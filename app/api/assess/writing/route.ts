import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assessWriting } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { text, prompt, language, promptId } = await req.json();

    if (!text || !prompt || !language) {
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

    const result = await assessWriting(text, prompt, language, targetCefrLevel);

    // Save to DB if user is logged in
    if (userId) {
      await prisma.assessment.create({
          data: {
            userId,
            language,
            skill: "writing",
            cefrLevel: result.cefr_level || "B1",
            overallScore: typeof result.overall_score === "number" ? result.overall_score : 60,
            grammarScore: result.sub_scores?.grammar ?? null,
            vocabularyScore: result.sub_scores?.vocabulary ?? null,
            coherenceScore: result.sub_scores?.coherence ?? null,
            prompt: promptId || prompt.substring(0, 200),
            userResponse: text.substring(0, 2000),
            strengths: JSON.stringify(result.strengths || []),
            improvements: JSON.stringify(result.improvements || []),
            feedback: result.target_level_gap ? `${result.detailed_feedback}\n\n**Target Goal Analysis:**\n${result.target_level_gap}` : result.detailed_feedback || "No feedback provided",
          },
        });
      }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Writing assessment error:", error);
    return NextResponse.json({ error: "Assessment failed. Please try again." }, { status: 500 });
  }
}
