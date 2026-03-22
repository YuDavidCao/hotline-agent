import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  context: { params: { callID: string } | Promise<{ callID: string }> },
) {
  try {
    const { callID } = await Promise.resolve(context.params);
    const body = await req.json();
    const resolved = body?.resolved;

    if (typeof resolved !== "boolean") {
      return NextResponse.json(
        { error: "Invalid payload: resolved must be a boolean" },
        { status: 400 },
      );
    }

    const updated = await prisma.inboundCall.update({
      where: { callId: callID },
      data: { resolved },
      select: {
        callId: true,
        resolved: true,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return NextResponse.json(
      { error: "Failed to update resolved status" },
      { status: 500 },
    );
  }
}
