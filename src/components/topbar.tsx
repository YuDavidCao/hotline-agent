"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import { SignOutButton } from "@/components/auth/sign-out-button"
import { Button } from "@/components/ui/button"

type TopbarProps = {
  userLabel: string
}

export function Topbar({ userLabel }: TopbarProps) {
  const pathname = usePathname()
  const showDashboardButton = pathname !== "/dashboard"

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
                d="M2.25 4.5c0-1.243 1.007-2.25 2.25-2.25h2.386c.996 0 1.87.677 2.121 1.641l.784 3.005a2.25 2.25 0 01-1.02 2.507l-1.61.966a11.205 11.205 0 005.37 5.37l.966-1.61a2.25 2.25 0 012.507-1.02l3.005.784A2.25 2.25 0 0121.75 17.114V19.5c0 1.243-1.007 2.25-2.25 2.25h-1.5C9.302 21.75 2.25 14.698 2.25 6V4.5z"
              />
            </svg>
          </span>
          <div className="min-w-0">
            <span className="font-semibold text-lg text-foreground tracking-tight block truncate">
              Hotline Agent
            </span>
            <span className="text-xs text-muted-foreground hidden sm:block">
              Human & LLM call transcripts
            </span>
          </div>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <span className="text-sm text-muted-foreground truncate max-w-[10rem] sm:max-w-xs">
            {userLabel}
          </span>
          {showDashboardButton ? (
            <Button asChild variant="outline" size="sm">
              <Link href="/dashboard">Dashboard</Link>
            </Button>
          ) : null}
          <SignOutButton />
        </div>
      </div>
    </header>
  )
}
