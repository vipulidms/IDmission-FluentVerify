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
  assessmentLanguage?: string;
  allowedAttempts?: number;
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

  // State for filtering & searching
  const [searchTerm, setSearchTerm] = useState("");
  const [langFilter, setLangFilter] = useState("all");
  const [targetCefrFilter, setTargetCefrFilter] = useState("all");
  const [latestCefrFilter, setLatestCefrFilter] = useState("all");
  const [attemptsFilter, setAttemptsFilter] = useState("all"); // 'all' | 'has_attempts' | 'no_attempts'
  const [integrityFilter, setIntegrityFilter] = useState("all"); // 'all' | 'clean' | 'flagged'
  const [sortBy, setSortBy] = useState<"highestScore" | "name" | "attempts" | "latestCEFR" | "flaggedCount">("highestScore");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Process users to compute initial scores, flags, and ranks
  const processedUsers = useMemo(() => {
    const mapped = users.map(user => {
      const attempts = user.assessments.length;
      const highestScore = user.assessments.reduce((max, a) => Math.max(max, a.overallScore), 0);
      const latestCEFR = user.assessments.length > 0 ? user.assessments[0].cefrLevel : "—";
      const flaggedCount = user.assessments.filter(a => {
        try { return a.integrityReport ? JSON.parse(a.integrityReport).flagged : false; } catch { return false; }
      }).length;
      return { ...user, attempts, highestScore, latestCEFR, flaggedCount };
    });

    // Sort by highestScore desc to calculate actual rank
    mapped.sort((a, b) => b.highestScore - a.highestScore);

    return mapped.map((user, index) => ({
      ...user,
      rank: index + 1
    }));
  }, [users]);

  // Filter users based on query criteria
  const filteredLeaderboard = useMemo(() => {
    return processedUsers.filter(user => {
      const name = user.firstName || user.lastName 
        ? `${user.firstName || ""} ${user.lastName || ""}`.toLowerCase() 
        : (user.name || "").toLowerCase();
      const email = user.email.toLowerCase();
      const mobile = (user.mobileNumber || "").toLowerCase();
      const query = searchTerm.toLowerCase().trim();
      
      if (query && !name.includes(query) && !email.includes(query) && !mobile.includes(query)) {
        return false;
      }

      if (langFilter !== "all") {
        if (user.assessmentLanguage?.toLowerCase() !== langFilter.toLowerCase()) {
          return false;
        }
      }

      if (targetCefrFilter !== "all") {
        if (user.targetCefrLevel !== targetCefrFilter) {
          return false;
        }
      }

      if (latestCefrFilter !== "all") {
        if (user.latestCEFR !== latestCefrFilter) {
          return false;
        }
      }

      if (attemptsFilter !== "all") {
        if (attemptsFilter === "has_attempts" && user.attempts === 0) {
          return false;
        }
        if (attemptsFilter === "no_attempts" && user.attempts > 0) {
          return false;
        }
      }

      if (integrityFilter !== "all") {
        if (integrityFilter === "clean" && user.flaggedCount > 0) {
          return false;
        }
        if (integrityFilter === "flagged" && user.flaggedCount === 0) {
          return false;
        }
      }

      return true;
    });
  }, [processedUsers, searchTerm, langFilter, targetCefrFilter, latestCefrFilter, attemptsFilter, integrityFilter]);

  // Sort filtered users
  const sortedLeaderboard = useMemo(() => {
    const sorted = [...filteredLeaderboard];
    sorted.sort((a, b) => {
      let aVal: any = a[sortBy];
      let bVal: any = b[sortBy];

      if (sortBy === "name") {
        const aName = a.firstName || a.lastName ? `${a.firstName || ""} ${a.lastName || ""}`.trim() : a.name || a.email;
        const bName = b.firstName || b.lastName ? `${b.firstName || ""} ${b.lastName || ""}`.trim() : b.name || b.email;
        aVal = aName.toLowerCase();
        bVal = bName.toLowerCase();
      } else if (sortBy === "latestCEFR") {
        const levels = ["—", "A1", "A2", "B1", "B2", "C1", "C2"];
        aVal = levels.indexOf(a.latestCEFR);
        bVal = levels.indexOf(b.latestCEFR);
      }

      if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
      if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
      return 0;
    });
    return sorted;
  }, [filteredLeaderboard, sortBy, sortOrder]);

  // Compute dynamic stats based on filtered candidates
  const stats = useMemo(() => {
    const total = filteredLeaderboard.length;
    const withAttempts = filteredLeaderboard.filter(u => u.attempts > 0);
    const avgScore = withAttempts.length > 0
      ? Math.round(withAttempts.reduce((sum, u) => sum + u.highestScore, 0) / withAttempts.length)
      : 0;
    const totalAttemptsCount = filteredLeaderboard.reduce((sum, u) => sum + u.attempts, 0);
    const flaggedAttemptsCount = filteredLeaderboard.reduce((sum, u) => sum + u.flaggedCount, 0);

    return {
      total,
      avgScore,
      totalAttemptsCount,
      flaggedAttemptsCount
    };
  }, [filteredLeaderboard]);

  const handleSort = (field: typeof sortBy) => {
    if (sortBy === field) {
      setSortOrder(prev => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const renderSortIndicator = (field: typeof sortBy) => {
    if (sortBy !== field) return null;
    return sortOrder === "asc" ? " ▲" : " ▼";
  };

  const exportToCSV = () => {
    const headers = [
      "Rank",
      "Candidate Name",
      "Email",
      "Mobile",
      "Language",
      "Target CEFR",
      "Allowed Attempts",
      "Total Attempts",
      "Latest CEFR Level",
      "Highest Score",
      "Integrity Flags"
    ];

    const rows = filteredLeaderboard.map(user => {
      const name = user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : user.name || "Unknown Candidate";
      return [
        user.rank,
        name,
        user.email,
        user.mobileNumber || "N/A",
        user.assessmentLanguage || "english",
        user.targetCefrLevel || "N/A",
        user.allowedAttempts ?? 1,
        user.attempts,
        user.latestCEFR,
        user.attempts > 0 ? user.highestScore : "N/A",
        user.flaggedCount
      ];
    });

    const csvContent = [
      headers.join(","),
      ...rows.map(row =>
        row.map(val => {
          const strVal = String(val);
          if (strVal.includes(",") || strVal.includes('"') || strVal.includes("\n")) {
            return `"${strVal.replace(/"/g, '""')}"`;
          }
          return strVal;
        }).join(",")
      )
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `fluentverify_candidates_report_${new Date().toISOString().slice(0, 10)}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const isFilterActive =
    searchTerm !== "" ||
    langFilter !== "all" ||
    targetCefrFilter !== "all" ||
    latestCefrFilter !== "all" ||
    attemptsFilter !== "all" ||
    integrityFilter !== "all";

  const clearFilters = () => {
    setSearchTerm("");
    setLangFilter("all");
    setTargetCefrFilter("all");
    setLatestCefrFilter("all");
    setAttemptsFilter("all");
    setIntegrityFilter("all");
    setSortBy("highestScore");
    setSortOrder("desc");
  };



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

        {/* Dynamic Report Summary Statistics Cards */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "20px", marginBottom: "30px" }}>
          {/* Card 1: Total Candidates */}
          <div className="glass-card" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.02)", display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Candidates</span>
              <span style={{ fontSize: "20px" }}>👥</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)" }}>
              {stats.total} <span style={{ fontSize: "16px", fontWeight: 500, color: "var(--text-muted)" }}>/ {users.length}</span>
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Matching current criteria</div>
          </div>

          {/* Card 2: Average Score */}
          <div className="glass-card" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.02)", display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Avg. Highest Score</span>
              <span style={{ fontSize: "20px" }}>🏆</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: stats.avgScore >= 70 ? "var(--brand-green)" : stats.avgScore >= 50 ? "#6366f1" : "var(--brand-gold)" }}>
              {stats.avgScore}%
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>For candidates with attempts</div>
          </div>

          {/* Card 3: Total Attempts */}
          <div className="glass-card" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.02)", display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Total Attempts</span>
              <span style={{ fontSize: "20px" }}>📝</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: "var(--text-primary)" }}>
              {stats.totalAttemptsCount}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Across filtered candidates</div>
          </div>

          {/* Card 4: Flagged Attempts */}
          <div className="glass-card" style={{ padding: "24px", background: "rgba(255, 255, 255, 0.02)", display: "flex", flexDirection: "column", gap: "10px", position: "relative", overflow: "hidden" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontSize: "12px", color: "var(--text-muted)", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.06em" }}>Flagged Attempts</span>
              <span style={{ fontSize: "20px" }}>🚩</span>
            </div>
            <div style={{ fontSize: "32px", fontWeight: 800, color: stats.flaggedAttemptsCount > 0 ? "var(--brand-rose)" : "var(--brand-green)" }}>
              {stats.flaggedAttemptsCount}
            </div>
            <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Integrity violations identified</div>
          </div>
        </div>

        {/* Filter & Search Bar */}
        <div className="glass-card" style={{ padding: "24px", marginBottom: "30px", background: "rgba(21, 27, 61, 0.3)", border: "1px solid var(--border-subtle)" }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", alignItems: "flex-end" }}>
              {/* Search Candidate */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px", gridColumn: "span 2" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Search Candidate</label>
                <div style={{ position: "relative" }}>
                  <input 
                    type="text" 
                    value={searchTerm} 
                    onChange={(e) => setSearchTerm(e.target.value)} 
                    placeholder="Search by name, email, or mobile..." 
                    className="form-input" 
                    style={{ paddingLeft: "40px" }}
                  />
                  <span style={{ position: "absolute", left: "14px", top: "50%", transform: "translateY(-50%)", color: "var(--text-muted)", fontSize: "16px" }}>🔍</span>
                </div>
              </div>

              {/* Language Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Language</label>
                <select 
                  value={langFilter} 
                  onChange={(e) => setLangFilter(e.target.value)} 
                  className="form-input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="all">All Languages</option>
                  <option value="english">🇬🇧 English</option>
                  <option value="german">🇩🇪 German</option>
                </select>
              </div>

              {/* Target CEFR Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Target CEFR</label>
                <select 
                  value={targetCefrFilter} 
                  onChange={(e) => setTargetCefrFilter(e.target.value)} 
                  className="form-input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="all">All Levels</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>

              {/* Latest CEFR Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Latest CEFR</label>
                <select 
                  value={latestCefrFilter} 
                  onChange={(e) => setLatestCefrFilter(e.target.value)} 
                  className="form-input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="all">All Levels</option>
                  <option value="—">No CEFR (—)</option>
                  <option value="A1">A1</option>
                  <option value="A2">A2</option>
                  <option value="B1">B1</option>
                  <option value="B2">B2</option>
                  <option value="C1">C1</option>
                  <option value="C2">C2</option>
                </select>
              </div>

              {/* Attempts Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Attempts</label>
                <select 
                  value={attemptsFilter} 
                  onChange={(e) => setAttemptsFilter(e.target.value)} 
                  className="form-input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="all">All Statuses</option>
                  <option value="has_attempts">Has Attempts</option>
                  <option value="no_attempts">No Attempts</option>
                </select>
              </div>

              {/* Integrity Filter */}
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "var(--text-secondary)", textTransform: "uppercase", letterSpacing: "0.05em" }}>Integrity</label>
                <select 
                  value={integrityFilter} 
                  onChange={(e) => setIntegrityFilter(e.target.value)} 
                  className="form-input"
                  style={{ cursor: "pointer" }}
                >
                  <option value="all">All States</option>
                  <option value="clean">✅ Clean</option>
                  <option value="flagged">🚩 Flagged</option>
                </select>
              </div>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", paddingTop: "12px", borderTop: "1px solid var(--border-subtle)", marginTop: "8px" }}>
              <div>
                {isFilterActive && (
                  <button 
                    onClick={clearFilters} 
                    className="btn btn-ghost btn-sm"
                    style={{ color: "var(--brand-rose)" }}
                  >
                    🧹 Clear Filters
                  </button>
                )}
              </div>
              <div style={{ display: "flex", gap: "12px" }}>
                <button 
                  onClick={exportToCSV} 
                  className="btn btn-outline btn-sm"
                  style={{ display: "flex", alignItems: "center", gap: "6px" }}
                >
                  📥 Export CSV Report ({filteredLeaderboard.length} candidates)
                </button>
              </div>
            </div>
          </div>
        </div>

        <div className="glass-card" style={{ padding: "1px", overflow: "hidden" }}>
          <div className="table-responsive">
            <table className="history-table" style={{ margin: 0, width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.02)" }}>
                  <th style={{ padding: "20px", textAlign: "left" }}>Rank</th>
                  <th 
                    onClick={() => handleSort("name")} 
                    style={{ padding: "20px", cursor: "pointer", userSelect: "none", textAlign: "left" }}
                    className="hover:text-brand transition-colors"
                  >
                    Candidate{renderSortIndicator("name")}
                  </th>
                  <th 
                    onClick={() => handleSort("attempts")} 
                    style={{ padding: "20px", cursor: "pointer", userSelect: "none", textAlign: "left" }}
                    className="hover:text-brand transition-colors"
                  >
                    Total Attempts{renderSortIndicator("attempts")}
                  </th>
                  <th 
                    onClick={() => handleSort("latestCEFR")} 
                    style={{ padding: "20px", cursor: "pointer", userSelect: "none", textAlign: "left" }}
                    className="hover:text-brand transition-colors"
                  >
                    Latest CEFR{renderSortIndicator("latestCEFR")}
                  </th>
                  <th 
                    onClick={() => handleSort("highestScore")} 
                    style={{ padding: "20px", cursor: "pointer", userSelect: "none", textAlign: "left" }}
                    className="hover:text-brand transition-colors"
                  >
                    Highest Score{renderSortIndicator("highestScore")}
                  </th>
                  <th 
                    onClick={() => handleSort("flaggedCount")} 
                    style={{ padding: "20px", cursor: "pointer", userSelect: "none", textAlign: "left" }}
                    className="hover:text-brand transition-colors"
                  >
                    Integrity{renderSortIndicator("flaggedCount")}
                  </th>
                  <th style={{ padding: "20px", textAlign: "right" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {sortedLeaderboard.map((user) => (
                  <React.Fragment key={user.id}>
                    <tr 
                      style={{ borderTop: "1px solid var(--border-subtle)", background: expandedUser === user.id ? "rgba(99,102,241,0.05)" : "transparent" }}
                      className="hover:bg-white/5 transition-colors"
                    >
                      <td style={{ padding: "20px", fontWeight: 800, fontSize: "18px", color: user.rank <= 3 ? "var(--brand-gold)" : "var(--text-secondary)" }}>
                        #{user.rank}
                      </td>
                      <td style={{ padding: "20px" }}>
                        <div style={{ fontWeight: 700, fontSize: "16px", color: "var(--text-primary)" }}>
                          {user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : user.name || "Unknown Candidate"}
                        </div>
                        <div style={{ fontSize: "13px", color: "var(--text-muted)" }}>{user.email}</div>
                        {user.mobileNumber && <div style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>📱 {user.mobileNumber}</div>}
                      </td>
                      <td style={{ padding: "20px", fontWeight: 600, color: (user.attempts >= (user.allowedAttempts ?? 1)) ? "var(--brand-rose)" : "var(--text-primary)" }}>
                        {user.attempts} / {user.allowedAttempts ?? 1}
                      </td>
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
                        <td colSpan={7} style={{ padding: "0" }}>
                          <div style={{ padding: "24px 40px", borderBottom: "1px solid var(--border-subtle)" }}>
                            <h4 style={{ fontSize: "14px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.08em", color: "var(--text-secondary)", marginBottom: "16px" }}>
                              Assessment History for {user.firstName || user.lastName ? `${user.firstName || ""} ${user.lastName || ""}`.trim() : user.name || "Unknown Candidate"}
                            </h4>
                            <table className="history-table" style={{ width: "100%", background: "var(--bg-card)", borderRadius: "var(--radius-lg)", overflow: "hidden" }}>
                              <thead>
                                <tr>
                                  <th>Date</th>
                                  <th>Skill</th>
                                  <th>Language</th>
                                  <th>CEFR</th>
                                  <th>Score</th>
                                  <th>Location & IP</th>
                                  <th>Integrity</th>
                                </tr>
                              </thead>
                              <tbody>
                                {user.assessments.map(assessment => {
                                  let integrityData: { riskLevel?: string; flagged?: boolean; violationCount?: number; geoInfo?: { ip?: string; lat?: number; lng?: number } } = {};
                                  try { integrityData = assessment.integrityReport ? JSON.parse(assessment.integrityReport) : {}; } catch {}
                                  return (
                                    <tr 
                                      key={assessment.id}
                                      onClick={() => setSelectedAssessment(assessment)}
                                      className="cursor-pointer hover:bg-white/10 transition-colors"
                                      style={{ cursor: "pointer" }}
                                    >
                                      <td>
                                        <div>{new Date(assessment.createdAt).toLocaleDateString()}</div>
                                        <div style={{ fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                                          {new Date(assessment.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                        </div>
                                      </td>
                                      <td style={{ textTransform: "capitalize" }}>{skillIcons[assessment.skill]} {assessment.skill}</td>
                                      <td style={{ textTransform: "capitalize" }}>
                                        <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                                          {assessment.language === "english" ? <Flag country="gb" size={16} /> : <Flag country="de" size={16} />} {assessment.language}
                                        </span>
                                      </td>
                                      <td><span className={`cefr-badge cefr-${assessment.cefrLevel}`}>{assessment.cefrLevel}</span></td>
                                      <td style={{ fontWeight: 700, color: "var(--text-brand)" }}>{assessment.overallScore}/100</td>
                                      <td>
                                        {integrityData.geoInfo ? (
                                          <div style={{ fontSize: "11px", color: "var(--text-secondary)", display: "flex", flexDirection: "column", gap: "2px", whiteSpace: "nowrap" }}>
                                            {integrityData.geoInfo.ip && <div>🌐 {integrityData.geoInfo.ip}</div>}
                                            {integrityData.geoInfo.lat !== undefined && integrityData.geoInfo.lng !== undefined && <div>📍 {integrityData.geoInfo.lat.toFixed(4)}, {integrityData.geoInfo.lng.toFixed(4)}</div>}
                                          </div>
                                        ) : (
                                          <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>—</span>
                                        )}
                                      </td>
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
                                  );
                                })}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
                {sortedLeaderboard.length === 0 && (
                  <tr>
                    <td colSpan={7} style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
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
            assessmentLanguage: editUser.assessmentLanguage,
          }}
          onClose={() => setEditUser(null)} 
          onSuccess={() => { setEditUser(null); router.refresh(); }} 
        />
      )}
    </div>
  );
}
