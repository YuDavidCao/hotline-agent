import { NextRequest, NextResponse } from "next/server"

/**
 * Base URL for server-side fetch to this app. In dev, `req.nextUrl.origin` can be
 * `https://...` (e.g. X-Forwarded-Proto or HTTPS in the address bar) while the
 * dev server only speaks HTTP on the same port, which causes
 * ERR_SSL_WRONG_VERSION_NUMBER when fetch() uses TLS.
 */
function resolveUpstreamBase(req: NextRequest): string {
  if (process.env.NODE_ENV === "development") {
    const host = req.headers.get("host") ?? "localhost:3000"
    return `http://${host}`
  }
  return req.nextUrl.origin
}

/**
 * Proxies audio fetches to bypass CORS restrictions on Retell recording URLs.
 * The browser's <audio> element can play cross-origin audio, but Web Audio API
 * needs raw bytes via fetch() which requires CORS.
 */
export async function GET(req: NextRequest) {
  const url = req.nextUrl.searchParams.get("url")

  if (!url) {
    return NextResponse.json({ error: "Missing url parameter" }, { status: 400 })
  }

  let resolvedUrl: string
  try {
    // Resolve relative URLs (e.g. /api/recordings/...) against the request origin.
    resolvedUrl = new URL(url, resolveUpstreamBase(req)).toString()
  } catch {
    return NextResponse.json({ error: "Invalid url" }, { status: 400 })
  }

  try {
    const upstream = await fetch(resolvedUrl)

    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream returned ${upstream.status}` },
        { status: upstream.status },
      )
    }

    const contentType = upstream.headers.get("content-type") ?? "audio/mpeg"
    const body = upstream.body

    return new NextResponse(body, {
      status: 200,
      headers: {
        "Content-Type": contentType,
        "Cache-Control": "public, max-age=3600",
      },
    })
  } catch (err) {
    console.error("Audio proxy error:", err)
    return NextResponse.json({ error: "Failed to fetch audio" }, { status: 502 })
  }
}
