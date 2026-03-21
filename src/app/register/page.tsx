import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create account | Hotline Agent",
  description:
    "Create an account to review human–LLM phone transcripts. Not for HIPAA-covered healthcare.",
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center p-4 sm:p-8 bg-gradient-to-b from-background via-background to-muted/30">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_85%_50%_at_50%_-15%,rgb(153_126_103_/_0.12),transparent)] pointer-events-none" />
      <div className="relative w-full max-w-md">
        <div className="text-center mb-8">
          <p className="text-link font-semibold tracking-[0.2em] text-xs uppercase mb-3">
            Human–LLM phone analysis
          </p>
          <h1 className="text-2xl sm:text-[1.75rem] font-semibold text-foreground tracking-tight">
            Create your account
          </h1>
          <p className="text-sm text-muted-foreground mt-2 leading-relaxed">
            Use a work email and a strong password. Minimum 8 characters.
          </p>
        </div>
        <Card className="shadow-lg shadow-black/20">
          <RegisterForm />
        </Card>
        <p className="text-center text-xs text-muted-foreground mt-8 max-w-md mx-auto leading-relaxed">
          <strong className="font-medium text-foreground">Not for HIPAA-covered healthcare.</strong>{" "}
          Do not use this product for PHI or as a HIPAA-compliant system. It is for
          analyzing phone calls between humans and LLM agents only.
        </p>
      </div>
    </main>
  )
}
