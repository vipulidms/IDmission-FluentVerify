"use client";
import { useState, useEffect, useMemo } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCw } from "lucide-react";
import Flag from "@/components/Flag";
import {
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

interface AssessmentResult {
  cefr_level: string;
  overall_score: number;
  sub_scores: {
    grammar?: number | null;
    vocabulary?: number | null;
    fluency?: number | null;
    coherence?: number | null;
    comprehension?: number | null;
    pronunciation?: number | null;
    task_achievement?: number | null;
    inference?: number | null;
    detail_recognition?: number | null;
  };
  strengths: string[];
  improvements: string[];
  detailed_feedback: string;
}

interface Props {
  result: AssessmentResult;
  language: string;
  skill: string;
  prompt: string;
  onRetry: () => void;
  isHistoryView?: boolean;
  onClose?: () => void;
  integrityRiskLevel?: "low" | "medium" | "high";
  integrityReport?: string | null;
}

const cefrColors: Record<string, string> = {
  A1: "#10b981", A2: "#10b981", B1: "#6366f1", B2: "#6366f1", C1: "#f59e0b", C2: "#f59e0b",
};

const cefrLabels: Record<string, string> = {
  A1: "Beginner", A2: "Elementary", B1: "Intermediate",
  B2: "Upper-Intermediate", C1: "Advanced", C2: "Mastery",
};

const cefrDescriptions: Record<string, string> = {
  A1: "You can understand and use basic expressions. You can introduce yourself and ask simple questions.",
  A2: "You can communicate in simple, routine tasks. You understand frequently used expressions.",
  B1: "You can handle most situations likely to arise while travelling. You can produce simple connected text.",
  B2: "You can understand main ideas of complex text. You can interact with native speakers with fluency.",
  C1: "You can express ideas fluently and spontaneously without much searching. You have flexible command of language.",
  C2: "You can understand virtually everything heard or read. You can express yourself spontaneously, very fluently and precisely.",
};

function CircularScore({ score, color }: { score: number; color: string }) {
  const radius = 70;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (score / 100) * circumference;

  return (
    <div className="score-ring" style={{ width: "180px", height: "180px" }}>
      <svg width="180" height="180" viewBox="0 0 180 180">
        {/* Background ring */}
        <circle cx="90" cy="90" r={radius} fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="12" />
        {/* Score ring */}
        <circle
          cx="90" cy="90" r={radius}
          fill="none"
          stroke={color}
          strokeWidth="12"
          strokeDasharray={circumference}
          strokeDashoffset={strokeDashoffset}
          strokeLinecap="round"
          style={{ transition: "stroke-dashoffset 1.5s ease", filter: `drop-shadow(0 0 8px ${color}60)` }}
        />
      </svg>
      <div className="score-ring-text">
        <div style={{
          fontSize: "42px", fontWeight: 900, fontFamily: "Outfit, sans-serif",
          color: "var(--text-primary)",
        }}>
          {score}
        </div>
        <div style={{ fontSize: "13px", color: "var(--text-muted)", fontWeight: 600 }}>/ 100</div>
      </div>
    </div>
  );
}

export default function ResultsPanel({ result, language, skill, prompt, onRetry, isHistoryView, onClose, integrityRiskLevel, integrityReport }: Props) {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Safe checks & default values to prevent blank page crashes
  const safeResult = result || {};
  const cefrLevel = safeResult.cefr_level || "B1";
  const overallScore = typeof safeResult.overall_score === "number" ? safeResult.overall_score : 60;
  const detailedFeedback = safeResult.detailed_feedback || "Assessment complete. Keep practicing to improve your skills!";
  const integrityRisk = integrityRiskLevel || "low";

  const color = cefrColors[cefrLevel] || "#6366f1";
  const skillLabel = skill ? skill.charAt(0).toUpperCase() + skill.slice(1) : "Assessment";
  const langLabel = language === "english" ? <><Flag country="gb" size={16} /> English</> : <><Flag country="de" size={16} /> German</>;
  const isVerified = integrityRisk === "low" && !isHistoryView;

  // Safe parsing helper for strengths / improvements lists
  const parseList = (val: any): string[] => {
    if (!val) return [];
    if (Array.isArray(val)) {
      return val.map(item => String(item));
    }
    if (typeof val === "string") {
      const trimmed = val.trim();
      if (trimmed.startsWith("[") && trimmed.endsWith("]")) {
        try {
          const parsed = JSON.parse(trimmed);
          if (Array.isArray(parsed)) {
            return parsed.map(item => String(item));
          }
        } catch (e) {
          // ignore parsing error and treat as plain string
        }
      }
      if (trimmed.includes("\n")) {
        return trimmed.split("\n").map(s => s.replace(/^[•\-\*\d\.\s]+/, "").trim()).filter(Boolean);
      }
      return [trimmed];
    }
    return [];
  };

  const strengths = parseList(safeResult.strengths);
  const improvements = parseList(safeResult.improvements);

  // Parse integrity report safely
  const reportObj = useMemo(() => {
    if (!integrityReport) return null;
    try {
      const parsed = typeof integrityReport === "string" ? JSON.parse(integrityReport) : integrityReport;
      if (parsed && typeof parsed === "object") {
        return {
          violations: Array.isArray(parsed.violations) ? parsed.violations : [],
          violationCount: typeof parsed.violationCount === "number" ? parsed.violationCount : 0,
          riskLevel: parsed.riskLevel || "low",
          flagged: !!parsed.flagged,
        };
      }
    } catch (e) {
      console.error("Failed to parse integrity report", e);
    }
    return null;
  }, [integrityReport]);

  // Build radar chart data from sub_scores safely
  const subScores = safeResult.sub_scores || {};
  const subScoreData = Object.entries(subScores)
    .filter(([, v]) => v != null)
    .map(([key, value]) => ({
      subject: key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " "),
      score: typeof value === "number" ? value : 0,
      fullMark: 100,
    }));

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div style={{
          position: "absolute", inset: 0,
          background: `radial-gradient(ellipse at 60% 20%, ${color}15 0%, transparent 60%)`,
        }} />
      </div>

      <div className="container" style={{ paddingBottom: "80px", paddingTop: "40px" }}>
        {/* Breadcrumb */}
        <div className="breadcrumb">
          {isHistoryView ? (
            <>
              <button onClick={onClose} style={{ cursor: "pointer", background: "none", border: "none", color: "inherit", padding: 0, font: "inherit" }}>Dashboard</button>
              <span className="breadcrumb-sep">›</span>
              <span>Assessment Details</span>
            </>
          ) : (
            <>
              <Link href="/assessment">Assessment</Link>
              <span className="breadcrumb-sep">›</span>
              <span>{skillLabel} Results</span>
            </>
          )}
        </div>

        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div className="hero-badge" style={{ display: "inline-flex", borderColor: `${color}60`, background: `${color}15`, color }}>
            {isHistoryView ? "📖 Assessment Details" : "✨ Assessment Complete"}
          </div>
          {isVerified && (
            <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", marginLeft: "10px", padding: "5px 14px", background: "rgba(16,185,129,0.12)", border: "1px solid rgba(16,185,129,0.3)", borderRadius: "9999px", fontSize: "12px", fontWeight: 700, color: "#10b981", letterSpacing: "0.05em", verticalAlign: "middle" }}>
              ✅ Verified
            </div>
          )}
          <h1 style={{ fontSize: "clamp(32px, 5vw, 52px)", fontWeight: 900, marginTop: "16px", marginBottom: "8px" }}>
            {isHistoryView ? "Your " : "Your "}<span className="gradient-text">{isHistoryView ? "History" : "Results"}</span>
          </h1>
          <p className="text-secondary">{langLabel} · {skillLabel} Assessment</p>
        </div>


        {/* Top Stats Row */}
        <div style={{ display: "grid", gridTemplateColumns: "auto 1fr", gap: "32px", marginBottom: "36px", alignItems: "center" }}>
          {/* CEFR Level + Score */}
          <div className="glass-card" style={{
            padding: "40px",
            textAlign: "center",
            background: `linear-gradient(135deg, ${color}12, ${color}06)`,
            border: `1px solid ${color}40`,
          }}>
            <div style={{
              fontSize: "80px", fontWeight: 900, fontFamily: "Outfit, sans-serif",
              color, lineHeight: 1, marginBottom: "8px",
              textShadow: `0 0 40px ${color}60`,
            }}>
              {cefrLevel}
            </div>
            <div style={{ fontWeight: 700, fontSize: "18px", marginBottom: "4px" }}>
              {cefrLabels[cefrLevel] || "Intermediate"}
            </div>
            <div className="text-secondary" style={{ fontSize: "13px" }}>CEFR Level</div>
          </div>

          {/* Score ring + description */}
          <div className="glass-card" style={{ padding: "36px", display: "flex", alignItems: "center", gap: "36px" }}>
            <CircularScore score={overallScore} color={color} />
            <div>
              <div style={{ fontSize: "14px", fontWeight: 600, color: "var(--text-muted)", marginBottom: "12px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                Overall Score
              </div>
              <p style={{ fontSize: "16px", lineHeight: "1.7", color: "var(--text-secondary)", maxWidth: "420px" }}>
                {cefrDescriptions[cefrLevel] || "Evaluation complete."}
              </p>
            </div>
          </div>
        </div>

        {/* Main Content Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "24px" }}>
          {/* Sub-scores Radar Chart */}
          {subScoreData.length > 0 && (
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Skill Breakdown</h3>
              {mounted ? (
                <ResponsiveContainer width="100%" height={240}>
                  <RadarChart data={subScoreData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis
                      dataKey="subject"
                      tick={{ fill: "var(--text-secondary)", fontSize: 12, fontFamily: "Inter" }}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "var(--bg-card)",
                        border: "1px solid var(--border-glass)",
                        borderRadius: "8px",
                        color: "var(--text-primary)",
                      }}
                    />
                    <Radar
                      name="Score"
                      dataKey="score"
                      stroke={color}
                      fill={color}
                      fillOpacity={0.2}
                      strokeWidth={2}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                <div style={{ height: "240px", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <div className="spinner" />
                </div>
              )}

              {/* Sub-score bars */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "16px" }}>
                {subScoreData.map((item) => (
                  <div key={item.subject}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px", fontSize: "13px" }}>
                      <span className="text-secondary">{item.subject}</span>
                      <span style={{ fontWeight: 700, color }}>{item.score}/100</span>
                    </div>
                    <div className="progress-bar">
                      <div className="progress-fill" style={{ width: `${item.score}%`, background: `linear-gradient(90deg, ${color}, ${color}99)` }} />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Strengths & Improvements */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="glass-card" style={{ padding: "24px", flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#10b981", display: "flex", alignItems: "center", gap: "8px" }}>
                ✅ Strengths
              </h3>
              {strengths.length > 0 ? (
                <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none" }}>
                  {strengths.map((s: string, i: number) => (
                    <li key={i} style={{
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      padding: "10px 14px",
                      background: "rgba(16,185,129,0.06)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid rgba(16,185,129,0.15)",
                      lineHeight: "1.5",
                    }}>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary" style={{ fontSize: "14px", fontStyle: "italic" }}>No specific strengths noted.</p>
              )}
            </div>

            <div className="glass-card" style={{ padding: "24px", flex: 1 }}>
              <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "16px", color: "#f59e0b", display: "flex", alignItems: "center", gap: "8px" }}>
                💡 Areas to Improve
              </h3>
              {improvements.length > 0 ? (
                <ul style={{ display: "flex", flexDirection: "column", gap: "10px", listStyle: "none" }}>
                  {improvements.map((s: string, i: number) => (
                    <li key={i} style={{
                      fontSize: "14px",
                      color: "var(--text-secondary)",
                      padding: "10px 14px",
                      background: "rgba(245,158,11,0.06)",
                      borderRadius: "var(--radius-sm)",
                      border: "1px solid rgba(245,158,11,0.15)",
                      lineHeight: "1.5",
                    }}>
                      {s}
                    </li>
                  ))}
                </ul>
              ) : (
                <p className="text-secondary" style={{ fontSize: "14px", fontStyle: "italic" }}>No specific improvements needed.</p>
              )}
            </div>
          </div>
        </div>

        {/* Integrity Logs / Timeline */}
        {reportObj && reportObj.violations.length > 0 && (
          <div className="glass-card" style={{ padding: "28px", marginBottom: "32px", border: "1px solid rgba(244, 63, 94, 0.2)" }}>
            <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px", color: "var(--brand-rose)", display: "flex", alignItems: "center", gap: "8px" }}>
              🛡️ Integrity Log ({reportObj.violations.length} event{reportObj.violations.length !== 1 ? "s" : ""})
            </h3>
            <p className="text-secondary" style={{ fontSize: "14px", marginBottom: "16px" }}>
              The following security events were recorded during this assessment session:
            </p>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {reportObj.violations.map((v: any, index: number) => {
                const timeStr = v.timestamp ? new Date(v.timestamp).toLocaleTimeString() : `Event #${index + 1}`;
                const labelMap: Record<string, string> = {
                  tab_switch: "💻 Tab Switch",
                  window_blur: "📴 Left Window Focus",
                  copy_attempt: "📋 Copy Attempt",
                  paste_attempt: "📋 Paste Attempt",
                  right_click: "🖱️ Right Clicked",
                  mouse_leave: "🖱️ Left Screen Area",
                  fullscreen_exit: "🖥️ Exited Fullscreen",
                  keyboard_shortcut: "⌨️ Restricted Keypress",
                  face_absent: "🔴 No Face Detected",
                  multiple_faces: "👥 Multiple Faces Detected",
                  looking_away: "👀 Looking Away",
                  webcam_denied: "❌ Camera Denied",
                };
                return (
                  <div key={index} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 14px", background: "rgba(255, 255, 255, 0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-sm)" }}>
                    <div>
                      <span style={{ fontWeight: 600, fontSize: "14px", color: "var(--text-primary)" }}>
                        {labelMap[v.type] || v.type}
                      </span>
                      {v.detail && (
                        <span className="text-muted" style={{ fontSize: "12px", marginLeft: "12px" }}>
                          ({v.detail})
                        </span>
                      )}
                    </div>
                    <span className="text-muted" style={{ fontSize: "12px" }}>
                      {timeStr}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Detailed Feedback */}
        <div className="glass-card" style={{ padding: "28px", marginBottom: "32px" }}>
          <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "16px" }}>
            🤖 AI Detailed Feedback
          </h3>
          <p style={{ fontSize: "15px", lineHeight: "1.85", color: "var(--text-secondary)" }}>
            {detailedFeedback}
          </p>
        </div>

        {/* Prompt reference */}
        {prompt && (
          <div style={{ padding: "16px 20px", background: "rgba(255,255,255,0.02)", border: "1px solid var(--border-subtle)", borderRadius: "var(--radius-md)", marginBottom: "32px" }}>
            <div style={{ fontSize: "11px", color: "var(--text-muted)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
              Assessment Prompt
            </div>
            <p style={{ fontSize: "14px", color: "var(--text-secondary)" }}>{prompt}</p>
          </div>
        )}

        {/* Action Buttons */}
        <div style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
          {isHistoryView ? (
            <button onClick={onClose} className="btn btn-primary btn-lg">
              ← Back to Dashboard
            </button>
          ) : (
            <>
              <button id="retry-assessment-btn" onClick={onRetry} className="btn btn-primary btn-lg">
                Try Another Assessment →
              </button>
              <Link href="/assessment" className="btn btn-ghost btn-lg">
                Change Skill or Language
              </Link>
              <Link href="/dashboard" className="btn btn-ghost btn-lg">
                View Dashboard
              </Link>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
