"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import ResultsPanel from "@/components/ResultsPanel";
import Flag from "@/components/Flag";
import { useIntegrityMonitor, requestFullscreen, exitFullscreen } from "@/hooks/useIntegrityMonitor";
import { useFaceMonitor, getFaceStatusDisplay } from "@/hooks/useFaceMonitor";

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
  const [assessmentActive, setAssessmentActive] = useState(false);

  // ── Integrity monitoring ──────────────────────────────────────────────────
  const { toasts, dismissToast, getReport, isFullscreen, addViolation } = useIntegrityMonitor(assessmentActive);

  const [prepCountdown, setPrepCountdown] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [currentTranscription, setCurrentTranscription] = useState("");

  const [transcriptions, setTranscriptions] = useState<Array<{ phase: string; prompt: string; transcription: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | object>(null);
  const [error, setError] = useState("");
  const [browserSupported, setBrowserSupported] = useState(true);

  // ── Webcam refs ──────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webcamWidgetOpen, setWebcamWidgetOpen] = useState(true);

  // ── Face monitor ─────────────────────────────────────────────────────────
  const { faceStatus, faceCount, cameraEnabled, modelLoading, initCamera, stopCamera } = useFaceMonitor(
    videoRef,
    canvasRef,
    assessmentActive,
    addViolation
  );

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const recognitionRef = useRef<any>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const isRecordingActiveRef = useRef(false);

  useEffect(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    const supported = !!SpeechRecognition;
    setBrowserSupported(supported);

    fetch(`/api/assess/speaking/questions?lang=${language}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) setError(data.error);
        else { setQSet(data); setPhase("intro"); }
      })
      .catch(() => setError("Failed to load assessment questions"));

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (recognitionRef.current) recognitionRef.current.stop();
      stopCamera();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [language]);

  const parts = qSet
    ? [
        { title: "Part 1: Topic Introduction",   prompt: qSet.sec1Topic,       preparationTime: 15, speakingTime: 60, phaseLabel: "Section 1 / Topic" },
        { title: "Part 2: Follow-up Question 1", prompt: qSet.sec1FollowUp1,   preparationTime: 15, speakingTime: 45, phaseLabel: "Section 1 / Q1" },
        { title: "Part 3: Follow-up Question 2", prompt: qSet.sec1FollowUp2,   preparationTime: 15, speakingTime: 45, phaseLabel: "Section 1 / Q2" },
        { title: "Part 4: New Topic",            prompt: qSet.sec2Topic,       preparationTime: 15, speakingTime: 60, phaseLabel: "Section 2" },
        { title: "Part 5: Reading Paragraph",    prompt: "Please read the following paragraph aloud:\n\n" + qSet.sec3Paragraph, preparationTime: 10, speakingTime: 60, phaseLabel: "Section 3" },
      ]
    : [];

  const startPreparation = async () => {
    await requestFullscreen();
    setAssessmentActive(true);
    const part = parts[currentPart];
    setPrepCountdown(part.preparationTime);
    setPhase("prepare");
    timerRef.current = setInterval(() => {
      setPrepCountdown((prev) => {
        if (prev <= 1) { clearInterval(timerRef.current!); setPhase("record"); return 0; }
        return prev - 1;
      });
    }, 1000);
  };

  const startRecording = () => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) return;

    setCurrentTranscription("");
    setError(""); // Clear previous error messages

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
        if (event.results[i].isFinal) finalTranscript += event.results[i][0].transcript + " ";
        else interimTranscript += event.results[i][0].transcript;
      }
      setCurrentTranscription(finalTranscript + interimTranscript);
    };

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    recognition.onerror = (event: any) => {
      console.error("[SpeechRecognition] Error event:", event.error);
      if (event.error === "no-speech") {
        // "no-speech" is transient silence. Don't show scary error message to user.
        return;
      }
      if (event.error === "not-allowed") {
        setError("Microphone permission denied. Please allow microphone access.");
        stopRecording();
      } else if (event.error === "audio-capture") {
        setError("No microphone detected. Please check your system settings.");
        stopRecording();
      } else {
        setError("Speech recognition issue detected. Please speak clearly into your microphone.");
      }
    };

    recognition.onend = () => {
      // If we are still supposed to be recording, restart to prevent silent cutoff
      if (isRecordingActiveRef.current) {
        try {
          recognition.start();
        } catch (e) {
          // ignore if already running
        }
      }
    };

    recognition.start();
    recognitionRef.current = recognition;
    isRecordingActiveRef.current = true;
    setIsRecording(true);
    setRecordingTime(0);
    
    if (timerRef.current) clearInterval(timerRef.current);
    timerRef.current = setInterval(() => setRecordingTime((prev) => prev + 1), 1000);
  };

  const stopRecording = () => {
    isRecordingActiveRef.current = false;
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // ignore
      }
      recognitionRef.current = null;
    }
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
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
    if (phase === "record" && !isRecording) startRecording();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase]);

  const handleNextPart = () => {
    const newTranscriptions = [
      ...transcriptions,
      { phase: parts[currentPart].phaseLabel, prompt: parts[currentPart].prompt, transcription: currentTranscription },
    ];
    setTranscriptions(newTranscriptions);
    setCurrentTranscription("");
    setRecordingTime(0);

    if (currentPart < parts.length - 1) {
      setCurrentPart((c) => c + 1);
      setPhase("prepare");
      const nextPart = parts[currentPart + 1];
      setPrepCountdown(nextPart.preparationTime);
      timerRef.current = setInterval(() => {
        setPrepCountdown((prev) => {
          if (prev <= 1) { clearInterval(timerRef.current!); setPhase("record"); return 0; }
          return prev - 1;
        });
      }, 1000);
    } else {
      submitAssessment(newTranscriptions);
    }
  };

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const submitAssessment = async (finalTranscriptions: any[]) => {
    setAssessmentActive(false);
    exitFullscreen();
    stopCamera();
    setLoading(true);
    setError("");
    setPhase("submit");

    try {
      const res = await fetch("/api/assess/speaking", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ responses: finalTranscriptions, language, integrityReport: getReport() }),
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

  // ── Derived state ─────────────────────────────────────────────────────────
  const showFullscreenOverlay = assessmentActive && !isFullscreen && phase !== "submit";
  const faceDisplay = getFaceStatusDisplay(faceStatus);
  const totalViolations = getReport().violationCount;

  if (result) {
    return (
      <ResultsPanel
        result={result as Parameters<typeof ResultsPanel>[0]["result"]}
        language={language}
        skill="speaking"
        prompt="Combined 5-part Speaking Assessment"
        onRetry={() => window.location.reload()}
        integrityRiskLevel={(result as any).integrityRiskLevel}
        integrityReport={(result as any).integrityReport}
      />
    );
  }

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.1 }} />
      </div>

      {/* ── Integrity Toast Overlay ──────────────────────────────────────────── */}
      {toasts.length > 0 && !showFullscreenOverlay && (
        <div style={{ position: "fixed", top: "80px", right: "20px", zIndex: 9999, display: "flex", flexDirection: "column", gap: "10px", maxWidth: "340px" }}>
          {toasts.map((toast) => (
            <div key={toast.id} style={{ display: "flex", alignItems: "flex-start", gap: "12px", padding: "14px 16px", background: "rgba(244, 63, 94, 0.12)", border: "1px solid rgba(244, 63, 94, 0.35)", borderLeft: "3px solid #f43f5e", borderRadius: "12px", backdropFilter: "blur(16px)", boxShadow: "0 8px 32px rgba(0,0,0,0.4)", animation: "slideInRight 0.3s ease" }}>
              <span style={{ fontSize: "20px", flexShrink: 0, lineHeight: 1.2 }}>{toast.icon}</span>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: "12px", fontWeight: 700, color: "#fda4af", marginBottom: "3px", textTransform: "uppercase", letterSpacing: "0.06em" }}>Integrity Warning</div>
                <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>{toast.message}</div>
              </div>
              <button onClick={() => dismissToast(toast.id)} style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "16px", lineHeight: 1, flexShrink: 0, padding: "2px" }}>✕</button>
            </div>
          ))}
        </div>
      )}

      {/* ── Fullscreen Recovery Overlay ──────────────────────────────────────── */}
      {showFullscreenOverlay && (
        <div style={{ position: "fixed", inset: 0, zIndex: 10000, background: "rgba(3,2,19,0.94)", backdropFilter: "blur(24px)", display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: "24px", padding: "24px" }}>
          {/* Animated pulse ring */}
          <div style={{ position: "relative", width: "100px", height: "100px", display: "flex", alignItems: "center", justifyContent: "center" }}>
            <div style={{ position: "absolute", inset: 0, borderRadius: "50%", border: "2px solid rgba(244,63,94,0.3)", animation: "ping 2s ease infinite" }} />
            <div style={{ width: "80px", height: "80px", borderRadius: "50%", background: "rgba(244,63,94,0.15)", border: "2px solid rgba(244,63,94,0.5)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "36px" }}>
              🖥️
            </div>
          </div>

          <div style={{ textAlign: "center", maxWidth: "480px" }}>
            <div style={{ fontSize: "12px", fontWeight: 700, color: "#fda4af", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px" }}>
              Assessment Paused
            </div>
            <h2 style={{ fontSize: "28px", fontWeight: 900, fontFamily: "'Outfit', sans-serif", color: "var(--text-primary)", marginBottom: "12px" }}>
              You exited fullscreen mode
            </h2>
            <p style={{ fontSize: "15px", color: "var(--text-secondary)", lineHeight: 1.6, marginBottom: "8px" }}>
              This assessment requires fullscreen mode to ensure integrity. The timer has been paused.
            </p>
            {totalViolations > 0 && (
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", padding: "5px 12px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.25)", borderRadius: "9999px", fontSize: "12px", fontWeight: 600, color: "#fda4af", marginBottom: "24px" }}>
                🚩 {totalViolations} violation{totalViolations !== 1 ? "s" : ""} recorded
              </div>
            )}
          </div>

          <button
            onClick={() => requestFullscreen()}
            style={{ display: "flex", alignItems: "center", gap: "12px", padding: "18px 40px", background: "linear-gradient(135deg, #4C7FED, #2196F3)", border: "none", borderRadius: "14px", color: "white", fontSize: "17px", fontWeight: 700, cursor: "pointer", boxShadow: "0 0 40px rgba(76,127,237,0.5)", fontFamily: "'Inter', sans-serif", transition: "all 0.2s ease" }}
            onMouseEnter={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.04)"; }}
            onMouseLeave={(e) => { (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)"; }}
          >
            🔲 Return to Fullscreen
          </button>

          <p style={{ fontSize: "12px", color: "var(--text-muted)" }}>
            Your progress has been saved. Press the button above to continue.
          </p>
        </div>
      )}

      {/* ── Webcam Preview Widget ─────────────────────────────────────────────── */}
      {cameraEnabled && (
        <div style={{ position: "fixed", bottom: "24px", right: "24px", zIndex: 8888, borderRadius: "16px", overflow: "hidden", boxShadow: "0 8px 40px rgba(0,0,0,0.6)", border: "1px solid rgba(255,255,255,0.1)", transition: "all 0.3s ease", width: webcamWidgetOpen ? "160px" : "48px", background: "rgba(10,14,39,0.95)" }}>
          {/* Widget header */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "8px 10px", background: "rgba(0,0,0,0.3)", borderBottom: webcamWidgetOpen ? "1px solid rgba(255,255,255,0.08)" : "none" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "14px" }}>{faceDisplay.icon}</span>
              {webcamWidgetOpen && (
                <span style={{ fontSize: "10px", fontWeight: 700, color: faceDisplay.color, textTransform: "uppercase", letterSpacing: "0.06em" }}>
                  {faceDisplay.label}
                </span>
              )}
            </div>
            <button
              onClick={() => setWebcamWidgetOpen((o) => !o)}
              style={{ background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "12px", lineHeight: 1, padding: "2px" }}
              title={webcamWidgetOpen ? "Minimize" : "Expand"}
            >
              {webcamWidgetOpen ? "−" : "□"}
            </button>
          </div>

          {/* Video + canvas overlay - always mounted, but toggled via height & overflow to keep tracking running in background */}
          <div style={{
            position: "relative",
            width: "160px",
            height: webcamWidgetOpen ? "120px" : "0px",
            overflow: "hidden",
            transition: "height 0.3s ease",
          }}>
            <video
              ref={videoRef}
              style={{ width: "160px", height: "120px", objectFit: "cover", display: "block", transform: "scaleX(-1)" }}
              muted
              playsInline
              autoPlay
            />
            <canvas
              ref={canvasRef}
              width={160}
              height={120}
              style={{ position: "absolute", inset: 0, width: "160px", height: "120px", transform: "scaleX(-1)", pointerEvents: "none" }}
            />
            {modelLoading && (
              <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.7)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "10px", color: "var(--text-muted)", flexDirection: "column", gap: "6px" }}>
                <div className="spinner" style={{ width: "20px", height: "20px" }} />
                <span>Loading AI...</span>
              </div>
            )}
            {/* Status dot */}
            <div style={{ position: "absolute", top: "6px", left: "6px", width: "8px", height: "8px", borderRadius: "50%", background: faceDisplay.color, boxShadow: `0 0 6px ${faceDisplay.color}` }} />
          </div>

          {/* Face count badge */}
          {webcamWidgetOpen && faceCount > 0 && (
            <div style={{ padding: "4px 10px", background: faceCount > 1 ? "rgba(244,63,94,0.2)" : "rgba(16,185,129,0.1)", fontSize: "10px", fontWeight: 600, color: faceCount > 1 ? "#f43f5e" : "#10b981", textAlign: "center" }}>
              {faceCount} face{faceCount !== 1 ? "s" : ""} detected
            </div>
          )}
        </div>
      )}

      <div className="container" style={{ paddingBottom: "80px" }}>
        <div className="breadcrumb" style={{ paddingTop: "32px" }}>
          <Link href="/assessment">Assessment</Link>
          <span className="breadcrumb-sep">›</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            Speaking — {language === "english" ? <><Flag country="gb" size={16} /> English</> : <><Flag country="de" size={16} /> German</>}
          </span>
        </div>

        <div style={{ maxWidth: "720px", margin: "0 auto" }}>

          {/* ── Loading ─────────────────────────────────────────────────────── */}
          {phase === "loading" && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: "48px", height: "48px", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 700 }}>Loading Assessment...</h2>
            </div>
          )}

          {/* ── Intro ───────────────────────────────────────────────────────── */}
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

              <div className="glass-card" style={{ padding: "32px", marginBottom: "24px" }}>
                <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "16px" }}>Assessment Structure:</h3>
                <ul style={{ paddingLeft: "20px", lineHeight: "1.8", color: "var(--text-secondary)" }}>
                  <li><strong>Part 1:</strong> Introduction Topic</li>
                  <li><strong>Part 2 &amp; 3:</strong> Follow-up Questions</li>
                  <li><strong>Part 4:</strong> New Topic</li>
                  <li><strong>Part 5:</strong> Reading Paragraph</li>
                </ul>
              </div>

              {/* ── Webcam Permission Card ─────────────────────────────────── */}
              <div style={{ padding: "24px 28px", marginBottom: "24px", borderRadius: "16px", background: cameraEnabled ? "rgba(16,185,129,0.07)" : "rgba(76,127,237,0.07)", border: cameraEnabled ? "1px solid rgba(16,185,129,0.25)" : "1px solid rgba(76,127,237,0.25)" }}>
                <div style={{ display: "flex", alignItems: "flex-start", gap: "16px" }}>
                  <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: cameraEnabled ? "rgba(16,185,129,0.15)" : "rgba(76,127,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "22px", flexShrink: 0 }}>
                    {cameraEnabled ? "✅" : "📷"}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>
                      {cameraEnabled ? "Camera Enabled — Monitoring Active" : "Enable Camera Monitoring"}
                    </div>
                    <p className="text-secondary" style={{ fontSize: "13px", lineHeight: 1.6, marginBottom: "14px" }}>
                      {cameraEnabled
                        ? "Your camera is active. Our AI will monitor for multiple people in frame and ensure assessment integrity."
                        : "This assessment uses AI-powered camera monitoring to verify that you complete it independently. We detect multiple faces and reading behaviour. Camera access is optional but recommended."}
                    </p>
                    {!cameraEnabled && (
                      <button
                        onClick={initCamera}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: "13px" }}
                      >
                        📷 Allow Camera Access
                      </button>
                    )}
                    {cameraEnabled && (
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <div style={{ width: "80px", height: "60px", borderRadius: "8px", overflow: "hidden", border: "1px solid rgba(16,185,129,0.3)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <span style={{ fontSize: "22px" }}>📷</span>
                        </div>
                        <div style={{ fontSize: "12px", color: "#10b981", fontWeight: 600 }}>🟢 Camera ready — preview in bottom-right corner</div>
                      </div>
                    )}

                  </div>
                </div>
              </div>

              {/* ── Integrity Notice ────────────────────────────────────────── */}
              <div style={{ padding: "14px 18px", marginBottom: "24px", borderRadius: "12px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", gap: "12px" }}>
                <span style={{ fontSize: "18px", flexShrink: 0 }}>🛡️</span>
                <div style={{ fontSize: "13px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                  This assessment runs in <strong style={{ color: "var(--text-secondary)" }}>fullscreen mode</strong> with integrity monitoring enabled. Tab switches, copy/paste, right-click, and suspicious behaviour will be logged and reviewed by assessors.
                </div>
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

          {/* ── Preparation Phase ──────────────────────────────────────────── */}
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

              <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderLeft: "3px solid var(--brand-primary)", borderRadius: "var(--radius-md)", fontSize: "16px", lineHeight: "1.6", textAlign: "left", maxWidth: "600px", margin: "0 auto 24px auto", whiteSpace: "pre-wrap" }}>
                {parts[currentPart].prompt}
              </div>

              <p className="text-secondary" style={{ marginBottom: "8px", fontSize: "14px" }}>Recording starts automatically in</p>

              <div style={{ fontSize: "56px", fontWeight: 900, fontFamily: "Outfit, sans-serif", background: "var(--gradient-brand)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
                {prepCountdown}s
              </div>
            </div>
          )}

          {/* ── Recording Phase ────────────────────────────────────────────── */}
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

              <div style={{ padding: "20px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", borderLeft: "3px solid var(--brand-rose)", borderRadius: "var(--radius-md)", fontSize: "16px", lineHeight: "1.6", textAlign: "left", maxWidth: "600px", margin: "0 auto 24px auto", whiteSpace: "pre-wrap" }}>
                {parts[currentPart].prompt}
              </div>

              {currentTranscription && (
                <div style={{ padding: "12px 16px", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", borderRadius: "var(--radius-md)", fontSize: "14px", textAlign: "left", lineHeight: "1.6", marginBottom: "20px", color: "var(--text-secondary)", maxHeight: "100px", overflowY: "auto" }}>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>LIVE TRANSCRIPTION</div>
                  {currentTranscription}
                </div>
              )}

              {isRecording && (
                <div className="waveform" style={{ justifyContent: "center", marginBottom: "20px", height: "30px" }}>
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s` }} />
                  ))}
                </div>
              )}

              <div style={{ fontSize: "40px", fontWeight: 900, fontFamily: "Outfit, sans-serif", marginBottom: "20px", color: recordingTime > parts[currentPart].speakingTime * 0.8 ? "var(--brand-rose)" : "var(--text-primary)" }}>
                {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
                <span style={{ fontSize: "14px", color: "var(--text-muted)", marginLeft: "8px" }}>/ {parts[currentPart].speakingTime}s</span>
              </div>

              <div style={{ display: "flex", gap: "16px", justifyContent: "center", alignItems: "center" }}>
                {!isRecording ? (
                  <button id="record-btn" onClick={startRecording} className="record-btn record-btn-idle" title="Start Recording" style={{ width: "64px", height: "64px", fontSize: "28px" }}>🎤</button>
                ) : (
                  <button id="stop-record-btn" onClick={() => { stopRecording(); handleNextPart(); }} className="record-btn record-btn-recording" title="Stop Recording" style={{ width: "64px", height: "64px", fontSize: "28px" }}>⏹️</button>
                )}
              </div>
              <p className="text-muted" style={{ marginTop: "12px", fontSize: "13px" }}>{isRecording ? "Click to stop recording" : "Click to start recording"}</p>
            </div>
          )}

          {/* ── Submitting ─────────────────────────────────────────────────── */}
          {phase === "submit" && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: "48px", height: "48px", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>AI is evaluating all 5 parts...</h2>
              <p className="text-secondary">This usually takes 10–20 seconds</p>
            </div>
          )}

          {error && (
            <div className="alert alert-error" style={{ marginTop: "24px" }}>⚠️ {error}</div>
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
