import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assessSpeaking } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { responses, language, setId } = await req.json();

    if (!responses || !Array.isArray(responses) || !language) {
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

    const result = await assessSpeaking(responses, language, targetCefrLevel);

    // concatenate user responses for storage
    const fullTranscription = responses.map(r => r.transcription).join(" | ").substring(0, 2000);
    const fullPrompt = responses.map(r => r.prompt).join(" | ").substring(0, 200);

    if (userId) {
      await prisma.assessment.create({
          data: {
            userId,
            language,
            skill: "speaking",
            cefrLevel: result.cefr_level,
            overallScore: result.overall_score,
            grammarScore: result.sub_scores.grammar,
            vocabularyScore: result.sub_scores.vocabulary,
            fluencyScore: result.sub_scores.fluency,
            prompt: fullPrompt,
            userResponse: fullTranscription,
            strengths: JSON.stringify(result.strengths),
            improvements: JSON.stringify(result.improvements),
            feedback: result.detailed_feedback,
          },
        });
      }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Speaking assessment error:", error);
    return NextResponse.json({ error: "Assessment failed. Please try again." }, { status: 500 });
  }
}
