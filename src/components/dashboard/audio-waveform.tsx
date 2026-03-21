"use client"

import * as React from "react"
import type { SpeechSegment } from "@/lib/energy-detection"
import type { TimedCaption } from "@/lib/word-alignment"

interface AudioWaveformProps {
  samples: Float32Array
  sampleRate: number
  duration: number
  currentTime: number
  segments: SpeechSegment[]
  captions: TimedCaption[]
  onSeek: (time: number) => void
}

const WAVEFORM_HEIGHT = 96
const BAR_WIDTH = 2
const BAR_GAP = 1

/**
 * Downsample raw audio into per-bar peak amplitudes.
 */
function computePeaks(samples: Float32Array, barCount: number): Float32Array {
  const peaks = new Float32Array(barCount)
  const samplesPerBar = Math.floor(samples.length / barCount)
  if (samplesPerBar === 0) return peaks

  for (let i = 0; i < barCount; i++) {
    let max = 0
    const start = i * samplesPerBar
    const end = Math.min(start + samplesPerBar, samples.length)
    for (let j = start; j < end; j++) {
      const abs = Math.abs(samples[j])
      if (abs > max) max = abs
    }
    peaks[i] = max
  }
  return peaks
}

/**
 * Determine which speech segment a given time falls into, or null.
 */
function segmentAtTime(
  time: number,
  segments: SpeechSegment[],
): SpeechSegment | null {
  for (const seg of segments) {
    if (time >= seg.start && time <= seg.end) return seg
  }
  return null
}

/**
 * Get the role for a given time based on captions alignment.
 */
function roleAtTime(
  time: number,
  captions: TimedCaption[],
): "agent" | "user" | null {
  for (const cap of captions) {
    if (time >= cap.start && time < cap.end) return cap.turnRole
  }
  return null
}

export function AudioWaveform({
  samples,
  sampleRate,
  duration,
  currentTime,
  segments,
  captions,
  onSeek,
}: AudioWaveformProps) {
  const canvasRef = React.useRef<HTMLCanvasElement>(null)
  const containerRef = React.useRef<HTMLDivElement>(null)
  const [width, setWidth] = React.useState(0)

  React.useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const obs = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setWidth(Math.floor(entry.contentRect.width))
      }
    })
    obs.observe(container)
    return () => obs.disconnect()
  }, [])

  const barCount = React.useMemo(
    () => Math.max(1, Math.floor(width / (BAR_WIDTH + BAR_GAP))),
    [width],
  )
  const peaks = React.useMemo(
    () => computePeaks(samples, barCount),
    [samples, barCount],
  )

  // Draw the waveform
  React.useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas || width === 0) return

    const dpr = window.devicePixelRatio || 1
    canvas.width = width * dpr
    canvas.height = WAVEFORM_HEIGHT * dpr

    const ctx = canvas.getContext("2d")
    if (!ctx) return
    ctx.scale(dpr, dpr)
    ctx.clearRect(0, 0, width, WAVEFORM_HEIGHT)

    const midY = WAVEFORM_HEIGHT / 2
    const maxBarH = WAVEFORM_HEIGHT / 2 - 2

    // CSS custom properties are raw hex values (e.g. #21262d)
    const styles = getComputedStyle(canvas)
    const mutedColor = styles.getPropertyValue("--muted").trim() || "#374151"
    const fgColor = styles.getPropertyValue("--foreground").trim() || "#e5e7eb"

    const agentBg = "rgba(46, 160, 67, 0.15)"
    const userBg = "rgba(248, 81, 73, 0.15)"
    const agentBar = "rgba(46, 160, 67, 0.8)"
    const userBar = "rgba(248, 81, 73, 0.7)"

    const playheadX = duration > 0 ? (currentTime / duration) * width : 0

    // Pass 1: full-height background strips for speech segments
    for (let i = 0; i < barCount; i++) {
      const x = i * (BAR_WIDTH + BAR_GAP)
      const barTime = (i / barCount) * duration
      const inSpeech = segmentAtTime(barTime, segments)
      if (inSpeech) {
        const role = roleAtTime(barTime, captions)
        ctx.fillStyle = role === "user" ? userBg : agentBg
        ctx.fillRect(x, 0, BAR_WIDTH + BAR_GAP, WAVEFORM_HEIGHT)
      }
    }

    // Pass 2: waveform bars
    for (let i = 0; i < barCount; i++) {
      const x = i * (BAR_WIDTH + BAR_GAP)
      const barTime = (i / barCount) * duration
      const h = Math.max(1, peaks[i] * maxBarH)
      const isPast = x <= playheadX
      const inSpeech = segmentAtTime(barTime, segments)

      if (inSpeech) {
        const role = roleAtTime(barTime, captions)
        ctx.fillStyle = isPast
          ? (role === "user" ? userBar : agentBar)
          : (role === "user" ? "rgba(248, 81, 73, 0.4)" : "rgba(46, 160, 67, 0.4)")
      } else {
        ctx.fillStyle = isPast ? fgColor : mutedColor
      }
      ctx.fillRect(x, midY - h, BAR_WIDTH, h * 2)
    }

    // Playhead line
    if (duration > 0) {
      ctx.fillStyle = fgColor
      ctx.fillRect(Math.round(playheadX), 0, 1.5, WAVEFORM_HEIGHT)
    }
  }, [peaks, barCount, width, currentTime, duration, segments, captions])

  const handleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current
    if (!canvas || duration <= 0) return
    const rect = canvas.getBoundingClientRect()
    const ratio = Math.max(0, Math.min(1, (e.clientX - rect.left) / rect.width))
    onSeek(ratio * duration)
  }

  return (
    <div ref={containerRef} className="w-full">
      <canvas
        ref={canvasRef}
        className="w-full cursor-pointer"
        style={{ height: WAVEFORM_HEIGHT }}
        onClick={handleClick}
      />
    </div>
  )
}
