import type { SpeechSegment } from "./energy-detection"

export interface TimedCaption {
  /** Start time in seconds */
  start: number
  /** End time in seconds */
  end: number
  /** Caption text (one or more words) */
  text: string
  /** Which speaker this belongs to */
  turnRole: "agent" | "user"
  /** Index of the transcript turn this caption came from */
  turnIndex: number
}

interface TranscriptTurn {
  role: "agent" | "user"
  content: string
}

interface WordEntry {
  word: string
  role: "agent" | "user"
  turnIndex: number
}

/**
 * Parses the raw "Agent: ...\nUser: ..." transcript into structured turns.
 */
export function parseTranscriptTurns(transcript: string): TranscriptTurn[] {
  const turns: TranscriptTurn[] = []
  for (const line of transcript.split("\n")) {
    const t = line.trim()
    if (t.startsWith("Agent: ")) turns.push({ role: "agent", content: t.slice(7) })
    else if (t.startsWith("User: ")) turns.push({ role: "user", content: t.slice(6) })
  }
  return turns
}

function splitWords(text: string): string[] {
  return text.split(/\s+/).filter(Boolean)
}

/**
 * Groups consecutive speech segments into utterance blocks by finding
 * the largest inter-segment gaps. If the transcript has N turns we
 * pick the (N−1) largest gaps as speaker-change boundaries, producing
 * exactly N groups that map 1-to-1 with transcript turns.
 */
function groupSegmentsByTurnCount(
  segments: SpeechSegment[],
  turnCount: number,
): SpeechSegment[][] {
  if (segments.length === 0) return []
  if (turnCount <= 1 || segments.length <= 1) return [segments]

  const gaps: { index: number; size: number }[] = []
  for (let i = 0; i < segments.length - 1; i++) {
    gaps.push({ index: i, size: segments[i + 1].start - segments[i].end })
  }

  const splitCount = Math.min(turnCount - 1, gaps.length)
  const splitIndices = gaps
    .slice()
    .sort((a, b) => b.size - a.size)
    .slice(0, splitCount)
    .map((g) => g.index)
    .sort((a, b) => a - b)

  const groups: SpeechSegment[][] = []
  let start = 0
  for (const splitIdx of splitIndices) {
    groups.push(segments.slice(start, splitIdx + 1))
    start = splitIdx + 1
  }
  groups.push(segments.slice(start))

  return groups
}

/**
 * Distributes word entries across a group of segments proportionally
 * by duration, preserving per-word role metadata.
 */
function captionsForGroup(
  words: WordEntry[],
  group: SpeechSegment[],
  wordsPerCaption: number,
): TimedCaption[] {
  if (words.length === 0 || group.length === 0) return []

  const totalDuration = group.reduce((s, seg) => s + (seg.end - seg.start), 0)
  if (totalDuration <= 0) return []

  const captions: TimedCaption[] = []
  let wordCursor = 0

  for (let gi = 0; gi < group.length; gi++) {
    const seg = group[gi]
    const segDuration = seg.end - seg.start
    const isLast = gi === group.length - 1

    let segWordCount: number
    if (isLast) {
      segWordCount = words.length - wordCursor
    } else {
      segWordCount = Math.max(
        1,
        Math.round((segDuration / totalDuration) * words.length),
      )
      segWordCount = Math.min(segWordCount, words.length - wordCursor)
    }
    if (segWordCount <= 0) continue

    const segWords = words.slice(wordCursor, wordCursor + segWordCount)
    const timePerWord = segDuration / segWords.length

    for (let i = 0; i < segWords.length; i += wordsPerCaption) {
      const chunk = segWords.slice(i, i + wordsPerCaption)
      const captionStart = seg.start + i * timePerWord
      const captionEnd =
        seg.start +
        Math.min(i + wordsPerCaption, segWords.length) * timePerWord

      captions.push({
        start: captionStart,
        end: captionEnd,
        text: chunk.map((w) => w.word).join(" "),
        turnRole: chunk[0].role,
        turnIndex: chunk[0].turnIndex,
      })
    }

    wordCursor += segWordCount
  }

  return captions
}

/**
 * Flattens turns into WordEntry[] preserving per-word role/index.
 */
function turnsToWords(
  turns: TranscriptTurn[],
  startIndex = 0,
): WordEntry[] {
  const entries: WordEntry[] = []
  for (let i = 0; i < turns.length; i++) {
    for (const w of splitWords(turns[i].content)) {
      entries.push({ word: w, role: turns[i].role, turnIndex: startIndex + i })
    }
  }
  return entries
}

/**
 * Aligns transcript words to detected speech segments, respecting
 * speaker-turn boundaries.
 *
 * Strategy:
 *  1. Parse transcript into turns (Agent / User)
 *  2. Group speech segments into utterance blocks by selecting the
 *     largest inter-segment gaps as speaker-change points — one block
 *     per turn.
 *  3. Within each block, distribute that turn's words proportionally
 *     across the block's segments and chunk into captions.
 */
export function alignWordsToSegments(
  transcript: string,
  segments: SpeechSegment[],
  wordsPerCaption = 5,
): TimedCaption[] {
  if (segments.length === 0) return []

  const turns = parseTranscriptTurns(transcript)
  if (turns.length === 0) return []

  const turnWords = turns.map((t, i) =>
    splitWords(t.content).map((w) => ({
      word: w,
      role: t.role,
      turnIndex: i,
    } as WordEntry)),
  )
  if (turnWords.every((w) => w.length === 0)) return []

  const groups = groupSegmentsByTurnCount(segments, turns.length)
  if (groups.length === 0) return []

  const captions: TimedCaption[] = []

  if (groups.length === turns.length) {
    for (let i = 0; i < turns.length; i++) {
      captions.push(
        ...captionsForGroup(turnWords[i], groups[i], wordsPerCaption),
      )
    }
  } else if (groups.length < turns.length) {
    for (let i = 0; i < groups.length; i++) {
      if (i < groups.length - 1) {
        captions.push(
          ...captionsForGroup(turnWords[i], groups[i], wordsPerCaption),
        )
      } else {
        const combined = turnsToWords(turns.slice(i), i)
        captions.push(
          ...captionsForGroup(combined, groups[i], wordsPerCaption),
        )
      }
    }
  } else {
    for (let i = 0; i < turns.length; i++) {
      if (i < turns.length - 1) {
        captions.push(
          ...captionsForGroup(turnWords[i], groups[i], wordsPerCaption),
        )
      } else {
        const merged: SpeechSegment[] = []
        for (let j = i; j < groups.length; j++) {
          merged.push(...groups[j])
        }
        captions.push(
          ...captionsForGroup(turnWords[i], merged, wordsPerCaption),
        )
      }
    }
  }

  return captions
}
