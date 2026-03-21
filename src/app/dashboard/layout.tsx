import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { SignOutButton } from "@/components/auth/sign-out-button"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  return (
    <div className="min-h-screen flex flex-col">
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-4xl mx-auto flex items-center justify-between">
          <span className="font-semibold text-gray-900">NextJS Starter</span>
          <div className="flex items-center gap-3">
            <span className="text-sm text-gray-600">
              {session.user?.name ?? session.user?.email}
            </span>
            <SignOutButton />
          </div>
        </div>
      </header>
      <main className="flex-1 p-6">
        <div className="max-w-4xl mx-auto">{children}</div>
      </main>
    </div>
  )
}
