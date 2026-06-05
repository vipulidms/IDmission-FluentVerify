"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ResultsPanel from "@/components/ResultsPanel";
import Flag from "@/components/Flag";

type Language = "english" | "german";

const writingPrompts = {
  english: [
    {
      id: "en-w-1",
      level: "B1",
      title: "Technology in Daily Life",
      prompt: "How has technology changed the way we communicate with each other? Give specific examples and discuss both positive and negative effects.",
      minWords: 150,
      maxWords: 250,
    },
    {
      id: "en-w-2",
      level: "B2",
      title: "Environmental Responsibility",
      prompt: "To what extent do you agree that individuals have a greater responsibility than governments in protecting the environment? Justify your opinion with examples.",
      minWords: 200,
      maxWords: 350,
    },
    {
      id: "en-w-3",
      level: "A2",
      title: "My Daily Routine",
      prompt: "Describe your typical daily routine. What do you do from morning to evening? Include at least 5 activities and explain why they are important to you.",
      minWords: 80,
      maxWords: 150,
    },
    {
      id: "en-w-4",
      level: "C1",
      title: "Remote Work Revolution",
      prompt: "The COVID-19 pandemic accelerated the shift to remote work. Critically analyse the long-term implications of this trend for urban development, work-life balance, and social cohesion.",
      minWords: 300,
      maxWords: 450,
    },
  ],
  german: [
    {
      id: "de-w-1",
      level: "A2",
      title: "Meine Familie",
      prompt: "Beschreibe deine Familie. Wie heißen deine Familienmitglieder? Was machen sie gerne? Schreibe mindestens 5 Sätze über deine Familie.",
      minWords: 60,
      maxWords: 120,
    },
    {
      id: "de-w-2",
      level: "B1",
      title: "Leben in der Stadt oder auf dem Land",
      prompt: "Möchtest du lieber in einer Stadt oder auf dem Land leben? Erkläre deine Meinung und nenne Vor- und Nachteile beider Optionen.",
      minWords: 120,
      maxWords: 220,
    },
    {
      id: "de-w-3",
      level: "B2",
      title: "Soziale Medien und Gesellschaft",
      prompt: "Inwiefern beeinflussen soziale Medien das gesellschaftliche Leben und die zwischenmenschlichen Beziehungen? Diskutieren Sie Chancen und Risiken mit konkreten Beispielen.",
      minWords: 180,
      maxWords: 320,
    },
    {
      id: "de-w-4",
      level: "C1",
      title: "Klimawandel und Politik",
      prompt: "Analysieren Sie kritisch, ob die aktuellen politischen Maßnahmen zur Bekämpfung des Klimawandels ausreichen. Berücksichtigen Sie dabei wirtschaftliche, soziale und ökologische Aspekte.",
      minWords: 280,
      maxWords: 420,
    },
  ],
};

function countWords(text: string) {
  return text.trim().split(/\s+/).filter(Boolean).length;
}

function WritingContent() {
  const searchParams = useSearchParams();
  const language = (searchParams.get("lang") as Language) || "english";
  const prompts = writingPrompts[language];
  
  const [selectedPromptIndex, setSelectedPromptIndex] = useState(0);
  const [text, setText] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | object>(null);
  const [error, setError] = useState("");
  const startTimeRef = useRef(Date.now());

  const selectedPrompt = prompts[selectedPromptIndex];
  const wordCount = countWords(text);
  const isValid = wordCount >= selectedPrompt.minWords;

  useEffect(() => {
    startTimeRef.current = Date.now();
    setText("");
    setResult(null);
    setError("");
  }, [selectedPromptIndex, language]);

  const handleSubmit = async () => {
    if (!isValid) return;
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/assess/writing", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          text,
          prompt: selectedPrompt.prompt,
          language,
          promptId: selectedPrompt.id,
          timeTaken: Math.floor((Date.now() - startTimeRef.current) / 1000),
        }),
      });

      if (!res.ok) throw new Error("Assessment failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Assessment failed. Please check your API key and try again.");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ResultsPanel
        result={result as Parameters<typeof ResultsPanel>[0]["result"]}
        language={language}
        skill="writing"
        prompt={selectedPrompt.prompt}
        onRetry={() => { setResult(null); setText(""); }}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.1 }} />
      </div>

      <div className="container" style={{ paddingBottom: "80px" }}>
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ paddingTop: "32px" }}>
          <Link href="/assessment">Assessment</Link>
          <span className="breadcrumb-sep">›</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            Writing — {language === "english" ? <><Flag country="gb" size={16} /> English</> : <><Flag country="de" size={16} /> German</>}
          </span>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "300px 1fr", gap: "32px", alignItems: "start" }}>
          {/* Sidebar: Prompt Selection */}
          <div>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "var(--text-secondary)" }}>
              SELECT TOPIC
            </h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {prompts.map((p, i) => (
                <button
                  key={p.id}
                  id={`prompt-${p.id}`}
                  onClick={() => setSelectedPromptIndex(i)}
                  style={{
                    padding: "14px 18px",
                    borderRadius: "var(--radius-md)",
                    border: i === selectedPromptIndex
                      ? "1px solid var(--brand-primary)"
                      : "1px solid var(--border-subtle)",
                    background: i === selectedPromptIndex ? "rgba(99,102,241,0.1)" : "var(--bg-card)",
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 0.2s ease",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                    <span className={`cefr-badge cefr-${p.level}`} style={{ fontSize: "11px", padding: "2px 8px" }}>{p.level}</span>
                  </div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: i === selectedPromptIndex ? "var(--text-brand)" : "var(--text-primary)" }}>
                    {p.title}
                  </div>
                </button>
              ))}
            </div>

            {/* Tips */}
            <div style={{ marginTop: "24px", padding: "16px", background: "rgba(99,102,241,0.05)", borderRadius: "var(--radius-md)", border: "1px solid rgba(99,102,241,0.15)" }}>
              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-brand)", marginBottom: "10px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                ✨ Writing Tips
              </div>
              <ul style={{ fontSize: "13px", color: "var(--text-secondary)", listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                <li>• Plan your ideas before writing</li>
                <li>• Use a clear introduction & conclusion</li>
                <li>• Vary your sentence structures</li>
                <li>• Use linking words (however, therefore...)</li>
                <li>• Check grammar before submitting</li>
              </ul>
            </div>
          </div>

          {/* Main: Writing Area */}
          <div>
            <div className="glass-card" style={{ padding: "36px" }}>
              <div style={{ marginBottom: "28px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "16px" }}>
                  <span style={{ fontSize: "28px" }}>✍️</span>
                  <div>
                    <h1 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "4px" }}>{selectedPrompt.title}</h1>
                    <span className={`cefr-badge cefr-${selectedPrompt.level}`}>{selectedPrompt.level} Level</span>
                  </div>
                </div>

                <div style={{
                  padding: "20px 24px",
                  background: "rgba(255,255,255,0.03)",
                  border: "1px solid var(--border-subtle)",
                  borderLeft: "3px solid var(--brand-primary)",
                  borderRadius: "var(--radius-md)",
                }}>
                  <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--text-primary)" }}>
                    {selectedPrompt.prompt}
                  </p>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "12px", fontSize: "13px", color: "var(--text-muted)" }}>
                  <span>📝 {selectedPrompt.minWords}–{selectedPrompt.maxWords} words required</span>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Your Response</label>
                <textarea
                  id="writing-response"
                  className="form-input form-textarea"
                  placeholder={language === "english" ? "Start writing your response here..." : "Beginne hier mit dem Schreiben..."}
                  value={text}
                  onChange={(e) => setText(e.target.value)}
                  style={{ minHeight: "260px", fontSize: "15px", lineHeight: "1.7" }}
                />
              </div>

              {/* Word count bar */}
              <div style={{ marginTop: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px", fontSize: "13px" }}>
                  <span className="text-secondary">
                    {wordCount} / {selectedPrompt.minWords} words minimum
                    {wordCount >= selectedPrompt.minWords && (
                      <span style={{ color: "var(--brand-green)", marginLeft: "8px" }}>✓ Minimum reached</span>
                    )}
                  </span>
                  <span className={wordCount > selectedPrompt.maxWords ? "text-rose" : "text-muted"} style={{ color: wordCount > selectedPrompt.maxWords ? "var(--brand-rose)" : "var(--text-muted)" }}>
                    {wordCount > selectedPrompt.maxWords ? `${wordCount - selectedPrompt.maxWords} over limit` : `${selectedPrompt.maxWords - wordCount} remaining`}
                  </span>
                </div>
                <div className="progress-bar">
                  <div
                    className="progress-fill"
                    style={{
                      width: `${Math.min(100, (wordCount / selectedPrompt.minWords) * 100)}%`,
                      background: wordCount >= selectedPrompt.minWords ? "var(--gradient-green)" : "var(--gradient-brand)",
                    }}
                  />
                </div>
              </div>

              {error && (
                <div className="alert alert-error" style={{ marginTop: "20px" }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: "flex", gap: "12px", marginTop: "24px" }}>
                <button
                  id="submit-writing-btn"
                  onClick={handleSubmit}
                  className="btn btn-primary btn-lg"
                  disabled={loading || !isValid}
                  style={{ flex: 1 }}
                >
                  {loading ? (
                    <>
                      <div className="spinner" />
                      AI is evaluating your writing...
                    </>
                  ) : (
                    "Submit for AI Assessment →"
                  )}
                </button>
                <button
                  onClick={() => setText("")}
                  className="btn btn-ghost"
                  disabled={loading}
                >
                  Clear
                </button>
              </div>

              {!isValid && text.length > 0 && (
                <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "10px", textAlign: "center" }}>
                  Write at least {selectedPrompt.minWords - wordCount} more words to enable submission
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function WritingAssessmentPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" />}>
      <WritingContent />
    </Suspense>
  );
}
