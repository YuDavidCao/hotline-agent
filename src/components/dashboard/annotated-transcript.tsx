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

function AnnotatedContent({
  segments,
}: {
  segments: AnnotatedSegment[]
}) {
  return (
    <>
      {segments.map((seg, i) => {
        if (seg.kind === "plain") return <span key={i}>{seg.text}</span>
        if (seg.kind === "risk")
          return <RiskTooltip key={i} segment={seg} />
        return <NegationTooltip key={i} segment={seg} />
      })}
    </>
  )
}

export function AnnotatedTranscriptTurns({
  turns,
  risk,
  negation,
}: {
  turns: TranscriptTurn[]
  risk: HighRiskPhrase[]
  negation: NegationPhrase[]
}) {
  const annotated = React.useMemo(
    () =>
      turns.map((turn) => ({
        role: turn.role,
        segments: annotateText(turn.content, risk, negation),
      })),
    [turns, risk, negation]
  )

  return (
    <ul className="space-y-4">
      {annotated.map((turn, i) => (
        <li key={i} className="flex gap-3">
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
            <AnnotatedContent segments={turn.segments} />
          </span>
        </li>
      ))}
    </ul>
  )
}
