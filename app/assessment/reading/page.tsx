"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ResultsPanel from "@/components/ResultsPanel";
import Flag from "@/components/Flag";

type Language = "english" | "german";

const readingContent = {
  english: {
    title: "The Rise of Urban Farming",
    level: "B1",
    passage: `Urban farming is transforming cities around the world. From rooftop gardens in New York to vertical farms in Tokyo, people are finding innovative ways to grow food in urban environments.

The benefits are numerous. Urban farms can reduce food miles – the distance food travels from farm to plate – which cuts carbon emissions and ensures fresher produce reaches consumers. They also create community spaces where neighbours can meet and collaborate.

However, urban farming faces significant challenges. Land in cities is expensive, and many urban farmers struggle to make their operations financially viable. Water usage is another concern, though new hydroponic systems are addressing this by using up to 90% less water than traditional farming.

Despite these obstacles, the urban farming movement continues to grow. Advocates argue that as cities expand and climate change threatens traditional agriculture, urban farms could become an essential part of our food system.`,
    questions: [
      { id: "q1", question: "What is the main environmental benefit of urban farming mentioned in the text?", type: "short" as const, correctAnswer: "Reducing food miles and carbon emissions" },
      { id: "q2", question: "How much less water do hydroponic systems use compared to traditional farming?", type: "mcq" as const, options: ["50% less", "70% less", "90% less", "95% less"], correctAnswer: "90% less" },
      { id: "q3", question: "What is described as the biggest financial challenge for urban farmers?", type: "short" as const, correctAnswer: "High cost of land in cities" },
      { id: "q4", question: "In your own words, why might urban farming become more important in the future?", type: "short" as const, correctAnswer: "Because cities are expanding and climate change threatens traditional agriculture" },
    ],
  },
  german: {
    title: "Die Digitalisierung der Arbeitswelt",
    level: "B1",
    passage: `Die Digitalisierung verändert die Arbeitswelt grundlegend. Immer mehr Tätigkeiten werden durch Computer und Algorithmen übernommen, während neue Berufsfelder entstehen, die vor wenigen Jahren noch unbekannt waren.

Besonders betroffen sind Berufe mit repetitiven Aufgaben. Kassierer, Sachbearbeiter und einfache Buchhalter sehen sich durch Automatisierung bedroht. Eine Studie des Instituts für Arbeitsmarkt- und Berufsforschung zeigt, dass etwa 25 Prozent aller deutschen Arbeitsplätze durch Digitalisierung gefährdet sein könnten.

Gleichzeitig entstehen neue Chancen. IT-Spezialisten, Datenwissenschaftler und KI-Trainer werden dringend gesucht. Unternehmen investieren stark in Umschulungsprogramme, um ihre Mitarbeiter fit für die digitale Zukunft zu machen.

Experten sind sich einig: Lebenslanges Lernen wird in der digitalen Ära unverzichtbar sein. Wer sich anpassen und neue Fähigkeiten erwerben kann, wird auch in Zukunft gute Chancen auf dem Arbeitsmarkt haben.`,
    questions: [
      { id: "q1", question: "Welche Berufe sind laut dem Text am stärksten von der Automatisierung bedroht?", type: "short" as const, correctAnswer: "Berufe mit repetitiven Aufgaben wie Kassierer und Sachbearbeiter" },
      { id: "q2", question: "Wie viel Prozent der deutschen Arbeitsplätze könnten gefährdet sein?", type: "mcq" as const, options: ["15 Prozent", "20 Prozent", "25 Prozent", "30 Prozent"], correctAnswer: "25 Prozent" },
      { id: "q3", question: "Was machen Unternehmen, um ihre Mitarbeiter vorzubereiten?", type: "short" as const, correctAnswer: "Sie investieren in Umschulungsprogramme" },
      { id: "q4", question: "Was ist laut Experten in der digitalen Ära unverzichtbar?", type: "short" as const, correctAnswer: "Lebenslanges Lernen" },
    ],
  },
};

function ReadingContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userLanguage = (session?.user as any)?.assessmentLanguage as Language | undefined;
  const isAdmin = (session?.user as any)?.role === "admin";
  const language = (!isAdmin && userLanguage) ? userLanguage : ((searchParams.get("lang") as Language) || "english");

  const content = readingContent[language];

  const [answers, setAnswers] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | object>(null);
  const [error, setError] = useState("");

  const allAnswered = content.questions.every((q) => answers[q.id]?.trim());

  const handleSubmit = async () => {
    if (!allAnswered) return;
    setLoading(true);
    setError("");

    const questions = content.questions.map((q) => ({
      question: q.question,
      userAnswer: answers[q.id] || "",
      correctAnswer: q.correctAnswer,
    }));

    try {
      const res = await fetch("/api/assess/reading", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, passage: content.passage, language, passageTitle: content.title }),
      });
      if (!res.ok) throw new Error();
      setResult(await res.json());
    } catch {
      setError("Assessment failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    if (isAdmin) {
      return (
        <ResultsPanel
          result={result as Parameters<typeof ResultsPanel>[0]["result"]}
          language={language}
          skill="reading"
          prompt={content.title}
          onRetry={() => { setResult(null); setAnswers({}); }}
        />
      );
    }
    return (
      <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "20px" }}>
        <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
          <div className="hero-orb hero-orb-1" style={{ opacity: 0.1 }} />
        </div>
        <div className="glass-card animate-scaleIn" style={{ width: "100%", maxWidth: "560px", padding: "48px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px" }}>
          <div style={{
            width: "80px", height: "80px", borderRadius: "50%",
            background: "rgba(16, 185, 129, 0.12)", border: "2px solid #10b981",
            display: "flex", alignItems: "center", justifyContent: "center",
            fontSize: "36px", color: "#10b981", boxShadow: "0 0 20px rgba(16, 185, 129, 0.2)"
          }}>
            ✓
          </div>
          <div>
            <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>
              Assessment Submitted!
            </h1>
            <p className="text-secondary" style={{ fontSize: "15px", lineHeight: "1.6" }}>
              Thanks for conducting the test. Your information is submitted and your results will be communicated shortly.
            </p>
          </div>
          <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "15px", fontWeight: 600, width: "100%", textAlign: "center", display: "inline-block" }}>
            Go to Dashboard
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.08 }} />
      </div>

      <div className="container" style={{ paddingBottom: "80px" }}>
        <div className="breadcrumb" style={{ paddingTop: "32px" }}>
          <Link href="/assessment">Assessment</Link>
          <span className="breadcrumb-sep">›</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            Reading — {language === "english" ? <><Flag country="gb" size={16} /> English</> : <><Flag country="de" size={16} /> German</>}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px", alignItems: "start" }}>
          {/* Passage */}
          <div>
            <div className="glass-card" style={{ padding: "32px", position: "sticky", top: "90px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <span style={{ fontSize: "24px" }}>📖</span>
                <div>
                  <h1 style={{ fontSize: "22px", fontWeight: 800 }}>{content.title}</h1>
                  <span className={`cefr-badge cefr-${content.level}`}>{content.level} Level</span>
                </div>
              </div>
              <div style={{
                fontSize: "15px",
                lineHeight: "1.85",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}>
                {content.passage}
              </div>
            </div>
          </div>

          {/* Questions */}
          <div>
            <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "20px" }}>
              Comprehension Questions
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {content.questions.map((q, i) => (
                <div key={q.id} className="question-card">
                  <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 600 }}>
                    QUESTION {i + 1} OF {content.questions.length}
                  </div>
                  <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "16px", lineHeight: "1.6" }}>
                    {q.question}
                  </p>

                  {q.type === "mcq" && q.options ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {q.options.map((opt) => (
                        <button
                          key={opt}
                          id={`q${i + 1}-opt-${opt.replace(/\s+/g, "-")}`}
                          onClick={() => setAnswers({ ...answers, [q.id]: opt })}
                          className={`mcq-option ${answers[q.id] === opt ? "selected" : ""}`}
                        >
                          <span style={{
                            width: "20px", height: "20px", borderRadius: "50%",
                            border: `2px solid ${answers[q.id] === opt ? "var(--brand-primary)" : "var(--border-glass)"}`,
                            display: "flex", alignItems: "center", justifyContent: "center",
                            flexShrink: 0, background: answers[q.id] === opt ? "var(--brand-primary)" : "transparent",
                          }}>
                            {answers[q.id] === opt && <span style={{ width: "8px", height: "8px", borderRadius: "50%", background: "white" }} />}
                          </span>
                          {opt}
                        </button>
                      ))}
                    </div>
                  ) : (
                    <textarea
                      id={`q${i + 1}-answer`}
                      className="form-input form-textarea"
                      placeholder={language === "english" ? "Write your answer here..." : "Schreibe deine Antwort hier..."}
                      value={answers[q.id] || ""}
                      onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                      style={{ minHeight: "80px" }}
                    />
                  )}
                </div>
              ))}
            </div>

            {error && <div className="alert alert-error" style={{ marginTop: "20px" }}>⚠️ {error}</div>}

            <button
              id="submit-reading-btn"
              onClick={handleSubmit}
              className="btn btn-primary btn-lg"
              disabled={!allAnswered || loading}
              style={{ width: "100%", marginTop: "24px" }}
            >
              {loading ? <><div className="spinner" />Evaluating answers...</> : `Submit Answers (${Object.keys(answers).length}/${content.questions.length} answered)`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function ReadingAssessmentPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" />}>
      <ReadingContent />
    </Suspense>
  );
}
