import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 sm:py-24">
        <div className="max-w-lg w-full text-center">
          <p className="text-link font-semibold tracking-[0.2em] text-xs uppercase mb-4">
            Human–LLM signal processing and data analysis
          </p>
          <h1 className="text-3xl sm:text-4xl font-semibold text-foreground tracking-tight text-balance">
            HoosThere?
          </h1>
          <p className="mt-4 text-muted-foreground text-[15px] leading-relaxed">
          Route inbound helpline calls through an LLM-powered agent, then analyze conversations to improve response quality and agent performance.
          </p>

          <div className="mt-10 flex flex-col sm:flex-row gap-3 justify-center">
            <Button asChild>
              <Link href="/login">Sign in</Link>
            </Button>
            <Button variant="outline" asChild>
              <Link href="/register">Create account</Link>
            </Button>
          </div>
        </div>
      </div>

      <footer className="border-t border-border bg-card/50 backdrop-blur-sm">
        <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 sm:grid-cols-3 gap-6 text-center sm:text-left text-sm text-muted-foreground">
          <div>
            <p className="font-medium text-foreground mb-1">Secure access</p>
            <p className="text-sm leading-relaxed">
              Email and password authentication with encrypted sessions.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Structured data</p>
            <p className="text-sm leading-relaxed">
            Structured conversation data enables operators to quickly access call history, track active sessions, and maintain context across high call volumes.
            </p>
          </div>
          <div>
            <p className="font-medium text-foreground mb-1">Conversation-first</p>
            <p className="text-sm leading-relaxed">
            Real-time audio is processed on the client into structured text, enabling intuitive visualization and analysis of human and LLM conversation flows.            </p>
          </div>
        </div>
        <div className="max-w-3xl mx-auto px-6 pb-8">
          <p className="text-xs text-muted-foreground text-center leading-relaxed border-t border-border pt-6">
            <strong className="font-medium text-foreground">Not for HIPAA-covered healthcare.</strong>{" "}
            'HoosThere?' is not intended for healthcare providers, or use as a
            HIPAA-compliant service.
          </p>
        </div>
      </footer>
    </main>
  )
}
