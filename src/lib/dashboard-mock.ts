/**
 * Shapes mirror Retell webhook `call` payloads (see `src/app/api/retell/route.ts` comments).
 * Replace with Prisma/API data when wired.
 */

export type TranscriptRole = "agent" | "user"

export type TranscriptTurn = {
  role: TranscriptRole
  content: string
}

export type CallSeverity = "info" | "low" | "moderate" | "elevated" | "critical"

export type DashboardCallEntry = {
  id: string
  callId: string
  /** One-line label for the scroll list (date / duration / direction / severity). */
  listLabel: string
  severity: CallSeverity
  /** Numeric severity 0-100 derived from transcript analysis. */
  severityScore: number
  startTimestamp: number
  endTimestamp: number
  durationMs: number
  direction: "inbound" | "outbound"
  agentName: string
  fromNumber: string
  toNumber: string
  callStatus: string
  /** Full plain `transcript` string as Retell sends it. */
  transcript: string
  /** Structured turns (from `transcript_object`). */
  transcriptObject: TranscriptTurn[]
}

export function severityBadgeClass(severity: CallSeverity): string {
  switch (severity) {
    case "critical":
      return "bg-destructive/20 text-destructive border-destructive/40"
    case "elevated":
      return "bg-amber-500/15 text-amber-200 border-amber-500/35"
    case "moderate":
      return "bg-link/15 text-link border-link/35"
    case "low":
      return "bg-muted text-muted-foreground border-border"
    default:
      return "bg-muted/80 text-muted-foreground border-border"
  }
}
