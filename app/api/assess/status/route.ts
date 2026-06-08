import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const userId = (session.user as { id?: string }).id;
    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        role: true,
        allowedAttempts: true,
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const completedAttempts = await prisma.assessment.count({
      where: { userId },
    });

    const isCandidate = user.role !== "admin";
    const hasExhaustedAttempts = isCandidate && completedAttempts >= user.allowedAttempts;

    return NextResponse.json({
      role: user.role,
      allowedAttempts: user.allowedAttempts,
      completedAttempts,
      hasExhaustedAttempts,
    });
  } catch (error) {
    console.error("Attempts status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
