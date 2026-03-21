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

      <Card className="overflow-hidden p-0">
        <div className="border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">Calls</h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Inbound calls — most recent first.
              </p>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground whitespace-nowrap">
              {calls.length} total
            </span>
          </div>
        </div>
        <div className="p-4">
          <CallsTable calls={calls} />
        </div>
      </Card>
    </div>
  )
}
