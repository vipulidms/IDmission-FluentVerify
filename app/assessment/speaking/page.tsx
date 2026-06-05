"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ResultsPanel from "@/components/ResultsPanel";
import Flag from "@/components/Flag";

type Language = "english" | "german";

interface QuestionSet {
  id: string;
  language: string;
  level: string;
  sec1Topic: string;
  sec1FollowUp1: string;
  sec1FollowUp2: string;
  sec2Topic: string;
  sec3Paragraph: string;
}

type Phase = "loading" | "intro" | "prepare" | "record" | "transcribe" | "submit";

function SpeakingContent() {
  const searchParams = useSearchParams();
  const language = (searchParams.get("lang") as Language) || "english";

  const [qSet, setQSet] = useState<QuestionSet | null>(null);
  const [phase, setPhase] = useState<Phase>("loading");
  const [currentPart, setCurrentPart] = useState(0);
  
  const [prepCountdown, setPrepCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState("");
  
  const [transcriptions, setTranscriptions] = useState<Array<{ phase: string, prompt: string, transcription: string }>>([]);
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | object>(null);
  const [error, setError] = useState("");
  const [browserSupported, setBrowserSupported] = useState(true);

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setBrowserSupported(supported);
    
    // Fetch question set
    fetch(`/api/assess/speaking/questions?lang=${language}`)
      .then(r => r.json())
      .then(data => {
        if (data.error) {
          setError(data.error);
        } else {
          setQSet(data);
          setPhase("intro");
        }
      })
      .catch(() => setError("Failed to load assessment questions"));
      
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
    };
  }, [language]);

  const parts = qSet ? [
    { title: "Part 1: Topic Introduction", prompt: qSet.sec1Topic, preparationTime: 15, speakingTime: 60, phaseLabel: "Section 1 / Topic" },
    { title: "Part 2: Follow-up Question 1", prompt: qSet.sec1FollowUp1, preparationTime: 15, speakingTime: 45, phaseLabel: "Section 1 / Q1" },
    { title: "Part 3: Follow-up Question 2", prompt: qSet.sec1FollowUp2, preparationTime: 15, speakingTime: 45, phaseLabel: "Section 1 / Q2" },
    { title: "Part 4: New Topic", prompt: qSet.sec2Topic, preparationTime: 15, speakingTime: 60, phaseLabel: "Section 2" },
    { title: "Part 5: Reading Paragraph", prompt: "Please read the following paragraph aloud:\n\n" + qSet.sec3Paragraph, preparationTime: 10, speakingTime: 60, phaseLabel: "Section 3" },
  ] : [];

  const startPreparation = () => {
    const part = parts[currentPart];
    setPrepCountdown(part.preparationTime);
    setPhase("prepare");
    timerRef.current = setInterval(() => {
      setPrepCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setPhase("record");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setCurrentTranscription("");
    const recognition = new SpeechRecognition();
    recognition.lang = language === "english" ? "en-US" : "de-DE";
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.maxAlternatives = 1;

    let finalTranscript = "";
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onresult = (event: any) => {
      let interimTranscript = "";
      for (let i = event.resultIndex; i < event.results.length; i++) {
        if (event.results[i].isFinal) {
          finalTranscript += event.results[i][0].transcript + " ";
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      setCurrentTranscription(finalTranscript + interimTranscript);
    };

    recognition.onerror = () => {
      setError("Speech recognition failed. Please type your response instead.");
    };

    recognition.start();
    recognitionRef.current = recognition;
    setIsRecording(true);
    setRecordingTime(0);

    timerRef.current = setInterval(() => {
      setRecordingTime((prev) => prev + 1);
    }, 1000);
  };

  const stopRecording = () => {
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    if (timerRef.current) clearInterval(timerRef.current);
    setIsRecording(false);
  };

  useEffect(() => {
    if (phase === "record" && isRecording && parts[currentPart]) {
      if (recordingTime >= parts[currentPart].speakingTime) {
        stopRecording();
        handleNextPart();
      }
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [recordingTime]);

  useEffect(() => {
    if (phase === "record" && !isRecording) {
      startRecording();
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleNextPart = () => {
    const newTranscriptions = [...transcriptions, {
      phase: parts[currentPart].phaseLabel,
      prompt: parts[currentPart].prompt,
      transcription: currentTranscription
    }];
    
    setTranscriptions(newTranscriptions);
    setCurrentTranscription("");
    setRecordingTime(0);
    
    if (currentPart < parts.length - 1) {
      setCurrentPart(c => c + 1);
      setPhase("prepare"); 
      
      const nextPart = parts[currentPart + 1];
      setPrepCountdown(nextPart.preparationTime);
      timerRef.current = setInterval(() => {
        setPrepCountdown((prev) => {
          if (prev <= 1) {
            clearInterval(timerRef.current!);
            setPhase("record");
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      submitAssessment(newTranscriptions);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitAssessment = async (finalTranscriptions: any[]) => {
    setLoading(true);
    setError("");
    setPhase("submit");

    try {
      const res = await fetch("/api/assess/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          responses: finalTranscriptions,
          language,
        }),
      });

      if (!res.ok) throw new Error("Assessment failed");
      const data = await res.json();
      setResult(data);
    } catch {
      setError("Assessment failed. Please check your Gemini API key.");
      setPhase("transcribe");
    } finally {
      setLoading(false);
    }
  };

  if (result) {
    return (
      <ResultsPanel
        result={result as Parameters<typeof ResultsPanel>[0]["result"]}
        language={language}
        skill="speaking"
        prompt="Combined 5-part Speaking Assessment"
        onRetry={() => window.location.reload()}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.1 }} />
      </div>

      <div className="container" style={{ paddingBottom: "80px" }}>
        <div className="breadcrumb" style={{ paddingTop: "32px" }}>
          <Link href="/assessment">Assessment</Link>
          <span className="breadcrumb-sep">›</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            Speaking — {language === "english" ? <><Flag country="gb" size={16} /> English</> : <><Flag country="de" size={16} /> German</>}
          </span>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto" }}>
          {phase === "loading" && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: "48px", height: "48px", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 700 }}>Loading Assessment...</h2>
            </div>
          )}

          {phase === "intro" && qSet && (
            <div className="animate-fadeInUp">
              <h1 style={{ fontSize: "36px", fontWeight: 900, marginBottom: "8px" }}>
                🎤 Speaking <span className="gradient-text">Assessment</span>
              </h1>
              <p className="text-secondary" style={{ marginBottom: "36px" }}>
                This assessment consists of 5 parts. You will be given preparation time before each part.
              </p>

              {!browserSupported && (
                <div className="alert alert-info" style={{ marginBottom: "24px" }}>
                  🔔 Speech recognition may not be supported in your browser. You can type your response instead.
                </div>
              )}

              <div className="glass-card" style={{ padding: "32px", marginBottom: "32px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>Assessment Structure:</h3>
                <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "var(--text-secondary)" }}>
                  <li><strong>Part 1:</strong> Introduction Topic</li>
                  <li><strong>Part 2 & 3:</strong> Follow-up Questions</li>
                  <li><strong>Part 4:</strong> New Topic</li>
                  <li><strong>Part 5:</strong> Reading Paragraph</li>
                </ul>
              </div>

              <button
                id="start-speaking-btn"
                onClick={startPreparation}
                className="btn btn-primary btn-lg"
                style={{ width: "100%" }}
              >
                Start Assessment →
              </button>
            </div>
          )}

          {/* Preparation Phase */}
          {phase === "prepare" && parts[currentPart] && (
            <div className="animate-scaleIn" style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ fontSize: "32px", opacity: 0.9 }}>🧠</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "12px", color: "var(--brand-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Preparation Time — Part {currentPart + 1} of 5
                  </div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{parts[currentPart].title}</h2>
                </div>
              </div>

              <div style={{
                padding: "20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-subtle)",
                borderLeft: "3px solid var(--brand-primary)",
                borderRadius: "var(--radius-md)",
                fontSize: "16px",
                lineHeight: "1.6",
                textAlign: "left",
                maxWidth: "600px",
                margin: "0 auto 24px auto",
                whiteSpace: "pre-wrap"
              }}>
                {parts[currentPart].prompt}
              </div>

              <p className="text-secondary" style={{ marginBottom: "8px", fontSize: "14px" }}>
                Recording starts automatically in
              </p>

              <div style={{
                fontSize: "56px",
                fontWeight: 900,
                fontFamily: "Outfit, sans-serif",
                background: "var(--gradient-brand)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
              }}>
                {prepCountdown}s
              </div>
            </div>
          )}

          {/* Recording Phase */}
          {phase === "record" && parts[currentPart] && (
            <div className="animate-scaleIn" style={{ textAlign: "center", padding: "10px 0" }}>
              <div style={{ display: "flex", justifyContent: "center", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{ fontSize: "32px", opacity: 0.9 }}>🎙️</div>
                <div style={{ textAlign: "left" }}>
                  <div style={{ fontSize: "12px", color: "var(--brand-rose)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em" }}>
                    Recording — Part {currentPart + 1} of 5
                  </div>
                  <h2 style={{ fontSize: "20px", fontWeight: 800, margin: 0 }}>{parts[currentPart].title}</h2>
                </div>
              </div>

              <div style={{
                padding: "20px",
                background: "rgba(255,255,255,0.03)",
                border: "1px solid var(--border-subtle)",
                borderLeft: "3px solid var(--brand-rose)",
                borderRadius: "var(--radius-md)",
                fontSize: "16px",
                lineHeight: "1.6",
                textAlign: "left",
                maxWidth: "600px",
                margin: "0 auto 24px auto",
                whiteSpace: "pre-wrap"
              }}>
                {parts[currentPart].prompt}
              </div>

              {/* Live Transcription Preview */}
              {currentTranscription && (
                <div style={{
                  padding: "12px 16px",
                  background: "rgba(99,102,241,0.05)",
                  border: "1px solid rgba(99,102,241,0.15)",
                  borderRadius: "var(--radius-md)",
                  fontSize: "14px",
                  textAlign: "left",
                  lineHeight: "1.6",
                  marginBottom: "20px",
                  color: "var(--text-secondary)",
                  maxHeight: "100px",
                  overflowY: "auto",
                }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>LIVE TRANSCRIPTION</div>
                  {currentTranscription}
                </div>
              )}

              {/* Waveform Animation */}
              {isRecording && (
                <div className="waveform" style={{ justifyContent: "center", marginBottom: "20px", height: "30px" }}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}

              {/* Timer */}
              <div style={{ fontSize: "40px", fontWeight: 900, fontFamily: "Outfit, sans-serif", marginBottom: "20px", color: recordingTime > parts[currentPart].speakingTime * 0.8 ? "var(--brand-rose)" : "var(--text-primary)" }}>
                {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
                <span style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "8px" }}>/ {parts[currentPart].speakingTime}s</span>
              </div>

              {/* Record Button */}
              <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center" }}>
                {!isRecording ? (
                  <button
                    id="record-btn"
                    onClick={startRecording}
                    className="record-btn record-btn-idle"
                    title="Start Recording"
                    style={{ width: "64px", height: "64px", fontSize: "28px" }}
                  >
                    🎤
                  </button>
                ) : (
                  <button
                    id="stop-record-btn"
                    onClick={() => { stopRecording(); handleNextPart(); }}
                    className="record-btn record-btn-recording"
                    title="Stop Recording"
                    style={{ width: "64px", height: "64px", fontSize: "28px" }}
                  >
                    ⏹️
                  </button>
                )}
              </div>
              <p className="text-muted" style={{ marginTop: "12px", fontSize: "13px" }}>
                {isRecording ? "Click to stop recording" : "Click to start recording"}
              </p>
            </div>
          )}



          {phase === "submit" && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: "48px", height: "48px", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>AI is evaluating all 5 parts...</h2>
              <p className="text-secondary">This usually takes 10–20 seconds</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function SpeakingAssessmentPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" />}>
      <SpeakingContent />
    </Suspense>
  );
}
