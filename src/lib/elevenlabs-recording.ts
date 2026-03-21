import { access, mkdir, writeFile } from "fs/promises";
import { constants as fsConstants } from "fs";
import path from "path";

const PUBLIC_RECORDINGS_DIR = path.join(
  process.cwd(),
  "public",
  "elevenlabs-recordings",
);

function sanitizeFilenamePart(value: string): string {
  const s = value.replace(/[^a-zA-Z0-9._-]+/g, "_").replace(/^_+|_+$/g, "");
  return (s || "unknown").slice(0, 120);
}

/**
 * Writes base64 MP3 from post_call_audio to public static files and returns the site-relative URL.
 */
export async function saveElevenLabsRecordingToPublicMp3(
  conversationId: string,
  base64Mp3: string,
): Promise<string> {
  await mkdir(PUBLIC_RECORDINGS_DIR, { recursive: true });
  const safe = sanitizeFilenamePart(conversationId);
  const filename = `${safe}.mp3`;
  const filepath = path.join(PUBLIC_RECORDINGS_DIR, filename);
  const buf = Buffer.from(base64Mp3, "base64");
  await writeFile(filepath, buf);
  return `/elevenlabs-recordings/${filename}`;
}

/** If post_call_audio already wrote an MP3 for this conversation, return its site-relative URL. */
export async function getStoredRecordingRelativeUrlIfExists(
  conversationId: string,
): Promise<string | null> {
  const safe = sanitizeFilenamePart(conversationId);
  const filename = `${safe}.mp3`;
  const filepath = path.join(PUBLIC_RECORDINGS_DIR, filename);
  try {
    await access(filepath, fsConstants.F_OK);
    return `/elevenlabs-recordings/${filename}`;
  } catch {
    return null;
  }
}
