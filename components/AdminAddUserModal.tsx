"use client";
import { useState } from "react";

interface Props {
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminAddUserModal({ onClose, onSuccess }: Props) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("user");
  const [targetCefrLevel, setTargetCefrLevel] = useState("");
  const [assessmentLanguage, setAssessmentLanguage] = useState("english");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, mobileNumber, email, password, role, targetCefrLevel: targetCefrLevel || null, assessmentLanguage }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to add user");
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card animate-scaleIn" style={{ width: "100%", maxWidth: "480px", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px" }}>✕</button>
        <h2 style={{ fontSize: "24px", fontWeight: 800, marginBottom: "24px" }}>Add Candidate</h2>
        
        {error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>⚠️ {error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
            <div className="form-group">
              <label className="form-label">First Name</label>
              <input type="text" className="form-input" value={firstName} onChange={e => setFirstName(e.target.value)} required />
            </div>
            <div className="form-group">
              <label className="form-label">Last Name</label>
              <input type="text" className="form-input" value={lastName} onChange={e => setLastName(e.target.value)} required />
            </div>
          </div>
          
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input type="tel" className="form-input" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
          </div>
          
          <div className="form-group">
            <label className="form-label">Temporary Password</label>
            <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} />
          </div>

          <div className="form-group">
            <label className="form-label">Role</label>
            <select className="form-input" value={role} onChange={e => setRole(e.target.value)}>
              <option value="user">Candidate (User)</option>
              <option value="admin">Super Admin</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Target CEFR Level</label>
            <select className="form-input" value={targetCefrLevel} onChange={e => setTargetCefrLevel(e.target.value)}>
              <option value="">None (Assess all levels)</option>
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper-Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Mastery</option>
            </select>
          </div>

          <div className="form-group">
            <label className="form-label">Assessment Language</label>
            <select className="form-input" value={assessmentLanguage} onChange={e => setAssessmentLanguage(e.target.value)}>
              <option value="english">English 🇬🇧</option>
              <option value="german">German 🇩🇪</option>
            </select>
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", marginTop: "8px" }}>
            {loading ? "Adding..." : "Add User"}
          </button>
        </form>
      </div>
    </div>
  );
}
