import type { Metadata } from "next"
import { Card } from "@/components/ui/card"
import { RegisterForm } from "@/components/auth/register-form"

export const metadata: Metadata = {
  title: "Create account | NextJS Starter",
}

export default function RegisterPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-4">
      <div className="w-full max-w-sm">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Create account</h1>
          <p className="text-sm text-gray-600 mt-1">
            Get started with your free account
          </p>
        </div>
        <Card>
          <RegisterForm />
        </Card>
      </div>
    </main>
  )
}
