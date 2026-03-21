"use client"

import * as React from "react"

import { Progress } from "@/components/ui/progress"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Separator } from "@/components/ui/separator"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"
import { cn } from "@/lib/utils"
import {
  CALL_SORT_OPTIONS,
  DASHBOARD_MOCK_CALLS,
  sortDashboardCalls,
  severityBadgeClass,
  type CallSortKey,
  type CallSortOption,
  type DashboardCallEntry,
} from "@/lib/dashboard-mock"

function formatMetaRange(entry: DashboardCallEntry) {
  const start = new Date(entry.startTimestamp)
  const end = new Date(entry.endTimestamp)
  const fmt = (d: Date) =>
    d.toLocaleString(undefined, {
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    })
  return `${fmt(start)} → ${fmt(end)}`
}

/* ------------------------------------------------------------------ */
/*  Custom sort picker — no Radix portal, immune to overflow clipping */
/* ------------------------------------------------------------------ */

function SortPicker({
  value,
  options,
  onSelect,
}: {
  value: CallSortKey
  options: readonly CallSortOption[]
  onSelect: (key: CallSortKey) => void
}) {
  const [open, setOpen] = React.useState(false)
  const triggerRef = React.useRef<HTMLButtonElement>(null)
  const menuRef = React.useRef<HTMLDivElement>(null)
  const [pos, setPos] = React.useState({ top: 0, left: 0 })

  const currentLabel =
    options.find((o) => o.key === value)?.label ?? "Sort"

  const reposition = React.useCallback(() => {
    const el = triggerRef.current
    if (!el) return
    const rect = el.getBoundingClientRect()
    setPos({
      top: rect.bottom + 4,
      left: rect.left,
    })
  }, [])

  React.useEffect(() => {
    if (!open) return

    reposition()

    const onClickOutside = (e: MouseEvent) => {
      if (
        menuRef.current &&
        !menuRef.current.contains(e.target as Node) &&
        triggerRef.current &&
        !triggerRef.current.contains(e.target as Node)
      ) {
        setOpen(false)
      }
    }

    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false)
    }

    const onScroll = () => reposition()

    window.addEventListener("mousedown", onClickOutside, true)
    window.addEventListener("keydown", onKey)
    window.addEventListener("scroll", onScroll, true)
    window.addEventListener("resize", reposition)

    return () => {
      window.removeEventListener("mousedown", onClickOutside, true)
      window.removeEventListener("keydown", onKey)
      window.removeEventListener("scroll", onScroll, true)
      window.removeEventListener("resize", reposition)
    }
  }, [open, reposition])

  return (
    <>
      <button
        ref={triggerRef}
        type="button"
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "inline-flex h-9 w-full items-center justify-between gap-3 rounded-sm border border-border bg-input/30 px-3 text-sm font-semibold outline-none transition-colors",
          "hover:bg-input/50 hover:text-foreground",
          "focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50",
          "sm:w-[min(100%,17rem)]"
        )}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        <span className="text-muted-foreground font-medium">Sort</span>
        <span className="truncate font-medium text-foreground">
          {currentLabel}
        </span>
        <svg
          className="ml-auto h-3.5 w-3.5 shrink-0 text-muted-foreground"
          viewBox="0 0 16 16"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M4 6l4 4 4-4" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </button>

      {open && (
        <div
          ref={menuRef}
          role="listbox"
          aria-label="Sort by"
          style={{
            position: "fixed",
            top: pos.top,
            left: pos.left,
            zIndex: 9999,
          }}
          className="max-h-[min(22rem,calc(100vh-4rem))] w-[min(calc(100vw-2rem),20rem)] overflow-y-auto overscroll-contain rounded-sm border border-border bg-popover p-1 text-popover-foreground shadow-lg"
        >
          <div className="px-2 py-1.5 text-xs text-muted-foreground">
            Sort by field (date · duration · direction · severity · agent)
          </div>
          <div className="my-1 h-px bg-border" />
          {options.map((opt) => (
            <button
              key={opt.key}
              type="button"
              role="option"
              aria-selected={opt.key === value}
              onClick={() => {
                onSelect(opt.key)
                setOpen(false)
              }}
              className={cn(
                "flex w-full cursor-pointer flex-col items-start gap-0.5 rounded-sm px-2 py-2 text-left outline-none transition-colors",
                "hover:bg-accent hover:text-accent-foreground",
                "focus-visible:bg-accent focus-visible:text-accent-foreground",
                opt.key === value && "bg-accent text-accent-foreground"
              )}
            >
              <span className="text-sm font-medium leading-tight">
                {opt.label}
              </span>
              <span
                className={cn(
                  "text-[11px]",
                  opt.key === value
                    ? "text-accent-foreground/80"
                    : "text-muted-foreground"
                )}
              >
                e.g. {opt.fieldHint}
              </span>
            </button>
          ))}
        </div>
      )}
    </>
  )
}

/* ------------------------------------------------------------------ */
/*  Main workspace                                                     */
/* ------------------------------------------------------------------ */

export function DashboardCallWorkspace({
  className,
}: {
  className?: string
}) {
  const [sortKey, setSortKey] = React.useState<CallSortKey>("date_desc")
  const [sortProgress, setSortProgress] = React.useState(0)
  const [isSorting, setIsSorting] = React.useState(false)
  const rafRef = React.useRef<number | null>(null)
  const settleTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(
    null
  )

  const sortedCalls = React.useMemo(
    () => sortDashboardCalls(DASHBOARD_MOCK_CALLS, sortKey),
    [sortKey]
  )

  const [selectedId, setSelectedId] = React.useState(
    () => sortDashboardCalls(DASHBOARD_MOCK_CALLS, "date_desc")[0]?.id ?? ""
  )

  React.useEffect(() => {
    setSelectedId((prev) => {
      if (sortedCalls.some((c) => c.id === prev)) return prev
      return sortedCalls[0]?.id ?? ""
    })
  }, [sortedCalls])

  React.useEffect(() => {
    return () => {
      if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
      if (settleTimeoutRef.current != null)
        clearTimeout(settleTimeoutRef.current)
    }
  }, [])

  const selected =
    sortedCalls.find((c) => c.id === selectedId) ?? sortedCalls[0]

  const runSortProgress = React.useCallback(() => {
    if (rafRef.current != null) cancelAnimationFrame(rafRef.current)
    if (settleTimeoutRef.current != null)
      clearTimeout(settleTimeoutRef.current)

    setIsSorting(true)
    setSortProgress(0)
    const durationMs = 560
    const started = performance.now()

    const tick = (now: number) => {
      const elapsed = now - started
      const p = Math.min(100, (elapsed / durationMs) * 100)
      setSortProgress(p)
      if (elapsed < durationMs) {
        rafRef.current = requestAnimationFrame(tick)
      } else {
        setSortProgress(100)
        settleTimeoutRef.current = setTimeout(() => {
          setIsSorting(false)
          setSortProgress(0)
        }, 140)
      }
    }
    rafRef.current = requestAnimationFrame(tick)
  }, [])

  const handleSortSelect = (key: CallSortKey) => {
    if (key === sortKey) return
    setSortKey(key)
    runSortProgress()
  }

  const showSortProgress = isSorting || sortProgress > 0

  return (
    <div
      className={cn(
        "h-[min(44rem,78vh)] min-h-[22rem] w-full sm:h-[min(48rem,80vh)]",
        className
      )}
    >
      <ResizablePanelGroup
        orientation="horizontal"
        className="h-full rounded-sm border border-border bg-card"
      >
        <ResizablePanel defaultSize="28%" minSize="18%" className="min-w-0">
          <div className="flex h-full min-h-[12rem] flex-col border-r border-border bg-muted/20">
            <div className="border-b border-border px-4 py-3">
              <div className="flex flex-col gap-3">
                <div className="min-w-0">
                  <h2 className="text-[15px] font-semibold leading-snug text-foreground">
                    Current calls
                  </h2>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Select a call — list will sync from the database after
                    ingest.
                  </p>
                </div>
                <SortPicker
                  value={sortKey}
                  options={CALL_SORT_OPTIONS}
                  onSelect={handleSortSelect}
                />
              </div>
              {showSortProgress ? (
                <div className="pt-3">
                  <Progress
                    value={sortProgress}
                    className="h-1.5"
                    aria-label="Sort progress"
                  />
                  <p className="mt-2 text-[11px] text-muted-foreground">
                    Updating list…
                  </p>
                </div>
              ) : null}
            </div>
            <ScrollArea className="flex-1" aria-label="Call list">
              <div className="p-4">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Sessions
                </h3>
                {sortedCalls.map((call) => (
                  <React.Fragment key={call.id}>
                    <button
                      type="button"
                      onClick={() => setSelectedId(call.id)}
                      className={cn(
                        "w-full rounded-sm px-2 py-2.5 text-left text-[15px] outline-none transition-colors",
                        "hover:bg-muted/80 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                        selectedId === call.id
                          ? "bg-muted text-foreground"
                          : "text-foreground/90"
                      )}
                    >
                      <span className="line-clamp-2 font-medium leading-snug">
                        {call.listLabel}
                      </span>
                    </button>
                    <Separator className="my-2" />
                  </React.Fragment>
                ))}
              </div>
            </ScrollArea>
          </div>
        </ResizablePanel>

        <ResizableHandle withHandle />

        <ResizablePanel defaultSize="72%" minSize="40%" className="min-w-0">
          <ResizablePanelGroup orientation="vertical" className="h-full">
            <ResizablePanel defaultSize="32%" minSize="20%" className="min-h-0">
              <div className="flex h-full min-h-[8rem] flex-col border-b border-border bg-muted/15">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-[15px] font-semibold text-foreground">
                    Call context
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Metadata aligned with Retell webhook payloads.
                  </p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="space-y-3 p-4 text-[15px] leading-relaxed">
                    {selected ? (
                      <>
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={cn(
                              "rounded-sm border px-2 py-0.5 text-[11px] font-semibold uppercase tracking-wide",
                              severityBadgeClass(selected.severity)
                            )}
                          >
                            {selected.severity}
                          </span>
                          <span className="text-sm text-muted-foreground">
                            {selected.direction} · {selected.durationMs / 1000}s
                          </span>
                        </div>
                        <dl className="grid gap-2 sm:grid-cols-[minmax(0,7rem)_1fr] sm:gap-x-3">
                          <dt className="text-sm text-muted-foreground">
                            Call ID
                          </dt>
                          <dd className="break-all font-mono text-sm text-foreground">
                            {selected.callId}
                          </dd>
                          <dt className="text-sm text-muted-foreground">Agent</dt>
                          <dd>{selected.agentName}</dd>
                          <dt className="text-sm text-muted-foreground">
                            From / To
                          </dt>
                          <dd className="font-mono text-sm">
                            {selected.fromNumber} → {selected.toNumber}
                          </dd>
                          <dt className="text-sm text-muted-foreground">
                            Window
                          </dt>
                          <dd className="text-sm">
                            {formatMetaRange(selected)}
                          </dd>
                          <dt className="text-sm text-muted-foreground">
                            Status
                          </dt>
                          <dd className="capitalize">{selected.callStatus}</dd>
                        </dl>
                      </>
                    ) : null}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>

            <ResizableHandle withHandle />

            <ResizablePanel defaultSize="68%" minSize="35%" className="min-h-0">
              <div className="flex h-full min-h-[10rem] flex-col bg-background">
                <div className="border-b border-border px-4 py-3">
                  <h2 className="text-[15px] font-semibold text-foreground">
                    Full transcript
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    Plain text and turn-by-turn (like{" "}
                    <code className="text-[13px]">transcript</code> /{" "}
                    <code className="text-[13px]">transcript_object</code>).
                  </p>
                </div>
                <ScrollArea className="flex-1">
                  <div className="p-4">
                    {selected ? (
                      <div className="space-y-6">
                        <section aria-label="Plain transcript">
                          <h3 className="mb-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Raw transcript
                          </h3>
                          <pre className="whitespace-pre-wrap break-words font-mono text-sm leading-relaxed text-foreground">
                            {selected.transcript.trim()}
                          </pre>
                        </section>
                        <Separator />
                        <section aria-label="Transcript turns">
                          <h3 className="mb-3 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                            Turns
                          </h3>
                          <ul className="space-y-4">
                            {selected.transcriptObject.map((turn, i) => (
                              <li key={i} className="flex gap-3">
                                <span
                                  className={cn(
                                    "w-16 shrink-0 pt-0.5 text-[11px] font-semibold uppercase tracking-wide",
                                    turn.role === "agent"
                                      ? "text-foreground"
                                      : "text-muted-foreground"
                                  )}
                                >
                                  {turn.role === "agent" ? "Agent" : "User"}
                                </span>
                                <span className="text-[15px] leading-relaxed text-foreground">
                                  {turn.content}
                                </span>
                              </li>
                            ))}
                          </ul>
                        </section>
                      </div>
                    ) : null}
                  </div>
                </ScrollArea>
              </div>
            </ResizablePanel>
          </ResizablePanelGroup>
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  )
}
