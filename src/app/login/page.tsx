import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { LoginForm } from "@/components/auth/login-form"

export const metadata: Metadata = {
  title: "Sign in | Hotline Agent",
  description:
    "Sign in to review human–LLM phone transcripts. Not for HIPAA-covered healthcare use.",
}

export default function LoginPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-background via-background to-muted/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_50%_at_50%_-15%,oklch(0.52_0.2_25_/_0.12),transparent)] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-primary font-semibold tracking-[0.2em] text-xs uppercase mb-3">
            Human–LLM phone analysis
          </p>
          <h1 className="text-2xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight">
            Welcome back
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Sign in to review call transcripts from conversations between people and LLM
            agents.
          </p>
        </div>
        <Card className="shadow-lg shadow-black/20">
          <LoginForm />
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-8 max-w-md mx-auto leading-relaxed">
          <strong className="font-medium text-foreground">Not for HIPAA-covered healthcare.</strong>{" "}
          This service is not intended for healthcare workers handling protected health
          information (PHI) under HIPAA. It is for analyzing ordinary phone conversations
          between humans and LLMs. By signing in you confirm appropriate, non-HIPAA use.
        </p>
      </div>
    </main>
  )
}
