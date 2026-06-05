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
        targetCefrLevel = userRec?.targetCefrLevel || null;
      }
    }

    const result = await assessListening(questions, audioTranscript, language, targetCefrLevel);

    if (userId) {
      await prisma.assessment.create({
          data: {
            userId,
            language,
            skill: "listening",
            cefrLevel: result.cefr_level,
            overallScore: result.overall_score,
            vocabularyScore: result.sub_scores.vocabulary,
            prompt: contentTitle || "Listening Comprehension",
            userResponse: JSON.stringify(questions.map((q: { userAnswer: string }) => q.userAnswer)),
            strengths: JSON.stringify(result.strengths),
            improvements: JSON.stringify(result.improvements),
            feedback: result.detailed_feedback,
          },
        });
      }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Listening assessment error:", error);
    return NextResponse.json({ error: "Assessment failed. Please try again." }, { status: 500 });
  }
}
