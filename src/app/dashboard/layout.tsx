import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Topbar } from "@/components/topbar"

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const session = await auth()

  if (!session) {
    redirect("/login")
  }

  const userLabel = session.user?.name ?? session.user?.email ?? ""

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Topbar userLabel={userLabel} />
      <main className="flex-1 px-3 py-4 sm:px-5 sm:py-6 lg:px-6 lg:py-8">
        <div className="mx-auto w-full max-w-[min(100rem,calc(100vw-1.5rem))]">
          {children}
        </div>
      </main>
    </div>
  )
}
