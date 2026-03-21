import { mkdir, writeFile } from "fs/promises";
import path from "path";

const ARCHIVE_DIR = path.join(process.cwd(), "data", "elevenlabs-webhooks");

function sanitizeFilenamePart(value: string): string {
  const s = value.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return (s || "unknown").slice(0, 120);
}

type VerifiedWebhookEvent = {
  type?: string;
  event_timestamp?: number;
  data?: { conversation_id?: string };
};

/**
 * Persists the exact raw request body (verified JSON string) for debugging / audits.
 * Failures are logged but do not fail the webhook handler.
 */
export async function archiveElevenLabsWebhookRaw(
  rawBody: string,
  event: VerifiedWebhookEvent,
): Promise<void> {
  try {
    await mkdir(ARCHIVE_DIR, { recursive: true });
    const convId = event.data?.conversation_id
      ? String(event.data.conversation_id)
      : "no-conversation";
    const type = event.type ?? "unknown";
    const filename = `${Date.now()}-${sanitizeFilenamePart(type)}-${sanitizeFilenamePart(convId)}.json`;
    const filepath = path.join(ARCHIVE_DIR, filename);
    await writeFile(filepath, rawBody, "utf8");
  } catch {
    // Archive is best-effort; webhook still succeeds
  }
}
