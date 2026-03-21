"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/card"
import { Separator } from "@/components/ui/separator"
import { CallTranscriptView } from "./call-transcript-view"
import {
  type DashboardCallEntry,
  type CallSeverity,
} from "@/lib/dashboard-mock"

export interface FullCall {
  id: string
  callId: string
  agentId: string
  agentVersion: number
  agentName: string
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
    agentName: call.agentName,
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

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_20rem]">
      <CallTranscriptView
        entry={entry}
        risk={[]}
        negation={[]}
        onBack={() => router.back()}
      />

      <div className="flex flex-col gap-4">
        {/* Recording link */}
        {call.recordingURL && (
          <a
            href={call.recordingURL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-sm border border-border bg-card text-sm font-medium text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <svg className="h-4 w-4" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8">
              <path d="M8 2v8M5 7l3 3 3-3" strokeLinecap="round" strokeLinejoin="round" />
              <path d="M3 13h10" strokeLinecap="round" />
            </svg>
            Download recording
          </a>
        )}

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
