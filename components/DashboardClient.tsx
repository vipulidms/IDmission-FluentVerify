"use client";
import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Flag from "@/components/Flag";
import type { Session } from "next-auth";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
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
}

interface Props {
  session: Session;
  assessments: Assessment[];
}

const cefrColors: Record<string, string> = {
  A1: "#10b981", A2: "#10b981", B1: "#6366f1", B2: "#6366f1", C1: "#f59e0b", C2: "#f59e0b",
};

const skillIcons: Record<string, string> = {
  speaking: "🎤", writing: "✍️", listening: "👂", reading: "📖",
};

function getAverageByCEFR(assessments: Assessment[]) {
  const grouped: Record<string, number[]> = {};
  assessments.forEach((a) => {
    if (!grouped[a.skill]) grouped[a.skill] = [];
    grouped[a.skill].push(a.overallScore);
  });
  return Object.entries(grouped).map(([skill, scores]) => ({
    skill: skill.charAt(0).toUpperCase() + skill.slice(1),
    avg: Math.round(scores.reduce((a, b) => a + b, 0) / scores.length),
  }));
}

export default function DashboardClient({ session, assessments }: Props) {
  const router = useRouter();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);

  if (selectedAssessment) {
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
          strengths: selectedAssessment.strengths as any, // passed as JSON string initially, ResultsPanel handles parsing
          improvements: selectedAssessment.improvements as any,
          detailed_feedback: selectedAssessment.feedback,
        }}
        language={selectedAssessment.language}
        skill={selectedAssessment.skill}
        prompt={selectedAssessment.prompt}
        onRetry={() => {}}
        isHistoryView={true}
        onClose={() => setSelectedAssessment(null)}
      />
    );
  }

  const name = session.user?.name || session.user?.email || "User";
  const totalAssessments = assessments.length;
  const avgScore = totalAssessments
    ? Math.round(assessments.reduce((sum, a) => sum + a.overallScore, 0) / totalAssessments)
    : 0;
  const latestCEFR = assessments[0]?.cefrLevel || "—";
  const engCount = assessments.filter((a) => a.language === "english").length;
  const deCount = assessments.filter((a) => a.language === "german").length;
  const chartData = getAverageByCEFR(assessments);

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.08 }} />
      </div>

      <div className="container" style={{ paddingBottom: "80px" }}>
        {/* Header */}
        <div style={{ paddingTop: "40px", marginBottom: "40px" }}>
          <div className="hero-badge" style={{ display: "inline-flex", marginBottom: "16px" }}>
            📊 Your Dashboard
          </div>
          <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, marginBottom: "8px" }}>
            Welcome back, <span className="gradient-text">{name.split(" ")[0]}</span>!
          </h1>
          <p className="text-secondary">Here&apos;s an overview of your language assessment journey.</p>
        </div>

        {/* Stats Grid */}
        <div className="stats-grid" style={{ marginBottom: "36px" }}>
          <div className="stat-card">
            <div className="stat-value">{totalAssessments}</div>
            <div className="stat-label">Total Assessments</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">{avgScore || "—"}</div>
            <div className="stat-label">Average Score</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ color: cefrColors[latestCEFR] || "var(--text-brand)" }}>{latestCEFR}</div>
            <div className="stat-label">Latest CEFR Level</div>
          </div>
          <div className="stat-card">
            <div className="stat-value" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
              <Flag country="gb" size={24} /> {engCount} <span style={{ color: "var(--text-muted)", margin: "0 4px" }}>·</span> <Flag country="de" size={24} /> {deCount}
            </div>
            <div className="stat-label">EN · DE Assessments</div>
          </div>
        </div>

        {/* Chart + CTA */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr auto", gap: "24px", marginBottom: "36px", alignItems: "start" }}>
          {chartData.length > 0 ? (
            <div className="glass-card" style={{ padding: "28px" }}>
              <h3 style={{ fontSize: "18px", fontWeight: 700, marginBottom: "24px" }}>Average Score by Skill</h3>
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={chartData} barSize={40}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.05)" />
                  <XAxis dataKey="skill" tick={{ fill: "var(--text-secondary)", fontSize: 13 }} axisLine={false} tickLine={false} />
                  <YAxis domain={[0, 100]} tick={{ fill: "var(--text-muted)", fontSize: 12 }} axisLine={false} tickLine={false} />
                  <Tooltip
                    contentStyle={{
                      background: "var(--bg-card)",
                      border: "1px solid var(--border-glass)",
                      borderRadius: "8px",
                      color: "var(--text-primary)",
                    }}
                    formatter={(value) => [`${value}/100`, "Avg Score"]}
                  />
                  <Bar dataKey="avg" fill="url(#gradientBar)" radius={[6, 6, 0, 0]} />
                  <defs>
                    <linearGradient id="gradientBar" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#6366f1" />
                      <stop offset="100%" stopColor="#8b5cf6" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center" }}>
              <div style={{ fontSize: "48px", marginBottom: "16px" }}>📊</div>
              <p className="text-secondary">Complete assessments to see your progress charts here.</p>
            </div>
          )}

          {/* Quick Start */}
          <div className="glass-card" style={{ padding: "28px", minWidth: "260px" }}>
            <h3 style={{ fontSize: "16px", fontWeight: 700, marginBottom: "20px" }}>Start Assessment</h3>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              {[
                { lang: "english", skill: "writing" },
                { lang: "english", skill: "speaking" },
                { lang: "german", skill: "writing" },
                { lang: "german", skill: "speaking" },
              ].map((item, idx) => (
                <button
                  key={idx}
                  onClick={() => router.push(`/assessment/${item.skill}?lang=${item.lang}`)}
                  className="btn btn-outline"
                  style={{ display: "flex", alignItems: "center", gap: "8px", justifyContent: "center" }}
                >
                  <Flag country={item.lang === "english" ? "gb" : "de"} size={16} />
                  {item.lang === "english" ? "English" : "German"} {item.skill.charAt(0).toUpperCase() + item.skill.slice(1)} Test
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Assessment History */}
        <div>
          <h2 style={{ fontSize: "22px", fontWeight: 800, marginBottom: "20px" }}>Assessment History</h2>

          {assessments.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state-icon">🎯</div>
              <h3 className="empty-state-title">No assessments yet</h3>
              <p className="empty-state-desc">Take your first assessment to see your results here.</p>
              <Link href="/assessment" className="btn btn-primary btn-lg">Start Assessment →</Link>
            </div>
          ) : (
            <div style={{ overflowX: "auto" }}>
              <table className="history-table">
                <thead>
                  <tr>
                    <th>Skill</th>
                    <th>Language</th>
                    <th>CEFR Level</th>
                    <th>Score</th>
                    <th>Topic</th>
                    <th>Date</th>
                  </tr>
                </thead>
                <tbody>
                  {assessments.map((assessment) => (
                    <tr 
                      key={assessment.id}
                      onClick={() => setSelectedAssessment(assessment)}
                      className="cursor-pointer hover:bg-white/5 transition-colors"
                    >
                      <td>
                        <span style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                          <span>{skillIcons[assessment.skill] || "📝"}</span>
                          <span style={{ textTransform: "capitalize", fontWeight: 500 }}>{assessment.skill}</span>
                        </span>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          {assessment.language === "english" ? <Flag country="gb" size={16} /> : <Flag country="de" size={16} />} {assessment.language}
                        </span>
                      </td>
                      <td>
                        <span className={`cefr-badge cefr-${assessment.cefrLevel}`}>
                          {assessment.cefrLevel}
                        </span>
                      </td>
                      <td>
                        <span style={{
                          fontWeight: 700,
                          color: assessment.overallScore >= 70 ? "#10b981" : assessment.overallScore >= 50 ? "#6366f1" : "#f59e0b",
                        }}>
                          {assessment.overallScore}/100
                        </span>
                      </td>
                      <td>
                        <span className="text-secondary" style={{ fontSize: "13px" }}>
                          {assessment.prompt.substring(0, 50)}{assessment.prompt.length > 50 ? "..." : ""}
                        </span>
                      </td>
                      <td>
                        <span className="text-muted" style={{ fontSize: "13px" }}>
                          {new Date(assessment.createdAt).toLocaleDateString("en-GB", {
                            day: "numeric", month: "short", year: "numeric",
                          })}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
