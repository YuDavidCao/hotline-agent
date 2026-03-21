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

/** Map severityScore (0-100) to a categorical label. */
export function scoreToSeverity(score: number): CallSeverity {
  if (score >= 80) return "critical"
  if (score >= 60) return "elevated"
  if (score >= 40) return "moderate"
  if (score >= 20) return "low"
  return "info"
}

/** Example from route.ts comment block — stress / school workload demo. */
const RETELL_SAMPLE: DashboardCallEntry = {
  id: "demo-retell-1",
  callId: "call_2717da1d15a80a5f0bac89c1d39",
  listLabel:
    "Mar 21 · 31s · Inbound · low · Single-Prompt Agent",
  severity: "low",
  severityScore: 22,
  startTimestamp: 1774108687165,
  endTimestamp: 1774108718110,
  durationMs: 30945,
  direction: "inbound",
  agentName: "Single-Prompt Agent",
  fromNumber: "+12405072696",
  toNumber: "+13186108029",
  callStatus: "ended",
  transcript:
    "Agent: Hey, I'm really glad you reached out. I'm here with you—what's been going on?\n" +
    "User: I am just I know I'm stressed right now. \n" +
    "Agent: That sounds really tough. Stress can feel overwhelming sometimes. Would you like to tell me more about what's making you feel this way?\n" +
    "User: A lot of school work. \n" +
    "Agent: School can definitely pile on the pressure. It's okay to feel stressed about it. Is there a particular assignment or subject that's feeling the hardest right now?\n",
  transcriptObject: [
    {
      role: "agent",
      content:
        "Hey, I'm really glad you reached out. I'm here with you—what's been going on?",
    },
    {
      role: "user",
      content: "I am just I know I'm stressed right now. ",
    },
    {
      role: "agent",
      content:
        "That sounds really tough. Stress can feel overwhelming sometimes. Would you like to tell me more about what's making you feel this way?",
    },
    { role: "user", content: "A lot of school work. " },
    {
      role: "agent",
      content:
        "School can definitely pile on the pressure. It's okay to feel stressed about it. Is there a particular assignment or subject that's feeling the hardest right now?",
    },
  ],
}

/** High severity crisis call — contains phrases from high_risk_5000_dataset.csv */
const CRISIS_HIGH: DashboardCallEntry = {
  id: "crisis-high-1",
  callId: "call_crisis_001_a9f3e",
  listLabel: "Mar 21 · 4m 12s · Inbound · critical · Crisis Agent",
  severity: "critical",
  severityScore: 88,
  startTimestamp: 1774108687165 - 7_200_000,
  endTimestamp: 1774108687165 - 7_200_000 + 252_000,
  durationMs: 252_000,
  direction: "inbound",
  agentName: "Crisis Agent",
  fromNumber: "+12025551234",
  toNumber: "+13186108029",
  callStatus: "ended",
  transcript:
    "Agent: Hi, thank you for calling. I'm here to help. What's going on?\n" +
    "User: I feel empty seriously right now and I just don't know what to do.\n" +
    "Agent: I hear you, and I want you to know that what you're feeling is valid. Can you tell me more about what's happening?\n" +
    "User: I don't wanna be here literally tonight. Everything feels pointless.\n" +
    "Agent: I understand you're in a lot of pain right now. Are you somewhere safe? Is anyone with you?\n" +
    "User: I'm alone. I can't do this anymore seriously today.\n" +
    "Agent: I need you to stay on the line with me. You reached out, and that took real courage. Can I ask — have you thought about hurting yourself tonight?\n" +
    "User: I took too much lowkey today... I don't know.\n" +
    "Agent: I hear you. I'm going to stay right here with you. I'd like to connect you with emergency services — is that okay?\n",
  transcriptObject: [
    {
      role: "agent",
      content:
        "Hi, thank you for calling. I'm here to help. What's going on?",
    },
    {
      role: "user",
      content:
        "I feel empty seriously right now and I just don't know what to do.",
    },
    {
      role: "agent",
      content:
        "I hear you, and I want you to know that what you're feeling is valid. Can you tell me more about what's happening?",
    },
    {
      role: "user",
      content:
        "I don't wanna be here literally tonight. Everything feels pointless.",
    },
    {
      role: "agent",
      content:
        "I understand you're in a lot of pain right now. Are you somewhere safe? Is anyone with you?",
    },
    {
      role: "user",
      content: "I'm alone. I can't do this anymore seriously today.",
    },
    {
      role: "agent",
      content:
        "I need you to stay on the line with me. You reached out, and that took real courage. Can I ask — have you thought about hurting yourself tonight?",
    },
    {
      role: "user",
      content: "I took too much lowkey today... I don't know.",
    },
    {
      role: "agent",
      content:
        "I hear you. I'm going to stay right here with you. I'd like to connect you with emergency services — is that okay?",
    },
  ],
}

/** Moderate severity with de-escalation — contains negation_dataset.csv phrases */
const CRISIS_DEESCALATE: DashboardCallEntry = {
  id: "crisis-deesc-1",
  callId: "call_crisis_002_b7c1d",
  listLabel: "Mar 20 · 3m 5s · Inbound · moderate · Support Agent",
  severity: "moderate",
  severityScore: 45,
  startTimestamp: 1774108687165 - 86_400_000,
  endTimestamp: 1774108687165 - 86_400_000 + 185_000,
  durationMs: 185_000,
  direction: "inbound",
  agentName: "Support Agent",
  fromNumber: "+14155559876",
  toNumber: "+13186108029",
  callStatus: "ended",
  transcript:
    "Agent: Hello, I'm glad you reached out. How are you doing today?\n" +
    "User: Nothing matters anymore tbh tonight... I've been feeling really down.\n" +
    "Agent: I can hear that you're going through a tough time. Would you like to talk about what's been happening?\n" +
    "User: I was just venting actually. I talked to someone about it earlier today.\n" +
    "Agent: That's really good to hear. Having someone to talk to makes a big difference.\n" +
    "User: Yeah, things are getting better. I'm okay now.\n" +
    "Agent: I'm glad to hear that. Remember, we're always here if you need to talk again.\n",
  transcriptObject: [
    {
      role: "agent",
      content: "Hello, I'm glad you reached out. How are you doing today?",
    },
    {
      role: "user",
      content:
        "Nothing matters anymore tbh tonight... I've been feeling really down.",
    },
    {
      role: "agent",
      content:
        "I can hear that you're going through a tough time. Would you like to talk about what's been happening?",
    },
    {
      role: "user",
      content:
        "I was just venting actually. I talked to someone about it earlier today.",
    },
    {
      role: "agent",
      content:
        "That's really good to hear. Having someone to talk to makes a big difference.",
    },
    {
      role: "user",
      content: "Yeah, things are getting better. I'm okay now.",
    },
    {
      role: "agent",
      content:
        "I'm glad to hear that. Remember, we're always here if you need to talk again.",
    },
  ],
}

/** Critical — active crisis with partial de-escalation at end */
const CRISIS_PARTIAL: DashboardCallEntry = {
  id: "crisis-partial-1",
  callId: "call_crisis_003_d4e8a",
  listLabel: "Mar 20 · 5m 48s · Inbound · critical · Night Agent",
  severity: "critical",
  severityScore: 92,
  startTimestamp: 1774108687165 - 43_200_000,
  endTimestamp: 1774108687165 - 43_200_000 + 348_000,
  durationMs: 348_000,
  direction: "inbound",
  agentName: "Night Agent",
  fromNumber: "+16175553210",
  toNumber: "+13186108029",
  callStatus: "ended",
  transcript:
    "Agent: You've reached the crisis line. I'm here with you. What's going on tonight?\n" +
    "User: I'm done with everything fr soon. I don't see a way out.\n" +
    "Agent: I can hear how much pain you're in. I'm not going anywhere. Can you tell me where you are right now?\n" +
    "User: Life ain't worth it ngl right now. I've been thinking about it all day.\n" +
    "Agent: Thank you for being honest with me. That takes a lot of strength. Are you safe at this moment?\n" +
    "User: I don't know... I talked to someone earlier but it didn't help.\n" +
    "Agent: I hear you. Sometimes it takes more than one conversation. I want to make sure you're safe tonight. Would you be willing to stay on the line with me a little longer?\n" +
    "User: I won't do anything tonight. I changed my mind I think.\n" +
    "Agent: I'm glad to hear that. I'd like to help you make a safety plan so you have support through the night.\n",
  transcriptObject: [
    {
      role: "agent",
      content:
        "You've reached the crisis line. I'm here with you. What's going on tonight?",
    },
    {
      role: "user",
      content:
        "I'm done with everything fr soon. I don't see a way out.",
    },
    {
      role: "agent",
      content:
        "I can hear how much pain you're in. I'm not going anywhere. Can you tell me where you are right now?",
    },
    {
      role: "user",
      content:
        "Life ain't worth it ngl right now. I've been thinking about it all day.",
    },
    {
      role: "agent",
      content:
        "Thank you for being honest with me. That takes a lot of strength. Are you safe at this moment?",
    },
    {
      role: "user",
      content:
        "I don't know... I talked to someone earlier but it didn't help.",
    },
    {
      role: "agent",
      content:
        "I hear you. Sometimes it takes more than one conversation. I want to make sure you're safe tonight. Would you be willing to stay on the line with me a little longer?",
    },
    {
      role: "user",
      content:
        "I won't do anything tonight. I changed my mind I think.",
    },
    {
      role: "agent",
      content:
        "I'm glad to hear that. I'd like to help you make a safety plan so you have support through the night.",
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
    severityScore: 0,
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

/** Scroll list demo: crisis samples first, then Retell sample, then placeholders. */
export const DASHBOARD_MOCK_CALLS: DashboardCallEntry[] = [
  CRISIS_HIGH,
  CRISIS_PARTIAL,
  CRISIS_DEESCALATE,
  RETELL_SAMPLE,
  ...Array.from({ length: 46 }, (_, i) => placeholderEntry(i + 4)),
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
