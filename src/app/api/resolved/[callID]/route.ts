import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function PATCH(
  req: NextRequest,
  { params }: { params: { callId: string } }
) {
  try {
    const { resolved } = await req.json();

    const updated = await prisma.inboundCall.update({
      where: { callId: params.callId },
      data: { resolved },
    });

    return NextResponse.json(updated);
  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: "Failed to update resolved status" },
      { status: 500 }
    );
  }
}