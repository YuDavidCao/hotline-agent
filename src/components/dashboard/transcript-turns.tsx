"use client"

import * as React from "react"
import { cn } from "@/lib/utils"
import type { TranscriptTurn } from "@/lib/dashboard-mock"
import type { TimedCaption } from "@/lib/word-alignment"

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

function TurnContent({
  content,
  hlRange,
}: {
  content: string
  hlRange: { start: number; end: number } | null
}) {
  if (!hlRange) return <>{content}</>
  const { start, end } = hlRange
  return (
    <>
      {content.slice(0, start)}
      <span className="underline decoration-yellow-400 decoration-2 underline-offset-4">
        {content.slice(start, end)}
      </span>
      {content.slice(end)}
    </>
  )
}

export function TranscriptTurns({
  turns,
  activeTurnIndex,
  turnRefs,
  currentTime,
  captions,
}: {
  turns: TranscriptTurn[]
  activeTurnIndex?: number
  turnRefs?: React.MutableRefObject<(HTMLLIElement | null)[]>
  currentTime?: number
  captions?: TimedCaption[]
}) {
  return (
    <ul className="space-y-4">
      {turns.map((turn, i) => {
        const hlRange =
          captions && captions.length > 0
            ? getActiveCharRange(i, turn.content, currentTime, captions)
            : null

        return (
          <li
            key={i}
            ref={(el) => {
              if (turnRefs) turnRefs.current[i] = el
            }}
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
                  : "text-muted-foreground",
              )}
            >
              {turn.role === "agent" ? "Agent" : "User"}
            </span>
            <span className="text-[15px] leading-relaxed text-foreground">
              <TurnContent content={turn.content} hlRange={hlRange} />
            </span>
          </li>
        )
      })}
    </ul>
  )
}
