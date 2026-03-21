import type { Metadata } from "next"
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Card } from "@/components/ui/card"

export const metadata: Metadata = {
  title: "Dashboard | NextJS Starter",
}

export default async function DashboardPage() {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900">
          Welcome, {session.user?.name ?? "there"}!
        </h1>
        <p className="text-gray-600 mt-1">
          You&apos;re successfully authenticated.
        </p>
      </div>

      <Card>
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Your account
        </h2>
        <dl className="flex flex-col gap-3">
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 sm:w-24">Name</dt>
            <dd className="text-sm text-gray-900">
              {session.user?.name ?? "—"}
            </dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 sm:w-24">
              Email
            </dt>
            <dd className="text-sm text-gray-900">{session.user?.email}</dd>
          </div>
          <div className="flex flex-col sm:flex-row sm:gap-4">
            <dt className="text-sm font-medium text-gray-500 sm:w-24">
              User ID
            </dt>
            <dd className="text-sm text-gray-500 font-mono">
              {session.user?.id}
            </dd>
          </div>
        </dl>
      </Card>
    </div>
  )
}
