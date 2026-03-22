import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { CallsTable, type CallRow } from "@/components/dashboard/calls-table"
import { prisma } from "@/lib/prisma"

export const metadata: Metadata = {
  title: "Dashboard | Hotline Agent",
  description: "Review call transcripts and session activity.",
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const rawCalls = await prisma.inboundCall.findMany({
    orderBy: { startTime: "desc" },
    select: {
      id: true,
      callId: true,
      startTime: true,
      endTime: true,
      duration: true,
      fromNumber: true,
      transcript: true,
      severity: true,
      notes: true,
      recordingURL: true,
    },
  })

  const calls: CallRow[] = rawCalls.map((c) => ({
    id: c.id,
    callId: c.callId,
    startTime: Number(c.startTime),
    endTime: Number(c.endTime),
    duration: Number(c.duration),
    fromNumber: c.fromNumber,
    transcript: String(c.transcript ?? ""),
    severity: c.severity,
    notes: (c.notes as { note: string; reason: string }[] | null) ?? [],
    recordingURL: c.recordingURL,
  }))

  const totalCalls = calls.length
  const totalDurationMs = calls.reduce((sum, call) => sum + call.duration, 0)
  const averageDurationMs = totalCalls > 0 ? Math.round(totalDurationMs / totalCalls) : 0

  const lowSeverityCount = calls.filter((call) => call.severity <= 3).length
  const mediumSeverityCount = calls.filter(
    (call) => call.severity > 3 && call.severity < 6,
  ).length
  const highSeverityCount = calls.filter((call) => call.severity >= 6).length

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Welcome, {session.user?.name ?? "there"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-4xl text-[15px] leading-relaxed">
          Browse inbound calls, review transcripts, and manage flagged activity.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[18rem_minmax(0,1fr)] lg:items-start">
        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-muted/40 px-4 py-3">
            <h2 className="text-sm font-semibold text-foreground">Call Stats</h2>
            <p className="mt-0.5 text-xs text-muted-foreground">
              Current snapshot
            </p>
          </div>
          <div className="space-y-3 p-4">
            <div className="rounded-sm border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Total calls</p>
              <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                {totalCalls}
              </p>
            </div>

            <div className="rounded-sm border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Average call time</p>
              <p className="mt-1 text-2xl font-semibold text-foreground tabular-nums">
                {formatDuration(averageDurationMs)}
              </p>
            </div>

            <div className="rounded-sm border border-border bg-muted/30 p-3">
              <p className="text-xs text-muted-foreground">Severity categories</p>
              <ul className="mt-2 space-y-1.5 text-sm">
                <li className="flex items-center justify-between gap-2">
                  <span className="text-green-500">Low (1-3)</span>
                  <span className="font-semibold tabular-nums">{lowSeverityCount}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-yellow-500">Medium (4-5)</span>
                  <span className="font-semibold tabular-nums">{mediumSeverityCount}</span>
                </li>
                <li className="flex items-center justify-between gap-2">
                  <span className="text-red-500">High (6-10)</span>
                  <span className="font-semibold tabular-nums">{highSeverityCount}</span>
                </li>
              </ul>
            </div>
          </div>
        </Card>

        <Card className="overflow-hidden p-0">
          <div className="border-b border-border bg-muted/40 px-6 py-4">
            <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-lg font-semibold text-foreground">Calls</h2>
              </div>
            </div>
          </div>
          <div className="p-4">
            <CallsTable calls={calls} />
          </div>
        </Card>
      </div>
    </div>
  )
}
