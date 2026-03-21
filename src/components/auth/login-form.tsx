"use client"

import { useState } from "react"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { loginSchema } from "@/lib/validations/auth"

interface FieldErrors {
  email?: string[]
  password?: string[]
}

export function LoginForm() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({})
  const [error, setError] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError("")
    setFieldErrors({})

    const validated = loginSchema.safeParse({ email, password })
    if (!validated.success) {
      setFieldErrors(validated.error.flatten().fieldErrors as FieldErrors)
      return
    }

    setIsLoading(true)
    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        setError("Invalid email or password")
        return
      }

      router.push("/dashboard")
      router.refresh()
    } catch {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="flex flex-col gap-4"
      noValidate
      spellCheck={false}
    >
      <Input
        label="Email"
        name="email"
        type="email"
        inputMode="email"
        autoCapitalize="none"
        autoCorrect="off"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        error={fieldErrors.email?.[0]}
        placeholder="you@example.com"
        autoComplete="email"
        required
      />
      <Input
        label="Password"
        name="password"
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        error={fieldErrors.password?.[0]}
        placeholder="••••••••"
        autoComplete="current-password"
        required
      />

      {error && (
        <p
          role="alert"
          aria-live="polite"
          className="text-sm text-destructive-foreground bg-destructive/15 border border-destructive/40 rounded-lg px-3 py-2"
        >
          {error}
        </p>
      )}

      <Button type="submit" disabled={isLoading} className="w-full mt-1">
        {isLoading ? "Signing in…" : "Sign in"}
      </Button>

      <p className="text-sm text-center text-muted-foreground">
        Don&apos;t have an account?{" "}
        <Link
          href="/register"
          className="text-primary font-medium hover:underline underline-offset-4"
        >
          Create one
        </Link>
      </p>
    </form>
  )
}
