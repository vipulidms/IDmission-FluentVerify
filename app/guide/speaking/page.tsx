"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";

export default function SpeakingGuidePage() {
  const [micActive, setMicActive] = useState(false);
  const [volume, setVolume] = useState(0);
  const [statusText, setStatusText] = useState("Click 'Start Test' and speak into your microphone.");
  const [statusColor, setStatusColor] = useState("var(--text-muted)");

  const audioContextRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const animationRef = useRef<number | null>(null);

  // Stop the microphone test
  const stopTest = () => {
    if (animationRef.current) {
      cancelAnimationFrame(animationRef.current);
      animationRef.current = null;
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    setMicActive(false);
    setVolume(0);
    setStatusText("Test stopped.");
    setStatusColor("var(--text-muted)");
  };

  // Start the microphone test
  const startTest = async () => {
    try {
      stopTest(); // Reset first
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;

      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      const audioContext = new AudioContextClass();
      audioContextRef.current = audioContext;

      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 256;
      analyserRef.current = analyser;

      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);

      setMicActive(true);
      setStatusText("Listening... Speak out loud!");
      setStatusColor("var(--brand-primary)");

      const bufferLength = analyser.frequencyBinCount;
      const dataArray = new Uint8Array(bufferLength);

      const updateVolume = () => {
        if (!analyserRef.current) return;
        analyserRef.current.getByteTimeDomainData(dataArray);

        // Calculate Root Mean Square (RMS) amplitude
        let sum = 0;
        for (let i = 0; i < bufferLength; i++) {
          const val = (dataArray[i] - 128) / 128;
          sum += val * val;
        }
        const rms = Math.sqrt(sum / bufferLength);

        // Map RMS to volume scale 0-100 (amplify for standard mics)
        const volPercent = Math.min(100, Math.round(rms * 500));
        setVolume(volPercent);

        // Dynamically guide the user based on volume level
        if (volPercent < 4) {
          setStatusText("Silent — Say something!");
          setStatusColor("var(--text-muted)");
        } else if (volPercent < 22) {
          setStatusText("Whispering — Speak louder and clearer!");
          setStatusColor("#f59e0b"); // Warning amber
        } else if (volPercent < 75) {
          setStatusText("Optimal Volume — Great clarity!");
          setStatusColor("#10b981"); // Success green
        } else {
          setStatusText("Too Loud — Move slightly away from the microphone.");
          setStatusColor("#f43f5e"); // Danger rose
        }

        animationRef.current = requestAnimationFrame(updateVolume);
      };

      updateVolume();
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setStatusText("Microphone permission denied or not found.");
      setStatusColor("#f43f5e");
    }
  };

  useEffect(() => {
    return () => {
      // Clean up audio on unmount
      if (animationRef.current) cancelAnimationFrame(animationRef.current);
      if (streamRef.current) streamRef.current.getTracks().forEach((track) => track.stop());
      if (audioContextRef.current) audioContextRef.current.close();
    };
  }, []);

  return (
    <div className="page-wrapper">
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.12 }} />
        <div className="hero-orb hero-orb-2" style={{ opacity: 0.08, animationDelay: "-3s" }} />
      </div>

      <div className="container" style={{ paddingBottom: "100px", paddingTop: "40px" }}>
        {/* Back Link */}
        <div className="breadcrumb" style={{ marginBottom: "24px" }}>
          <Link href="/assessment" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "var(--text-muted)" }}>
            ← Back to Assessment Hub
          </Link>
        </div>

        {/* Header Section */}
        <div className="page-header" style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="hero-badge" style={{ display: "inline-flex", marginBottom: "16px" }}>
            🎤 Candidate Preparation Guide
          </div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", fontWeight: 900, marginBottom: "16px" }}>
            Speaking Assessment <span className="gradient-text">Guide</span>
          </h1>
          <p className="page-subtitle" style={{ margin: "0 auto", maxWidth: "600px" }}>
            Learn about the speaking assessment structure, rules, and how to verify your microphone is configured for clear, loud audio.
          </p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "32px", alignItems: "start" }}>
          {/* Left Column: Guidelines & Rules */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>

            {/* Critical Voice Constraint Card */}
            <div className="glass-card" style={{ padding: "32px", borderLeft: "4px solid #10b981", background: "linear-gradient(135deg, rgba(16,185,129,0.05) 0%, rgba(20,30,40,0.4) 100%)" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "16px", marginBottom: "16px" }}>
                <div style={{ fontSize: "32px" }}>📣</div>
                <div>
                  <h3 style={{ fontSize: "20px", fontWeight: 800, color: "#10b981" }}>CRITICAL REQUIREMENT: Speak Loudly & Clearly</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginTop: "4px" }}>Our AI evaluation relies on clear voice transcriptions to grade your pronunciation and grammar.</p>
                </div>
              </div>
              <ul style={{ fontSize: "14px", color: "var(--text-secondary)", listStyleType: "none", display: "flex", flexDirection: "column", gap: "10px", padding: 0 }}>
                <li style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#10b981" }}>✓</span>
                  <span><strong>Project Your Voice:</strong> Speak at a normal conversational volume, as if addressing someone in a large room. Do not whisper.</span>
                </li>
                <li style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#10b981" }}>✓</span>
                  <span><strong>Enunciate Clearly:</strong> Pronounce words carefully. Speaking too quickly can blur words together and lower your fluency rating.</span>
                </li>
                <li style={{ display: "flex", gap: "8px", alignItems: "flex-start" }}>
                  <span style={{ color: "#10b981" }}>✓</span>
                  <span><strong>Quiet Environment:</strong> Make sure you are in a silent room. Background conversations, fans, or television noise will confuse the transcriber.</span>
                </li>
              </ul>
            </div>

            {/* Test Structure Timeline */}
            <div className="glass-card" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "20px" }}>⏱️ Assessment Structure</h3>
              <p className="text-secondary" style={{ fontSize: "14px", marginBottom: "24px" }}>
                The speaking assessment takes approximately 10 minutes and consists of 5 parts. You will be given 15 seconds to prepare before recording each response.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative" }}>
                {/* Timeline connector line */}
                <div style={{ position: "absolute", left: "19px", top: "10px", bottom: "10px", width: "2px", background: "var(--border-subtle)", zIndex: 0 }} />

                {[
                  { part: "Part 1", title: "Topic Introduction", desc: "Introduce a given topic (e.g. your hobbies or daily routine).", prep: "15s prep", speak: "60s recording" },
                  { part: "Part 2", title: "Follow-up Question 1", desc: "Elaborate further on a specific detail relating to the first topic.", prep: "15s prep", speak: "45s recording" },
                  { part: "Part 3", title: "Follow-up Question 2", desc: "Answer another question about the same topic to test coherence.", prep: "15s prep", speak: "45s recording" },
                  { part: "Part 4", title: "New Topic", desc: "Discuss a new, slightly more complex question to test range.", prep: "15s prep", speak: "60s recording" },
                  { part: "Part 5", title: "Reading Paragraph Aloud", desc: "Read a short paragraph displayed on screen to evaluate pronunciation.", prep: "15s prep", speak: "60s recording" },
                ].map((item, index) => (
                  <div key={index} style={{ display: "flex", gap: "16px", position: "relative", zIndex: 1 }}>
                    {/* Circle Node */}
                    <div style={{
                      width: "40px", height: "40px", borderRadius: "50%",
                      background: "var(--bg-primary)", border: "2px solid var(--brand-primary)",
                      display: "flex", alignItems: "center", justifyContent: "center",
                      fontSize: "12px", fontWeight: 800, color: "var(--text-brand)", flexShrink: 0
                    }}>
                      {index + 1}
                    </div>
                    {/* Details */}
                    <div style={{ flex: 1, paddingTop: "2px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "8px", marginBottom: "4px" }}>
                        <h4 style={{ fontSize: "15px", fontWeight: 700, color: "var(--text-primary)" }}>{item.part}: {item.title}</h4>
                        <div style={{ display: "flex", gap: "6px", fontSize: "11px", fontWeight: 600 }}>
                          <span style={{ padding: "2px 8px", background: "rgba(255,255,255,0.04)", borderRadius: "10px", color: "var(--text-muted)" }}>{item.prep}</span>
                          <span style={{ padding: "2px 8px", background: "rgba(99,102,241,0.1)", borderRadius: "10px", color: "var(--text-brand)" }}>{item.speak}</span>
                        </div>
                      </div>
                      <p className="text-secondary" style={{ fontSize: "13px", lineHeight: "1.5" }}>{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Integrity Rules */}
            <div className="glass-card" style={{ padding: "32px", borderLeft: "4px solid #f43f5e" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 800, color: "var(--brand-rose)", marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                🛡️ Integrity & Fair Play Rules
              </h3>
              <p className="text-secondary" style={{ fontSize: "14px", lineHeight: "1.6", marginBottom: "20px" }}>
                To maintain credibility, the platform monitors candidates using automatic webcam and activity detection. The following events trigger warnings and flag your score:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                <div style={{ padding: "16px", background: "rgba(244,63,94,0.03)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: "12px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>🖥️</span> Fullscreen Lock
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    You must remain in fullscreen mode. Minimizing the browser or switching tabs will pause the test and record a violation.
                  </div>
                </div>

                <div style={{ padding: "16px", background: "rgba(244,63,94,0.03)", border: "1px solid rgba(244,63,94,0.15)", borderRadius: "12px" }}>
                  <div style={{ fontWeight: 700, fontSize: "13px", marginBottom: "6px", display: "flex", alignItems: "center", gap: "6px" }}>
                    <span>📷</span> Webcam Monitoring
                  </div>
                  <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: 1.5 }}>
                    Your webcam must be active. Looking away from the screen for too long, having no face, or having multiple faces in frame logs violations.
                  </div>
                </div>
              </div>
            </div>

          </div>

          {/* Right Column: Audio Tester Widget */}
          <div style={{ position: "sticky", top: "40px" }}>
            <div className="glass-card" style={{ padding: "32px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center" }}>
              <div style={{
                width: "64px", height: "64px", borderRadius: "50%",
                background: micActive ? "rgba(16,185,129,0.15)" : "rgba(99,102,241,0.1)",
                display: "flex", alignItems: "center", justifyContent: "center",
                fontSize: "28px", color: micActive ? "#10b981" : "var(--brand-primary)",
                marginBottom: "20px", transition: "all 0.3s ease",
                boxShadow: micActive ? "0 0 20px rgba(16,185,129,0.2)" : "none"
              }}>
                🎤
              </div>

              <h3 style={{ fontSize: "18px", fontWeight: 800, marginBottom: "8px" }}>Live Volume Tester</h3>
              <p className="text-secondary" style={{ fontSize: "13px", marginBottom: "24px" }}>
                Grant microphone permissions and speak aloud to ensure your audio levels are set up for optimal grading.
              </p>

              {/* Volume Status and Indicator Text */}
              <div style={{
                width: "100%", padding: "16px", borderRadius: "12px",
                background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)",
                marginBottom: "20px"
              }}>
                <div style={{ fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.05em", color: "var(--text-muted)", marginBottom: "8px" }}>
                  Status
                </div>
                <div style={{ fontSize: "14px", fontWeight: 700, color: statusColor, transition: "color 0.2s ease" }}>
                  {statusText}
                </div>
              </div>

              {/* Dynamic Waveform Visualizer */}
              <div style={{
                width: "100%", height: "40px", background: "rgba(0,0,0,0.15)",
                borderRadius: "8px", display: "flex", alignItems: "center",
                padding: "0 16px", gap: "4px", marginBottom: "28px",
                border: "1px solid var(--border-subtle)", overflow: "hidden"
              }}>
                {[...Array(24)].map((_, i) => {
                  // Simulate dynamic bar heights based on volume level
                  const multiplier = micActive ? (Math.sin(i * 0.4) * 0.4 + 0.6) : 0.08;
                  const activeHeight = Math.max(4, volume * multiplier * 0.8);
                  return (
                    <div
                      key={i}
                      style={{
                        flex: 1,
                        height: `${activeHeight}%`,
                        background: volume >= 75 ? "var(--brand-rose)" : volume >= 22 ? "var(--brand-green)" : "var(--brand-primary)",
                        opacity: micActive ? 0.9 : 0.25,
                        borderRadius: "2px",
                        transition: "height 0.08s ease, background-color 0.2s ease"
                      }}
                    />
                  );
                })}
              </div>

              {/* Trigger Buttons */}
              <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "12px" }}>
                {!micActive ? (
                  <button onClick={startTest} className="btn btn-primary" style={{ width: "100%", padding: "14px" }}>
                    Start Volume Test
                  </button>
                ) : (
                  <button onClick={stopTest} className="btn btn-ghost" style={{ width: "100%", padding: "14px", borderColor: "rgba(244,63,94,0.4)", color: "var(--brand-rose)" }}>
                    Stop Test
                  </button>
                )}

                <Link href="/assessment/speaking" className="btn btn-outline" style={{ width: "100%", padding: "14px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  Continue to Speaking Test →
                </Link>
              </div>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
