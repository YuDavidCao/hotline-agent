import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"
import { DashboardCallWorkspace } from "@/components/dashboard/dashboard-call-workspace"

export const metadata: Metadata = {
  title: "Dashboard | Hotline Agent",
  description: "Review call transcripts and session activity.",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-foreground tracking-tight">
          Welcome, {session.user?.name ?? "there"}
        </h1>
        <p className="text-muted-foreground mt-2 max-w-4xl text-[15px] leading-relaxed">
          Browse calls, inspect metadata, and review annotated transcripts.
          Click any row to open the full transcript with risk highlights.
        </p>
      </div>

      <Card className="overflow-hidden border-l-4 border-l-link p-0">
        <div className="border-b border-border bg-muted/40 px-6 py-4">
          <div className="flex flex-col gap-1 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <h2 className="text-lg font-semibold text-foreground">
                Call workspace
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Sortable table with severity scores and risk analysis.
              </p>
            </div>
            <span className="text-[11px] font-medium uppercase tracking-wider text-link whitespace-nowrap">
              Demo data
            </span>
          </div>
        </div>
        <div className="p-4 sm:p-5 lg:p-6">
          <DashboardCallWorkspace />
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-foreground mb-4">Your account</h2>
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground sm:w-28">Name</dt>
            <dd className="text-sm text-foreground">
              {session.user?.name ?? "—"}
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-muted-foreground sm:w-28">Email</dt>
            <dd className="text-sm text-foreground">{session.user?.email}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
