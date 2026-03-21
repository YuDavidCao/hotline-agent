'use client'

import { useParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
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

function severityClass(severity: number) {
  if (severity <= 3) return "bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400"
  if (severity < 6) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400"
  return "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400"
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
                Review call transcripts and aggregated notes.
              </p>
            </div>
          </div>

      {isLoading ? (
        <p>Loading notes…</p>
      ) : error ? (
        <p style={{ color: "red" }}>Error: {error}</p>
      ) : callHistory.length > 0 ? (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_22rem]">
          <div className="space-y-3">
            {callHistory.map((call) => (
              <Card key={call.callId} className="space-y-2 p-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2 border-b border-border pb-1.5">
                  <div>
                    <p className="text-xs text-muted-foreground">Call ID</p>
                    <p className="font-mono text-[11px] sm:text-xs">{call.callId}</p>
                  </div>
                  <div className="flex items-center gap-2 sm:gap-3">
                    <Button
                      type="button"
                      variant="outline"
                      size="xs"
                      onClick={() => router.push(`/dashboard/calls/${call.id}`)}
                    >
                      View call
                    </Button>
                    <div className="flex min-w-[9rem] flex-col items-end gap-1 text-xs">
                      <p className="text-muted-foreground tabular-nums">{formatDuration(call.durationMs)}</p>
                      <p
                        className={`inline-flex rounded-sm border px-2 py-0.5 font-medium ${severityClass(call.severity)}`}
                      >
                        Severity {call.severity}
                      </p>
                    </div>
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
                    <h2 className="text-xs font-medium">Transcript</h2>
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
            ))}
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
      ) : (
        <p>No notes found.</p>
      )}
        </div>
      </main>
    </div>
  )
}