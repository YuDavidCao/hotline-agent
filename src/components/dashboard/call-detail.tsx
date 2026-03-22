"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CallTranscriptView } from "./call-transcript-view"
import { AudioWaveform } from "./audio-waveform"
import { detectSpeechSegments, type SpeechSegment } from "@/lib/energy-detection"
import { alignWordsToSegments, type TimedCaption } from "@/lib/word-alignment"
import {
  type DashboardCallEntry,
  type CallSeverity,
} from "@/lib/dashboard-mock"

export interface FullCall {
  id: string
  callId: string
  agentId: string
  agentVersion: number
  retellVariables: Record<string, unknown>
  startTime: number
  endTime: number
  duration: number
  transcript: string
  recordingURL: string
  disconnectionReason: string
  fromNumber: string
  toNumber: string
  direction: string
  notes: { note: string; reason: string }[]
  severity: number
}

function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${s.toString().padStart(2, "0")}`
}

interface AudioAnalysis {
  samples: Float32Array
  sampleRate: number
  /** Duration from decoded buffer — available before <audio> loadedmetadata on cold reload. */
  decodedDurationSec: number
  segments: SpeechSegment[]
  captions: TimedCaption[]
}

/**
 * Fetches audio through the proxy, decodes it, and runs energy detection +
 * word alignment. Returns null while loading or on error.
 */
function useAudioAnalysis(
  recordingURL: string | undefined,
  transcript: string,
): { analysis: AudioAnalysis | null; loading: boolean; error: string | null } {
  const [analysis, setAnalysis] = React.useState<AudioAnalysis | null>(null)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!recordingURL) return
    let cancelled = false

    async function run() {
      setLoading(true)
      setError(null)
      try {
        const proxyUrl = `/api/audio-proxy?url=${encodeURIComponent(recordingURL!)}`
        const resp = await fetch(proxyUrl)
        if (!resp.ok) throw new Error(`Proxy returned ${resp.status}`)

        const arrayBuffer = await resp.arrayBuffer()
        const audioCtx = new AudioContext()
        const audioBuffer = await audioCtx.decodeAudioData(arrayBuffer)
        await audioCtx.close()

        const samples = audioBuffer.getChannelData(0)
        const sampleRate = audioBuffer.sampleRate

        const segments = detectSpeechSegments(samples, sampleRate)
        const captions = alignWordsToSegments(transcript, segments)

        if (!cancelled) {
          setAnalysis({
            samples,
            sampleRate,
            decodedDurationSec: audioBuffer.duration,
            segments,
            captions,
          })
        }
      } catch (err) {
        if (!cancelled) {
          setError(err instanceof Error ? err.message : "Failed to analyze audio")
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    run()
    return () => { cancelled = true }
  }, [recordingURL, transcript])

  return { analysis, loading, error }
}

function AudioPlayer({
  src,
  transcript,
  onTimeUpdate,
}: {
  src: string
  transcript: string
  onTimeUpdate?: (time: number, captions: TimedCaption[]) => void
}) {
  const audioRef = React.useRef<HTMLAudioElement>(null)
  const pendingSeekRef = React.useRef<number | null>(null)
  const [playing, setPlaying] = React.useState(false)
  const [currentTime, setCurrentTime] = React.useState(0)
  const [duration, setDuration] = React.useState(0)

  const { analysis, loading, error } = useAudioAnalysis(src, transcript)

  /** Prefer media element duration; fall back to decoded buffer when metadata is not ready yet. */
  const effectiveDuration =
    duration > 0 ? duration : (analysis?.decodedDurationSec ?? 0)

  // Push captions to parent as soon as analysis finishes
  React.useEffect(() => {
    if (analysis) {
      onTimeUpdate?.(currentTime, analysis.captions)
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [analysis])

  // Use requestAnimationFrame for smooth ~60fps waveform updates,
  // but throttle parent callback to ~20fps to limit transcript re-renders
  React.useEffect(() => {
    const audio = audioRef.current
    if (!audio) return

    let rafId: number | null = null
    let lastParentUpdate = 0
    const PARENT_INTERVAL = 50

    const tick = () => {
      if (audio.paused) return
      // Setting currentTime is async; until seek completes, reading currentTime
      // can still be the pre-seek value and would overwrite optimistic UI state.
      if (audio.seeking) {
        rafId = requestAnimationFrame(tick)
        return
      }
      const t = audio.currentTime
      setCurrentTime(t)
      const now = performance.now()
      if (analysis && now - lastParentUpdate >= PARENT_INTERVAL) {
        lastParentUpdate = now
        onTimeUpdate?.(t, analysis.captions)
      }
      rafId = requestAnimationFrame(tick)
    }

    const onPlay = () => { rafId = requestAnimationFrame(tick) }
    const onPause = () => { if (rafId !== null) cancelAnimationFrame(rafId) }
    const onMeta = () => {
      setDuration(audio.duration)
      // Seek may have run before loadedmetadata (cold reload); apply now.
      if (pendingSeekRef.current !== null) {
        audio.currentTime = pendingSeekRef.current
        setCurrentTime(audio.currentTime)
      }
    }
    const onEnded = () => setPlaying(false)
    const onSeeked = () => {
      const t = audio.currentTime
      setCurrentTime(t)
      if (analysis) {
        onTimeUpdate?.(t, analysis.captions)
      }
    }

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("ended", onEnded)
    audio.addEventListener("seeked", onSeeked)

    // Metadata may have already loaded (e.g. cached audio on page refresh)
    if (audio.readyState >= HTMLMediaElement.HAVE_METADATA) {
      setDuration(audio.duration)
    }

    if (!audio.paused) onPlay()

    return () => {
      if (rafId !== null) cancelAnimationFrame(rafId)
      audio.removeEventListener("play", onPlay)
      audio.removeEventListener("pause", onPause)
      audio.removeEventListener("loadedmetadata", onMeta)
      audio.removeEventListener("ended", onEnded)
      audio.removeEventListener("seeked", onSeeked)
    }
  }, [analysis, onTimeUpdate])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio) return
    if (playing) {
      audio.pause()
    } else {
      if (pendingSeekRef.current !== null) {
        audio.currentTime = pendingSeekRef.current
        pendingSeekRef.current = null
      }
      audio.play()
    }
    setPlaying(!playing)
  }

  const seek = (time: number) => {
    const audio = audioRef.current
    if (!audio) return
    const maxT = effectiveDuration > 0 ? effectiveDuration : 0
    const clamped = maxT > 0 ? Math.max(0, Math.min(time, maxT)) : Math.max(0, time)
    pendingSeekRef.current = clamped
    setCurrentTime(clamped)
    const canSeekElement =
      audio.readyState >= HTMLMediaElement.HAVE_METADATA &&
      Number.isFinite(audio.duration) &&
      audio.duration > 0
    if (canSeekElement) {
      audio.currentTime = clamped
    }
  }

  const seekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    seek(ratio * duration)
  }

  const progress =
    effectiveDuration > 0 ? (currentTime / effectiveDuration) * 100 : 0

  return (
    <Card className="overflow-hidden p-0">
      <audio ref={audioRef} src={src} preload="metadata" />
      <div className="border-b border-border bg-muted/40 px-5 py-3">
        <h2 className="text-[15px] font-semibold text-foreground">Recording</h2>
      </div>
      <div className="flex flex-col gap-3 p-4">
        {/* Waveform visualization */}
        {analysis && (
          <AudioWaveform
            samples={analysis.samples}
            sampleRate={analysis.sampleRate}
            duration={effectiveDuration}
            currentTime={currentTime}
            segments={analysis.segments}
            captions={analysis.captions}
            onSeek={seek}
          />
        )}

        {loading && (
          <div className="flex h-24 items-center justify-center text-xs text-muted-foreground">
            Analyzing audio…
          </div>
        )}

        {error && (
          <div className="flex h-24 items-center justify-center text-xs text-destructive">
            {error}
          </div>
        )}

        {/* Play/pause + fallback progress bar */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={toggle}
            className={cn(
              "flex h-9 w-9 shrink-0 items-center justify-center rounded-full border transition-colors",
              "border-border bg-background hover:bg-accent hover:text-accent-foreground",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            )}
            aria-label={playing ? "Pause recording" : "Play recording"}
          >
            {playing ? (
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <rect x="3" y="2" width="4" height="12" rx="1" />
                <rect x="9" y="2" width="4" height="12" rx="1" />
              </svg>
            ) : (
              <svg className="h-4 w-4" viewBox="0 0 16 16" fill="currentColor">
                <path d="M4 2.5v11l9-5.5L4 2.5z" />
              </svg>
            )}
          </button>
          <div className="flex min-w-0 flex-1 flex-col gap-1.5">
            {!analysis && (
              <div
                className="group relative h-1.5 w-full cursor-pointer rounded-full bg-muted"
                onClick={seekBar}
              >
                <div
                  className="h-full rounded-full bg-foreground/60 transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            )}
            <div className="flex justify-between text-[11px] tabular-nums text-muted-foreground">
              <span>{formatTime(currentTime)}</span>
              <span>
                {effectiveDuration > 0 ? formatTime(effectiveDuration) : "--:--"}
              </span>
            </div>
          </div>
        </div>
      </div>
    </Card>
  )
}

function numericToCallSeverity(n: number): CallSeverity {
  if (n <= 2) return "info"
  if (n <= 4) return "low"
  if (n <= 6) return "moderate"
  if (n <= 8) return "elevated"
  return "critical"
}

function parseTranscript(transcript: string): DashboardCallEntry["transcriptObject"] {
  const turns: DashboardCallEntry["transcriptObject"] = []
  for (const line of transcript.split("\n")) {
    const t = line.trim()
    if (t.startsWith("Agent: ")) turns.push({ role: "agent", content: t.slice(7) })
    else if (t.startsWith("User: ")) turns.push({ role: "user", content: t.slice(6) })
  }
  return turns
}

function toEntry(call: FullCall): DashboardCallEntry {
  return {
    id: call.id,
    callId: call.callId,
    listLabel: call.callId,
    severity: numericToCallSeverity(call.severity),
    severityScore: call.severity * 10,
    startTimestamp: call.startTime,
    endTimestamp: call.endTime,
    durationMs: call.duration,
    direction: call.direction as "inbound" | "outbound",
    agentId: call.agentId,
    fromNumber: call.fromNumber,
    toNumber: call.toNumber,
    callStatus: call.disconnectionReason.replace(/_/g, " "),
    transcript: call.transcript,
    transcriptObject: parseTranscript(call.transcript),
  }
}

export function CallDetail({ call }: { call: FullCall }) {
  const router = useRouter()
  const entry = React.useMemo(() => toEntry(call), [call])
  const [playbackTime, setPlaybackTime] = React.useState(0)
  const [captions, setCaptions] = React.useState<TimedCaption[]>([])

  const handleTimeUpdate = React.useCallback((time: number, caps: TimedCaption[]) => {
    setPlaybackTime(time)
    setCaptions(caps)
  }, [])

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <CallTranscriptView
        entry={entry}
        onBack={() => router.back()}
        currentTime={playbackTime}
        captions={captions}
        audioSlot={
          call.recordingURL ? (
            <AudioPlayer
              src={call.recordingURL}
              transcript={call.transcript}
              onTimeUpdate={handleTimeUpdate}
            />
          ) : undefined
        }
      />

      <div className="flex flex-col gap-4">
        {/* Notes */}
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-muted/40 px-5 py-3">
            <h2 className="text-[15px] font-semibold text-foreground">Notes</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">AI-extracted from transcript</p>
          </div>
          <div className="p-5">
            {call.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes.</p>
            ) : (
              <ul className="space-y-3">
                {call.notes.map((n, i) => (
                  <React.Fragment key={i}>
                    {i > 0 && <Separator />}
                    <li className="pt-1 first:pt-0">
                      <p className="text-sm font-medium text-foreground leading-snug">{n.note}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground leading-relaxed">{n.reason}</p>
                    </li>
                  </React.Fragment>
                ))}
              </ul>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}
