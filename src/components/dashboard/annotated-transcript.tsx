"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import {
  annotateText,
  type AnnotatedSegment,
  type HighRiskPhrase,
  type NegationPhrase,
} from "@/lib/risk-annotations"
import type { TranscriptTurn } from "@/lib/dashboard-mock"

function RiskTooltip({
  segment,
}: {
  segment: Extract<AnnotatedSegment, { kind: "risk" }>
}) {
  return (
    <span className="group/tip relative inline">
      <span className="cursor-help underline decoration-destructive decoration-2 underline-offset-4">
        {segment.text}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2",
          "hidden max-w-xs whitespace-normal rounded border border-destructive/30 bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground shadow-lg",
          "group-hover/tip:block"
        )}
      >
        <span className="font-semibold text-destructive">
          Risk {segment.severity}/100
        </span>
        <br />
        {segment.category}
      </span>
    </span>
  )
}

function NegationTooltip({
  segment,
}: {
  segment: Extract<AnnotatedSegment, { kind: "negation" }>
}) {
  return (
    <span className="group/tip relative inline">
      <span className="cursor-help underline decoration-secondary decoration-2 underline-offset-4">
        {segment.text}
      </span>
      <span
        className={cn(
          "pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2",
          "hidden max-w-xs whitespace-normal rounded border border-secondary/30 bg-popover px-2.5 py-1.5 text-xs leading-snug text-popover-foreground shadow-lg",
          "group-hover/tip:block"
        )}
      >
        <span className="font-semibold text-secondary">
          De-escalation {segment.severity}/100
        </span>
        <br />
        {segment.interpretation}
      </span>
    </span>
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
