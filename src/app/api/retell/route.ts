// install the sdk: https://docs.retellai.com/get-started/sdk
import { NextResponse } from "next/server";
import { saveInboundCallToDB } from "@/lib/db";
import { transcriptSummary } from "@/lib/transcript_summary";
import { Retell } from "retell-sdk";

export interface MyCallData {
  call_id: string;
  agent_id: string;
  agent_version: number;
  agent_name: string;
  retell_llm_dynamic_variables?: Record<string, unknown>; // JSON
  start_timestamp: number; // webhook sends number
  end_timestamp: number; // webhook sends number
  duration_ms: number; // webhook sends number
  transcript: string;
  recording_url: string;
  disconnection_reason: string;
  from_number: string;
  to_number: string;
  direction: string;
  notes: {
    note: string,
    reason: string
  }[];
  severity: number;
  [key: string]: unknown;
  resolved: boolean 
}

export async function POST(req: Request) {
  try {
    const rawBody = await req.text();
        
    const signature = req.headers.get("x-retell-signature"); 
    const apiKey = process.env.RETELL_API_KEY; 
    if (!signature || !apiKey || !Retell.verify(rawBody, apiKey, signature)) { 
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 }); 
    }

    const call = JSON.parse(rawBody);
    if (call?.call_id) {
      const { notes, severity } = (await transcriptSummary(call.transcript))!;
      const resolved: boolean = false 
      await saveInboundCallToDB({
        ...call,
        notes,
        severity,
        resolved
      });
    }

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("Retell webhook handler failed", error);
    return NextResponse.json(
      { error: "Invalid webhook payload" },
      { status: 400 },
    );
  }
}