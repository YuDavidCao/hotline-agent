/**
 * Server-only CSV loading for risk/negation datasets.
 * Reads from `data/` directory and deduplicates phrases.
 *
 * Do NOT import this module from client components — it uses `fs`.
 */

import fs from "fs"
import path from "path"
import type {
  HighRiskPhrase,
  NegationPhrase,
  RiskDataPayload,
} from "./risk-annotations"

function parseCsvRows(raw: string): string[][] {
  return raw
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean)
    .map((line) => {
      const parts: string[] = []
      let current = ""
      let inQuotes = false
      for (const ch of line) {
        if (ch === '"') {
          inQuotes = !inQuotes
        } else if (ch === "," && !inQuotes) {
          parts.push(current.trim())
          current = ""
        } else {
          current += ch
        }
      }
      parts.push(current.trim())
      return parts
    })
}

/**
 * Load and deduplicate the high-risk dataset.
 * When the same phrase appears multiple times, the entry with the
 * highest severity is kept.
 */
function loadHighRisk(): HighRiskPhrase[] {
  const filePath = path.join(
    process.cwd(),
    "data",
    "high_risk_5000_dataset.csv"
  )
  const rows = parseCsvRows(fs.readFileSync(filePath, "utf-8"))
  const map = new Map<string, HighRiskPhrase>()

  for (const cols of rows.slice(1)) {
    const phrase = (cols[0] ?? "").toLowerCase()
    const severity = parseInt(cols[1] ?? "0", 10)
    const category = cols[2] ?? ""
    if (!phrase) continue
    const existing = map.get(phrase)
    if (!existing || severity > existing.severity) {
      map.set(phrase, { phrase, severity, category })
    }
  }

  return Array.from(map.values())
}

/**
 * Load and deduplicate the negation dataset.
 * When the same phrase appears multiple times, the entry with the
 * lowest severity is kept (strongest de-escalation signal).
 */
function loadNegation(): NegationPhrase[] {
  const filePath = path.join(process.cwd(), "data", "negation_dataset.csv")
  const rows = parseCsvRows(fs.readFileSync(filePath, "utf-8"))
  const map = new Map<string, NegationPhrase>()

  for (const cols of rows.slice(1)) {
    const phrase = (cols[0] ?? "").toLowerCase()
    const severity = parseInt(cols[1] ?? "0", 10)
    const interpretation = cols[2] ?? ""
    if (!phrase) continue
    const existing = map.get(phrase)
    if (!existing || severity < existing.severity) {
      map.set(phrase, { phrase, severity, interpretation })
    }
  }

  return Array.from(map.values())
}

let cache: RiskDataPayload | null = null

/** Load both datasets (cached after first call within the same process). */
export function loadRiskData(): RiskDataPayload {
  if (cache) return cache
  cache = { risk: loadHighRisk(), negation: loadNegation() }
  return cache
}
