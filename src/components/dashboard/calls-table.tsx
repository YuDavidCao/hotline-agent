"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { cn } from "@/lib/utils"
import { InputBase } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"

interface Note {
  note: string
  reason: string
}

export interface CallRow {
  id: string
  callId: string
  startTime: number
  endTime: number
  duration: number
  fromNumber: string
  transcript: string
  severity: number
  notes: Note[]
  recordingURL: string
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  if (minutes === 0) return `${seconds}s`
  return `${minutes}m ${seconds}s`
}

function transcriptPreview(transcript: string): string {
  const trimmed = transcript.trim()
  if (trimmed.length <= 50) return trimmed
  return trimmed.slice(0, 50) + "..."
}

function severityClass(severity: number): string {
  if (severity <= 3) return "bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400"
  if (severity <= 6) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400"
  return "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400"
}

function NotesCell({ notes }: { notes: Note[] }) {
  const [pos, setPos] = React.useState<{ top: number; left: number } | null>(null)
  const triggerRef = React.useRef<HTMLSpanElement>(null)
  const timeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleEnter = () => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    const rect = triggerRef.current?.getBoundingClientRect()
    if (rect) setPos({ top: rect.bottom + 6, left: rect.left })
  }

  const handleLeave = () => {
    timeoutRef.current = setTimeout(() => setPos(null), 80)
  }

  React.useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])

  if (!notes || notes.length === 0) {
    return <span className="text-muted-foreground text-xs">—</span>
  }

  return (
    <>
      <span
        ref={triggerRef}
        className="cursor-help text-sm text-foreground underline decoration-dotted underline-offset-2"
        onMouseEnter={handleEnter}
        onMouseLeave={handleLeave}
      >
        {notes.length} note{notes.length !== 1 ? "s" : ""}
      </span>
      {pos && (
        <div
          style={{ position: "fixed", top: pos.top, left: pos.left, zIndex: 9999 }}
          className="w-72 rounded-sm border border-border bg-popover p-3 shadow-lg text-sm text-popover-foreground"
          onMouseEnter={() => { if (timeoutRef.current) clearTimeout(timeoutRef.current) }}
          onMouseLeave={handleLeave}
        >
          <ul className="space-y-2.5">
            {notes.map((n, i) => (
              <li key={i}>
                <p className="font-medium leading-snug text-foreground">{n.note}</p>
                <p className="text-muted-foreground text-xs mt-0.5 leading-relaxed">{n.reason}</p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </>
  )
}

function ActionsCell({ call }: { call: CallRow }) {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 items-center gap-1 rounded-sm border border-border bg-background px-2.5 text-xs font-medium outline-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          )}
        >
          Actions
          <svg
            className="h-3 w-3 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="min-w-[160px]">
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => router.push(`/dashboard/calls/${call.id}`)}
        >
          View call
        </DropdownMenuItem>
        <DropdownMenuItem
          onClick={async () => {
            // Your hash
            const encoder = new TextEncoder()
            const data = encoder.encode(call.fromNumber)
            const hashBuffer = await crypto.subtle.digest('SHA-256', data)
            const hashArray = Array.from(new Uint8Array(hashBuffer))
            const hashBase64 = btoa(String.fromCharCode(...hashArray))
            const urlSafe = hashBase64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')

            // Push URL with hash as path, number as query
            const encodedNumber = encodeURIComponent(call.fromNumber)
            router.push(`/history/${urlSafe}?number=${encodedNumber}`)
          }}
        >
          Track this number
        </DropdownMenuItem>
        <DropdownMenuSeparator />
        <DropdownMenuItem
          className="cursor-pointer"
          disabled={!call.recordingURL}
          onClick={() => {
            if (call.recordingURL) window.open(call.recordingURL, "_blank")
          }}
        >
          Download recording
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

type SortKey = "startTime" | "endTime" | "fromNumber" | "duration" | "severity"
type SortDir = "asc" | "desc"

function sortCalls(calls: CallRow[], key: SortKey, dir: SortDir): CallRow[] {
  return [...calls].sort((a, b) => {
    const aVal = a[key]
    const bVal = b[key]
    if (aVal < bVal) return dir === "asc" ? -1 : 1
    if (aVal > bVal) return dir === "asc" ? 1 : -1
    return 0
  })
}

function SortIcon({ active, dir }: { active: boolean; dir: SortDir }) {
  return (
    <svg
      className={cn("ml-1 inline-block h-3 w-3 shrink-0", active ? "text-foreground" : "text-muted-foreground/40")}
      viewBox="0 0 16 16"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.2"
    >
      {active && dir === "asc" ? (
        <path d="M4 10l4-4 4 4" strokeLinecap="round" strokeLinejoin="round" />
      ) : active && dir === "desc" ? (
        <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
      ) : (
        <>
          <path d="M4 6l4-3 4 3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
          <path d="M4 10l4 3 4-3" strokeLinecap="round" strokeLinejoin="round" opacity="0.5" />
        </>
      )}
    </svg>
  )
}

function SortTh({
  label,
  sortKey,
  current,
  dir,
  onSort,
  className,
}: {
  label: string
  sortKey: SortKey
  current: SortKey
  dir: SortDir
  onSort: (key: SortKey) => void
  className?: string
}) {
  const active = current === sortKey
  return (
    <th className={cn("px-4 py-3 text-left", className)}>
      <button
        type="button"
        onClick={() => onSort(sortKey)}
        className={cn(
          "inline-flex items-center text-[11px] font-semibold uppercase tracking-wider outline-none transition-colors",
          active ? "text-foreground" : "text-muted-foreground hover:text-foreground"
        )}
      >
        {label}
        <SortIcon active={active} dir={dir} />
      </button>
    </th>
  )
}

export function CallsTable({ calls }: { calls: CallRow[] }) {
  const [sortKey, setSortKey] = React.useState<SortKey>("startTime")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [query, setQuery] = React.useState("")

  const handleSort = (key: SortKey) => {
    if (key === sortKey) {
      setSortDir((d) => (d === "asc" ? "desc" : "asc"))
    } else {
      setSortKey(key)
      setSortDir("desc")
    }
  }

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase()
    if (!q) return calls
    return calls.filter((c) => {
      if (c.fromNumber.toLowerCase().includes(q)) return true
      if (c.transcript.toLowerCase().includes(q)) return true
      if (c.notes.some((n) => n.note.toLowerCase().includes(q) || n.reason.toLowerCase().includes(q))) return true
      return false
    })
  }, [calls, query])

  const sorted = sortCalls(filtered, sortKey, sortDir)

  if (calls.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-16 text-center">
        <p className="text-sm text-muted-foreground">No calls yet.</p>
        <p className="text-xs text-muted-foreground">
          Calls will appear here after the webhook ingests them.
        </p>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="relative">
        <svg
          className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground"
          viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.8"
        >
          <circle cx="6.5" cy="6.5" r="4" />
          <path d="M10 10l3 3" strokeLinecap="round" />
        </svg>
        <InputBase
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by phone number, transcript, or notes…"
          className="pl-9 pr-8"
        />
        {query && (
          <button
            type="button"
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Clear search"
          >
            <svg className="h-3.5 w-3.5" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 3l10 10M13 3L3 13" strokeLinecap="round" />
            </svg>
          </button>
        )}
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[900px] text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <SortTh label="Start" sortKey="startTime" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="End" sortKey="endTime" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="From" sortKey="fromNumber" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="Duration" sortKey="duration" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Transcript
            </th>
            <SortTh label="Severity" sortKey="severity" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <th className="px-4 py-3 text-left text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Notes
            </th>
            <th className="px-4 py-3 text-right text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
              Actions
            </th>
          </tr>
        </thead>
        <tbody>
          {sorted.map((call, idx) => (
            <tr
              key={call.id}
              className={cn(
                "border-b border-border transition-colors",
                idx % 2 === 0 ? "bg-background" : "bg-muted/10",
                "hover:bg-accent/30"
              )}
            >
              <td className="px-4 py-3 whitespace-nowrap text-foreground">
                {formatDateTime(call.startTime)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-foreground">
                {formatDateTime(call.endTime)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap font-mono text-foreground">
                {call.fromNumber}
              </td>
              <td className="px-4 py-3 whitespace-nowrap text-foreground">
                {formatDuration(call.duration)}
              </td>
              <td className="px-4 py-3 max-w-[220px] text-muted-foreground">
                {transcriptPreview(call.transcript)}
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 text-[11px] font-semibold",
                    severityClass(call.severity)
                  )}
                >
                  {call.severity}
                </span>
              </td>
              <td className="px-4 py-3">
                <NotesCell notes={call.notes} />
              </td>
              <td className="px-4 py-3 text-right">
                <ActionsCell call={call} />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No calls match <span className="font-medium text-foreground">&ldquo;{query}&rdquo;</span>.
        </div>
      )}
    </div>
    </div>
  )
}
