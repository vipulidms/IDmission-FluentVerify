"use client";
import { useState, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import ResultsPanel from "@/components/ResultsPanel";
import Flag from "@/components/Flag";

type Language = "english" | "german";

const listeningContent = {
  english: {
    title: "A Job Interview",
    level: "B1",
    transcript: `Interviewer: Good morning, Sarah. Thank you for coming in today.

Sarah: Thank you. I'm very pleased to be here.

Interviewer: I've read your CV and I'm impressed by your five years of experience in marketing. Can you tell me more about your current role?

Sarah: Of course. I'm currently a Senior Marketing Coordinator at TechStart. I manage our social media channels, coordinate campaigns, and analyse results. Last year, I led a campaign that increased our social media followers by 40 percent.

Interviewer: That's impressive. Why are you looking to leave your current position?

Sarah: I've learned a great deal at TechStart, but I'm looking for a new challenge and more opportunities for career growth. Your company's focus on data-driven marketing particularly excites me.

Interviewer: One final question – what are your salary expectations?

Sarah: Based on my experience, I'm looking for something in the range of forty-five to fifty thousand pounds per year.

Interviewer: That's within our budget. We'll be in touch within the week.`,
    questions: [
      { id: "q1", question: "How many years of experience does Sarah have in marketing?", type: "mcq" as const, options: ["Three years", "Four years", "Five years", "Six years"], correctAnswer: "Five years" },
      { id: "q2", question: "By what percentage did Sarah increase social media followers?", type: "short" as const, correctAnswer: "40 percent" },
      { id: "q3", question: "What is Sarah's salary expectation per year?", type: "short" as const, correctAnswer: "£45,000–£50,000" },
      { id: "q4", question: "Why is Sarah leaving her current job?", type: "short" as const, correctAnswer: "She wants a new challenge and more career growth opportunities" },
    ],
  },
  german: {
    title: "Ein Gespräch über Urlaub",
    level: "B1",
    transcript: `Anna: Hallo Klaus! Wie war dein Urlaub in Spanien?

Klaus: Es war wunderschön! Wir haben zwei Wochen in Barcelona verbracht. Die Stadt ist unglaublich.

Anna: Was habt ihr alles gemacht?

Klaus: Am ersten Tag haben wir die Sagrada Família besichtigt – das war einfach atemberaubend. Dann sind wir täglich an den Strand gegangen. Das Wetter war perfekt, jeden Tag Sonnenschein und etwa 28 Grad.

Anna: Klingt fantastisch! Und das Essen?

Klaus: Oh, das Essen war köstlich! Wir haben viel Tapas gegessen und natürlich Paella. Es gibt ein kleines Restaurant nahe dem Hotel, das die beste Paella serviert, die ich je gegessen habe.

Anna: Hast du auch Ausflüge gemacht?

Klaus: Ja, wir haben einen Tagesausflug nach Montserrat gemacht. Das ist ein Kloster in den Bergen, etwa eine Stunde von Barcelona entfernt. Die Aussicht von oben war spektakulär.`,
    questions: [
      { id: "q1", question: "Wie lange war Klaus in Spanien?", type: "mcq" as const, options: ["Eine Woche", "Zwei Wochen", "Drei Wochen", "Einen Monat"], correctAnswer: "Zwei Wochen" },
      { id: "q2", question: "Wie war das Wetter in Barcelona?", type: "short" as const, correctAnswer: "Sonnenschein, etwa 28 Grad" },
      { id: "q3", question: "Wohin hat Klaus einen Tagesausflug gemacht?", type: "short" as const, correctAnswer: "Nach Montserrat" },
      { id: "q4", question: "Was isst Klaus besonders gerne in Spanien?", type: "short" as const, correctAnswer: "Tapas und Paella" },
    ],
  },
};

function ListeningContent() {
  const searchParams = useSearchParams();
  const { data: session } = useSession();

  const userLanguage = (session?.user as any)?.assessmentLanguage as Language | undefined;
  const isAdmin = (session?.user as any)?.role === "admin";
  const language = (!isAdmin && userLanguage) ? userLanguage : ((searchParams.get("lang") as Language) || "english");

  const content = listeningContent[language];

  const [showTranscript, setShowTranscript] = useState(false);
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
      const res = await fetch("/api/assess/listening", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ questions, audioTranscript: content.transcript, language, contentTitle: content.title }),
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
    return (
      <ResultsPanel
        result={result as Parameters<typeof ResultsPanel>[0]["result"]}
        language={language}
        skill="listening"
        prompt={content.title}
        onRetry={() => { setResult(null); setAnswers({}); setShowTranscript(false); }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-2" style={{ opacity: 0.08 }} />
      </div>

      <div className="container" style={{ paddingBottom: "80px" }}>
        <div className="breadcrumb" style={{ paddingTop: "32px" }}>
          <Link href="/assessment">Assessment</Link>
          <span className="breadcrumb-sep">›</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            Listening — {language === "english" ? <><Flag country="gb" size={16} /> English</> : <><Flag country="de" size={16} /> German</>}
          </span>
        </div>

        <div style={{ maxWidth: "760px", margin: "0 auto" }}>
          <div style={{ marginBottom: "36px" }}>
            <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: "8px" }}>
              👂 Listening <span className="gradient-text">Assessment</span>
            </h1>
            <p className="text-secondary">Read the transcript carefully, then answer the comprehension questions below.</p>
          </div>

          {/* Audio Visual Player (Simulated) */}
          <div className="glass-card" style={{ padding: "28px", marginBottom: "28px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
              <div style={{
                width: "56px", height: "56px", borderRadius: "50%",
                background: "var(--gradient-brand)", display: "flex",
                alignItems: "center", justifyContent: "center", fontSize: "24px",
                boxShadow: "var(--shadow-glow)", flexShrink: 0,
              }}>
                👂
              </div>
              <div>
                <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>{content.title}</h3>
                <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                  <span className={`cefr-badge cefr-${content.level}`}>{content.level}</span>
                  <span className="text-secondary" style={{ fontSize: "14px", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                    {language === "english" ? <><Flag country="gb" size={14} /> English</> : <><Flag country="de" size={14} /> German</>} • Listening Comprehension
                  </span>
                </div>
              </div>
            </div>

            {/* Simulated waveform */}
            <div style={{
              height: "48px",
              background: "rgba(99,102,241,0.05)",
              borderRadius: "var(--radius-md)",
              border: "1px solid var(--border-subtle)",
              display: "flex",
              alignItems: "center",
              padding: "0 16px",
              gap: "3px",
              marginBottom: "16px",
            }}>
              {[...Array(40)].map((_, i) => (
                <div key={i} style={{
                  width: "4px",
                  height: `${8 + Math.sin(i * 0.5) * 14 + Math.random() * 10}px`,
                  background: i < 20 ? "var(--brand-primary)" : "var(--border-glass)",
                  borderRadius: "2px",
                  opacity: 0.8,
                }} />
              ))}
            </div>

            <div style={{ display: "flex", gap: "12px" }}>
              <button
                id="show-transcript-btn"
                onClick={() => setShowTranscript(!showTranscript)}
                className="btn btn-ghost btn-sm"
              >
                {showTranscript ? "📋 Hide Transcript" : "📋 Read Transcript"}
              </button>
              <span className="text-muted" style={{ fontSize: "13px", display: "flex", alignItems: "center" }}>
                💡 Read the transcript as if listening to the audio
              </span>
            </div>

            {showTranscript && (
              <div style={{
                marginTop: "16px",
                padding: "20px",
                background: "rgba(255,255,255,0.02)",
                borderRadius: "var(--radius-md)",
                border: "1px solid var(--border-subtle)",
                fontSize: "14px",
                lineHeight: "1.85",
                color: "var(--text-secondary)",
                whiteSpace: "pre-wrap",
              }}>
                {content.transcript}
              </div>
            )}
          </div>

          {/* Questions */}
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "20px" }}>Questions</h2>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {content.questions.map((q, i) => (
              <div key={q.id} className="question-card">
                <div style={{ fontSize: "12px", color: "var(--text-muted)", marginBottom: "8px", fontWeight: 600 }}>
                  QUESTION {i + 1}
                </div>
                <p style={{ fontSize: "15px", fontWeight: 600, marginBottom: "14px", lineHeight: "1.6" }}>
                  {q.question}
                </p>

                {q.type === "mcq" && q.options ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                    {q.options.map((opt) => (
                      <button
                        key={opt}
                        id={`listen-q${i + 1}-${opt.replace(/\s+/g, "-")}`}
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
                  <input
                    id={`listen-q${i + 1}-answer`}
                    type="text"
                    className="form-input"
                    placeholder={language === "english" ? "Your answer..." : "Deine Antwort..."}
                    value={answers[q.id] || ""}
                    onChange={(e) => setAnswers({ ...answers, [q.id]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </div>

          {error && <div className="alert alert-error" style={{ marginTop: "20px" }}>⚠️ {error}</div>}

          <button
            id="submit-listening-btn"
            onClick={handleSubmit}
            className="btn btn-primary btn-lg"
            disabled={!allAnswered || loading}
            style={{ width: "100%", marginTop: "24px" }}
          >
            {loading ? <><div className="spinner" />Evaluating...</> : `Submit Answers (${Object.keys(answers).length}/${content.questions.length})`}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ListeningAssessmentPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" />}>
      <ListeningContent />
    </Suspense>
  );
}
