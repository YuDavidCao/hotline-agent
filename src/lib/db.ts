import type { MyCallData } from "@/lib/inbound-call-types";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function saveInboundCallToDB(callData: MyCallData) {
  try {
    const prismaData = mapCallDataToPrisma(callData);

    const call = await prisma.inboundCall.upsert({
      where: { callId: prismaData.callId },
      update: {
        agentId: prismaData.agentId,
        agentVersion: prismaData.agentVersion,
        retellVariables: prismaData.retellVariables,
        startTime: prismaData.startTime,
        endTime: prismaData.endTime,
        duration: prismaData.duration,
        transcript: prismaData.transcript,
        // Transcription payload has no recording; keep URL set earlier by post_call_audio.
        ...(callData.recording_url
          ? { recordingURL: prismaData.recordingURL }
          : {}),
        disconnectionReason: prismaData.disconnectionReason,
        fromNumber: prismaData.fromNumber,
        toNumber: prismaData.toNumber,
        direction: prismaData.direction,
        notes: prismaData.notes,
        severity: prismaData.severity,
        resolved: prismaData.resolved
      },
      create: prismaData,
    });

    return call;
  } catch (error) {
    throw error;
  }
}

/** Sets recording URL when post_call_audio arrives (may run before or after transcription). */
export async function updateInboundCallRecordingUrl(
  callId: string,
  recordingUrl: string,
): Promise<{ updated: boolean }> {
  const result = await prisma.inboundCall.updateMany({
    where: { callId },
    data: { recordingURL: recordingUrl },
  });
  return { updated: result.count > 0 };
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function mapCallDataToPrisma(
  callData: MyCallData,
): Prisma.InboundCallUncheckedCreateInput {
  return {
    callId: callData.call_id,
    agentId: callData.agent_id,
    agentVersion: callData.agent_version,
    retellVariables: toJsonInput(callData.retell_llm_dynamic_variables),
    startTime: BigInt(callData.start_timestamp),
    endTime: BigInt(callData.end_timestamp),
    duration: BigInt(callData.duration_ms),
    transcript: callData.transcript,
    recordingURL: callData.recording_url,
    disconnectionReason: callData.disconnection_reason,
    fromNumber: callData.from_number,
    toNumber: callData.to_number,
    direction: callData.direction,
    notes: toJsonInput(callData.notes),
    severity: callData.severity,
    resolved: callData.resolved
  };
}
