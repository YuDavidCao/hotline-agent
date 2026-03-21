"use client"

import * as React from "react"
import { DASHBOARD_MOCK_CALLS, type DashboardCallEntry } from "@/lib/dashboard-mock"
import type { RiskDataPayload } from "@/lib/risk-annotations"
import { callColumns } from "./call-columns"
import { CallDataTable } from "./call-data-table"
import { CallTranscriptView } from "./call-transcript-view"

export function DashboardCallWorkspace({
  className,
}: {
  className?: string
}) {
  const [selectedCall, setSelectedCall] =
    React.useState<DashboardCallEntry | null>(null)

  const [riskData, setRiskData] = React.useState<RiskDataPayload | null>(null)

  React.useEffect(() => {
    fetch("/api/risk-data")
      .then((r) => r.json())
      .then((data: RiskDataPayload) => setRiskData(data))
      .catch(() => {})
  }, [])

  if (selectedCall) {
    return (
      <div className={className}>
        <CallTranscriptView
          entry={selectedCall}
          risk={riskData?.risk ?? []}
          negation={riskData?.negation ?? []}
          onBack={() => setSelectedCall(null)}
        />
      </div>
    )
  }

  return (
    <div className={className}>
      <CallDataTable
        columns={callColumns}
        data={DASHBOARD_MOCK_CALLS}
        onRowClick={setSelectedCall}
      />
    </div>
  )
}
