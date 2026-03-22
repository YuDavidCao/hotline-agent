/**
 * Energy-based speech segment detection
 */

export interface SpeechSegment {
  /** Start time in seconds */
  start: number
  /** End time in seconds */
  end: number
}

interface DetectionOptions {
  /** Size of the rectangular smoothing window (in samples). Default: 4 */
  smoothingWindow?: number
  /** Threshold as a fraction of the max smoothed energy. Default: 0.05 */
  thresholdFactor?: number
  /** Gaps shorter than this (ms) are merged into speech. Default: 50 */
  gapMs?: number
  /** Segments shorter than this (ms) are discarded. Default: 100 */
  minLengthMs?: number
}

function convolveSame(signal: Float64Array, windowSize: number): Float64Array {
  const n = signal.length
  const out = new Float64Array(n)
  const half = Math.floor(windowSize / 2)

  let sum = 0
  for (let j = 0; j < Math.min(windowSize - half, n); j++) sum += signal[j]

  for (let i = 0; i < n; i++) {
    out[i] = sum
    const drop = i - half
    if (drop >= 0) sum -= signal[drop]
    const add = i - half + windowSize
    if (add < n) sum += signal[add]
  }
  return out
}

function norm(samples: Float32Array): number {
  let sum = 0
  for (let i = 0; i < samples.length; i++) {
    sum += samples[i] * samples[i]
  }
  return Math.sqrt(sum)
}

export function detectSpeechSegments(
  samples: Float32Array,
  sampleRate: number,
  opts?: DetectionOptions,
): SpeechSegment[] {
  const smoothingWindow = opts?.smoothingWindow ?? 4
  const thresholdFactor = opts?.thresholdFactor ?? 0.05
  const gapMs = opts?.gapMs ?? 50
  const minLengthMs = opts?.minLengthMs ?? 100

  const n = samples.length
  if (n === 0) return []

  const signalNorm = norm(samples)
  if (signalNorm === 0) return []

  // Normalize then square → instantaneous energy
  const energy = new Float64Array(n)
  for (let i = 0; i < n; i++) {
    const normalized = samples[i] / signalNorm
    energy[i] = normalized * normalized
  }

  // Smooth with rectangular window
  const smoothed = convolveSame(energy, smoothingWindow)

  // Threshold
  let maxSmoothed = 0
  for (let i = 0; i < n; i++) {
    if (smoothed[i] > maxSmoothed) maxSmoothed = smoothed[i]
  }
  const threshold = thresholdFactor * maxSmoothed

  const speech = new Uint8Array(n)
  for (let i = 0; i < n; i++) {
    speech[i] = smoothed[i] > threshold ? 1 : 0
  }

  // Merge gaps shorter than gapMs
  const gapSamples = Math.round((gapMs / 1000) * sampleRate)
  const merged = convolveSame(new Float64Array(speech), gapSamples)
  for (let i = 0; i < n; i++) {
    speech[i] = merged[i] > 0 ? 1 : 0
  }

  // Find rising/falling edges
  const starts: number[] = []
  const ends: number[] = []

  for (let i = 1; i < n; i++) {
    const diff = speech[i] - speech[i - 1]
    if (diff === 1) starts.push(i)
    else if (diff === -1) ends.push(i)
  }

  if (speech[0] === 1) starts.unshift(0)
  if (speech[n - 1] === 1) ends.push(n - 1)

  // Filter by min length
  const minLenSamples = Math.round((minLengthMs / 1000) * sampleRate)
  const segments: SpeechSegment[] = []

  const count = Math.min(starts.length, ends.length)
  for (let i = 0; i < count; i++) {
    if (ends[i] - starts[i] >= minLenSamples) {
      segments.push({
        start: starts[i] / sampleRate,
        end: ends[i] / sampleRate,
      })
    }
  }

  return segments
}