import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

type NoteItem = {
  note: string;
  reason: string;
};

function toTranscriptText(value: unknown): string {
  if (typeof value === "string") return value;

  if (Array.isArray(value)) {
    const lines = value
      .map((item) => {
        if (
          typeof item === "object" &&
          item !== null &&
          typeof (item as { role?: unknown }).role === "string" &&
          typeof (item as { content?: unknown }).content === "string"
        ) {
          return `${(item as { role: string }).role}: ${(item as { content: string }).content}`;
        }

        return null;
      })
      .filter((line): line is string => line !== null);

    return lines.join("\n");
  }

  if (value === null || value === undefined) return "";

  return JSON.stringify(value);
}

function parseNotes(value: unknown): NoteItem[] {
  if (!Array.isArray(value)) return [];

  return value
    .filter(
      (item): item is NoteItem =>
        typeof item === "object" &&
        item !== null &&
        typeof (item as { note?: unknown }).note === "string" &&
        typeof (item as { reason?: unknown }).reason === "string",
    )
    .map((item) => ({ note: item.note, reason: item.reason }));
}

type NotesRouteContext = {
  params: {
    phoneNumber: string;
  };
};

export async function GET(_req: NextRequest, context: NotesRouteContext) {
  try {
    const params = context.params;
    const phoneNumber = params.phoneNumber;
    const allCalls = await prisma.inboundCall.findMany({
      where: {
        fromNumber: phoneNumber,
      },
      orderBy: {
        startTime: "desc",
      },
      select: {
        id: true,
        callId: true,
        transcript: true,
        notes: true,
        severity: true,
        startTime: true,
        endTime: true,
        duration: true,
        disconnectionReason: true,
      },
    });

    const callHistory = allCalls.map((call) => ({
      id: call.id,
      callId: call.callId,
      transcriptText: toTranscriptText(call.transcript),
      notes: parseNotes(call.notes),
      severity: call.severity,
      startTime: Number(call.startTime),
      endTime: Number(call.endTime),
      durationMs: Number(call.duration),
      disconnectionReason: call.disconnectionReason,
    }));

    return NextResponse.json(callHistory);
  } catch (error) {
    return NextResponse.json(
      { error: "Failed to fetch notes" },
      { status: 500 },
    );
  }
}
