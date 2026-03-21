import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard | Hotline Agent",
  description: "Review call transcripts and session activity.",
}

/** Placeholder transcript until calls are wired to the backend. */
const MOCK_TRANSCRIPT_LINES = [
  { role: "agent" as const, text: "Thanks for calling. How can I help you today?" },
  { role: "caller" as const, text: "Hi — I need to reschedule an appointment." },
  { role: "agent" as const, text: "I can help with that. What date works best for you?" },
  { role: "caller" as const, text: "Thursday afternoon would be ideal." },
  { role: "agent" as const, text: "I’ve noted Thursday afternoon. You’ll receive a confirmation shortly." },
]

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-8">
      <div>
        <h1 className="text-2xl sm:text-3xl font-semibold text-brand-ink tracking-tight">
          Welcome, {session.user?.name ?? "there"}
        </h1>
        <p className="text-slate-600 mt-2 max-w-2xl text-[15px] leading-relaxed">
          Your latest call transcript will appear here once your telephony integration is
          connected. Sample content below shows how human and LLM turns are laid out for
          review and analysis.
        </p>
      </div>

      <Card className="border-l-4 border-l-brand-teal overflow-hidden p-0">
        <div className="px-6 py-4 border-b border-slate-100 bg-brand-teal-soft/50 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
          <div>
            <h2 className="text-lg font-semibold text-brand-ink">
              Latest session transcript
            </h2>
            <p className="text-sm text-slate-600 mt-0.5">
              Placeholder — encounter ID and timestamps will appear after integration.
            </p>
          </div>
          <span className="text-[11px] font-medium uppercase tracking-wider text-brand-teal whitespace-nowrap">
            Demo data
          </span>
        </div>
        <div
          className="p-6 max-h-[min(28rem,55vh)] overflow-y-auto font-mono text-sm leading-relaxed bg-white text-slate-800"
          role="region"
          aria-label="Call transcript"
        >
          <ul className="space-y-4">
            {MOCK_TRANSCRIPT_LINES.map((line, i) => (
              <li key={i} className="flex gap-3">
                <span
                  className={`shrink-0 w-16 text-[11px] font-semibold uppercase tracking-wide pt-0.5 ${
                    line.role === "agent"
                      ? "text-brand-teal"
                      : "text-brand-accent"
                  }`}
                >
                  {line.role === "agent" ? "Agent" : "Caller"}
                </span>
                <span>{line.text}</span>
              </li>
            ))}
          </ul>
        </div>
      </Card>

      <Card>
        <h2 className="text-lg font-semibold text-brand-ink mb-4">Your account</h2>
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-slate-500 sm:w-28">Name</dt>
            <dd className="text-sm text-slate-900">
              {session.user?.name ?? "—"}
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-slate-500 sm:w-28">Email</dt>
            <dd className="text-sm text-slate-900">{session.user?.email}</dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
