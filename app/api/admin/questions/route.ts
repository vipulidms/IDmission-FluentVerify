import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || (session.user as any).role !== "admin") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const data = await req.json();

    const qSet = await prisma.speakingQuestionSet.create({
      data: {
        language: data.language,
        level: data.level,
        sec1Topic: data.sec1Topic,
        sec1FollowUp1: data.sec1FollowUp1,
        sec1FollowUp2: data.sec1FollowUp2,
        sec2Topic: data.sec2Topic,
        sec3Paragraph: data.sec3Paragraph,
      },
    });

    return NextResponse.json(qSet, { status: 201 });
  } catch (error) {
    console.error("Admin question set creation error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
