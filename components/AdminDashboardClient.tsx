"use client";
import React, { useState, useMemo } from "react";
import ResultsPanel from "./ResultsPanel";
import Link from "next/link";
import { useRouter } from "next/navigation";
import AdminAddUserModal from "./AdminAddUserModal";
import AdminEditUserModal from "./AdminEditUserModal";
import Flag from "@/components/Flag";

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
  integrityReport?: string | null; // JSON string
}


interface UserData {
  id: string;
  name: string | null;
  firstName: string | null;
  lastName: string | null;
  mobileNumber: string | null;
  email: string;
  image: string | null;
  role: string;
  targetCefrLevel?: string | null;
  assessments: Assessment[];
}

interface Props {
  users: UserData[];
}

const cefrColors: Record<string, string> = {
  A1: "#10b981", A2: "#10b981", B1: "#6366f1", B2: "#6366f1", C1: "#f59e0b", C2: "#f59e0b",
};

const skillIcons: Record<string, string> = {
  speaking: "🎤", writing: "✍️", listening: "👂", reading: "📖",
};

export default function AdminDashboardClient({ users }: Props) {
  const router = useRouter();
  const [selectedAssessment, setSelectedAssessment] = useState<Assessment | null>(null);
  const [expandedUser, setExpandedUser] = useState<string | null>(null);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [editUser, setEditUser] = useState<UserData | null>(null);

  // Compute leaderboard stats
  const leaderboard = useMemo(() => {
    return users.map(user => {
      const attempts = user.assessments.length;
      const highestScore = user.assessments.reduce((max, a) => Math.max(max, a.overallScore), 0);
      const latestCEFR = user.assessments.length > 0 ? user.assessments[0].cefrLevel : "—";
      const flaggedCount = user.assessments.filter(a => {
        try { return a.integrityReport ? JSON.parse(a.integrityReport).flagged : false; } catch { return false; }
      }).length;
      return { ...user, attempts, highestScore, latestCEFR, flaggedCount };
    }).sort((a, b) => b.highestScore - a.highestScore);
  }, [users]);


  if (selectedAssessment) {
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

  return (
    <div className="page-wrapper">
      <div style={{ position: "fixed", inset: 0, background: "var(--bg-primary)", zIndex: -1 }}>
        <div className="hero-orb hero-orb-1" style={{ opacity: 0.08 }} />
      </div>

      <div className="container" style={{ paddingBottom: "80px", paddingTop: "40px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px" }}>
          <div>
            <div className="hero-badge" style={{ display: "inline-flex", marginBottom: "16px" }}>
              👑 Super Admin
            </div>
            <h1 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, marginBottom: "8px" }}>
              Candidate <span className="gradient-text">Leaderboard</span>
            </h1>
            <p className="text-secondary">Review all candidate attempts and detailed scores.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setIsAddUserOpen(true)} className="btn btn-primary">
              + Add Candidate
            </button>
            <Link href="/dashboard" className="btn btn-ghost">
              Back to Dashboard
            </Link>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1px", overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="history-table" style={{ margin: 0, width: "100%", borderCollapse: "collapse" }}>
              <thead>
              <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                <th style={{ padding: "20px" }}>Rank</th>
                <th style={{ padding: "20px" }}>Candidate</th>
                <th style={{ padding: "20px" }}>Total Attempts</th>
                <th style={{ padding: "20px" }}>Latest CEFR</th>
                <th style={{ padding: "20px" }}>Highest Score</th>
                <th style={{ padding: "20px" }}>Integrity</th>
                <th style={{ padding: "20px", textAlign: "right" }}>Actions</th>
              </tr>

            </thead>
            <tbody>
              {leaderboard.map((user, index) => (
                <React.Fragment key={user.id}>
                  <tr 
                    style={{ borderTop: "1px solid var(--border-subtle)", background: expandedUser === user.id ? "rgba(99,102,241,0.05)" : "transparent" }}
                    className="hover:bg-white/5 transition-colors"
                  >
                    <td style={{ padding: "20px", fontWeight: 800, fontSize: "18px", color: index < 3 ? "var(--brand-gold)" : "var(--text-secondary)" }}>
                      #{index + 1}
                    </td>
                    <td style={{ padding: "20px" }}>
                      <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
                        {user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : user.name || "Unknown Candidate"}
                      </div>
                      <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{user.email}</div>
                      {user.mobileNumber && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>📱 {user.mobileNumber}</div>}
                    </td>
                    <td style={{ padding: "20px", fontWeight: 600 }}>{user.attempts}</td>
                    <td style={{ padding: "20px" }}>
                      {user.attempts > 0 ? (
                        <span className={`cefr-badge cefr-${user.latestCEFR}`}>
                          {user.latestCEFR}
                        </span>
                      ) : "—"}
                    </td>
                    <td style={{ padding: "20px", fontWeight: 800, fontSize: "18px", color: user.highestScore >= 70 ? "#10b981" : user.highestScore >= 50 ? "#6366f1" : "#f59e0b" }}>
                      {user.attempts > 0 ? `${user.highestScore}/100` : "—"}
                    </td>
                    <td style={{ padding: "20px" }}>
                      {user.flaggedCount > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "9999px", fontSize: "12px", fontWeight: 700, color: "#f43f5e" }}>
                          🚩 {user.flaggedCount} flagged
                        </span>
                      ) : user.attempts > 0 ? (
                        <span style={{ display: "inline-flex", alignItems: "center", gap: "5px", padding: "4px 10px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.25)", borderRadius: "9999px", fontSize: "12px", fontWeight: 700, color: "#10b981" }}>
                          ✅ Clean
                        </span>
                      ) : (
                        <span style={{ color: "var(--text-muted)", fontSize: "13px" }}>—</span>
                      )}
                    </td>
                    <td style={{ padding: "20px", textAlign: "right" }}>

                      <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", alignItems: "center" }}>
                        <button 
                          onClick={() => setEditUser(user)}
                          className="btn btn-ghost btn-sm"
                          style={{ color: "var(--brand-400)" }}
                        >
                          Edit Candidate
                        </button>
                        {user.attempts > 0 && (
                          <button 
                            onClick={() => setExpandedUser(expandedUser === user.id ? null : user.id)}
                            className="btn btn-ghost btn-sm"
                          >
                            {expandedUser === user.id ? "Hide Attempts" : "View Attempts"}
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>

                  {/* Expanded Attempts View */}
                  {expandedUser === user.id && user.assessments.length > 0 && (
                    <tr style={{ background: "rgba(0,0,0,0.2)" }}>
                      <td colSpan={6} style={{ padding: "0" }}>
                        <div style={{ padding: "24px 40px", borderBottom: "1px solid var(--border-subtle)" }}>
                          <h4 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "16px" }}>
                            Assessment History for {user.name}
                          </h4>
                          <table className="history-table" style={{ width: "100%", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                            <thead>
                              <tr>
                                <th>Date</th>
                                <th>Skill</th>
                                <th>Language</th>
                                <th>CEFR</th>
                                <th>Score</th>
                                <th>Integrity</th>
                              </tr>
                            </thead>
                            <tbody>
                              {user.assessments.map(assessment => {
                                let integrityData: { riskLevel?: string; flagged?: boolean; violationCount?: number } = {};
                                try { integrityData = assessment.integrityReport ? JSON.parse(assessment.integrityReport) : {}; } catch {}
                                return (
                                <tr 
                                  key={assessment.id}
                                  onClick={() => setSelectedAssessment(assessment)}
                                  className="cursor-pointer hover:bg-white/10 transition-colors"
                                  style={{ cursor: "pointer" }}
                                >
                                  <td>{new Date(assessment.createdAt).toLocaleDateString()}</td>
                                  <td style={{ textTransform: "capitalize" }}>{skillIcons[assessment.skill]} {assessment.skill}</td>
                                  <td style={{ textTransform: "capitalize" }}>
                                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                      {assessment.language === "english" ? <Flag country="gb" size={16} /> : <Flag country="de" size={16} />} {assessment.language}
                                    </span>
                                  </td>
                                  <td><span className={`cefr-badge cefr-${assessment.cefrLevel}`}>{assessment.cefrLevel}</span></td>
                                  <td style={{ fontWeight: 700, color: "var(--text-brand)" }}>{assessment.overallScore}/100</td>
                                  <td>
                                    {assessment.integrityReport ? (
                                      integrityData.flagged ? (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", background: "rgba(244,63,94,0.12)", border: "1px solid rgba(244,63,94,0.3)", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, color: "#f43f5e" }}>
                                          🚩 {integrityData.violationCount} violations
                                        </span>
                                      ) : (
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "3px 8px", background: "rgba(16,185,129,0.1)", border: "1px solid rgba(16,185,129,0.2)", borderRadius: "9999px", fontSize: "11px", fontWeight: 700, color: "#10b981" }}>
                                          ✅ {integrityData.violationCount ?? 0}
                                        </span>
                                      )
                                    ) : (
                                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>N/A</span>
                                    )}
                                  </td>
                                </tr>
                              )})}

                            </tbody>
                          </table>
                        </div>
                      </td>
                    </tr>
                  )}
                </React.Fragment>
              ))}
              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
                    No candidates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
          </div>
        </div>
      </div>

      {isAddUserOpen && (
        <AdminAddUserModal 
          onClose={() => setIsAddUserOpen(false)} 
          onSuccess={() => { setIsAddUserOpen(false); router.refresh(); }} 
        />
      )}
      {editUser && (
        <AdminEditUserModal 
          user={{
            id: editUser.id,
            name: editUser.firstName ? `${editUser.firstName} ${editUser.lastName || ""}`.trim() : editUser.name || editUser.email,
            email: editUser.email,
            mobileNumber: editUser.mobileNumber,
            targetCefrLevel: editUser.targetCefrLevel,
          }}
          onClose={() => setEditUser(null)} 
          onSuccess={() => { setEditUser(null); router.refresh(); }} 
        />
      )}
    </div>
  );
}
