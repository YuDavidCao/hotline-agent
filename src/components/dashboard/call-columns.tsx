"use client"

import { ColumnDef } from "@tanstack/react-table"
import { cn } from "@/lib/utils"
import {
  severityBadgeClass,
  type DashboardCallEntry,
} from "@/lib/dashboard-mock"

const HIGH_SEVERITY_THRESHOLD = 70

function formatDate(ts: number) {
  return new Date(ts).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  })
}

function formatDuration(ms: number) {
  const totalSec = Math.round(ms / 1000)
  const min = Math.floor(totalSec / 60)
  const sec = totalSec % 60
  return min > 0 ? `${min}m ${sec}s` : `${sec}s`
}

export const callColumns: ColumnDef<DashboardCallEntry>[] = [
  {
    accessorKey: "startTimestamp",
    header: "Date",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm tabular-nums">
        {formatDate(row.original.startTimestamp)}
      </span>
    ),
  },
  {
    accessorKey: "agentName",
    header: "Agent",
    cell: ({ row }) => (
      <span className="text-sm font-medium">{row.original.agentName}</span>
    ),
  },
  {
    accessorKey: "direction",
    header: "Direction",
    cell: ({ row }) => (
      <span className="text-sm capitalize">{row.original.direction}</span>
    ),
  },
  {
    accessorKey: "durationMs",
    header: "Duration",
    cell: ({ row }) => (
      <span className="whitespace-nowrap text-sm tabular-nums text-muted-foreground">
        {formatDuration(row.original.durationMs)}
      </span>
    ),
  },
  {
    accessorKey: "severity",
    header: "Severity",
    cell: ({ row }) => {
      const entry = row.original
      return (
        <div className="flex items-center gap-2">
          <span
            className={cn(
              "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
              severityBadgeClass(entry.severity)
            )}
          >
            {entry.severity}
          </span>
        </div>
      )
    },
  },
  {
    accessorKey: "severityScore",
    header: "Score",
    cell: ({ row }) => {
      const score = row.original.severityScore
      const isHigh = score > HIGH_SEVERITY_THRESHOLD
      return (
        <span
          className={cn(
            "inline-block rounded-sm px-2 py-0.5 text-[11px] font-semibold tabular-nums",
            isHigh
              ? "bg-destructive/15 text-destructive"
              : "bg-muted text-muted-foreground"
          )}
        >
          {score}/100
        </span>
      )
    },
  },
  {
    accessorKey: "callStatus",
    header: "Status",
    cell: ({ row }) => (
      <span className="text-sm capitalize text-muted-foreground">
        {row.original.callStatus}
      </span>
    ),
  },
]
