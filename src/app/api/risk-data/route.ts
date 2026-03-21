import { NextResponse } from "next/server"
import { loadRiskData } from "@/lib/risk-datasets"

export const dynamic = "force-static"

export function GET() {
  const data = loadRiskData()
  return NextResponse.json(data)
}
