"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { Card } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
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
          setAnalysis({ samples, sampleRate, segments, captions })
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
    const onMeta = () => setDuration(audio.duration)
    const onEnded = () => setPlaying(false)

    audio.addEventListener("play", onPlay)
    audio.addEventListener("pause", onPause)
    audio.addEventListener("loadedmetadata", onMeta)
    audio.addEventListener("ended", onEnded)

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
    pendingSeekRef.current = time
    audio.currentTime = time
    setCurrentTime(time)
  }

  const seekBar = (e: React.MouseEvent<HTMLDivElement>) => {
    const audio = audioRef.current
    if (!audio || !duration) return
    const rect = e.currentTarget.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    audio.currentTime = ratio * duration
  }

  const progress = duration > 0 ? (currentTime / duration) * 100 : 0

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
            duration={duration}
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
              <span>{duration > 0 ? formatTime(duration) : "--:--"}</span>
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
    severityScore: call.severity,
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
        risk={[]}
        negation={[]}
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
        <Card className="h-fit overflow-hidden p-0 lg:sticky lg:top-4">
          <div className="border-b border-border bg-muted/40 px-5 py-3">
            <h2 className="text-[15px] font-semibold text-foreground">Notes</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">AI-extracted from transcript</p>
          </div>
          <ScrollArea className="h-[28rem] p-3">
            {call.notes.length === 0 ? (
              <p className="text-sm text-muted-foreground">No notes for this call.</p>
            ) : (
              <ul className="space-y-2">
                {call.notes.map((n, i) => (
                  <li key={i} className="rounded-sm border border-border bg-muted/40 p-2">
                    <p className="text-sm font-medium leading-snug text-foreground">{n.note}</p>
                    <p className="mt-0.5 text-xs leading-relaxed text-muted-foreground">{n.reason}</p>
                  </li>
                ))}
              </ul>
            )}
          </ScrollArea>
        </Card>
      </div>
    </div>
  )
}
