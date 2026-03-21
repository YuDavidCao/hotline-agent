"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { ScrollArea } from "@/components/ui/scroll-area"
import {
  severityBadgeClass,
  type DashboardCallEntry,
} from "@/lib/dashboard-mock"
import type { HighRiskPhrase, NegationPhrase } from "@/lib/risk-annotations"
import type { TimedCaption } from "@/lib/word-alignment"
import { AnnotatedTranscriptTurns } from "./annotated-transcript"

function formatMetaRange(entry: DashboardCallEntry) {
  const start = new Date(entry.startTimestamp)
  const end = new Date(entry.endTimestamp)
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  return `${fmt(start)} → ${fmt(end)}`
}

function activeTurnFromCaptions(
  currentTime: number | undefined,
  captions: TimedCaption[],
): number | undefined {
  if (currentTime === undefined || captions.length === 0) return undefined
  for (const cap of captions) {
    if (currentTime >= cap.start && currentTime < cap.end) {
      return cap.turnIndex
    }
  }
  return undefined
}

export function CallTranscriptView({
  entry,
  risk,
  negation,
  onBack,
  currentTime,
  captions,
  audioSlot,
}: {
  entry: DashboardCallEntry
  risk: HighRiskPhrase[]
  negation: NegationPhrase[]
  onBack: () => void
  currentTime?: number
  captions?: TimedCaption[]
  audioSlot?: React.ReactNode
}) {
  const turnRefs = React.useRef<(HTMLLIElement | null)[]>([])
  const activeTurn = activeTurnFromCaptions(currentTime, captions ?? [])

  // Auto-scroll to the active turn
  React.useEffect(() => {
    if (activeTurn === undefined) return
    const el = turnRefs.current[activeTurn]
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "nearest" })
    }
  }, [activeTurn])

  return (
    <div className="flex flex-col gap-6">
      {/* Header with back button */}
      <div className="flex items-start gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={onBack}
          className="shrink-0"
        >
          <svg
            className="mr-1.5 h-3.5 w-3.5"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path
              d="M10 4l-4 4 4 4"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          Back
        </Button>
        <div className="min-w-0">
          <h2 className="text-lg font-semibold text-foreground">
            {entry.agentName}
          </h2>
          <p className="mt-0.5 text-sm text-muted-foreground">
            {entry.callId}
          </p>
        </div>
      </div>

      {/* Call metadata summary */}
      <div className="rounded-md border border-border bg-card p-4">
        <div className="flex flex-wrap items-center gap-2 mb-4">
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              severityBadgeClass(entry.severity)
            )}
          >
            {entry.severity}
          </span>
          <span
            className={cn(
              "rounded-sm px-2 py-0.5 text-[11px] font-semibold tabular-nums",
              entry.severityScore > 70
                ? "bg-destructive/15 text-destructive"
                : "bg-muted text-muted-foreground"
            )}
          >
            Score {entry.severityScore}/100
          </span>
          <span className="text-sm text-muted-foreground">
            {entry.direction} · {Math.round(entry.durationMs / 1000)}s
          </span>
        </div>
        <dl className="grid gap-2 text-sm sm:grid-cols-[minmax(0,7rem)_1fr] sm:gap-x-3">
          <dt className="text-muted-foreground">Agent</dt>
          <dd className="font-medium">{entry.agentName}</dd>
          <dt className="text-muted-foreground">From / To</dt>
          <dd className="font-mono">{entry.fromNumber} → {entry.toNumber}</dd>
          <dt className="text-muted-foreground">Window</dt>
          <dd>{formatMetaRange(entry)}</dd>
          <dt className="text-muted-foreground">Status</dt>
          <dd className="capitalize">{entry.callStatus}</dd>
        </dl>
      </div>

      {audioSlot}

      {/* Annotated transcript turns */}
      <div className="rounded-md border border-border bg-card">
        <div className="border-b border-border px-5 py-3">
          <h3 className="text-[15px] font-semibold text-foreground">
            Transcript
          </h3>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Matched phrases are{" "}
            <span className="underline decoration-destructive decoration-2 underline-offset-4">
              risk
            </span>{" "}
            (red) or{" "}
            <span className="underline decoration-secondary decoration-2 underline-offset-4">
              de-escalation
            </span>{" "}
            (green). Hover for details.
          </p>
        </div>
        <ScrollArea className="max-h-[min(36rem,60vh)]">
          <div className="p-5">
            <AnnotatedTranscriptTurns
              turns={entry.transcriptObject}
              risk={risk}
              negation={negation}
              activeTurnIndex={activeTurn}
              turnRefs={turnRefs}
            />
          </div>
        </ScrollArea>
      </div>
    </div>
  )
}
