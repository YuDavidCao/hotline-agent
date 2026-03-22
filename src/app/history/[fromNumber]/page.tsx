'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useMemo, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { AppNavbar } from '@/components/layout/app-navbar'
import { ScrollArea } from '@/components/ui/scroll-area'

type NoteItem = {
  note: string
}

type CallHistoryItem = {
  id: string
  callId: string
  transcriptText: string
  notes: NoteItem[]
  severity: number
  startTime: number
  endTime: number
  durationMs: number
  disconnectionReason: string
}

async function fetchCallHistory(phoneNumber: string) {
  const res = await fetch(`/api/notes/${encodeURIComponent(phoneNumber)}`)
  if (!res.ok) throw new Error("Failed to fetch")
  return (await res.json()) as CallHistoryItem[]
}

function formatTimestamp(timestamp: number) {
  return new Date(timestamp).toLocaleString()
}

function formatDuration(durationMs: number) {
  const totalSeconds = Math.floor(durationMs / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}m ${seconds}s`
}

function formatShortWhen(ts: number) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

function severityClass(severity: number) {
  if (severity <= 3) return "bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400"
  if (severity < 6) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400"
  return "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400"
}

function severityDotClass(severity: number) {
  if (severity <= 3) return "bg-green-500 ring-green-500/40"
  if (severity < 6) return "bg-yellow-500 ring-yellow-500/40"
  return "bg-red-500 ring-red-500/40"
}

const MS_DAY = 86_400_000
const MS_48H = 48 * 60 * 60 * 1000

function buildCallerInsights(calls: CallHistoryItem[]) {
  if (calls.length === 0) {
    return {
      total: 0,
      avgSeverity: 0,
      firstStart: 0,
      lastStart: 0,
      repeatCaller: false,
      insightLines: [] as string[],
      lastWindow24h: 0,
      escalationSteps: [] as { call: CallHistoryItem; delta: number | null }[],
    }
  }

  const chronological = [...calls].sort((a, b) => a.startTime - b.startTime)
  const total = chronological.length
  const sumSev = chronological.reduce((s, c) => s + c.severity, 0)
  const avgSeverity = Math.round((sumSev / total) * 10) / 10
  const firstStart = chronological[0]!.startTime
  const lastStart = chronological[chronological.length - 1]!.startTime
  const spanDays = Math.max(1, Math.ceil((lastStart - firstStart) / MS_DAY))

  const now = Date.now()
  const lastWindow48h = chronological.filter((c) => c.startTime >= now - MS_48H).length
  const lastWindow7d = chronological.filter((c) => c.startTime >= now - 7 * MS_DAY).length
  const lastWindow24h = chronological.filter((c) => c.startTime >= now - MS_DAY).length

  const repeatCaller = total >= 2
  const insightLines: string[] = []

  if (lastWindow48h >= 2) {
    insightLines.push(
      `This caller has called ${lastWindow48h} time${lastWindow48h === 1 ? '' : 's'} in the last 2 days.`,
    )
  } else if (lastWindow7d >= 3 && lastWindow48h < 2) {
    insightLines.push(
      `This caller has called ${lastWindow7d} time${lastWindow7d === 1 ? '' : 's'} in the last 7 days.`,
    )
  } else if (repeatCaller && lastWindow48h < 2) {
    insightLines.push(
      `Repeat caller: ${total} total call${total === 1 ? '' : 's'} over about ${spanDays} day${spanDays === 1 ? '' : 's'}.`,
    )
  }

  const last3 = chronological.slice(-3)
  const s3 = last3.map((c) => c.severity)
  const severityLast3StrictlyUp =
    s3.length === 3 && s3[0]! < s3[1]! && s3[1]! < s3[2]!
  const severityLast3NonDown =
    s3.length === 3 && s3[0]! <= s3[1]! && s3[1]! <= s3[2]! && s3[2]! > s3[0]!

  if (s3.length === 3) {
    if (severityLast3StrictlyUp) {
      insightLines.push('Severity increasing over the last 3 calls.')
    } else if (severityLast3NonDown && !severityLast3StrictlyUp) {
      insightLines.push('Severity trending up over the last 3 calls (with plateaus).')
    } else if (s3[0]! > s3[1]! && s3[1]! > s3[2]!) {
      insightLines.push('Severity decreasing over the last 3 calls.')
    }
  } else if (chronological.length === 2) {
    const [a, b] = chronological
    if (b!.severity > a!.severity) {
      insightLines.push('Severity increased from the first call to the most recent.')
    } else if (b!.severity < a!.severity) {
      insightLines.push('Severity decreased from the first call to the most recent.')
    }
  }

  const escalationSteps = chronological.map((call, i) => ({
    call,
    delta: i === 0 ? null : call.severity - chronological[i - 1]!.severity,
  }))

  return {
    total,
    avgSeverity,
    firstStart,
    lastStart,
    repeatCaller,
    insightLines,
    lastWindow24h,
    escalationSteps,
  }
}

export default function CallHistoryPage() {
  const router = useRouter()
  const params = useParams()
  const fromNumberParam = params.fromNumber
  const normalizedNumber = Array.isArray(fromNumberParam)
    ? fromNumberParam[0] ?? ''
    : fromNumberParam ?? ''
  const number = decodeURIComponent(normalizedNumber)

  const [callHistory, setCallHistory] = useState<CallHistoryItem[]>([])
  const [expandedCalls, setExpandedCalls] = useState<Record<string, boolean>>({})
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState("")

  const allNotes = callHistory.flatMap((call) =>
    call.notes.map((note, idx) => ({
      key: `${call.callId}-${idx}`,
      callId: call.callId,
      callDbId: call.id,
      note: note.note,
    }))
  )

  const insights = useMemo(() => buildCallerInsights(callHistory), [callHistory])

  useEffect(() => {
    if (!number) return

    setIsLoading(true)
    fetchCallHistory(number)
      .then(data => {
        setCallHistory(data)
        setError("")
      })
      .catch(err => setError(err.message))
      .finally(() => setIsLoading(false))
  }, [number])

  return (
    <div className="min-h-screen bg-background">
      <AppNavbar subtitle="History by phone number" showDashboardButton showSignOutButton />

      <main className="px-3 py-4 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        <div className="mx-auto w-full max-w-[min(100rem,calc(100vw-1.5rem))] space-y-4">
          <div className="flex items-start gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.back()}
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
              <h1 className="text-2xl font-semibold">History for {number}</h1>
              <p className="text-sm text-muted-foreground mt-0.5">
                Transcripts and notes for this number. Calls are listed newest first; the rail shows severity
                and change from the chronologically prior call.
              </p>
            </div>
          </div>

      {isLoading ? (
        <p>Loading notes…</p>
      ) : error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : callHistory.length > 0 ? (
        <div className="space-y-4">
          <Card className="overflow-hidden p-0">
            <div className="flex flex-wrap items-start justify-between gap-3 border-b border-border bg-muted/30 px-4 py-3">
              <div>
                <h2 className="text-sm font-semibold">Caller snapshot</h2>
                <p className="text-xs text-muted-foreground">
                  Activity and severity patterns for this number
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {insights.repeatCaller ? (
                  <span className="inline-flex items-center rounded-sm border border-amber-500/40 bg-amber-500/10 px-2 py-0.5 text-xs font-medium text-amber-800 dark:text-amber-300">
                    Repeat caller
                  </span>
                ) : (
                  <span className="inline-flex items-center rounded-sm border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    Single call on record
                  </span>
                )}
                {insights.lastWindow24h >= 2 ? (
                  <span className="inline-flex items-center rounded-sm border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
                    {insights.lastWindow24h} in last 24h
                  </span>
                ) : null}
              </div>
            </div>
            <div className="grid gap-3 p-4 sm:grid-cols-2 lg:grid-cols-4">
              <div className="rounded-sm border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Total calls</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{insights.total}</p>
              </div>
              <div className="rounded-sm border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Avg. severity</p>
                <p className="mt-1 text-xl font-semibold tabular-nums">{insights.avgSeverity}</p>
              </div>
              <div className="rounded-sm border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">First call</p>
                <p className="mt-1 text-sm font-medium leading-tight">{formatShortWhen(insights.firstStart)}</p>
              </div>
              <div className="rounded-sm border border-border bg-muted/20 p-3">
                <p className="text-xs text-muted-foreground">Latest call</p>
                <p className="mt-1 text-sm font-medium leading-tight">{formatShortWhen(insights.lastStart)}</p>
              </div>
            </div>
            {insights.insightLines.length > 0 ? (
              <ul className="space-y-2 border-t border-border px-4 py-3 text-sm">
                {insights.insightLines.map((line, i) => (
                  <li
                    key={i}
                    className="flex gap-2 rounded-sm border border-border/80 bg-muted/25 px-3 py-2 leading-snug"
                  >
                    <span className="mt-0.5 text-muted-foreground" aria-hidden>
                      →
                    </span>
                    <span>{line}</span>
                  </li>
                ))}
              </ul>
            ) : null}
          </Card>

        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-4">
            <div>
              <h2 className="text-sm font-semibold">Call history</h2>
              <p className="text-xs text-muted-foreground mt-0.5">
                Newest first. Dot color reflects severity; Δ is the change from the chronologically prior call.
              </p>
            </div>
            <ul className="space-y-4" role="list">
              {[...insights.escalationSteps].reverse().map(({ call, delta }, i, arr) => (
                <li
                  key={call.id}
                  className="grid grid-cols-[2.5rem_minmax(0,1fr)] gap-x-2 sm:grid-cols-[2.75rem_minmax(0,1fr)]"
                >
                  <div className="relative flex justify-center pt-3">
                    <button
                      type="button"
                      title={`Open call — severity ${call.severity}`}
                      aria-label={`Open call from ${formatShortWhen(call.startTime)}, severity ${call.severity}`}
                      onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                      className={`relative z-10 mt-0.5 h-3.5 w-3.5 shrink-0 rounded-full ring-2 ring-offset-2 ring-offset-background transition hover:scale-110 ${severityDotClass(call.severity)}`}
                    />
                    {i < arr.length - 1 ? (
                      <div
                        className="absolute left-1/2 top-7 bottom-[-1rem] w-px -translate-x-1/2 bg-border"
                        aria-hidden
                      />
                    ) : null}
                  </div>
                  <Card className="space-y-2 p-2.5">
                    <div className="flex flex-wrap items-start justify-between gap-2 border-b border-border pb-1.5">
                      <div className="min-w-0">
                        <p className="text-xs text-muted-foreground">Call ID</p>
                        <p className="font-mono text-[11px] sm:text-xs break-all">{call.callId}</p>
                        <p className="mt-1 text-[11px] text-muted-foreground tabular-nums sm:text-xs">
                          {delta === null ? (
                            <span>Earliest call on record</span>
                          ) : delta > 0 ? (
                            <span className="text-red-600 dark:text-red-400">Δ +{delta} vs earlier call</span>
                          ) : delta < 0 ? (
                            <span className="text-green-600 dark:text-green-400">Δ {delta} vs earlier call</span>
                          ) : (
                            <span>Δ 0 vs earlier call</span>
                          )}
                        </p>
                      </div>
                      <div className="flex shrink-0 flex-wrap items-center justify-end gap-2 sm:gap-3">
                        <div className="flex min-w-[5rem] flex-col items-end gap-1 text-xs">
                          <p className="text-muted-foreground tabular-nums">{formatDuration(call.durationMs)}</p>
                          <p
                            className={`inline-flex rounded-sm border px-2 py-0.5 font-medium ${severityClass(call.severity)}`}
                          >
                            Severity {call.severity}
                          </p>
                        </div>
                        <Button
                          type="button"
                          variant="outline"
                          size="xs"
                          onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                        >
                          View call
                        </Button>
                      </div>
                    </div>

                    <div className="grid gap-0.5 text-[11px] sm:grid-cols-2">
                      <p>
                        <span className="text-muted-foreground">Started:</span>{' '}
                        {formatTimestamp(call.startTime)}
                      </p>
                      <p>
                        <span className="text-muted-foreground">Ended:</span>{' '}
                        {formatTimestamp(call.endTime)}
                      </p>
                      <p className="sm:col-span-2">
                        <span className="text-muted-foreground">Disconnected:</span>{' '}
                        {call.disconnectionReason}
                      </p>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <h3 className="text-xs font-medium">Transcript</h3>
                        <Button
                          type="button"
                          variant="ghost"
                          size="xs"
                          className="h-6 px-2"
                          onClick={() =>
                            setExpandedCalls((prev) => ({
                              ...prev,
                              [call.id]: !prev[call.id],
                            }))
                          }
                        >
                          {expandedCalls[call.id] ? 'Show less' : 'Show all'}
                        </Button>
                      </div>
                      {expandedCalls[call.id] ? (
                        <div className="rounded-sm border border-border bg-muted/30 p-2">
                          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                            {call.transcriptText || 'No transcript available.'}
                          </pre>
                        </div>
                      ) : (
                        <ScrollArea className="h-24 rounded-sm border border-border bg-muted/30 p-2">
                          <pre className="whitespace-pre-wrap text-xs leading-relaxed text-foreground">
                            {call.transcriptText || 'No transcript available.'}
                          </pre>
                        </ScrollArea>
                      )}
                    </div>
                  </Card>
                </li>
              ))}
            </ul>
          </div>

          <Card className="h-fit p-0 lg:sticky lg:top-4">
            <div className="border-b border-border px-4 py-3">
              <h2 className="text-sm font-semibold">All Notes</h2>
              <p className="text-xs text-muted-foreground">Across {callHistory.length} call{callHistory.length !== 1 ? 's' : ''}</p>
            </div>
            <ScrollArea className="h-[28rem] p-3">
              {allNotes.length > 0 ? (
                <ul className="space-y-2">
                  {allNotes.map((item) => (
                    <li key={item.key} className="rounded-sm border border-border bg-muted/40 p-2">
                      <p className="mb-1 font-mono text-[10px] text-muted-foreground">{item.callId}</p>
                      <p className="text-sm leading-snug">{item.note}</p>
                      <Button
                        type="button"
                        variant="link"
                        size="xs"
                        className="mt-1 h-auto px-0"
                        onClick={() => router.push(`/dashboard/calls/${item.callDbId}`)}
                      >
                        View call
                      </Button>
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-sm text-muted-foreground">No notes across these calls.</p>
              )}
            </ScrollArea>
          </Card>
        </div>
        </div>
      ) : (
        <p>No notes found.</p>
      )}
        </div>
      </main>
    </div>
  )
}