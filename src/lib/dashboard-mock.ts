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

/** Example from route.ts comment block — stress / school workload demo. */
const RETELL_SAMPLE: DashboardCallEntry = {
  id: "demo-retell-1",
  callId: "call_2717da1d15a80a5f0bac89c1d39",
  listLabel:
    "Mar 21 · 31s · Inbound · moderate · Single-Prompt Agent",
  severity: "moderate",
  startTimestamp: 1774108687165,
  endTimestamp: 1774108718110,
  durationMs: 30945,
  direction: "inbound",
  agentName: "Single-Prompt Agent",
  fromNumber: "+12405072696",
  toNumber: "+13186108029",
  callStatus: "ended",
  transcript:
    "Agent: Hey, I’m really glad you reached out. I’m here with you—what’s been going on?\n" +
    "User: I am just I know I'm stressed right now. \n" +
    "Agent: That sounds really tough. Stress can feel overwhelming sometimes. Would you like to tell me more about what’s making you feel this way?\n" +
    "User: A lot of school work. \n" +
    "Agent: School can definitely pile on the pressure. It’s okay to feel stressed about it. Is there a particular assignment or subject that’s feeling the hardest right now?\n",
  transcriptObject: [
    {
      role: "agent",
      content:
        "Hey, I’m really glad you reached out. I’m here with you—what’s been going on?",
    },
    {
      role: "user",
      content: "I am just I know I'm stressed right now. ",
    },
    {
      role: "agent",
      content:
        "That sounds really tough. Stress can feel overwhelming sometimes. Would you like to tell me more about what’s making you feel this way?",
    },
    { role: "user", content: "A lot of school work. " },
    {
      role: "agent",
      content:
        "School can definitely pile on the pressure. It’s okay to feel stressed about it. Is there a particular assignment or subject that’s feeling the hardest right now?",
    },
  ],
}

function placeholderEntry(i: number): DashboardCallEntry {
  const start = Date.now() - i * 3600_000
  return {
    id: `placeholder-${i}`,
    callId: `call_placeholder_${50 - i}`,
    listLabel: `v1.2.0-beta.${50 - i} · pending ingest`,
    severity: "info",
    startTimestamp: start,
    endTimestamp: start + 60_000,
    durationMs: 60_000,
    direction: i % 2 === 0 ? "inbound" : "outbound",
    agentName: "Queued agent",
    fromNumber: "+10000000000",
    toNumber: "+10000000001",
    callStatus: "ended",
    transcript: "Agent: Placeholder transcript body.\nUser: Will sync from database.\n",
    transcriptObject: [
      { role: "agent", content: "Placeholder transcript body." },
      { role: "user", content: "Will sync from database." },
    ],
  }
}

/** Scroll list demo: first row is Retell-shaped sample; rest are placeholders. */
export const DASHBOARD_MOCK_CALLS: DashboardCallEntry[] = [
  RETELL_SAMPLE,
  ...Array.from({ length: 49 }, (_, i) => placeholderEntry(i + 1)),
]

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

/** Matches segments in `listLabel` (e.g. `Mar 21 · 31s · Inbound · moderate · Single-Prompt Agent`). */
export type CallSortKey =
  | "date_desc"
  | "date_asc"
  | "duration_desc"
  | "duration_asc"
  | "severity_desc"
  | "severity_asc"
  | "direction_inbound_first"
  | "direction_outbound_first"
  | "agent_asc"
  | "agent_desc"

export type CallSortOption = {
  key: CallSortKey
  /** Menu title — field name + ordering. */
  label: string
  /** Example text from the summary line this sort uses. */
  fieldHint: string
}

export const CALL_SORT_OPTIONS: CallSortOption[] = [
  {
    key: "date_desc",
    label: "Date · newest first",
    fieldHint: "Mar 21, …",
  },
  {
    key: "date_asc",
    label: "Date · oldest first",
    fieldHint: "…",
  },
  {
    key: "duration_desc",
    label: "Duration · longest",
    fieldHint: "31s, …",
  },
  {
    key: "duration_asc",
    label: "Duration · shortest",
    fieldHint: "…",
  },
  {
    key: "severity_desc",
    label: "Severity · high → low",
    fieldHint: "moderate, …",
  },
  {
    key: "severity_asc",
    label: "Severity · low → high",
    fieldHint: "…",
  },
  {
    key: "direction_inbound_first",
    label: "Direction · inbound first",
    fieldHint: "Inbound",
  },
  {
    key: "direction_outbound_first",
    label: "Direction · outbound first",
    fieldHint: "Outbound",
  },
  {
    key: "agent_asc",
    label: "Agent · A → Z",
    fieldHint: "Single-Prompt Agent",
  },
  {
    key: "agent_desc",
    label: "Agent · Z → A",
    fieldHint: "…",
  },
]

const SEVERITY_RANK: Record<CallSeverity, number> = {
  info: 0,
  low: 1,
  moderate: 2,
  elevated: 3,
  critical: 4,
}

export function sortDashboardCalls(
  entries: DashboardCallEntry[],
  key: CallSortKey
): DashboardCallEntry[] {
  const copy = [...entries]
  const tieDate = (a: DashboardCallEntry, b: DashboardCallEntry) =>
    b.startTimestamp - a.startTimestamp

  switch (key) {
    case "date_desc":
      return copy.sort((a, b) => b.startTimestamp - a.startTimestamp)
    case "date_asc":
      return copy.sort((a, b) => a.startTimestamp - b.startTimestamp)
    case "duration_desc":
      return copy.sort((a, b) => b.durationMs - a.durationMs || tieDate(a, b))
    case "duration_asc":
      return copy.sort((a, b) => a.durationMs - b.durationMs || tieDate(a, b))
    case "severity_desc":
      return copy.sort(
        (a, b) =>
          SEVERITY_RANK[b.severity] - SEVERITY_RANK[a.severity] ||
          tieDate(a, b)
      )
    case "severity_asc":
      return copy.sort(
        (a, b) =>
          SEVERITY_RANK[a.severity] - SEVERITY_RANK[b.severity] ||
          tieDate(a, b)
      )
    case "direction_inbound_first":
      return copy.sort((a, b) => {
        const ra = a.direction === "inbound" ? 0 : 1
        const rb = b.direction === "inbound" ? 0 : 1
        return ra - rb || tieDate(a, b)
      })
    case "direction_outbound_first":
      return copy.sort((a, b) => {
        const ra = a.direction === "outbound" ? 0 : 1
        const rb = b.direction === "outbound" ? 0 : 1
        return ra - rb || tieDate(a, b)
      })
    case "agent_asc":
      return copy.sort(
        (a, b) =>
          a.agentName.localeCompare(b.agentName, undefined, {
            sensitivity: "base",
          }) || tieDate(a, b)
      )
    case "agent_desc":
      return copy.sort(
        (a, b) =>
          b.agentName.localeCompare(a.agentName, undefined, {
            sensitivity: "base",
          }) || tieDate(a, b)
      )
    default:
      return copy
  }
}
