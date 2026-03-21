import Link from "next/link"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24">
        <div className="max-w-lg w-full text-center">
          <p className="text-brand-teal font-semibold tracking-[0.2em] text-xs uppercase mb-4">
            Human–LLM phone analysis
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-brand-ink tracking-tight text-balance">
            Transcripts for phone calls between people and LLMs
          </h1>
          <p className="mt-4 text-slate-600 text-[15px] leading-relaxed">
            Route inbound calls through an LLM-based agent, then review and analyze what
            was said on both sides—built for conversation research and product QA, not
            for patient care workflows.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/login"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg bg-brand-teal text-white text-sm font-medium hover:bg-brand-teal-hover transition-colors shadow-sm shadow-teal-900/10"
            >
              Sign in
            </Link>
            <Link
              href="/register"
              className="inline-flex items-center justify-center px-6 py-3 rounded-lg border border-slate-200 bg-white text-slate-700 text-sm font-medium hover:bg-slate-50 transition-colors"
            >
              Create account
            </Link>
          </div>
        </div>
      </div>

      <footer className="border-t border-slate-200/80 bg-white/80 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left text-sm text-slate-600">
          <div>
            <p className="font-medium text-slate-800 mb-1">Secure access</p>
            <p className="text-sm leading-relaxed">
              Email and password authentication with encrypted sessions.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-800 mb-1">Structured data</p>
            <p className="text-sm leading-relaxed">
              PostgreSQL via Prisma for reliable session and user records.
            </p>
          </div>
          <div>
            <p className="font-medium text-slate-800 mb-1">Conversation-first</p>
            <p className="text-sm leading-relaxed">
              Transcript layout tuned for reviewing human and LLM turns on calls.
            </p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-8">
          <p className="text-xs text-slate-500 text-center leading-relaxed border-t border-slate-200/80 pt-6">
            <strong className="font-medium text-slate-600">Not for HIPAA-covered healthcare.</strong>{" "}
            Hotline Agent is not intended for healthcare providers, PHI, or use as a
            HIPAA-compliant service. It is for analyzing phone conversations between
            humans and LLMs outside regulated medical contexts.
          </p>
        </div>
      </footer>
    </main>
  )
}
