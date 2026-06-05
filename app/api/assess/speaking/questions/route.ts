import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const lang = req.nextUrl.searchParams.get("lang") || "english";
    const sets = await prisma.speakingQuestionSet.findMany({
      where: { language: lang },
    });
    
    if (sets.length === 0) {
      return NextResponse.json({ error: "No question sets found" }, { status: 404 });
    }
    
    // Pick random set
    const randomSet = sets[Math.floor(Math.random() * sets.length)];
    return NextResponse.json(randomSet);
  } catch (error) {
    return NextResponse.json({ error: "Internal error" }, { status: 500 });
  }
}
