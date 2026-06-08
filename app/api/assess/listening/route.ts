import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assessListening } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { questions, audioTranscript, language, contentTitle } = await req.json();

    if (!questions || !audioTranscript || !language) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    let targetCefrLevel: string | null = null;
    let userId: string | null = null;

    if (session?.user) {
      userId = (session.user as { id?: string }).id || null;
      if (userId) {
        const userRec = await prisma.user.findUnique({ where: { id: userId } });
        if (userRec) {
          targetCefrLevel = userRec.targetCefrLevel || null;
          if (userRec.role !== "admin") {
            const completedCount = await prisma.assessment.count({ where: { userId } });
            if (completedCount >= userRec.allowedAttempts) {
              return NextResponse.json({ error: "You have exhausted your allowed assessment attempts." }, { status: 403 });
            }
          }
        }
      }
    }

    const result = await assessListening(questions, audioTranscript, language, targetCefrLevel);

    if (userId) {
      await prisma.assessment.create({
          data: {
            userId,
            language,
            skill: "listening",
            cefrLevel: result.cefr_level || "B1",
            overallScore: typeof result.overall_score === "number" ? result.overall_score : 60,
            vocabularyScore: result.sub_scores?.vocabulary ?? null,
            prompt: contentTitle || "Listening Comprehension",
            userResponse: JSON.stringify(questions.map((q: { userAnswer: string }) => q.userAnswer)),
            strengths: JSON.stringify(result.strengths || []),
            improvements: JSON.stringify(result.improvements || []),
            feedback: result.target_level_gap ? `${result.detailed_feedback}\n\n**Target Goal Analysis:**\n${result.target_level_gap}` : result.detailed_feedback || "No feedback provided",
          },
        });
      }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Listening assessment error:", error);
    return NextResponse.json({ error: "Assessment failed. Please try again." }, { status: 500 });
  }
}
