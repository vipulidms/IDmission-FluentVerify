"use client";
import { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { useSession } from "next-auth/react";
import Flag from "@/components/Flag";

type Language = "english" | "german";
type Skill = "speaking" | "writing" | "listening" | "reading";

const skills = [
  { id: "speaking" as Skill, icon: "🎤", label: "Speaking", desc: "Record a spoken response to a prompt", color: "#6366f1", time: "15–20 min", disabled: false },
  { id: "writing" as Skill, icon: "✍️", label: "Writing", desc: "Write a response to a topic prompt", color: "#10b981", time: "10–15 min", disabled: true },
  { id: "listening" as Skill, icon: "👂", label: "Listening", desc: "Listen and answer comprehension questions", color: "#f59e0b", time: "5–10 min", disabled: true },
  { id: "reading" as Skill, icon: "📖", label: "Reading", desc: "Read a passage and answer questions", color: "#f43f5e", time: "10–15 min", disabled: true },
];

function AssessmentHubContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const [selectedLanguage, setSelectedLanguage] = useState<Language>("english");
  const [selectedSkill, setSelectedSkill] = useState<Skill | null>(null);
  const [attemptsStatus, setAttemptsStatus] = useState<{ allowedAttempts: number; completedAttempts: number; hasExhaustedAttempts: boolean } | null>(null);

  const userLanguage = (session?.user as any)?.assessmentLanguage as Language | undefined;
  const isAdmin = (session?.user as any)?.role === "admin";

  useEffect(() => {
    const langParam = searchParams.get("lang") as Language | null;
    const skillParam = searchParams.get("skill") as Skill | null;
    
    if (userLanguage && !isAdmin) {
      setSelectedLanguage(userLanguage);
    } else if (langParam && (langParam === "english" || langParam === "german")) {
      setSelectedLanguage(langParam);
    }

    if (skillParam && skills.find((s) => s.id === skillParam)) {
      setSelectedSkill(skillParam);
    }
  }, [searchParams, userLanguage, isAdmin]);

  useEffect(() => {
    fetch("/api/assess/status")
      .then((res) => res.json())
      .then((data) => {
        if (!data.error) {
          setAttemptsStatus({
            allowedAttempts: data.allowedAttempts,
            completedAttempts: data.completedAttempts,
            hasExhaustedAttempts: data.hasExhaustedAttempts,
          });
        }
      })
      .catch((err) => console.error("Error fetching attempts status:", err));
  }, []);

  const handleStart = () => {
    if (!selectedSkill) return;
    router.push(`/assessment/${selectedSkill}?lang=${selectedLanguage}`);
  };

  const showLanguageSelection = !userLanguage || isAdmin;
  let stepIndex = 1;

  return (
    <div className="page-wrapper">
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, background: "var(--gradient-hero)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.15 }} />
        <div className="hero-orb hero-orb-2" style={{ opacity: 0.15 }} />
      </div>

      <div className="container">
        {/* Breadcrumb */}
        <div className="breadcrumb" style={{ paddingTop: "32px" }}>
          <span>Assessment</span>
        </div>

        {/* Header */}
        <div className="page-header" style={{ textAlign: "left", paddingTop: "20px" }}>
          <div className="hero-badge" style={{ display: "inline-flex", marginBottom: "16px" }}>
            🎯 Language Assessment
          </div>
          <h1 className="page-title">
            Choose Your{" "}
            <span className="gradient-text">Assessment</span>
          </h1>
          <p className="page-subtitle" style={{ textAlign: "left", maxWidth: "500px", margin: 0 }}>
            Select your language and skill, then start your AI-powered assessment.
          </p>
        </div>

        {attemptsStatus?.hasExhaustedAttempts ? (
          <div className="glass-card animate-scaleIn" style={{ padding: "48px 40px", textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: "24px", maxWidth: "600px", margin: "40px auto 80px auto" }}>
            <div style={{
              width: "80px", height: "80px", borderRadius: "50%",
              background: "rgba(244, 63, 94, 0.12)", border: "2px solid var(--brand-rose)",
              display: "flex", alignItems: "center", justifyContent: "center",
              fontSize: "36px", color: "var(--brand-rose)", boxShadow: "0 0 20px rgba(244, 63, 94, 0.2)"
            }}>
              ⚠️
            </div>
            <div>
              <h1 style={{ fontSize: "24px", fontWeight: 900, marginBottom: "12px", fontFamily: "'Outfit', sans-serif" }}>
                Assessment Limit Exhausted
              </h1>
              <p className="text-secondary" style={{ fontSize: "15px", lineHeight: "1.6" }}>
                You have completed your allowed assessment attempts ({attemptsStatus.completedAttempts} of {attemptsStatus.allowedAttempts} completed). Your responses are submitted for review. Please contact your administrator if you need to take additional tests.
              </p>
            </div>
            <Link href="/dashboard" className="btn btn-primary" style={{ padding: "14px 32px", fontSize: "15px", fontWeight: 600, width: "100%", textAlign: "center", display: "inline-block" }}>
              Go to Dashboard
            </Link>
          </div>
        ) : (
          <div style={{ paddingBottom: "80px" }}>
            {/* Step 1: Language */}
            {showLanguageSelection ? (
              <div style={{ marginBottom: "48px" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                  <div style={{
                    width: "32px", height: "32px", borderRadius: "50%",
                    background: "var(--gradient-brand)", display: "flex",
                    alignItems: "center", justifyContent: "center",
                    fontSize: "14px", fontWeight: 800, color: "white", flexShrink: 0,
                  }}>{stepIndex++}</div>
                  <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Select Language</h2>
                </div>

                <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
                  {(["english", "german"] as Language[]).map((lang) => (
                    <button
                      key={lang}
                      id={`lang-${lang}`}
                      onClick={() => setSelectedLanguage(lang)}
                      style={{
                        display: "flex", alignItems: "center", gap: "16px",
                        padding: "20px 28px",
                        borderRadius: "var(--radius-lg)",
                        border: selectedLanguage === lang
                          ? "2px solid var(--brand-primary)"
                          : "1px solid var(--border-subtle)",
                        background: selectedLanguage === lang
                          ? "rgba(99, 102, 241, 0.1)"
                          : "var(--bg-card)",
                        cursor: "pointer",
                        transition: "all 0.2s ease",
                        boxShadow: selectedLanguage === lang ? "var(--shadow-glow)" : "none",
                      }}
                    >
                      <span style={{ fontSize: "40px", lineHeight: 1 }}>{lang === "english" ? <Flag country="gb" size={40} /> : <Flag country="de" size={40} />}</span>
                      <div style={{ textAlign: "left" }}>
                        <div style={{ fontWeight: 700, fontSize: "18px", color: selectedLanguage === lang ? "var(--text-brand)" : "var(--text-primary)" }}>
                          {lang === "english" ? "English" : "Deutsch"}
                        </div>
                        <div className="text-secondary" style={{ fontSize: "13px" }}>
                          {lang === "english" ? "British/American English" : "Standarddeutsch"}
                        </div>
                      </div>
                      {selectedLanguage === lang && (
                        <span style={{ marginLeft: "8px", color: "var(--brand-primary)", fontSize: "20px" }}>✓</span>
                      )}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div style={{ marginBottom: "40px", padding: "24px 32px", borderRadius: "var(--radius-xl)", background: "rgba(99,102,241,0.05)", border: "1px solid rgba(99,102,241,0.15)", display: "flex", alignItems: "center", gap: "20px", backdropFilter: "blur(8px)" }}>
                <div style={{ fontSize: "40px", lineHeight: 1 }}>
                  {selectedLanguage === "english" ? <Flag country="gb" size={40} /> : <Flag country="de" size={40} />}
                </div>
                <div>
                  <div style={{ fontSize: "12px", fontWeight: 700, color: "var(--text-brand)", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: "4px" }}>
                    Assigned Assessment Language
                  </div>
                  <div style={{ fontSize: "18px", fontWeight: 800, color: "var(--text-primary)" }}>
                    {selectedLanguage === "english" ? "English 🇬🇧" : "German (Deutsch) 🇩🇪"}
                  </div>
                  <div style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: "2px" }}>
                    Your candidate profile is configured for {selectedLanguage === "english" ? "English" : "German"} language assessments.
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Skill */}
            <div style={{ marginBottom: "48px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: "var(--gradient-brand)", display: "flex",
                  alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 800, color: "white", flexShrink: 0,
                }}>{stepIndex++}</div>
                <h2 style={{ fontSize: "22px", fontWeight: 700 }}>Select Skill to Assess</h2>
              </div>

              <div className="skill-grid">
                {skills.map((skill) => (
                  <button
                    key={skill.id}
                    id={`skill-${skill.id}`}
                    onClick={() => !skill.disabled && setSelectedSkill(skill.id)}
                    disabled={skill.disabled}
                    style={{
                      padding: "28px",
                      borderRadius: "var(--radius-xl)",
                      border: selectedSkill === skill.id
                        ? `2px solid ${skill.color}`
                        : "1px solid var(--border-subtle)",
                      background: selectedSkill === skill.id
                        ? `rgba(${skill.color === "#6366f1" ? "99,102,241" : skill.color === "#10b981" ? "16,185,129" : skill.color === "#f59e0b" ? "245,158,11" : "244,63,94"}, 0.1)`
                        : "var(--bg-card)",
                      cursor: skill.disabled ? "not-allowed" : "pointer",
                      transition: "all 0.2s ease",
                      textAlign: "left",
                      boxShadow: selectedSkill === skill.id ? `0 0 30px ${skill.color}30` : "none",
                      opacity: skill.disabled ? 0.6 : 1,
                      position: "relative",
                    }}
                  >
                    <div style={{ fontSize: "36px", marginBottom: "14px" }}>{skill.icon}</div>
                    <div style={{
                      fontSize: "20px", fontWeight: 700, marginBottom: "8px",
                      color: selectedSkill === skill.id ? skill.color : "var(--text-primary)",
                    }}>
                      {skill.label}
                      {skill.disabled && <span style={{ fontSize: "12px", background: "rgba(0,0,0,0.1)", padding: "4px 8px", borderRadius: "12px", marginLeft: "12px", color: "var(--text-muted)" }}>Coming Soon</span>}
                    </div>
                    <div className="text-secondary" style={{ fontSize: "13px", lineHeight: "1.6" }}>{skill.desc}</div>
                    <div style={{ marginTop: "14px", fontSize: "12px", color: skill.disabled ? "var(--text-muted)" : skill.color, fontWeight: 600 }}>
                      ⏱ {skill.time}
                    </div>
                  </button>
                ))}
              </div>
            </div>

            {/* Step 3: Start */}
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
                <div style={{
                  width: "32px", height: "32px", borderRadius: "50%",
                  background: selectedSkill ? "var(--gradient-brand)" : "var(--bg-glass-strong)",
                  display: "flex", alignItems: "center", justifyContent: "center",
                  fontSize: "14px", fontWeight: 800, color: "white", flexShrink: 0,
                  transition: "all 0.3s ease",
                }}>{stepIndex++}</div>
                <h2 style={{ fontSize: "22px", fontWeight: 700, color: selectedSkill ? "var(--text-primary)" : "var(--text-muted)" }}>
                  Begin Assessment
                </h2>
              </div>

              {selectedSkill ? (
                <div className="glass-card" style={{ padding: "32px", background: "linear-gradient(135deg, rgba(99,102,241,0.08), rgba(139,92,246,0.05))" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "20px", flexWrap: "wrap" }}>
                    <div style={{ flex: 1 }}>
                      <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "8px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          Ready for your {selectedLanguage === "english" ? <><Flag country="gb" size={24} /> English</> : <><Flag country="de" size={24} /> German</>}
                          {" "}
                          {skills.find((s) => s.id === selectedSkill)?.icon}
                          {" "}
                          {skills.find((s) => s.id === selectedSkill)?.label} Assessment?
                        </div>
                      </h3>
                      <p className="text-secondary" style={{ fontSize: "14px" }}>
                        You will receive an instant CEFR score with detailed AI feedback after completing the assessment.
                      </p>
                      {selectedSkill === "speaking" && (
                        <div style={{ marginTop: "12px" }}>
                          <Link href="/guide/speaking" target="_blank" style={{ fontSize: "13px", color: "var(--text-brand)", fontWeight: 600, textDecoration: "underline" }}>
                            📖 Read Speaking Guide & Test Mic Volume ↗
                          </Link>
                        </div>
                      )}
                    </div>
                    <button
                      id="start-assessment-btn"
                      onClick={handleStart}
                      className="btn btn-primary btn-lg"
                      style={{ flexShrink: 0 }}
                    >
                      Start Now →
                    </button>
                  </div>
                </div>
              ) : (
                <div style={{ padding: "24px", borderRadius: "var(--radius-lg)", background: "var(--bg-card)", border: "1px dashed var(--border-subtle)" }}>
                  <p className="text-muted" style={{ fontSize: "14px", textAlign: "center" }}>
                    Select a skill above to continue
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

export default function AssessmentPage() {
  return (
    <Suspense fallback={<div className="page-wrapper" />}>
      <AssessmentHubContent />
    </Suspense>
  );
}
