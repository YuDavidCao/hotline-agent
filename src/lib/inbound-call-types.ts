/**
 * Normalized inbound-call shape stored from voice provider webhooks (e.g. ElevenLabs post-call).
 * Field names match the historical Retell payload for Prisma compatibility.
 */
export interface MyCallData {
  call_id: string;
  agent_id: string;
  agent_version: number;
  retell_llm_dynamic_variables?: Record<string, unknown>;
  start_timestamp: number;
  end_timestamp: number;
  duration_ms: number;
  transcript: string;
  recording_url: string;
  disconnection_reason: string;
  from_number: string;
  to_number: string;
  direction: string;
  notes: {
    note: string;
    reason: string;
  }[];
  severity: number;
  resolved: boolean; 
  [key: string]: unknown;
}
