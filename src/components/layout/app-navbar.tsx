import Link from "next/link"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"

type AppNavbarProps = {
  subtitle?: string
  username?: string | null
  showDashboardButton?: boolean
  showSignOutButton?: boolean
}

export function AppNavbar({
  subtitle = "Human & LLM call transcripts",
  username,
  showDashboardButton = false,
  showSignOutButton = false,
}: AppNavbarProps) {
  return (
    <header className="bg-card border-b border-border shadow-sm">
      <div className="mx-auto flex w-full max-w-[min(100rem,calc(100vw-1.5rem))] items-center justify-between gap-4 px-3 py-4 sm:px-5 lg:px-6">
        <div className="flex items-center gap-3 min-w-0">
          <span
            className="hidden sm:flex h-9 w-9 shrink-0 items-center justify-center rounded-sm bg-muted text-link border border-border"
            aria-hidden
          >
            <svg
              className="w-5 h-5"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M9 12h3.75M9 15h3.75M9 18h3.75m3 .75H18a2.25 2.25 0 002.25-2.25V6.108c0-1.135-.845-2.098-1.976-2.192a48.424 48.424 0 00-1.123-.08m-5.801 0c-.065.21-.1.433-.1.664 0 .414.336.75.75.75h4.5a.75.75 0 00.75-.75 2.25 2.25 0 00-.1-.664m-5.8 0A2.251 2.251 0 0113.5 2.25H15c1.012 0 1.867.668 2.15 1.586m-5.8 0c-.376.023-.75.05-1.124.08C9.095 4.01 8.25 4.973 8.25 6.108V8.25m0 0H4.875c-.621 0-1.125.504-1.125 1.125v11.25c0 .621.504 1.125 1.125 1.125h9.75c.621 0 1.125-.504 1.125-1.125V9.375c0-.621-.504-1.125-1.125-1.125H8.25zM6.75 12h.008v.008H6.75V12zm0 3h.008v.008H6.75V15zm0 3h.008v.008H6.75V18z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <span className="font-semibold text-lg text-foreground tracking-tight block truncate">
              Hotline Agent
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              {subtitle}
            </span>
          </div>
        </div>

        <div className="flex items-center gap-3 shrink-0">
          {username ? (
            <span className="text-sm text-muted-foreground truncate max-w-[10rem] sm:max-w-xs">
              {username}
            </span>
          ) : null}
          {showDashboardButton ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : null}
          {showSignOutButton ? <SignOutButton /> : null}
        </div>
      </div>
    </header>
  )
}
