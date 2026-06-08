"use client";
import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Flag from "@/components/Flag";
import type { Session } from "next-auth";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  RadarChart,
  Radar,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
} from "recharts";
import ResultsPanel from "./ResultsPanel";

interface Assessment {
  id: string;
  language: string;
  skill: string;
  cefrLevel: string;
  overallScore: number;
  grammarScore: number | null;
  vocabularyScore: number | null;
  fluencyScore: number | null;
  coherenceScore: number | null;
  createdAt: Date;
  prompt: string;
  userResponse: string;
  strengths: string;
  improvements: string;
  feedback: string;
  integrityReport?: string | null;
}

interface Props {
  session: Session;
  assessments: Assessment[];
}

const CEFR_ORDER = ["A1", "A2", "B1", "B2", "C1", "C2"];

const CEFR_META: Record<string, { label: string; color: string; glow: string; desc: string }> = {
  A1: { label: "Beginner",       color: "#10b981", glow: "rgba(16,185,129,0.4)",  desc: "Can understand and use basic expressions" },
  A2: { label: "Elementary",     color: "#34d399", glow: "rgba(52,211,153,0.4)",  desc: "Can communicate in simple tasks" },
  B1: { label: "Intermediate",   color: "#6366f1", glow: "rgba(99,102,241,0.4)",  desc: "Can deal with most travel situations" },
  B2: { label: "Upper-Inter.",   color: "#818cf8", glow: "rgba(129,140,248,0.4)", desc: "Can interact with fluency and spontaneity" },
  C1: { label: "Advanced",       color: "#f59e0b", glow: "rgba(245,158,11,0.4)",  desc: "Can use language flexibly and effectively" },
  C2: { label: "Mastery",        color: "#fbbf24", glow: "rgba(251,191,36,0.4)",  desc: "Near-native level proficiency" },
};

function getScoreTrend(assessments: Assessment[]) {
  return [...assessments]
    .reverse()
    .slice(-12)
    .map((a, i) => ({
      index: i + 1,
      score: a.overallScore,
      date: new Date(a.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" }),
    }));
}

function getRadarData(assessments: Assessment[]) {
  if (!assessments.length) return [];
  const avg = (arr: (number | null)[]) => {
    const valid = arr.filter((v): v is number => v !== null);
    return valid.length ? Math.round(valid.reduce((a, b) => a + b, 0) / valid.length) : 0;
  };
  return [
    { subject: "Grammar",    A: avg(assessments.map((a) => a.grammarScore)) },
    { subject: "Vocabulary", A: avg(assessments.map((a) => a.vocabularyScore)) },
    { subject: "Fluency",    A: avg(assessments.map((a) => a.fluencyScore)) },
    { subject: "Coherence",  A: avg(assessments.map((a) => a.coherenceScore)) },
    { subject: "Overall",    A: avg(assessments.map((a) => a.overallScore)) },
  ];
}

function getActivityMap(assessments: Assessment[]) {
  const map: Record<string, number> = {};
  assessments.forEach((a) => {
    const d = new Date(a.createdAt).toISOString().split("T")[0];
    map[d] = (map[d] || 0) + 1;
  });
  return map;
}

function getTopImprovements(assessments: Assessment[]): string[] {
  const counts: Record<string, number> = {};
  assessments.forEach((a) => {
    try {
      const items: string[] = typeof a.improvements === "string"
        ? JSON.parse(a.improvements)
        : a.improvements ?? [];
      items.forEach((item) => {
        const key = item.slice(0, 60).toLowerCase();
        counts[key] = (counts[key] || 0) + 1;
      });
    } catch {}
  });
  return Object.entries(counts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 4)
    .map(([k]) => k.charAt(0).toUpperCase() + k.slice(1));
}

function ActivityHeatmap({ activityMap }: { activityMap: Record<string, number> }) {
  const weeks: { date: string; count: number }[][] = [];
  const today = new Date();
  // Build last 16 weeks
  const start = new Date(today);
  start.setDate(start.getDate() - 16 * 7 + 1);
  let week: { date: string; count: number }[] = [];
  for (let d = new Date(start); d <= today; d.setDate(d.getDate() + 1)) {
    const key = d.toISOString().split("T")[0];
    week.push({ date: key, count: activityMap[key] || 0 });
    if (d.getDay() === 6) {
      weeks.push(week);
      week = [];
    }
  }
  if (week.length) weeks.push(week);

  const getColor = (count: number) => {
    if (count === 0) return "rgba(255,255,255,0.04)";
    if (count === 1) return "rgba(99,102,241,0.3)";
    if (count === 2) return "rgba(99,102,241,0.6)";
    return "rgba(99,102,241,0.9)";
  };

  return (
    <div style={{ overflowX: "auto" }}>
      <div style={{ display: "flex", gap: "3px", minWidth: "fit-content" }}>
        {weeks.map((week, wi) => (
          <div key={wi} style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
            {week.map((day) => (
              <div
                key={day.date}
                title={`${day.date}: ${day.count} assessment${day.count !== 1 ? "s" : ""}`}
                style={{
                  width: "13px",
                  height: "13px",
                  borderRadius: "3px",
                  background: getColor(day.count),
                  transition: "transform 0.15s ease",
                  cursor: day.count > 0 ? "pointer" : "default",
                }}
                onMouseEnter={(e) => { (e.target as HTMLDivElement).style.transform = "scale(1.3)"; }}
                onMouseLeave={(e) => { (e.target as HTMLDivElement).style.transform = "scale(1)"; }}
              />
            ))}
          </div>
        ))}
      </div>
      <div style={{ display: "flex", alignItems: "center", gap: "6px", marginTop: "8px" }}>
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Less</span>
        {[0, 1, 2, 3].map((n) => (
          <div key={n} style={{ width: "11px", height: "11px", borderRadius: "2px", background: getColor(n) }} />
        ))}
        <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>More</span>
      </div>
    </div>
  );
}

function CEFRRoadmap({ currentLevel, assessments }: { currentLevel: string; assessments: Assessment[] }) {
  const currentIdx = CEFR_ORDER.indexOf(currentLevel);
  const visitedLevels = new Set(assessments.map((a) => a.cefrLevel));

  return (
    <div style={{ position: "relative", padding: "8px 0 16px" }}>
      {/* Connector line */}
      <div style={{
        position: "absolute",
        top: "36px",
        left: "32px",
        right: "32px",
        height: "2px",
        background: "var(--border-subtle)",
        zIndex: 0,
      }} />
      {/* Progress fill */}
      <div style={{
        position: "absolute",
        top: "36px",
        left: "32px",
        width: currentIdx >= 0 ? `${(currentIdx / (CEFR_ORDER.length - 1)) * 100}%` : "0%",
        height: "2px",
        background: "var(--gradient-brand)",
        zIndex: 1,
        transition: "width 1.2s ease",
        boxShadow: "0 0 8px rgba(99,102,241,0.6)",
      }} />

      <div style={{ display: "flex", justifyContent: "space-between", position: "relative", zIndex: 2 }}>
        {CEFR_ORDER.map((level, idx) => {
          const meta = CEFR_META[level];
          const isActive = level === currentLevel;
          const isVisited = visitedLevels.has(level);
          const isPast = idx < currentIdx;

          return (
            <div key={level} style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "10px", flex: 1 }}>
              {/* Node */}
              <div style={{
                width: "52px",
                height: "52px",
                borderRadius: "50%",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                fontSize: "13px",
                fontWeight: 800,
                fontFamily: "'Outfit', sans-serif",
                background: isActive
                  ? `radial-gradient(circle, ${meta.color}, ${meta.color}cc)`
                  : isPast || isVisited
                    ? `rgba(${meta.color.replace("#", "").match(/.{2}/g)!.map(h => parseInt(h, 16)).join(",")}, 0.3)`
                    : "var(--bg-card)",
                border: isActive
                  ? `2px solid ${meta.color}`
                  : isPast || isVisited
                    ? `1px solid ${meta.color}66`
                    : "1px solid var(--border-subtle)",
                color: isActive ? "white" : isPast || isVisited ? meta.color : "var(--text-muted)",
                boxShadow: isActive ? `0 0 24px ${meta.glow}, 0 0 40px ${meta.glow}` : "none",
                transform: isActive ? "scale(1.15)" : "scale(1)",
                transition: "all 0.4s ease",
                position: "relative",
              }}>
                {level}
                {isActive && (
                  <div style={{
                    position: "absolute",
                    inset: "-4px",
                    borderRadius: "50%",
                    border: `2px solid ${meta.color}`,
                    opacity: 0.4,
                    animation: "ping 2s cubic-bezier(0,0,0.2,1) infinite",
                  }} />
                )}
              </div>
              {/* Label */}
              <div style={{ textAlign: "center" }}>
                <div style={{ fontSize: "11px", fontWeight: 600, color: isActive ? meta.color : "var(--text-muted)" }}>
                  {meta.label}
                </div>
                {isActive && (
                  <div style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "2px", maxWidth: "80px" }}>
                    You are here
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function AnimatedScore({ value, duration = 1200 }: { value: number; duration?: number }) {
  const [displayed, setDisplayed] = useState(0);
  const startRef = useRef<number | null>(null);

  useEffect(() => {
    startRef.current = null;
    const animate = (ts: number) => {
      if (!startRef.current) startRef.current = ts;
      const progress = Math.min((ts - startRef.current) / duration, 1);
      setDisplayed(Math.round(progress * value));
      if (progress < 1) requestAnimationFrame(animate);
    };
    requestAnimationFrame(animate);
  }, [value, duration]);

  return <>{displayed}</>;
}

const skillIcons: Record<string, string> = {
  speaking: "🎤", writing: "✍️", listening: "👂", reading: "📖",
};

export default function DashboardClient({ session, assessments }: Props) {
  const router = useRouter();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [activeTab, setActiveTab] = useState<"overview" | "history">("overview");
  
  const userLang = (session?.user as any)?.assessmentLanguage || "english";
  const isAdmin = (session?.user as any)?.role === "admin";
  const allowedAttempts = (session?.user as any)?.allowedAttempts ?? 1;
  const completedAttempts = assessments.length;
  const isAttemptExhausted = !isAdmin && completedAttempts >= allowedAttempts;

  if (selectedAssessment && isAdmin) {
    let integrityRiskLevel: "low" | "medium" | "high" = "low";
    try {
      if (selectedAssessment.integrityReport) {
        integrityRiskLevel = JSON.parse(selectedAssessment.integrityReport).riskLevel || "low";
      }
    } catch {}

    return (
      <ResultsPanel
        result={{
          cefr_level: selectedAssessment.cefrLevel,
          overall_score: selectedAssessment.overallScore,
          sub_scores: {
            grammar: selectedAssessment.grammarScore,
            vocabulary: selectedAssessment.vocabularyScore,
            fluency: selectedAssessment.fluencyScore,
            coherence: selectedAssessment.coherenceScore,
          },
          strengths: selectedAssessment.strengths as any,
          improvements: selectedAssessment.improvements as any,
          detailed_feedback: selectedAssessment.feedback,
        }}
        language={selectedAssessment.language}
        skill={selectedAssessment.skill}
        prompt={selectedAssessment.prompt}
        onRetry={() => {}}
        isHistoryView={true}
        onClose={() => setSelectedAssessment(null)}
        integrityRiskLevel={integrityRiskLevel}
        integrityReport={selectedAssessment.integrityReport}
      />
    );
  }

  const name = session.user?.name || session.user?.email || "User";
  const firstName = name.split(" ")[0];
  const totalAssessments = assessments.length;
  const avgScore = totalAssessments
    ? Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / totalAssessments)
    : 0;
  const bestScore = totalAssessments ? Math.max(...assessments.map((a) => a.overallScore)) : 0;
  const latestCEFR = assessments[0]?.cefrLevel || "—";
  const latestMeta = CEFR_META[latestCEFR];

  // Unique days active
  const uniqueDays = new Set(assessments.map((a) => new Date(a.createdAt).toISOString().split("T")[0])).size;

  const trendData = getScoreTrend(assessments);
  const radarData = getRadarData(assessments);
  const activityMap = getActivityMap(assessments);
  const topImprovements = getTopImprovements(assessments);

  const engCount = assessments.filter((a) => a.language === "english").length;
  const deCount = assessments.filter((a) => a.language === "german").length;

  return (
    <div className="page-wrapper">
      {/* Background orbs */}
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.07 }} />
        <div className="hero-orb hero-orb-2" style={{ opacity: 0.05, animationDelay: "-3s" }} />
      </div>

      <style>{`
        @keyframes ping {
          75%, 100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes shimmer {
          0% { background-position: -200% center; }
          100% { background-position: 200% center; }
        }
        .score-pulse {
          animation: ping 2s cubic-bezier(0,0,0.2,1) infinite;
        }
        .tab-btn {
          padding: 10px 24px;
          border-radius: 10px;
          font-size: 14px;
          font-weight: 600;
          transition: all 0.2s ease;
          cursor: pointer;
          border: none;
          background: transparent;
          color: var(--text-muted);
          font-family: inherit;
        }
        .tab-btn.active {
          background: var(--gradient-brand);
          color: white;
          box-shadow: 0 0 20px rgba(99,102,241,0.3);
        }
        .tab-btn:hover:not(.active) {
          background: var(--bg-glass);
          color: var(--text-primary);
        }
        .insight-chip {
          display: flex;
          align-items: flex-start;
          gap: 10px;
          padding: 12px 14px;
          background: rgba(99,102,241,0.06);
          border: 1px solid rgba(99,102,241,0.15);
          border-radius: 10px;
          font-size: 13px;
          color: var(--text-secondary);
          line-height: 1.5;
        }
      `}</style>

      <div className="container" style={{ paddingBottom: "100px" }}>
        {/* ─── Header ─── */}
        <div style={{ paddingTop: "40px", marginBottom: "36px", display: "flex", alignItems: "flex-end", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <h1 style={{ fontSize: "clamp(26px, 4vw, 42px)", fontWeight: 900, marginBottom: "6px" }}>
              Welcome back!
            </h1>
            <p className="text-secondary" style={{ fontSize: "15px" }}>
              Track your language learning journey and performance insights.
            </p>
          </div>
          {!isAdmin && isAttemptExhausted ? null : (
            <button
              onClick={() => router.push(`/assessment/speaking?lang=${userLang}`)}
              className="btn btn-primary"
              style={{ flexShrink: 0 }}
            >
              🎤 New Assessment
            </button>
          )}
        </div>

        {/* ─── Tabs ─── */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "32px", background: "var(--bg-card)", border: "1px solid var(--border-subtle)", borderRadius: "14px", padding: "4px", width: "fit-content" }}>
          {(["overview", "history"] as const).map((tab) => (
            <button
              key={tab}
              className={`tab-btn${activeTab === tab ? " active" : ""}`}
              onClick={() => setActiveTab(tab)}
            >
              {tab === "overview" ? "🗺 Overview" : "📋 History"}
            </button>
          ))}
        </div>

        {activeTab === "overview" && (
          <>
            {isAttemptExhausted && (
              <div 
                className="glass-card animate-fadeIn" 
                style={{ 
                  padding: "20px 24px", 
                  marginBottom: "28px", 
                  borderLeft: "4px solid var(--brand-rose)", 
                  background: "rgba(244, 63, 94, 0.05)",
                  display: "flex",
                  alignItems: "center",
                  gap: "16px"
                }}
              >
                <div style={{ fontSize: "28px", lineHeight: 1 }}>⚠️</div>
                <div style={{ flex: 1 }}>
                  <h4 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "4px", color: "var(--brand-rose)" }}>
                    Assessment Limit Reached
                  </h4>
                  <p className="text-secondary" style={{ fontSize: "13px", margin: 0, lineHeight: "1.5" }}>
                    You have completed all of your allowed assessment attempts ({completedAttempts} of {allowedAttempts} completed). Your responses have been submitted and will be communicated to you by the administrator shortly.
                  </p>
                </div>
              </div>
            )}

            {/* ─── CEFR Profile Hero ─── */}
            {!isAdmin ? (
              /* Simple Candidate Workspace Overview */
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "28px", alignItems: "start" }}>
                {/* Welcome & Status Panel */}
                <div className="glass-card" style={{ padding: "32px", minHeight: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                  <div>
                    <h3 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "12px" }}>
                      📝 Candidate Test Space
                    </h3>
                    <p className="text-secondary" style={{ fontSize: "14px", lineHeight: "1.6" }}>
                      Welcome to your IDmission FluentVerify test dashboard. Complete your speaking assessment below. 
                      Your responses will be evaluated by our AI grading engine, and your results will be directly communicated to the test administrator.
                    </p>
                  </div>
                  <div style={{
                    marginTop: "16px",
                    padding: "12px 14px",
                    background: "rgba(99, 102, 241, 0.08)",
                    border: "1px solid rgba(99, 102, 241, 0.2)",
                    borderRadius: "10px",
                    fontSize: "13px",
                    color: "var(--text-muted)",
                    display: "flex",
                    alignItems: "center",
                    gap: "8px"
                  }}>
                    🛡️ <strong>Assigned Language:</strong> 
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", color: "var(--text-primary)", fontWeight: 600, textTransform: "capitalize" }}>
                      {userLang === "english" ? <><Flag country="gb" size={14} /> English</> : <><Flag country="de" size={14} /> German</>}
                    </span>
                  </div>
                </div>

                {/* Quick Start Panel */}
                <div className="glass-card" style={{ padding: "32px", minHeight: "220px" }}>
                  <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>🚀 Quick Start</h3>
                  <p className="text-secondary" style={{ fontSize: "12px", marginBottom: "20px" }}>Jump straight into your assessment</p>
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                    {[
                      { lang: "english", skill: "speaking", label: "English Speaking", flag: "gb" },
                      { lang: "german", skill: "speaking", label: "German Speaking", flag: "de" },
                    ].filter(item => item.lang === userLang).map((item) => (
                      isAttemptExhausted ? (
                        <button
                          key={`${item.lang}-${item.skill}`}
                          disabled
                          className="btn btn-outline"
                          style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", width: "100%", padding: "14px", opacity: 0.5, cursor: "not-allowed" }}
                        >
                          <Flag country={item.flag as any} size={16} />
                          {skillIcons[item.skill]} Attempts Exhausted ({completedAttempts}/{allowedAttempts})
                        </button>
                      ) : (
                        <button
                          key={`${item.lang}-${item.skill}`}
                          onClick={() => router.push(`/assessment/${item.skill}?lang=${item.lang}`)}
                          className="btn btn-primary"
                          style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", width: "100%", padding: "14px" }}
                        >
                          <Flag country={item.flag as any} size={16} />
                          {skillIcons[item.skill]} Start {item.label} Test
                        </button>
                      )
                    ))}
                    <div style={{ padding: "12px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px dashed var(--border-subtle)", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                      ✍️ 👂 📖 Writing, Listening & Reading — <span style={{ color: "var(--text-brand)" }}>Coming Soon</span>
                    </div>
                  </div>
                </div>
              </div>
            ) : (
              /* Full Admin/Standard Overview */
              <>
                {/* ─── CEFR Profile Hero ─── */}
                {totalAssessments > 0 ? (
                  <div className="glass-card" style={{ padding: "32px", marginBottom: "28px", background: "linear-gradient(135deg, rgba(21,27,61,0.8) 0%, rgba(30,40,80,0.6) 100%)", position: "relative", overflow: "hidden" }}>
                    {/* Glow behind badge */}
                    <div style={{
                      position: "absolute", top: "-40px", right: "-40px",
                      width: "200px", height: "200px",
                      borderRadius: "50%",
                      background: latestMeta ? `radial-gradient(circle, ${latestMeta.color}22, transparent)` : "transparent",
                      filter: "blur(40px)",
                      pointerEvents: "none",
                    }} />

                    <div style={{ display: "flex", alignItems: "center", gap: "32px", flexWrap: "wrap" }}>
                      {/* Big CEFR Badge */}
                      <div style={{ position: "relative", flexShrink: 0 }}>
                        <div style={{
                          width: "100px", height: "100px", borderRadius: "50%",
                          background: latestMeta ? `radial-gradient(circle at 35% 35%, ${latestMeta.color}, ${latestMeta.color}99)` : "var(--gradient-brand)",
                          display: "flex", alignItems: "center", justifyContent: "center",
                          fontSize: "28px", fontWeight: 900, fontFamily: "'Outfit', sans-serif",
                          color: "white",
                          boxShadow: latestMeta ? `0 0 40px ${latestMeta.glow}, 0 0 80px ${latestMeta.glow}` : "none",
                        }}>
                          {latestCEFR}
                        </div>
                        <div style={{
                          position: "absolute", inset: "-6px", borderRadius: "50%",
                          border: latestMeta ? `2px solid ${latestMeta.color}44` : "none",
                          animation: "ping 3s ease-in-out infinite",
                        }} />
                      </div>

                      {/* Info */}
                      <div style={{ flex: 1, minWidth: "200px" }}>
                        <div style={{ fontSize: "13px", fontWeight: 600, color: latestMeta?.color || "var(--text-brand)", marginBottom: "4px", textTransform: "uppercase", letterSpacing: "0.08em" }}>
                          Current Level — {latestMeta?.label || ""}
                        </div>
                        <div style={{ fontSize: "clamp(18px, 3vw, 26px)", fontWeight: 800, marginBottom: "8px" }}>
                          {latestMeta?.desc || "Keep practicing to unlock your level"}
                        </div>
                        <div style={{ display: "flex", gap: "20px", flexWrap: "wrap" }}>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            🎯 <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{totalAssessments}</span> sessions completed
                          </div>
                          <div style={{ fontSize: "13px", color: "var(--text-secondary)" }}>
                            📅 <span style={{ fontWeight: 600, color: "var(--text-primary)" }}>{uniqueDays}</span> practice days
                          </div>
                        </div>
                      </div>

                      {/* Score ring */}
                      <div style={{ textAlign: "center", flexShrink: 0 }}>
                        <div style={{ position: "relative", width: "80px", height: "80px", margin: "0 auto" }}>
                          <svg width="80" height="80" style={{ transform: "rotate(-90deg)" }}>
                            <circle cx="40" cy="40" r="32" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="6" />
                            <circle
                              cx="40" cy="40" r="32" fill="none"
                              stroke={latestMeta?.color || "#6366f1"}
                              strokeWidth="6"
                              strokeLinecap="round"
                              strokeDasharray={`${2 * Math.PI * 32}`}
                              strokeDashoffset={`${2 * Math.PI * 32 * (1 - avgScore / 100)}`}
                              style={{ transition: "stroke-dashoffset 1.2s ease" }}
                            />
                          </svg>
                          <div style={{ position: "absolute", inset: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                            <div style={{ fontSize: "18px", fontWeight: 800, fontFamily: "'Outfit', sans-serif", color: latestMeta?.color || "var(--text-brand)" }}>
                              <AnimatedScore value={avgScore} />
                            </div>
                          </div>
                        </div>
                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "6px", fontWeight: 600 }}>AVG SCORE</div>
                      </div>
                    </div>
                  </div>
                ) : null}

                {/* ─── Stats Row ─── */}
                <div className="stats-grid" style={{ marginBottom: "28px" }}>
                  {[
                    { icon: "🎯", value: totalAssessments, label: "Total Sessions", accent: "var(--brand-primary)" },
                    { icon: "📈", value: avgScore || "—", label: "Average Score", accent: "#6366f1" },
                    { icon: "🏆", value: bestScore || "—", label: "Best Score", accent: "#f59e0b" },
                    { icon: "📅", value: uniqueDays, label: "Active Days", accent: "#10b981" },
                  ].map((stat, i) => (
                    <div key={i} className="stat-card" style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ fontSize: "22px", marginBottom: "6px" }}>{stat.icon}</div>
                      <div style={{ fontFamily: "'Outfit', sans-serif", fontSize: "32px", fontWeight: 800, color: stat.accent }}>
                        {typeof stat.value === "number" ? <AnimatedScore value={stat.value} /> : stat.value}
                      </div>
                      <div className="stat-label">{stat.label}</div>
                    </div>
                  ))}
                </div>

                {/* ─── CEFR Journey Roadmap ─── */}
                <div className="glass-card" style={{ padding: "28px", marginBottom: "28px" }}>
                  <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
                    <div>
                      <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "4px" }}>🗺 CEFR Learning Roadmap</h3>
                      <p className="text-secondary" style={{ fontSize: "13px" }}>Your journey from A1 to C2 mastery</p>
                    </div>
                    {latestCEFR !== "—" && latestCEFR !== "C2" && (
                      <div style={{ fontSize: "12px", color: "var(--text-muted)", background: "rgba(99,102,241,0.08)", padding: "6px 12px", borderRadius: "8px", border: "1px solid rgba(99,102,241,0.15)" }}>
                        Next: <span style={{ color: CEFR_META[CEFR_ORDER[CEFR_ORDER.indexOf(latestCEFR) + 1]]?.color, fontWeight: 700 }}>
                          {CEFR_ORDER[CEFR_ORDER.indexOf(latestCEFR) + 1]}
                        </span>
                      </div>
                    )}
                  </div>
                  <CEFRRoadmap currentLevel={latestCEFR} assessments={assessments} />
                </div>

                {/* ─── Analytics Row ─── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
                  {/* Score Trend */}
                  <div className="glass-card" style={{ padding: "28px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>📈 Score Trend</h3>
                    <p className="text-secondary" style={{ fontSize: "12px", marginBottom: "20px" }}>Your last {trendData.length} assessments</p>
                    {trendData.length >= 2 ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <LineChart data={trendData}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                          <XAxis dataKey="date" tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 11 }} axisLine={false} tickLine={false} />
                          <Tooltip
                            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                            formatter={(v) => [`${v}/100`, "Score"]}
                          />
                          <defs>
                            <linearGradient id="lineGrad" x1="0" y1="0" x2="1" y2="0">
                              <stop offset="0%" stopColor="#6366f1" />
                              <stop offset="100%" stopColor="#60a5fa" />
                            </linearGradient>
                          </defs>
                          <Line
                            type="monotone"
                            dataKey="score"
                            stroke="url(#lineGrad)"
                            strokeWidth={2.5}
                            dot={{ fill: "#6366f1", r: 4, strokeWidth: 2, stroke: "var(--bg-primary)" }}
                            activeDot={{ r: 6, fill: "#60a5fa" }}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
                        <div>
                          <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.4 }}>📈</div>
                          Complete 2+ assessments<br />to see your trend
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Radar */}
                  <div className="glass-card" style={{ padding: "28px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>🕸 Skill Breakdown</h3>
                    <p className="text-secondary" style={{ fontSize: "12px", marginBottom: "20px" }}>Average sub-scores across all sessions</p>
                    {radarData.length > 0 && radarData.some((d) => d.A > 0) ? (
                      <ResponsiveContainer width="100%" height={200}>
                        <RadarChart data={radarData} margin={{ top: 0, right: 20, bottom: 0, left: 20 }}>
                          <PolarGrid stroke="rgba(255,255,255,0.06)" />
                          <PolarAngleAxis dataKey="subject" tick={{ fill: "var(--text-secondary)", fontSize: 11 }} />
                          <PolarRadiusAxis domain={[0, 100]} tick={false} axisLine={false} />
                          <Radar
                            name="Score"
                            dataKey="A"
                            stroke="#6366f1"
                            strokeWidth={2}
                            fill="#6366f1"
                            fillOpacity={0.18}
                            dot={{ fill: "#818cf8", r: 3 }}
                          />
                          <Tooltip
                            contentStyle={{ background: "var(--bg-card)", border: "1px solid var(--border-glass)", borderRadius: "8px", color: "var(--text-primary)", fontSize: "13px" }}
                            formatter={(v) => [`${v}/100`]}
                          />
                        </RadarChart>
                      </ResponsiveContainer>
                    ) : (
                      <div style={{ height: "200px", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-muted)", fontSize: "14px", textAlign: "center" }}>
                        <div>
                          <div style={{ fontSize: "36px", marginBottom: "12px", opacity: 0.4 }}>🕸</div>
                          Complete assessments<br />to see your skill radar
                        </div>
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Activity Heatmap + Improvements ─── */}
                <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: "24px", marginBottom: "28px" }}>
                  <div className="glass-card" style={{ padding: "28px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>🔥 Practice Activity</h3>
                    <p className="text-secondary" style={{ fontSize: "12px", marginBottom: "20px" }}>Last 16 weeks — each cell = one day</p>
                    <ActivityHeatmap activityMap={activityMap} />
                  </div>

                  <div className="glass-card" style={{ padding: "28px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>💡 Top Focus Areas</h3>
                    <p className="text-secondary" style={{ fontSize: "12px", marginBottom: "20px" }}>Most common improvement points from AI feedback</p>
                    {topImprovements.length > 0 ? (
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                        {topImprovements.map((item, i) => (
                          <div key={i} className="insight-chip">
                            <span style={{ fontSize: "16px", flexShrink: 0 }}>
                              {["🎯", "💬", "📝", "🔤"][i % 4]}
                            </span>
                            {item}
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div style={{ textAlign: "center", padding: "24px 0", color: "var(--text-muted)", fontSize: "13px" }}>
                        <div style={{ fontSize: "32px", marginBottom: "10px", opacity: 0.4 }}>💡</div>
                        Complete assessments to see<br />your personalized tips
                      </div>
                    )}
                  </div>
                </div>

                {/* ─── Language Split + Quick Actions ─── */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "28px" }}>
                  {/* Language breakdown */}
                  <div className="glass-card" style={{ padding: "28px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>🌍 Languages Practiced</h3>
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                      {[
                        { lang: "English", country: "gb", count: engCount, color: "#6366f1" },
                        { lang: "German", country: "de", count: deCount, color: "#10b981" },
                      ].map((l) => (
                        <div key={l.lang}>
                          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "8px" }}>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <Flag country={l.country as any} size={20} />
                              <span style={{ fontSize: "14px", fontWeight: 600 }}>{l.lang}</span>
                            </div>
                            <span style={{ fontSize: "13px", color: "var(--text-muted)" }}>{l.count} session{l.count !== 1 ? "s" : ""}</span>
                          </div>
                          <div className="progress-bar">
                            <div className="progress-fill" style={{
                              width: totalAssessments ? `${(l.count / totalAssessments) * 100}%` : "0%",
                              background: `linear-gradient(90deg, ${l.color}, ${l.color}aa)`,
                            }} />
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Quick Start */}
                  <div className="glass-card" style={{ padding: "28px" }}>
                    <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "6px" }}>🚀 Quick Start</h3>
                    <p className="text-secondary" style={{ fontSize: "12px", marginBottom: "16px" }}>Jump straight into an assessment</p>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      {[
                        { lang: "english", skill: "speaking", label: "English Speaking", flag: "gb" },
                        { lang: "german", skill: "speaking", label: "German Speaking", flag: "de" },
                      ].filter(item => (session?.user as any)?.role === "admin" || item.lang === userLang).map((item) => (
                        <button
                          key={`${item.lang}-${item.skill}`}
                          onClick={() => router.push(`/assessment/${item.skill}?lang=${item.lang}`)}
                          className="btn btn-outline"
                          style={{ display: "flex", alignItems: "center", gap: "10px", justifyContent: "center", width: "100%" }}
                        >
                          <Flag country={item.flag as any} size={16} />
                          {skillIcons[item.skill]} {item.label}
                        </button>
                      ))}
                      <div style={{ padding: "10px 14px", borderRadius: "10px", background: "rgba(255,255,255,0.03)", border: "1px dashed var(--border-subtle)", textAlign: "center", fontSize: "12px", color: "var(--text-muted)" }}>
                        ✍️ 👂 📖 Writing, Listening & Reading — <span style={{ color: "var(--text-brand)" }}>Coming Soon</span>
                      </div>
                    </div>
                  </div>
                </div>
              </>
            )}
          </>
        )}

        {activeTab === "history" && (
          <div>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "20px", flexWrap: "wrap", gap: "12px" }}>
              <h2 style={{ fontSize: "22px", fontWeight: 800 }}>Assessment History</h2>
              <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>
                {totalAssessments} session{totalAssessments !== 1 ? "s" : ""} total
              </div>
            </div>

            {assessments.length === 0 ? (
              <div className="empty-state">
                <div className="empty-state-icon">🎯</div>
                <h3 className="empty-state-title">No assessments yet</h3>
                <p className="empty-state-desc">Take your first assessment to see your results here.</p>
                <Link href={`/assessment?lang=${userLang}`} className="btn btn-primary btn-lg">Start Assessment →</Link>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="history-table">
                  <thead>
                    <tr>
                      <th>Skill</th>
                      <th>Language</th>
                      {isAdmin ? (
                        <>
                          <th>CEFR Level</th>
                          <th>Score</th>
                        </>
                      ) : (
                        <th>Status</th>
                      )}
                      <th>Topic</th>
                      <th>Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {assessments.map((assessment) => (
                      <tr
                        key={assessment.id}
                        onClick={isAdmin ? () => setSelectedAssessment(assessment) : undefined}
                        className={isAdmin ? "cursor-pointer hover:bg-white/5 transition-colors" : ""}
                        style={{ cursor: isAdmin ? "pointer" : "default" }}
                      >
                        <td>
                          <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <span>{skillIcons[assessment.skill] || "📝"}</span>
                            <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{assessment.skill}</span>
                          </span>
                        </td>
                        <td>
                          <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                            {assessment.language === "english" ? <Flag country="gb" size={16} /> : <Flag country="de" size={16} />}
                            <span style={{ textTransform: "capitalize" }}>{assessment.language}</span>
                          </span>
                        </td>
                        {isAdmin ? (
                          <>
                            <td>
                              <span className={`cefr-badge cefr-${assessment.cefrLevel}`}>{assessment.cefrLevel}</span>
                            </td>
                            <td>
                              <span style={{
                                fontWeight: 700,
                                color: assessment.overallScore >= 70 ? "#10b981" : assessment.overallScore >= 50 ? "#818cf8" : "#f59e0b",
                              }}>
                                {assessment.overallScore}/100
                              </span>
                            </td>
                          </>
                        ) : (
                          <td>
                            <span style={{
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px",
                              padding: "4px 10px",
                              background: "rgba(16, 185, 129, 0.12)",
                              color: "#10b981",
                              borderRadius: "9999px",
                              fontSize: "12px",
                              fontWeight: 600
                            }}>
                              ✓ Submitted
                            </span>
                          </td>
                        )}
                        <td>
                          <span className="text-secondary" style={{ fontSize: "13px" }}>
                            {assessment.prompt.substring(0, 50)}{assessment.prompt.length > 50 ? "…" : ""}
                          </span>
                        </td>
                        <td>
                          <span className="text-muted" style={{ fontSize: "13px" }}>
                            {new Date(assessment.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* ─── Empty state (no assessments at all, overview tab) ─── */}
        {activeTab === "overview" && totalAssessments === 0 && (
          <div className="empty-state glass-card" style={{ padding: "80px 40px" }}>
            <div className="empty-state-icon">🚀</div>
            <h3 className="empty-state-title">Your journey starts here</h3>
            <p className="empty-state-desc">
              Complete your first speaking assessment to unlock your CEFR level, score trends, skill radar, and more.
            </p>
            <Link href={`/assessment?lang=${userLang}`} className="btn btn-primary btn-lg">Start First Assessment →</Link>
          </div>
        )}
      </div>
    </div>
  );
}
