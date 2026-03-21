import { constants as fsConstants } from "fs";
import { access, readFile } from "fs/promises";
import path from "path";
import { NextResponse } from "next/server";

const RECORDINGS_DIR = path.join(process.cwd(), "recording");

const SAFE_MP3 = /^[a-zA-Z0-9._-]+\.mp3$/;

export async function GET(
  _req: Request,
  { params }: { params: { filename: string } },
) {
  const filename = params.filename;
  if (!SAFE_MP3.test(filename)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const filepath = path.join(RECORDINGS_DIR, filename);
  const resolved = path.resolve(filepath);
  if (!resolved.startsWith(path.resolve(RECORDINGS_DIR) + path.sep)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  try {
    await access(resolved, fsConstants.R_OK);
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
  const buf = await readFile(resolved);
  return new NextResponse(buf, {
    status: 200,
    headers: {
      "Content-Type": "audio/mpeg",
      "Content-Length": String(buf.length),
      "Cache-Control": "private, max-age=3600",
    },
  });
}
