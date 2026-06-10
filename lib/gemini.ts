import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export interface AssessmentResult {
  cefr_level: string;
  overall_score: number;
  sub_scores: {
    grammar?: number;
    vocabulary?: number;
    fluency?: number;
    coherence?: number;
    comprehension?: number;
    pronunciation?: number;
  };
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
  target_level_gap?: string;
}

const CEFR_LEVELS = ["A1", "A2", "B1", "B2", "C1", "C2"];

function cleanJsonResponse(text: string): string {
  // Remove markdown code blocks if present
  text = text.replace(/```json\n?/g, "").replace(/```\n?/g, "");
  return text.trim();
}

function enforceCEFRConsistency(result: any): AssessmentResult {
  if (!result) return result;

  let cefr = (result.cefr_level || "B1").toUpperCase().trim();
  const validLevels = ["A1", "A2", "B1", "B2", "C1", "C2"];
  if (!validLevels.includes(cefr)) {
    cefr = "B1";
  }
  result.cefr_level = cefr;

  const ranges: Record<string, { min: number; max: number; default: number }> = {
    A1: { min: 0, max: 20, default: 10 },
    A2: { min: 21, max: 35, default: 28 },
    B1: { min: 36, max: 55, default: 45 },
    B2: { min: 56, max: 75, default: 65 },
    C1: { min: 76, max: 90, default: 83 },
    C2: { min: 91, max: 100, default: 95 },
  };

  const range = ranges[cefr];
  let score = typeof result.overall_score === "number" ? result.overall_score : range.default;

  // Add grace buffers to reduce strict clamping penalty
  const allowedMax = cefr === "C2" ? range.max : range.max + 10;
  const allowedMin = cefr === "A1" ? range.min : range.min - 5;

  // Clamp overall score
  if (score < allowedMin || score > allowedMax) {
    score = Math.max(allowedMin, Math.min(allowedMax, score));
  }
  result.overall_score = score;

  // Clamp sub-scores
  if (result.sub_scores) {
    Object.keys(result.sub_scores).forEach((key) => {
      if (typeof result.sub_scores[key] === "number") {
        result.sub_scores[key] = Math.max(allowedMin, Math.min(allowedMax, result.sub_scores[key]));
      }
    });
  }

  return result;
}

export async function assessWriting(
  userText: string,
  prompt: string,
  language: "english" | "german",
  targetCefrLevel?: string | null
): Promise<AssessmentResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const targetInstruction = targetCefrLevel ? `\nCRITICAL: The user's target CEFR level is ${targetCefrLevel}. You MUST evaluate their response against the requirements of ${targetCefrLevel}. Provide a specific gap analysis in the 'target_level_gap' field comparing their actual performance to their ${targetCefrLevel} target. Do NOT mix this into the detailed_feedback.` : `\nInclude a "target_level_gap" field with a value of null or empty string since no target was set.`;

  const systemPrompt = `You are an expert ${language} language assessor certified in CEFR (Common European Framework of Reference for Languages). ${targetInstruction}
  
  Assess the following ${language} writing response to the given prompt. Return ONLY a JSON object with no markdown formatting.

  Prompt given to user: "${prompt}"
  
  User's response: "${userText}"
  
  Return this exact JSON structure:
  {
    "cefr_level": "B1",
    "overall_score": 65,
    "sub_scores": {
      "grammar": 60,
      "vocabulary": 70,
      "coherence": 65,
      "task_achievement": 65
    },
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"],
    "detailed_feedback": "Detailed paragraph of feedback here...",
    "target_level_gap": "Your target is B2, but your current performance is B1. To reach B2, you need to..."
  }
  
  CEFR levels: A1 (0-20), A2 (21-35), B1 (36-55), B2 (56-75), C1 (76-90), C2 (91-100)
  Score should reflect genuine CEFR assessment. Be specific and constructive.

  HANDLING HIGHLY FLUENT/NATIVE WRITERS:
  1. Native or highly fluent speakers writing naturally, using conversational/colloquial expressions, or common contractions MUST NOT be downgraded. Focus on structural accuracy, argument coherence, and natural lexical resource.
  2. Highly fluent/native-level writing must be placed accurately in C1 (76-90) or C2 (91-100) based on their overall grammar, vocabulary depth, and coherence.

  CRITICAL RULE: If the user's response is completely off-topic, random, or ignores the prompt entirely, you MUST assign the lowest possible scores (A1, 0-10) and explicitly mention that the response was irrelevant in the detailed feedback.
  CRITICAL: The JSON above is purely an example of the structure. DO NOT copy the scores (e.g., 65) or text from the example. You MUST evaluate the response strictly on its own merits and provide genuine scores and feedback.`;

  const result = await model.generateContent(systemPrompt);
  const text = cleanJsonResponse(result.response.text());

  try {
    const parsed = JSON.parse(text);
    return enforceCEFRConsistency(parsed);
  } catch {
    return enforceCEFRConsistency({
      cefr_level: "B1",
      overall_score: 50,
      sub_scores: { grammar: 50, vocabulary: 50, coherence: 50 },
      strengths: ["Shows understanding of the topic", "Attempts to address the prompt"],
      improvements: ["Work on grammar accuracy", "Expand vocabulary range", "Improve text organization"],
      detailed_feedback: "Your response shows basic understanding of the topic. Continue practicing to improve your language skills.",
      target_level_gap: "Focus on producing more complex sentences to reach your target level.",
    });
  }
}

export async function assessReading(
  questions: Array<{ question: string; userAnswer: string; correctAnswer?: string }>,
  passage: string,
  language: "english" | "german",
  targetCefrLevel?: string | null
): Promise<AssessmentResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const targetInstruction = targetCefrLevel ? `\nCRITICAL: The user's target CEFR level is ${targetCefrLevel}. You MUST evaluate their reading comprehension against the requirements of ${targetCefrLevel}. Provide a specific gap analysis in the 'target_level_gap' field comparing their actual performance to their ${targetCefrLevel} target. Do NOT mix this into the detailed_feedback.` : `\nInclude a "target_level_gap" field with a value of null since no target was set.`;

  const qAndA = questions
    .map((q, i) => `Q${i + 1}: ${q.question}\nUser Answer: ${q.userAnswer}${q.correctAnswer ? `\nExpected: ${q.correctAnswer}` : ""}`)
    .join("\n\n");

  const systemPrompt = `You are an expert ${language} language assessor. Evaluate the user's reading comprehension based on their answers to questions about a passage. ${targetInstruction}

  Reading Passage: "${passage.substring(0, 1000)}..."
  
  Questions and Answers:
  ${qAndA}
  
  Return ONLY this exact JSON structure (no markdown):
  {
    "cefr_level": "B2",
    "overall_score": 72,
    "sub_scores": {
      "comprehension": 75,
      "vocabulary": 70,
      "inference": 70
    },
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "detailed_feedback": "Detailed feedback paragraph...",
    "target_level_gap": "Your target is B2, but your current reading comprehension aligns closer to B1. To reach B2, focus on..."
  }
  CRITICAL: The JSON above is purely an example of the structure. DO NOT copy the scores (e.g., 72) or text from the example. You MUST evaluate the response strictly on its own merits and provide genuine scores and feedback.`;

  const result = await model.generateContent(systemPrompt);
  const text = cleanJsonResponse(result.response.text());

  try {
    return enforceCEFRConsistency(JSON.parse(text));
  } catch {
    return enforceCEFRConsistency({
      cefr_level: "B1",
      overall_score: 50,
      sub_scores: { comprehension: 50, vocabulary: 50 },
      strengths: ["Shows basic reading comprehension", "Attempts all questions"],
      improvements: ["Read more carefully for details", "Practice inference skills"],
      detailed_feedback: "Your reading comprehension shows basic understanding. Focus on reading for specific details and implied meaning.",
      target_level_gap: "To reach your target, practice reading longer and more complex texts.",
    });
  }
}

export async function assessListening(
  questions: Array<{ question: string; userAnswer: string; correctAnswer?: string }>,
  audioTranscript: string,
  language: "english" | "german",
  targetCefrLevel?: string | null
): Promise<AssessmentResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const targetInstruction = targetCefrLevel ? `\nCRITICAL: The user's target CEFR level is ${targetCefrLevel}. You MUST evaluate their listening comprehension against the requirements of ${targetCefrLevel}. Provide a specific gap analysis in the 'target_level_gap' field comparing their actual performance to their ${targetCefrLevel} target. Do NOT mix this into the detailed_feedback.` : `\nInclude a "target_level_gap" field with a value of null since no target was set.`;

  const qAndA = questions
    .map((q, i) => `Q${i + 1}: ${q.question}\nUser Answer: ${q.userAnswer}${q.correctAnswer ? `\nExpected: ${q.correctAnswer}` : ""}`)
    .join("\n\n");

  const systemPrompt = `You are an expert ${language} language assessor. Evaluate listening comprehension based on answers to questions about an audio recording. ${targetInstruction}

  Audio Content (transcript): "${audioTranscript}"
  
  Questions and Answers:
  ${qAndA}
  
  Return ONLY this exact JSON structure (no markdown):
  {
    "cefr_level": "B1",
    "overall_score": 65,
    "sub_scores": {
      "comprehension": 65,
      "vocabulary": 65,
      "detail_recognition": 65
    },
    "strengths": ["strength 1", "strength 2"],
    "improvements": ["improvement 1", "improvement 2"],
    "detailed_feedback": "Detailed feedback paragraph...",
    "target_level_gap": "Your target is B2, but your current listening comprehension aligns closer to B1. To reach B2, practice listening to..."
  }
  CRITICAL: The JSON above is purely an example of the structure. DO NOT copy the scores (e.g., 65) or text from the example. You MUST evaluate the response strictly on its own merits and provide genuine scores and feedback.`;

  const result = await model.generateContent(systemPrompt);
  const text = cleanJsonResponse(result.response.text());

  try {
    return enforceCEFRConsistency(JSON.parse(text));
  } catch {
    return enforceCEFRConsistency({
      cefr_level: "B1",
      overall_score: 50,
      sub_scores: { comprehension: 50, vocabulary: 50 },
      strengths: ["Shows listening comprehension", "Attempts all questions"],
      improvements: ["Practice active listening", "Focus on key information"],
      detailed_feedback: "Your listening comprehension shows you can understand general topics. Keep practicing to catch specific details.",
      target_level_gap: "To reach your target, practice listening to native speakers at natural speed.",
    });
  }
}

export async function assessSpeaking(
  responses: Array<{ phase: string; prompt: string; transcription: string }>,
  language: "english" | "german",
  targetCefrLevel?: string | null
): Promise<AssessmentResult> {
  const model = genAI.getGenerativeModel({ model: "gemini-2.5-flash" });

  const targetInstruction = targetCefrLevel ? `\nCRITICAL: The user's target CEFR level is ${targetCefrLevel}. You MUST evaluate their spoken responses against the requirements of ${targetCefrLevel}. Provide a specific gap analysis in the 'target_level_gap' field comparing their actual performance to their ${targetCefrLevel} target. Do NOT mix this into the detailed_feedback.` : `\nInclude a "target_level_gap" field with a value of null since no target was set.`;

  const qAndA = responses
    .map((r) => `[${r.phase}] Prompt: "${r.prompt}"\nUser Response: "${r.transcription}"`)
    .join("\n\n");

  const systemPrompt = `You are an expert ${language} language speaking assessor certified in CEFR standards. ${targetInstruction}
  
  Assess the following combined transcriptions of a 5-part spoken assessment.
  
  Assessment Transcriptions:
  ${qAndA}
  
  Return ONLY this exact JSON structure (no markdown):
  {
    "cefr_level": "B2",
    "overall_score": 72,
    "sub_scores": {
      "fluency": 70,
      "grammar": 72,
      "vocabulary": 75,
      "pronunciation": 70
    },
    "strengths": ["strength 1", "strength 2", "strength 3"],
    "improvements": ["improvement 1", "improvement 2", "improvement 3"],
    "detailed_feedback": "Detailed speaking feedback paragraph addressing the whole assessment...",
    "target_level_gap": "Your target is B2, but your current performance is B1. To reach B2, you need to speak more continuously and..."
  }
  
  Note: Evaluate holistically based on grammar in transcription, vocabulary range, and likely fluency across all 5 parts. Be constructive and specific.

  HANDLING SPEECH-TO-TEXT (STT) TRANSCRIPTIONS:
  1. The user's response was transcribed using a browser speech-to-text API. It may lack punctuation, capitalization, or have occasional phonetic mishearings. DO NOT penalize the grammar, fluency, or coherence scores for these automated transcription artifacts. Focus on the underlying sentence structures, vocabulary, and semantic clarity.
  2. Native or highly fluent speakers speaking casually, naturally, or using colloquial phrasing/contractions (e.g., "gonna", "wanna", conversational idioms) MUST NOT be downgraded. Evaluate their native-level flow and comfort, placing them accurately in C1 (76-90) or C2 (91-100) based on their overall proficiency.
  
  CRITICAL RULE: Task Achievement is paramount. If the user's responses are completely off-topic, random nonsense, or ignore the provided prompts entirely, you MUST heavily penalize them, assign the lowest possible CEFR level (A1) and scores (0-10), and explicitly state that their answers were irrelevant to the questions.
  CRITICAL: The JSON above is purely an example of the structure. DO NOT copy the scores (e.g., 72) or text from the example. You MUST evaluate the response strictly on its own merits and provide genuine scores and feedback.`;

  const result = await model.generateContent(systemPrompt);
  const text = cleanJsonResponse(result.response.text());

  try {
    return enforceCEFRConsistency(JSON.parse(text));
  } catch {
    return enforceCEFRConsistency({
      cefr_level: "B1",
      overall_score: 50,
      sub_scores: { fluency: 50, grammar: 50, vocabulary: 50, pronunciation: 50 },
      strengths: ["Shows communication ability", "Addresses the prompts"],
      improvements: ["Work on fluency", "Expand speaking vocabulary", "Practice complex structures"],
      detailed_feedback: "Your speaking responses demonstrate you can communicate on familiar topics. Continue practicing for greater fluency and accuracy.",
      target_level_gap: "To reach your target level, practice speaking at length on complex topics.",
    });
  }
}
