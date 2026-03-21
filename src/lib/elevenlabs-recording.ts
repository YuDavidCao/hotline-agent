import { access, mkdir, writeFile } from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";

const RECORDINGS_DIR = path.join(process.cwd(), "recording");

function sanitizeFilenamePart(value: string): string {
  const s = value.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return (s || "unknown").slice(0, 120);
}

/**
 * Writes base64 MP3 from post_call_audio to `recording/` and returns the app URL for playback/download.
 */
export async function saveElevenLabsRecordingMp3(
  conversationId: string,
  base64Mp3: string,
): Promise<string> {
  await mkdir(RECORDINGS_DIR, { recursive: true });
  const safe = sanitizeFilenamePart(conversationId);
  const filename = `${safe}.mp3`;
  const filepath = path.join(RECORDINGS_DIR, filename);
  const buf = Buffer.from(base64Mp3, "base64");
  await writeFile(filepath, buf);
  return `/api/recordings/${filename}`;
}

/** If post_call_audio already wrote an MP3 for this conversation, return its URL. */
export async function getStoredRecordingRelativeUrlIfExists(
  conversationId: string,
): Promise<string | null> {
  const safe = sanitizeFilenamePart(conversationId);
  const filename = `${safe}.mp3`;
  const filepath = path.join(RECORDINGS_DIR, filename);
  try {
    await access(filepath, fsConstants.F_OK);
    return `/api/recordings/${filename}`;
  } catch {
    return null;
  }
}
