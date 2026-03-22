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
  sentimentScore: number
  resolved: boolean
  notes: Note[]
  recordingURL: string
}

function formatDateTime(ts: number): string {
  return new Date(ts).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
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

function severityClass(severity: number): string {
  if (severity <= 3) return "bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400"
  if (severity < 6) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400"
  return "bg-red-500/10 text-red-700 border-red-500/30 dark:text-red-400"
}

function sentimentClass(score: number): string {
  if (score < 40) return "bg-green-500/10 text-green-700 border-green-500/30 dark:text-green-400"
  if (score < 70) return "bg-yellow-500/10 text-yellow-700 border-yellow-500/30 dark:text-yellow-400"
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

function ActionsCell({
  call,
  resolved,
  onToggleResolved,
}: {
  call: CallRow
  resolved: boolean
  onToggleResolved: (callId: string, nextResolved: boolean) => Promise<void>
}) {
  const router = useRouter()
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex h-7 w-7 items-center justify-center rounded-sm border border-border bg-background text-xs font-medium outline-none transition-colors",
            "hover:bg-accent hover:text-accent-foreground",
            "focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
          )}
          aria-label="Call actions"
        >
          <svg
            className="h-3.5 w-3.5 shrink-0"
            viewBox="0 0 16 16"
            fill="none"
            stroke="currentColor"
            strokeWidth="1.8"
          >
            <path d="M2.5 4h11M2.5 8h11M2.5 12h11" strokeLinecap="round" />
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
            const encodedNumber = encodeURIComponent(call.fromNumber)
            router.push(`/history/${encodedNumber}`)
          }}
        >
          Track this number
        </DropdownMenuItem>
        <DropdownMenuItem
          className="cursor-pointer"
          onClick={() => onToggleResolved(call.callId, !resolved)}
        >
          {resolved ? "Mark unresolved" : "Resolve"}
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

type SortKey = "startTime" | "endTime" | "fromNumber" | "duration" | "severity" | "sentimentScore"
type SortDir = "asc" | "desc"
type TimeFilter = "all" | "past24h" | "past7d" | "past30d"
type SeverityFilter = "all" | "low" | "medium" | "high"

const TIME_FILTER_LABEL: Record<TimeFilter, string> = {
  all: "All time",
  past24h: "Past 24 hours",
  past7d: "Past week",
  past30d: "Past month",
}

const SEVERITY_FILTER_LABEL: Record<SeverityFilter, string> = {
  all: "All severity",
  low: "Low (1-3)",
  medium: "Medium (4-5)",
  high: "High (6-10)",
}

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

function FilterDropdown<T extends string>({
  label,
  value,
  options,
  onChange,
}: {
  label: string
  value: T
  options: { value: T; label: string }[]
  onChange: (value: T) => void
}) {
  const selectedLabel = options.find((option) => option.value === value)?.label ?? ""

  return (
    <div className="flex flex-col gap-1">
      <span className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
        {label}
      </span>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            className={cn(
              "inline-flex h-9 w-full items-center justify-between rounded-sm border border-border bg-input/30 px-3 text-sm text-foreground outline-none transition-colors",
              "hover:bg-input/50",
              "focus-visible:ring-2 focus-visible:ring-ring"
            )}
          >
            <span className="truncate">{selectedLabel}</span>
            <svg
              className="ml-2 h-3.5 w-3.5 shrink-0 text-muted-foreground"
              viewBox="0 0 16 16"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-[12rem]">
          {options.map((option) => (
            <DropdownMenuItem
              key={option.value}
              className="cursor-pointer flex items-center justify-between"
              onClick={() => onChange(option.value)}
            >
              <span>{option.label}</span>
              {value === option.value ? (
                <svg
                  className="h-3.5 w-3.5 text-foreground"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M3.5 8.5l2.5 2.5 6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              ) : null}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}

export function CallsTable({ calls }: { calls: CallRow[] }) {
  const [sortKey, setSortKey] = React.useState<SortKey>("startTime")
  const [sortDir, setSortDir] = React.useState<SortDir>("desc")
  const [query, setQuery] = React.useState("")
  const [timeFilter, setTimeFilter] = React.useState<TimeFilter>("all")
  const [severityFilter, setSeverityFilter] = React.useState<SeverityFilter>("all")
  const [resolvedByCallId, setResolvedByCallId] = React.useState<Record<string, boolean>>({})

  const handleToggleResolved = React.useCallback(
    async (callId: string, nextResolved: boolean) => {
      setResolvedByCallId((prev) => ({ ...prev, [callId]: nextResolved }))

      try {
        const res = await fetch(`/api/resolved/${encodeURIComponent(callId)}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ resolved: nextResolved }),
        })

        if (!res.ok) {
          throw new Error("Failed to update resolved state")
        }
      } catch (error) {
        setResolvedByCallId((prev) => ({ ...prev, [callId]: !nextResolved }))
        console.error(error)
      }
    },
    [],
  )

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
    const now = Date.now()

    return calls.filter((c) => {
      if (timeFilter !== "all") {
        const msAgo = now - c.startTime
        if (timeFilter === "past24h" && msAgo > 24 * 60 * 60 * 1000) return false
        if (timeFilter === "past7d" && msAgo > 7 * 24 * 60 * 60 * 1000) return false
        if (timeFilter === "past30d" && msAgo > 30 * 24 * 60 * 60 * 1000) return false
      }

      if (severityFilter !== "all") {
        if (severityFilter === "low" && !(c.severity <= 3)) return false
        if (severityFilter === "medium" && !(c.severity > 3 && c.severity < 6)) return false
        if (severityFilter === "high" && !(c.severity >= 6)) return false
      }

      if (!q) return true
      if (c.fromNumber.toLowerCase().includes(q)) return true
      if (c.notes.some((n) => n.note.toLowerCase().includes(q) || n.reason.toLowerCase().includes(q))) return true
      return false
    })
  }, [calls, query, timeFilter, severityFilter])

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
      <div className="grid gap-2 rounded-sm border border-border bg-muted/20 p-2 sm:grid-cols-[minmax(0,1fr)_12rem_12rem] sm:items-end">
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
            placeholder="Search by phone number or notes…"
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

        <FilterDropdown
          label="Timeframe"
          value={timeFilter}
          onChange={setTimeFilter}
          options={[
            { value: "all", label: TIME_FILTER_LABEL.all },
            { value: "past24h", label: TIME_FILTER_LABEL.past24h },
            { value: "past7d", label: TIME_FILTER_LABEL.past7d },
            { value: "past30d", label: TIME_FILTER_LABEL.past30d },
          ]}
        />

        <FilterDropdown
          label="Severity"
          value={severityFilter}
          onChange={setSeverityFilter}
          options={[
            { value: "all", label: SEVERITY_FILTER_LABEL.all },
            { value: "low", label: SEVERITY_FILTER_LABEL.low },
            { value: "medium", label: SEVERITY_FILTER_LABEL.medium },
            { value: "high", label: SEVERITY_FILTER_LABEL.high },
          ]}
        />
      </div>
      <div className="overflow-x-auto">
      <table className="w-full min-w-[760px] text-sm border-collapse">
        <thead>
          <tr className="border-b border-border bg-muted/40">
            <SortTh label="Start" sortKey="startTime" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="End" sortKey="endTime" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="From" sortKey="fromNumber" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="Duration" sortKey="duration" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="Severity" sortKey="severity" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
            <SortTh label="Sentiment" sortKey="sentimentScore" current={sortKey} dir={sortDir} onSort={handleSort} className="whitespace-nowrap" />
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
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 text-[11px] font-semibold",
                    severityClass(call.severity),
                    call.severity >= 6 && "animate-breathing-red"
                  )}
                >
                  {call.severity}
                </span>
              </td>
              <td className="px-4 py-3 whitespace-nowrap">
                <span
                  className={cn(
                    "rounded-sm border px-2 py-0.5 text-[11px] font-semibold",
                    sentimentClass(call.sentimentScore),
                  )}
                >
                  {call.sentimentScore}
                </span>
              </td>
              <td className="px-4 py-3">
                <NotesCell notes={call.notes} />
              </td>
              <td className="px-4 py-3 text-right">
                <ActionsCell
                  call={call}
                  resolved={resolvedByCallId[call.callId] ?? call.resolved}
                  onToggleResolved={handleToggleResolved}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {sorted.length === 0 && (
        <div className="py-12 text-center text-sm text-muted-foreground">
          No calls match the current filters.
        </div>
      )}
    </div>
    </div>
  )
}
