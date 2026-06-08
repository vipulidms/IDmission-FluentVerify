"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
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
  const { data: session } = useSession();

  const userLanguage = (session?.user as any)?.assessmentLanguage as Language | undefined;
  const isAdmin = (session?.user as any)?.role === "admin";
  const language = (!isAdmin && userLanguage) ? userLanguage : ((searchParams.get("lang") as Language) || "english");

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
  const [isAutoSubmitting, setIsAutoSubmitting] = useState(false);

  const [transcriptions, setTranscriptions] = useState<Array<{ phase: string; prompt: string; transcription: string }>>([]);

  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<null | object>(null);
  const [error, setError] = useState("");
  const [browserSupported, setBrowserSupported] = useState(true);

  // ── Webcam refs ──────────────────────────────────────────────────────────
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [webcamWidgetOpen, setWebcamWidgetOpen] = useState(true);
  const [micEnabled, setMicEnabled] = useState(false);
  const [permissionsError, setPermissionsError] = useState("");
  const [geoInfo, setGeoInfo] = useState<{ ip?: string; lat?: number; lng?: number } | null>(null);

  // ── Face monitor ─────────────────────────────────────────────────────────
  const { faceStatus, faceCount, cameraEnabled, modelLoading, initCamera, stopCamera } = useFaceMonitor(
    videoRef,
    canvasRef,
    assessmentActive,
    addViolation
  );

  const requestCameraAndMic = async () => {
    setPermissionsError("");
    setError("");

    // Fetch IP and GeoLocation
    let ip = "";
    try {
      const res = await fetch("https://api.ipify.org?format=json");
      const data = await res.json();
      ip = data.ip;
    } catch (e) {
      console.warn("Failed to fetch IP", e);
    }

    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setGeoInfo({
            ip,
            lat: position.coords.latitude,
            lng: position.coords.longitude,
          });
        },
        (error) => {
          console.warn("Geolocation error", error);
          setGeoInfo({ ip });
        }
      );
    } else {
      setGeoInfo({ ip });
    }
    
    const camOk = await initCamera();
    if (!camOk) {
      setPermissionsError("Camera access was denied. Camera is required for integrity checks.");
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((track) => track.stop());
      setMicEnabled(true);
    } catch (err) {
      setPermissionsError("Microphone access was denied. Microphone is required for speaking tests.");
    }
  };

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
        { title: "Part 5: Reading Paragraph",    prompt: "Please read the following paragraph aloud:\n\n" + qSet.sec3Paragraph, preparationTime: 15, speakingTime: 60, phaseLabel: "Section 3" },
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
        if (event.results[i].isFinal) {
          let segment = event.results[i][0].transcript.trim();
          if (segment) {
            // Capitalize first letter of each final segment
            segment = segment.charAt(0).toUpperCase() + segment.slice(1);
            // Add period if segment doesn't end with sentence-ending punctuation
            if (!/[.!?]$/.test(segment)) segment += ".";
            finalTranscript += segment + " ";
          }
        } else {
          interimTranscript += event.results[i][0].transcript;
        }
      }
      // Show finalised + in-progress text; capitalise start of interim too
      const interim = interimTranscript
        ? interimTranscript.charAt(0).toUpperCase() + interimTranscript.slice(1)
        : "";
      setCurrentTranscription(finalTranscript + interim);
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
        
        setIsAutoSubmitting(true);
        const autoSubmitTimer = setTimeout(() => {
          setIsAutoSubmitting(false);
          handleNextPart();
        }, 1500);
        
        return () => clearTimeout(autoSubmitTimer);
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
        body: JSON.stringify({ responses: finalTranscriptions, language, integrityReport: { ...getReport(), geoInfo } }),
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

      {/* Webcam is centered dynamically above the content card */}

      <div className="container" style={{ paddingBottom: "40px" }}>
        <div className="breadcrumb" style={{ paddingTop: "20px" }}>
          <Link href="/assessment">Assessment</Link>
          <span className="breadcrumb-sep">›</span>
          <span style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            Speaking — {language === "english" ? <><Flag country="gb" size={16} /> English</> : <><Flag country="de" size={16} /> German</>}
          </span>
        </div>

        <div style={{ maxWidth: (phase === "prepare" || phase === "record") ? "1000px" : "900px", margin: "0 auto", transition: "max-width 0.3s ease" }}>

          {/* ── Loading Phase ─────────────────────────────────────────────────── */}
          {phase === "loading" && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: "48px", height: "48px", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 700 }}>Loading Assessment...</h2>
            </div>
          )}

          {/* ── Submitting Phase ───────────────────────────────────────────────── */}
          {phase === "submit" && (
            <div style={{ textAlign: "center", padding: "80px 0" }}>
              <div className="spinner" style={{ width: "48px", height: "48px", margin: "0 auto 24px" }} />
              <h2 style={{ fontSize: "24px", fontWeight: 700, marginBottom: "8px" }}>AI is evaluating all 5 parts...</h2>
              <p className="text-secondary">This usually takes 10–20 seconds</p>
            </div>
          )}

          {/* ── Main Workspace: Intro, Prepare, & Record ─────────────────────── */}
          {(phase === "intro" || phase === "prepare" || phase === "record") && (
            <>
              {/* Progress Step Indicator (Prepare & Record phases) */}
              {(phase === "prepare" || phase === "record") && (
                <div style={{ 
                  position: "relative",
                  marginBottom: "32px", 
                  background: "rgba(255, 255, 255, 0.02)", 
                  border: "1px solid var(--border-subtle)", 
                  borderRadius: "16px", 
                  padding: "20px 24px", 
                  backdropFilter: "blur(12px)",
                  boxShadow: "0 8px 32px rgba(0, 0, 0, 0.15)"
                }}>
                  {/* Steps Container */}
                  <div style={{ 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "space-between", 
                    position: "relative",
                    zIndex: 1,
                    width: "100%"
                  }}>
                    {/* Track Line — spans from center of step-1 to center of step-5 only */}
                    <div style={{
                      position: "absolute",
                      top: "14px",
                      left: `calc(${100 / (parts.length * 2)}% - 1px)`,
                      right: `calc(${100 / (parts.length * 2)}% - 1px)`,
                      height: "3px",
                      background: "rgba(255, 255, 255, 0.08)",
                      borderRadius: "2px",
                      zIndex: 0
                    }} />

                    {/* Active / Completed Fill Line */}
                    <div style={{
                      position: "absolute",
                      top: "14px",
                      left: `calc(${100 / (parts.length * 2)}% - 1px)`,
                      width: currentPart === 0
                        ? "0px"
                        : `calc(${(currentPart / (parts.length - 1)) * (100 - 100 / parts.length)}% )`,
                      height: "3px",
                      background: "linear-gradient(90deg, #10b981, #4c7fed)",
                      borderRadius: "2px",
                      zIndex: 0,
                      transition: "width 0.5s ease"
                    }} />
                    {parts.map((p, idx) => {
                      const isCompleted = idx < currentPart;
                      const isActive = idx === currentPart;
                      
                      let stepBg = "var(--bg-primary)";
                      let borderColor = "var(--border-subtle)";
                      let textColor = "var(--text-muted)";
                      let titleColor = "var(--text-secondary)";
                      
                      if (isCompleted) {
                        stepBg = "var(--bg-primary)";
                        borderColor = "#10b981";
                        textColor = "#10b981";
                        titleColor = "var(--text-primary)";
                      } else if (isActive) {
                        stepBg = "var(--bg-primary)";
                        borderColor = phase === "record" ? "var(--brand-rose)" : "#4c7fed";
                        textColor = phase === "record" ? "var(--brand-rose)" : "#4c7fed";
                        titleColor = "var(--text-primary)";
                      }

                      return (
                        <div key={idx} style={{ 
                          display: "flex", 
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "8px",
                          flex: 1,
                          textAlign: "center"
                        }}>
                          {/* Circle Node */}
                          <div style={{ 
                            position: "relative",
                            zIndex: 2,
                            width: "28px", 
                            height: "28px", 
                            borderRadius: "50%", 
                            background: stepBg, 
                            border: `2.5px solid ${borderColor}`, 
                            display: "flex", 
                            alignItems: "center", 
                            justifyContent: "center", 
                            fontSize: "12px", 
                            fontWeight: 800, 
                            color: textColor,
                            transition: "all 0.3s ease",
                            boxShadow: isActive ? `0 0 14px ${borderColor}60` : "none"
                          }}>
                            {isCompleted ? "✓" : idx + 1}
                          </div>

                          {/* Step Label */}
                          <div className="hidden-mobile" style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                            <span style={{ fontSize: "9px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em", color: isActive ? textColor : "var(--text-muted)" }}>
                              Part {idx + 1}
                            </span>
                            <span style={{ fontSize: "11px", fontWeight: 600, color: titleColor, whiteSpace: "nowrap" }}>
                              {idx === 0 ? "Topic Intro" : idx === 1 || idx === 2 ? `Follow-up ${idx}` : idx === 3 ? "New Topic" : "Paragraph"}
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              <div className="speaking-grid">
              
              {/* Left Column / Control Panel Card */}
              <div 
                className={
                  `glass-card p-6 flex flex-col items-center justify-between relative overflow-hidden ${
                    phase === "record" && recordingTime >= parts[currentPart].speakingTime - 5 
                      ? "animate-flash-border-rose" 
                      : ""
                  }`
                } 
                style={{ 
                  width: "100%", 
                  minHeight: "380px",
                  padding: "32px 24px"
                }}
              >
                {/* Webcam Preview Widget — single source of truth for videoRef/canvasRef */}
                {cameraEnabled && (
                  <div style={{ 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center"
                  }}>
                    <div style={{ 
                      position: "relative", 
                      width: "200px", 
                      height: "150px", 
                      borderRadius: "16px", 
                      overflow: "hidden", 
                      boxShadow: "0 12px 36px rgba(0,0,0,0.5)", 
                      border: `2px solid ${faceDisplay.color}`, 
                      background: "rgba(10,14,39,0.95)",
                      transition: "border-color 0.3s ease"
                    }}>
                      <video
                        ref={videoRef}
                        style={{ 
                          width: "200px", 
                          height: "150px", 
                          objectFit: "cover", 
                          display: "block", 
                          transform: "scaleX(-1)",
                          filter: phase === "prepare" ? "brightness(0.3) grayscale(0.5)" : "none",
                          transition: "filter 0.5s ease"
                        }}
                        muted
                        playsInline
                        autoPlay
                      />
                      <canvas
                        ref={canvasRef}
                        width={200}
                        height={150}
                        style={{ position: "absolute", inset: 0, width: "200px", height: "150px", transform: "scaleX(-1)", pointerEvents: "none" }}
                      />
                      {modelLoading && (
                        <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.75)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", color: "var(--text-muted)", flexDirection: "column", gap: "8px" }}>
                          <div className="spinner" style={{ width: "24px", height: "24px" }} />
                          <span>Loading AI...</span>
                        </div>
                      )}
                      {/* Status Dot */}
                      <div style={{ position: "absolute", top: "8px", left: "8px", width: "10px", height: "10px", borderRadius: "50%", background: faceDisplay.color, boxShadow: `0 0 8px ${faceDisplay.color}` }} />
                      
                      {/* Face Status text badge */}
                      <div style={{ 
                        position: "absolute", 
                        bottom: "8px", 
                        left: "50%", 
                        transform: "translateX(-50%)", 
                        background: "rgba(10, 14, 39, 0.85)", 
                        padding: "4px 10px", 
                        borderRadius: "12px", 
                        fontSize: "10px", 
                        fontWeight: 700, 
                        color: faceDisplay.color, 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "4px",
                        textTransform: "uppercase",
                        letterSpacing: "0.05em",
                        border: `1px solid ${faceDisplay.color}40`,
                        backdropFilter: "blur(4px)"
                      }}>
                        <span>{faceDisplay.icon}</span>
                        <span>{faceDisplay.label}</span>
                      </div>
                    </div>
                    
                    {/* Face count overlay if multiple */}
                    {faceCount > 1 && (
                      <div style={{ 
                        marginTop: "8px", 
                        fontSize: "12px", 
                        fontWeight: 600, 
                        color: "#f43f5e", 
                        background: "rgba(244,63,94,0.12)", 
                        padding: "4px 12px", 
                        borderRadius: "8px",
                        border: "1px solid rgba(244,63,94,0.25)"
                      }}>
                        ⚠️ {faceCount} faces detected
                      </div>
                    )}
                  </div>
                )}

                {/* ── Intro-only: Permissions card inside left panel ── */}
                {phase === "intro" && (
                  <div style={{ width: "100%", marginTop: "16px" }}>
                    <div style={{
                      padding: "16px",
                      borderRadius: "12px",
                      background: (cameraEnabled && micEnabled) ? "rgba(16,185,129,0.08)" : "rgba(76,127,237,0.08)",
                      border: (cameraEnabled && micEnabled) ? "1px solid rgba(16,185,129,0.3)" : "1px solid rgba(76,127,237,0.3)"
                    }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: (cameraEnabled && micEnabled) ? "rgba(16,185,129,0.15)" : "rgba(76,127,237,0.15)", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "16px", flexShrink: 0 }}>
                          {(cameraEnabled && micEnabled) ? "✅" : "📷"}
                        </div>
                        <div style={{ fontWeight: 700, fontSize: "13px" }}>
                          {(cameraEnabled && micEnabled) ? "Camera & Mic Ready" : "Setup Camera & Microphone"}
                        </div>
                      </div>

                      <p className="text-secondary" style={{ fontSize: "11px", lineHeight: 1.6, marginBottom: "10px" }}>
                        {(cameraEnabled && micEnabled)
                          ? "Both devices are active and ready."
                          : "Camera and microphone required for face tracking and audio evaluation."}
                      </p>

                      {/* Status indicators */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "5px", marginBottom: cameraEnabled && micEnabled ? 0 : "10px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px" }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: cameraEnabled ? "#10b981" : "var(--text-muted)", display: "inline-block", flexShrink: 0 }} />
                          <span style={{ color: cameraEnabled ? "#10b981" : "var(--text-secondary)" }}>Camera {cameraEnabled ? "active" : "not connected"}</span>
                        </div>
                        <div style={{ display: "flex", alignItems: "center", gap: "7px", fontSize: "11px" }}>
                          <span style={{ width: "7px", height: "7px", borderRadius: "50%", background: micEnabled ? "#10b981" : "var(--text-muted)", display: "inline-block", flexShrink: 0 }} />
                          <span style={{ color: micEnabled ? "#10b981" : "var(--text-secondary)" }}>Microphone {micEnabled ? "active" : "not connected"}</span>
                        </div>
                      </div>

                      {!(cameraEnabled && micEnabled) && (
                        <button
                          onClick={requestCameraAndMic}
                          className="btn btn-primary btn-sm"
                          style={{ fontSize: "12px", display: "flex", alignItems: "center", gap: "6px", width: "100%", justifyContent: "center" }}
                        >
                          🎤 Allow Device Permissions
                        </button>
                      )}
                      {permissionsError && (
                        <div style={{ color: "#f43f5e", fontSize: "11px", marginTop: "8px", fontWeight: 600 }}>
                          ⚠️ {permissionsError}
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Info and Controls for Prepare & Record phases */}
                {(phase === "prepare" || phase === "record") && parts[currentPart] && (
                  <div style={{ display: "flex", flexDirection: "column", gap: "16px", alignItems: "center", width: "100%", flex: 1, justifyContent: "center", marginTop: "16px" }}>
                    
                    {/* Title / Header */}
                    <div style={{ textAlign: "center" }}>
                      <div style={{ fontSize: "11px", color: phase === "record" ? "var(--brand-rose)" : "var(--brand-400)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em" }}>
                        {phase === "record" ? "Recording" : "Preparation"} — Part {currentPart + 1} of 5
                      </div>
                      <h3 style={{ fontSize: "16px", fontWeight: 800, margin: "4px 0 0 0", color: "var(--text-primary)" }}>
                        {parts[currentPart].title}
                      </h3>
                    </div>

                    {/* Timer Widget */}
                    {phase === "record" && (
                      <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
                        <div 
                          className={recordingTime >= parts[currentPart].speakingTime - 5 ? "animate-pulse-timer" : ""} 
                          style={{ 
                            fontSize: "36px", 
                            fontWeight: 900, 
                            fontFamily: "Outfit, sans-serif", 
                            lineHeight: 1.1,
                            color: recordingTime >= parts[currentPart].speakingTime - 5 ? "var(--brand-rose)" : "var(--text-primary)",
                            display: "inline-block"
                          }}
                        >
                          {Math.floor(recordingTime / 60).toString().padStart(2, "0")}:{(recordingTime % 60).toString().padStart(2, "0")}
                          <span style={{ fontSize: "12px", color: "var(--text-muted)", marginLeft: "4px", fontWeight: 500 }}>
                            / {parts[currentPart].speakingTime}s
                          </span>
                        </div>

                        {/* Warnings */}
                        {recordingTime >= parts[currentPart].speakingTime - 5 && (
                          <div style={{ 
                            marginTop: "8px", 
                            fontSize: "11px", 
                            fontWeight: 700, 
                            color: "#fda4af", 
                            background: "rgba(244, 63, 94, 0.15)", 
                            border: "1px solid rgba(244, 63, 94, 0.3)", 
                            padding: "4px 10px", 
                            borderRadius: "9999px",
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "4px",
                            boxShadow: "0 4px 12px rgba(244, 63, 94, 0.15)"
                          }}>
                            ⚠️ Auto-submit in {parts[currentPart].speakingTime - recordingTime}s
                          </div>
                        )}
                      </div>
                    )}

                    {/* Waveform Visualization */}
                    {phase === "record" && isRecording && (
                      <div className="waveform" style={{ justifyContent: "center", height: "24px", margin: "4px 0" }}>
                        {[...Array(9)].map((_, i) => (
                          <div key={i} className="waveform-bar" style={{ animationDelay: `${i * 0.1}s`, width: "3px", background: "var(--brand-rose)" }} />
                        ))}
                      </div>
                    )}

                    {/* Control Buttons */}
                    {phase === "record" && (
                      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "8px" }}>
                        {!isRecording ? (
                          <button id="record-btn" onClick={startRecording} className="record-btn record-btn-idle" title="Start Recording" style={{ width: "56px", height: "56px", fontSize: "24px" }}>🎤</button>
                        ) : (
                          <button id="stop-record-btn" onClick={() => { stopRecording(); handleNextPart(); }} className="record-btn record-btn-recording" title="Stop Recording" style={{ width: "56px", height: "56px", fontSize: "24px" }}>⏹️</button>
                        )}
                        <span style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 500 }}>
                          {isRecording ? "Click to stop & submit" : "Click to start recording"}
                        </span>
                      </div>
                    )}

                  </div>
                )}

                {/* Auto-submitting overlay */}
                {phase === "record" && isAutoSubmitting && (
                  <div style={{ 
                    position: "absolute", 
                    inset: 0, 
                    background: "rgba(10,14,39,0.95)", 
                    backdropFilter: "blur(12px)", 
                    display: "flex", 
                    flexDirection: "column", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    gap: "12px", 
                    zIndex: 10,
                    animation: "fadeIn 0.2s ease"
                  }}>
                    <div style={{ fontSize: "36px", animation: "bounce 1s infinite" }}>⏰</div>
                    <div style={{ fontSize: "20px", fontWeight: 900, color: "var(--brand-rose)", letterSpacing: "-0.02em" }}>Time's Up!</div>
                    <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>Auto-submitting response...</div>
                  </div>
                )}

              </div>

              {/* Right Column / Content Details */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", width: "100%" }}>
                
                {/* INTRO DETAILS */}
                {phase === "intro" && qSet && (
                  <div className="animate-fadeInUp" style={{ width: "100%" }}>
                    {/* Compact header */}
                    <div style={{ textAlign: "center", marginBottom: "20px" }}>
                      <h1 style={{ fontSize: "28px", fontWeight: 900, marginBottom: "6px" }}>
                        🎤 Speaking <span className="gradient-text">Assessment</span>
                      </h1>
                      <p className="text-secondary" style={{ fontSize: "13px" }}>
                        5 parts · Preparation time given before each part
                      </p>
                    </div>

                    {!browserSupported && (
                      <div className="alert alert-info" style={{ marginBottom: "16px", fontSize: "13px" }}>
                        🔔 Speech recognition may not be supported in your browser. You can type your response instead.
                      </div>
                    )}

                    {/* Assessment structure */}
                    <div className="glass-card" style={{ padding: "20px", marginBottom: "12px" }}>
                      <h3 style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-muted)", marginBottom: "14px" }}>
                        Assessment Structure
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {[
                          { icon: "💬", label: "Part 1", desc: "Introduction Topic", time: "60s" },
                          { icon: "❓", label: "Part 2 & 3", desc: "Follow-up Questions", time: "45s each" },
                          { icon: "🗣️", label: "Part 4", desc: "New Topic", time: "60s" },
                          { icon: "📖", label: "Part 5", desc: "Reading Paragraph", time: "60s" },
                        ].map((item) => (
                          <div key={item.label} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "8px 10px", background: "rgba(255,255,255,0.03)", borderRadius: "8px", border: "1px solid var(--border-subtle)" }}>
                            <span style={{ fontSize: "16px", flexShrink: 0 }}>{item.icon}</span>
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-primary)" }}>{item.label}: {item.desc}</div>
                            </div>
                            <span style={{ fontSize: "10px", fontWeight: 600, color: "var(--text-muted)", background: "rgba(255,255,255,0.05)", padding: "2px 7px", borderRadius: "9999px", flexShrink: 0 }}>{item.time}</span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Integrity notice */}
                    <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px solid var(--border-subtle)", display: "flex", alignItems: "flex-start", gap: "10px", marginBottom: "16px" }}>
                      <span style={{ fontSize: "16px", flexShrink: 0 }}>🛡️</span>
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", lineHeight: 1.6 }}>
                        Runs in <strong style={{ color: "var(--text-secondary)" }}>fullscreen</strong> with integrity monitoring. Tab switches, copy/paste, and suspicious behaviour will be logged.
                      </div>
                    </div>

                    {/* Start button */}
                    <button
                      id="start-speaking-btn"
                      onClick={startPreparation}
                      className="btn btn-primary"
                      style={{ width: "100%", padding: "14px", fontSize: "15px", opacity: (cameraEnabled && micEnabled) ? 1 : 0.5, cursor: (cameraEnabled && micEnabled) ? "pointer" : "not-allowed" }}
                      disabled={!(cameraEnabled && micEnabled)}
                    >
                      Start Assessment →
                    </button>
                    {!(cameraEnabled && micEnabled) && (
                      <p style={{ fontSize: "11px", color: "var(--text-muted)", textAlign: "center", marginTop: "6px" }}>
                        Allow camera & microphone in the left panel to begin
                      </p>
                    )}
                  </div>
                )}

                {/* PREPARATION & RECORDING PROMPT AREA */}
                {(phase === "prepare" || phase === "record") && parts[currentPart] && (
                  <>
                    {phase === "prepare" && (
                      <div className="animate-fadeIn" style={{ 
                        background: "rgba(76, 127, 237, 0.12)", 
                        border: "2px solid rgba(76, 127, 237, 0.4)", 
                        borderRadius: "12px", 
                        padding: "20px", 
                        marginBottom: "16px", 
                        display: "flex", 
                        alignItems: "center", 
                        gap: "16px",
                        boxShadow: "0 0 20px rgba(76, 127, 237, 0.15)"
                      }}>
                        <div style={{ fontSize: "36px", animation: "pulse 2s infinite" }}>⏳</div>
                        <div style={{ flex: 1 }}>
                          <div style={{ fontSize: "18px", fontWeight: 900, color: "var(--brand-primary)", marginBottom: "4px", letterSpacing: "0.02em" }}>
                            PREPARATION TIME — DO NOT SPEAK YET
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.5 }}>
                            Read the question carefully and mentally prepare your answer. The microphone is currently <strong>OFF</strong>. You will be notified when recording begins.
                          </div>
                        </div>
                        
                        {/* Countdown Timer built into the banner */}
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", background: "rgba(76, 127, 237, 0.1)", padding: "12px 20px", borderRadius: "8px", border: "1px solid rgba(76, 127, 237, 0.2)" }}>
                          <span style={{ fontSize: "11px", fontWeight: 700, color: "var(--brand-primary)", textTransform: "uppercase", letterSpacing: "0.05em", marginBottom: "4px" }}>Starts In</span>
                          <span style={{ fontSize: "36px", fontWeight: 900, fontFamily: "Outfit, sans-serif", color: "var(--brand-primary)", lineHeight: 1 }}>{prepCountdown}s</span>
                        </div>
                      </div>
                    )}

                    <div className="glass-card" style={{ padding: "28px", minHeight: "220px", display: "flex", flexDirection: "column", gap: "16px", transition: "all 0.3s ease" }}>
                      <h4 style={{ fontSize: "11px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", margin: 0 }}>
                        Question / Prompt
                      </h4>
                      <div style={{ 
                        fontSize: phase === "prepare" ? "22px" : "17px", 
                        fontWeight: phase === "prepare" ? 600 : 400,
                        lineHeight: phase === "prepare" ? "1.5" : "1.7", 
                        color: phase === "prepare" ? "#ffffff" : "var(--text-primary)", 
                        whiteSpace: "pre-wrap", 
                        flex: 1,
                        transition: "all 0.3s ease"
                      }}>
                        {parts[currentPart].prompt}
                      </div>
                    </div>

                    {/* Live Transcription Box (Record phase only) */}
                    {phase === "record" && currentTranscription && (
                      <div className="glass-card animate-fadeIn" style={{ padding: "20px", minHeight: "100px", borderLeft: "3px solid var(--brand-primary)" }}>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", textTransform: "uppercase", letterSpacing: "0.08em", fontWeight: 700, marginBottom: "8px" }}>
                          Live Transcription
                        </div>
                        <p style={{ fontSize: "14px", color: "var(--text-secondary)", lineHeight: "1.6", margin: 0 }}>
                          {currentTranscription}
                        </p>
                      </div>
                    )}
                  </>
                )}

            </div>
          </div>
        </>)}

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
