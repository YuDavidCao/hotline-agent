import { notFound } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { CallDetail, type FullCall } from "@/components/dashboard/call-detail"

export default async function CallPage({ params }: { params: { id: string } }) {
  const raw = await prisma.inboundCall.findUnique({ where: { id: params.id } })

  if (!raw) notFound()

  const call: FullCall = {
    id: raw.id,
    callId: raw.callId,
    agentId: raw.agentId,
    agentVersion: raw.agentVersion,
    retellVariables: raw.retellVariables as Record<string, unknown>,
    startTime: Number(raw.startTime),
    endTime: Number(raw.endTime),
    duration: Number(raw.duration),
    transcript: String(raw.transcript ?? ""),
    recordingURL: raw.recordingURL,
    disconnectionReason: raw.disconnectionReason,
    fromNumber: raw.fromNumber,
    toNumber: raw.toNumber,
    direction: raw.direction,
    notes: (raw.notes as { note: string; reason: string }[] | null) ?? [],
    severity: raw.severity,
    sentimentScore: raw.sentimentScore,
  }

  return <CallDetail call={call} />
}
