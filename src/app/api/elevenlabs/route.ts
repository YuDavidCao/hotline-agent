// Post-call webhooks: https://elevenlabs.io/docs/agents-platform/customization/post-call-webhooks
import { ElevenLabsClient, ElevenLabsError } from "@elevenlabs/elevenlabs-js";
import { NextResponse } from "next/server";
import {
  saveInboundCallToDB,
  updateInboundCallRecordingUrl,
} from "@/lib/db";
import type { MyCallData } from "@/lib/inbound-call-types";
import {
  getStoredRecordingRelativeUrlIfExists,
  saveElevenLabsRecordingMp3,
} from "@/lib/elevenlabs-recording";
import { archiveElevenLabsWebhookRaw } from "@/lib/elevenlabs-webhook-archive";
import { transcriptSummary } from "@/lib/transcript_summary";

type TranscriptTurn = {
  role?: string;
  message?: string | null;
};

function turnsToPlainText(turns: TranscriptTurn[] | undefined): string {
  if (!Array.isArray(turns) || turns.length === 0) {
    return "";
  }
  return turns
    .map((t) => {
      const role = t.role ?? "unknown";
      const label =
        role === "agent" ? "Agent" : role === "user" ? "User" : role;
      return `${label}: ${t.message ?? ""}`;
    })
    .join("\n\n");
}

function phoneFieldsFromMetadata(metadata: Record<string, unknown>): {
  from_number: string;
  to_number: string;
  direction: string;
} {
  const raw =
    (metadata.phone_call as Record<string, unknown> | undefined) ??
    (metadata.phoneCall as Record<string, unknown> | undefined);
  if (!raw || typeof raw !== "object") {
    return { from_number: "", to_number: "", direction: "" };
  }
  return {
    from_number: String(raw.external_number ?? raw.externalNumber ?? ""),
    to_number: String(raw.agent_number ?? raw.agentNumber ?? ""),
    direction: String(raw.direction ?? ""),
  };
}

function mapPostCallTranscriptionToMyCallData(data: Record<string, unknown>): MyCallData {
  const metadata = (data.metadata ?? {}) as Record<string, unknown>;
  const startSecs = Number(metadata.start_time_unix_secs ?? 0);
  const durationSecs = Number(metadata.call_duration_secs ?? 0);
  const startMs = Math.round(startSecs * 1000);
  const durationMs = Math.round(durationSecs * 1000);
  const endMs = startMs + durationMs;

  const clientData = data.conversation_initiation_client_data as
    | { dynamic_variables?: Record<string, unknown> }
    | undefined;
  const dynamicVars = clientData?.dynamic_variables ?? {};
  const transcript = turnsToPlainText(data.transcript as TranscriptTurn[] | undefined);
  const phone = phoneFieldsFromMetadata(metadata);

  return {
    call_id: String(data.conversation_id ?? ""),
    agent_id: String(data.agent_id ?? ""),
    agent_version: 0,
    retell_llm_dynamic_variables: dynamicVars,
    start_timestamp: startMs,
    end_timestamp: endMs,
    duration_ms: durationMs,
    transcript,
    recording_url: "",
    disconnection_reason: String(
      metadata.termination_reason ?? data.status ?? "",
    ),
    from_number: phone.from_number,
    to_number: phone.to_number,
    direction: phone.direction,
    notes: [],
    severity: 1,
  };
}

export async function POST(req: Request) {
  const rawBody = await req.text();
  const signature = req.headers.get("elevenlabs-signature");
  const secret = process.env.ELEVENLABS_WH_SECRET;

  try {
    if (!signature || !secret) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }

    // Client is only used for webhook HMAC verification; API key may be unset at build time.
    const elevenlabs = new ElevenLabsClient({
      apiKey: process.env.ELEVENLABS_API_KEY ?? "unused",
    });

    const event = (await elevenlabs.webhooks.constructEvent(
      rawBody,
      signature,
      secret,
    )) as { type?: string; data?: Record<string, unknown> };

    if (process.env.NODE_ENV !== "production") {
      await archiveElevenLabsWebhookRaw(rawBody, event);
    }

    if (event.type === "post_call_transcription" && event.data) {
      const data = event.data;
      if (data.conversation_id) {
        const call = mapPostCallTranscriptionToMyCallData(data);
        const { notes, severity } = (await transcriptSummary(call.transcript))!;
        const pendingRecording =
          (await getStoredRecordingRelativeUrlIfExists(call.call_id)) ?? "";
        await saveInboundCallToDB({
          ...call,
          recording_url: pendingRecording || call.recording_url,
          notes,
          severity,
        });
      }
    }

    if (event.type === "post_call_audio" && event.data) {
      const data = event.data as {
        conversation_id?: string;
        full_audio?: string;
      };
      const conversationId = data.conversation_id;
      const fullAudio = data.full_audio;
      if (conversationId && fullAudio) {
        const recordingUrl = await saveElevenLabsRecordingMp3(
          conversationId,
          fullAudio,
        );
        const { updated } = await updateInboundCallRecordingUrl(
          conversationId,
          recordingUrl,
        );
        if (!updated) {
          console.warn(
            `post_call_audio: no InboundCall row yet for ${conversationId}; recording saved at ${recordingUrl}`,
          );
        }
      }
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    if (error instanceof ElevenLabsError) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }
}
