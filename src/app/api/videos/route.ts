import { NextRequest , NextResponse } from "next/server";
import prisma from "@/lib/db";
export const config = {
    runtime: 'edge',
}
export async function GET(request: NextRequest) {
    try {
        const videos = await prisma.video.findMany({
            orderBy: {
                createdAt: 'desc'
            }
        })
        return NextResponse.json(videos);
    } catch (error) {
        return NextResponse.json("Error fetching videos", { status: 500 });
    }
    finally {
        await prisma.$disconnect();
    }
}