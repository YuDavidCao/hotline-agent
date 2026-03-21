import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(req: NextRequest, context: any) {
    try { 
        const params = context.params;
        const phoneNumber = params.phoneNumber;
        const allCalls = await prisma.inboundCall.findMany({
            where: { 
                fromNumber: phoneNumber
            }, 
            select: { 
                notes: true 
            }
        })
        const extractedNotes = allCalls.flatMap(call =>
            (call.notes ?? []).map((n: any) => n.note)
        );
        return NextResponse.json(extractedNotes);
    }
    catch (error) { 
        console.error("Failed to fetch number ", error)
        return NextResponse.json(
        { error: 'Failed to fetch notes' },
        { status: 500 }
        );
    }
} 
