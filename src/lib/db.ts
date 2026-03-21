import { MyCallData } from "@/app/api/retell/route";
import { Prisma, PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

export async function saveInboundCallToDB(callData: MyCallData) {
  try {
    const prismaData = mapCallDataToPrisma(callData);

    const call = await prisma.inboundCall.upsert({
      where: { callId: prismaData.callId },
      update: {
        agentId: prismaData.agentId,
        agentVersion: prismaData.agentVersion,
        agentName: prismaData.agentName,
        retellVariables: prismaData.retellVariables,
        startTime: prismaData.startTime,
        endTime: prismaData.endTime,
        duration: prismaData.duration,
        transcript: prismaData.transcript,
        recordingURL: prismaData.recordingURL,
        disconnectionReason: prismaData.disconnectionReason,
        fromNumber: prismaData.fromNumber,
        toNumber: prismaData.toNumber,
        direction: prismaData.direction,
        notes: prismaData.notes,
        severity: prismaData.severity,
      },
      create: prismaData,
    });

    console.log("Saved inbound call to DB:", call.callId);
    return call;
  } catch (error) {
    console.error("Error saving inbound call to DB:", error);
    throw error;
  }
}

function toJsonInput(value: unknown): Prisma.InputJsonValue {
  return JSON.parse(JSON.stringify(value ?? {})) as Prisma.InputJsonValue;
}

function mapCallDataToPrisma(
  callData: MyCallData,
): Prisma.InboundCallUncheckedCreateInput {
  return {
    callId: callData.call_id,
    agentId: callData.agent_id,
    agentVersion: callData.agent_version,
    agentName: callData.agent_name,
    retellVariables: toJsonInput(callData.retell_llm_dynamic_variables),
    startTime: BigInt(callData.start_timestamp),
    endTime: BigInt(callData.end_timestamp),
    duration: BigInt(callData.duration_ms),
    transcript: callData.transcript,
    recordingURL: callData.recording_url,
    disconnectionReason: callData.disconnection_reason,
    fromNumber: callData.from_number,
    toNumber: callData.to_number,
    direction: callData.direction,
    notes: toJsonInput(callData.notes),
    severity: callData.severity,
  };
}
