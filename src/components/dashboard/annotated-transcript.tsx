"use client"

import * as React from "react"
import { createPortal } from "react-dom"
import { cn } from "@/lib/utils"
import {
  annotateText,
  type AnnotatedSegment,
  type HighRiskPhrase,
  type NegationPhrase,
} from "@/lib/risk-annotations"
import type { TranscriptTurn } from "@/lib/dashboard-mock"
import type { TimedCaption } from "@/lib/word-alignment"

const TOOLTIP_GAP = 8
const MIN_SPACE_ABOVE = 80

/**
 * Portal-based tooltip that escapes any overflow:hidden ancestors.
 * Prefers rendering above the trigger; flips below when too close to
 * the top of the viewport.
 */
function FloatingTooltip({
  children,
  content,
  borderClass,
}: {
  children: React.ReactNode
  content: React.ReactNode
  borderClass: string
}) {
  const triggerRef = React.useRef<HTMLSpanElement>(null)
  const [pos, setPos] = React.useState<{
    top: number
    left: number
    below: boolean
  } | null>(null)

  const show = React.useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const r = el.getBoundingClientRect()
    const below = r.top < MIN_SPACE_ABOVE
    setPos({
      top: below ? r.bottom + TOOLTIP_GAP : r.top - TOOLTIP_GAP,
      left: r.left + r.width / 2,
      below,
    })
  }, [])

  const hide = React.useCallback(() => setPos(null), [])

  return (
    <>
      <span ref={triggerRef} onMouseEnter={show} onMouseLeave={hide}>
        {children}
      </span>
      {pos !== null &&
        createPortal(
          <span
            className={cn(
              "pointer-events-none fixed z-[9999] max-w-xs -translate-x-1/2 whitespace-normal rounded border bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground shadow-lg",
              borderClass,
              pos.below ? "" : "-translate-y-full"
            )}
            style={{ top: pos.top, left: pos.left }}
          >
            {content}
          </span>,
          document.body
        )}
    </>
  )
}

function RiskTooltip({
  segment,
}: {
  segment: Extract<AnnotatedSegment, { kind: "risk" }>
}) {
  return (
    <FloatingTooltip
      borderClass="border-destructive/30"
      content={
        <>
          <span className="font-semibold text-destructive">
            Risk {segment.severity}/100
          </span>
          <br />
          {segment.category}
        </>
      }
    >
      <span className="cursor-help underline decoration-destructive decoration-2 underline-offset-4">
        {segment.text}
      </span>
    </FloatingTooltip>
  )
}

function NegationTooltip({
  segment,
}: {
  segment: Extract<AnnotatedSegment, { kind: "negation" }>
}) {
  return (
    <FloatingTooltip
      borderClass="border-secondary/30"
      content={
        <>
          <span className="font-semibold text-secondary">
            De-escalation {segment.severity}/100
          </span>
          <br />
          {segment.interpretation}
        </>
      }
    >
      <span className="cursor-help underline decoration-secondary decoration-2 underline-offset-4">
        {segment.text}
      </span>
    </FloatingTooltip>
  )
}

/**
 * Computes the active caption's character range within a turn's content.
 * Returns null when nothing is active for the given turn.
 */
function getActiveCharRange(
  turnIndex: number,
  turnContent: string,
  currentTime: number | undefined,
  captions: TimedCaption[],
): { start: number; end: number } | null {
  if (currentTime === undefined) return null

  const turnCaps = captions.filter((c) => c.turnIndex === turnIndex)
  if (turnCaps.length === 0) return null

  const words = turnContent.split(/\s+/).filter(Boolean)

  let wordOffset = 0
  let activeStartWord = -1
  let activeEndWord = -1

  for (const cap of turnCaps) {
    const capWordCount = cap.text.split(/\s+/).filter(Boolean).length

    // Only highlight while playback is inside this caption's time window.
    // Using start-only matching left the last caption of each turn stuck
    // highlighted after audio had passed it (every later cap still matched
    // currentTime >= cap.start).
    if (currentTime >= cap.start && currentTime < cap.end) {
      activeStartWord = wordOffset
      activeEndWord = wordOffset + capWordCount
      break
    }

    wordOffset += capWordCount
  }

  if (activeStartWord < 0) return null

  let charStart = -1
  let charEnd = 0
  let wi = 0
  let i = 0

  while (i < turnContent.length && wi < words.length) {
    while (i < turnContent.length && /\s/.test(turnContent[i])) i++
    const wordStart = i
    while (i < turnContent.length && !/\s/.test(turnContent[i])) i++

    if (wi === activeStartWord) charStart = wordStart
    if (wi === activeEndWord - 1) {
      charEnd = i
      break
    }
    wi++
  }

  if (charStart < 0) return null
  return { start: charStart, end: charEnd }
}

type HighlightedSegment = AnnotatedSegment & { highlighted?: boolean }

/**
 * Splits annotated segments at highlight character boundaries, tagging
 * the overlapping portions with `highlighted: true`.
 */
function splitWithHighlight(
  segments: AnnotatedSegment[],
  hlStart: number,
  hlEnd: number,
): HighlightedSegment[] {
  const result: HighlightedSegment[] = []
  let charPos = 0

  for (const seg of segments) {
    const segStart = charPos
    const segEnd = charPos + seg.text.length
    charPos = segEnd

    if (segEnd <= hlStart || segStart >= hlEnd) {
      result.push(seg)
      continue
    }

    const overlapStart = Math.max(0, hlStart - segStart)
    const overlapEnd = Math.min(seg.text.length, hlEnd - segStart)

    if (overlapStart > 0) {
      result.push({ ...seg, text: seg.text.slice(0, overlapStart) })
    }
    result.push({
      ...seg,
      text: seg.text.slice(overlapStart, overlapEnd),
      highlighted: true,
    })
    if (overlapEnd < seg.text.length) {
      result.push({ ...seg, text: seg.text.slice(overlapEnd) })
    }
  }

  return result
}

function AnnotatedContent({
  segments,
}: {
  segments: HighlightedSegment[]
}) {
  return (
    <>
      {segments.map((seg, i) => {
        const inner = (() => {
          if (seg.kind === "risk")
            return <RiskTooltip key={i} segment={seg} />
          if (seg.kind === "negation")
            return <NegationTooltip key={i} segment={seg} />
          return <span key={i}>{seg.text}</span>
        })()

        if (seg.highlighted) {
          return (
            <span
              key={i}
              className="underline decoration-yellow-400 decoration-2 underline-offset-4"
            >
              {seg.kind === "risk" ? (
                <RiskTooltip segment={seg} />
              ) : seg.kind === "negation" ? (
                <NegationTooltip segment={seg} />
              ) : (
                seg.text
              )}
            </span>
          )
        }

        return inner
      })}
    </>
  )
}

export function AnnotatedTranscriptTurns({
  turns,
  risk,
  negation,
  activeTurnIndex,
  turnRefs,
  currentTime,
  captions,
}: {
  turns: TranscriptTurn[]
  risk: HighRiskPhrase[]
  negation: NegationPhrase[]
  activeTurnIndex?: number
  turnRefs?: React.MutableRefObject<(HTMLLIElement | null)[]>
  currentTime?: number
  captions?: TimedCaption[]
}) {
  const annotated = React.useMemo(
    () =>
      turns.map((turn) => ({
        role: turn.role,
        content: turn.content,
        segments: annotateText(turn.content, risk, negation),
      })),
    [turns, risk, negation]
  )

  return (
    <ul className="space-y-4">
      {annotated.map((turn, i) => {
        const hlRange =
          captions && captions.length > 0
            ? getActiveCharRange(i, turn.content, currentTime, captions)
            : null

        const segs: HighlightedSegment[] = hlRange
          ? splitWithHighlight(turn.segments, hlRange.start, hlRange.end)
          : turn.segments

        return (
          <li
            key={i}
            ref={(el) => { if (turnRefs) turnRefs.current[i] = el }}
            className={cn(
              "flex gap-3 rounded-sm px-2 py-1 -mx-2 transition-colors duration-300",
              activeTurnIndex === i && "bg-accent/40",
            )}
          >
            <span
              className={cn(
                "w-16 shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide",
                turn.role === "agent"
                  ? "text-foreground"
                  : "text-muted-foreground"
              )}
            >
              {turn.role === "agent" ? "Agent" : "User"}
            </span>
            <span className="text-[15px] leading-relaxed text-foreground">
              <AnnotatedContent segments={segs} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
