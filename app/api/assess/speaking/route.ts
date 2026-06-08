import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { assessSpeaking } from "@/lib/gemini";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    const { responses, language, setId, integrityReport } = await req.json();

    if (!responses || !Array.isArray(responses) || !language) {
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

    const result = await assessSpeaking(responses, language, targetCefrLevel);

    // concatenate user responses for storage
    const fullTranscription = responses.map((r: { transcription: string }) => r.transcription).join(" | ").substring(0, 2000);
    const fullPrompt = responses.map((r: { prompt: string }) => r.prompt).join(" | ").substring(0, 200);

    if (userId) {
      await prisma.assessment.create({
          data: {
            userId,
            language,
            skill: "speaking",
            cefrLevel: result.cefr_level || "B1",
            overallScore: typeof result.overall_score === "number" ? result.overall_score : 60,
            grammarScore: result.sub_scores?.grammar ?? null,
            vocabularyScore: result.sub_scores?.vocabulary ?? null,
            fluencyScore: result.sub_scores?.fluency ?? null,
            prompt: fullPrompt,
            userResponse: fullTranscription,
            strengths: JSON.stringify(result.strengths || []),
            improvements: JSON.stringify(result.improvements || []),
            feedback: result.target_level_gap ? `${result.detailed_feedback}\n\n**Target Goal Analysis:**\n${result.target_level_gap}` : result.detailed_feedback || "No feedback provided",
            integrityReport: integrityReport ? JSON.stringify(integrityReport) : null,
          },
        });
      }

    // Include riskLevel and full report in response so ResultsPanel can show details
    return NextResponse.json({
      ...result,
      integrityRiskLevel: integrityReport?.riskLevel ?? "low",
      integrityFlagged: integrityReport?.flagged ?? false,
      integrityReport: integrityReport ? JSON.stringify(integrityReport) : null,
    });
  } catch (error) {
    console.error("Speaking assessment error:", error);
    return NextResponse.json({ error: "Assessment failed. Please try again." }, { status: 500 });
  }
}

