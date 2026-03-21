/**
 * Client-safe types and annotation logic for risk/negation phrase matching.
 * No Node.js dependencies — safe to import from "use client" components.
 */

export type HighRiskPhrase = {
  phrase: string
  severity: number
  category: string
}

export type NegationPhrase = {
  phrase: string
  severity: number
  interpretation: string
}

export type RiskDataPayload = {
  risk: HighRiskPhrase[]
  negation: NegationPhrase[]
}

export type AnnotatedSegment =
  | { kind: "plain"; text: string }
  | { kind: "risk"; text: string; severity: number; category: string }
  | { kind: "negation"; text: string; severity: number; interpretation: string }

type RawMatch = {
  start: number
  end: number
} & (
  | { kind: "risk"; severity: number; category: string }
  | { kind: "negation"; severity: number; interpretation: string }
)

/**
 * Scan a text string for matches against both datasets.
 * Returns an array of segments splitting the original text into plain,
 * risk-highlighted, and negation-highlighted runs.
 */
export function annotateText(
  text: string,
  risk: HighRiskPhrase[],
  negation: NegationPhrase[]
): AnnotatedSegment[] {
  const lower = text.toLowerCase()
  const candidates: RawMatch[] = []

  for (const entry of risk) {
    if (!entry.phrase) continue
    let idx = 0
    while ((idx = lower.indexOf(entry.phrase, idx)) !== -1) {
      candidates.push({
        start: idx,
        end: idx + entry.phrase.length,
        kind: "risk",
        severity: entry.severity,
        category: entry.category,
      })
      idx += 1
    }
  }

  for (const entry of negation) {
    if (!entry.phrase) continue
    let idx = 0
    while ((idx = lower.indexOf(entry.phrase, idx)) !== -1) {
      candidates.push({
        start: idx,
        end: idx + entry.phrase.length,
        kind: "negation",
        severity: entry.severity,
        interpretation: entry.interpretation,
      })
      idx += 1
    }
  }

  // Leftmost first; at same position prefer longest match
  candidates.sort(
    (a, b) => a.start - b.start || b.end - b.start - (a.end - a.start)
  )

  // Greedy non-overlapping selection
  const selected: RawMatch[] = []
  let lastEnd = 0
  for (const c of candidates) {
    if (c.start >= lastEnd) {
      selected.push(c)
      lastEnd = c.end
    }
  }

  // Build segment list
  const segments: AnnotatedSegment[] = []
  let pos = 0
  for (const m of selected) {
    if (m.start > pos) {
      segments.push({ kind: "plain", text: text.slice(pos, m.start) })
    }
    const matched = text.slice(m.start, m.end)
    if (m.kind === "risk") {
      segments.push({
        kind: "risk",
        text: matched,
        severity: m.severity,
        category: m.category,
      })
    } else {
      segments.push({
        kind: "negation",
        text: matched,
        severity: m.severity,
        interpretation: m.interpretation,
      })
    }
    pos = m.end
  }
  if (pos < text.length) {
    segments.push({ kind: "plain", text: text.slice(pos) })
  }

  return segments
}
