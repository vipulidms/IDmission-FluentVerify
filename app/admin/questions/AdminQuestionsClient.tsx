"use client";
import React, { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

interface QuestionSet {
  id: string;
  language: string;
  level: string;
  sec1Topic: string;
  sec1FollowUp1: string;
  sec1FollowUp2: string;
  sec2Topic: string;
  sec3Paragraph: string;
  createdAt: Date;
}

export default function AdminQuestionsClient({ questionSets }: { questionSets: QuestionSet[] }) {
  const router = useRouter();
  const [isAdding, setIsAdding] = useState(false);
  const [loading, setLoading] = useState(false);
  
  const [language, setLanguage] = useState("english");
  const [level, setLevel] = useState("B2");
  const [sec1Topic, setSec1Topic] = useState("");
  const [sec1FollowUp1, setSec1FollowUp1] = useState("");
  const [sec1FollowUp2, setSec1FollowUp2] = useState("");
  const [sec2Topic, setSec2Topic] = useState("");
  const [sec3Paragraph, setSec3Paragraph] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const res = await fetch("/api/admin/questions", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          language, level, sec1Topic, sec1FollowUp1, sec1FollowUp2, sec2Topic, sec3Paragraph
        }),
      });

      if (!res.ok) throw new Error("Failed");
      
      setIsAdding(false);
      
      // Reset form
      setSec1Topic("");
      setSec1FollowUp1("");
      setSec1FollowUp2("");
      setSec2Topic("");
      setSec3Paragraph("");
      
      router.refresh();
    } catch (err) {
      alert("Failed to add question set.");
    } finally {
      setLoading(false);
    }
  };

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
              Question <span className="gradient-text">Sets</span>
            </h1>
            <p className="text-secondary">Manage randomized assessment prompts.</p>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={() => setIsAdding(!isAdding)} className="btn btn-primary">
              {isAdding ? "Cancel" : "+ Add New Set"}
            </button>
            <Link href="/admin" className="btn btn-ghost">
              Back to Leaderboard
            </Link>
          </div>
        </div>

        {isAdding && (
          <div className="glass-card animate-fadeInUp" style={{ padding: "32px", marginBottom: "40px" }}>
            <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "24px" }}>Add New Question Set</h2>
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label">Language</label>
                  <select className="form-input" value={language} onChange={e => setLanguage(e.target.value)}>
                    <option value="english">English</option>
                    <option value="german">German</option>
                  </select>
                </div>
                <div className="form-group">
                  <label className="form-label">Target CEFR Level</label>
                  <select className="form-input" value={level} onChange={e => setLevel(e.target.value)}>
                    <option value="A1">A1</option><option value="A2">A2</option>
                    <option value="B1">B1</option><option value="B2">B2</option>
                    <option value="C1">C1</option><option value="C2">C2</option>
                  </select>
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Section 1: Main Topic</label>
                <textarea className="form-input form-textarea" value={sec1Topic} onChange={e => setSec1Topic(e.target.value)} required rows={2} />
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div className="form-group">
                  <label className="form-label">Section 1: Follow-up Question 1</label>
                  <textarea className="form-input form-textarea" value={sec1FollowUp1} onChange={e => setSec1FollowUp1(e.target.value)} required rows={2} />
                </div>
                <div className="form-group">
                  <label className="form-label">Section 1: Follow-up Question 2</label>
                  <textarea className="form-input form-textarea" value={sec1FollowUp2} onChange={e => setSec1FollowUp2(e.target.value)} required rows={2} />
                </div>
              </div>

              <div className="form-group">
                <label className="form-label">Section 2: New Topic</label>
                <textarea className="form-input form-textarea" value={sec2Topic} onChange={e => setSec2Topic(e.target.value)} required rows={2} />
              </div>

              <div className="form-group">
                <label className="form-label">Section 3: Reading Paragraph</label>
                <textarea className="form-input form-textarea" value={sec3Paragraph} onChange={e => setSec3Paragraph(e.target.value)} required rows={4} />
              </div>

              <div style={{ textAlign: "right" }}>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                  {loading ? "Saving..." : "Save Question Set"}
                </button>
              </div>
            </form>
          </div>
        )}

        <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          {questionSets.map(qs => (
            <div key={qs.id} className="glass-card" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                  <span style={{ fontSize: "24px" }}>{qs.language === "english" ? "🇬🇧" : "🇩🇪"}</span>
                  <span className={`cefr-badge cefr-${qs.level}`}>{qs.level}</span>
                </div>
                <div className="text-muted" style={{ fontSize: "13px" }}>
                  Added: {new Date(qs.createdAt).toLocaleDateString()}
                </div>
              </div>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
                <div><strong style={{ color: "var(--brand-400)" }}>Sec 1 Topic:</strong> {qs.sec1Topic}</div>
                <div><strong style={{ color: "var(--brand-400)" }}>Sec 1 Q1:</strong> {qs.sec1FollowUp1}</div>
                <div><strong style={{ color: "var(--brand-400)" }}>Sec 1 Q2:</strong> {qs.sec1FollowUp2}</div>
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <strong style={{ color: "var(--brand-gold)" }}>Sec 2 Topic:</strong> {qs.sec2Topic}
                </div>
                <div style={{ borderTop: "1px solid var(--border-subtle)", paddingTop: "12px" }}>
                  <strong style={{ color: "var(--brand-rose)" }}>Sec 3 Paragraph:</strong> {qs.sec3Paragraph}
                </div>
              </div>
            </div>
          ))}
          {questionSets.length === 0 && (
            <div className="glass-card" style={{ padding: "40px", textAlign: "center", color: "var(--text-muted)" }}>
              No question sets found.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
