"use client";
import { useState } from "react";

interface Props {
  user: {
    id: string;
    name: string | null;
    email: string;
    mobileNumber: string | null;
    targetCefrLevel?: string | null;
  };
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminEditUserModal({ user, onClose, onSuccess }: Props) {
  const [email, setEmail] = useState(user.email);
  const [mobileNumber, setMobileNumber] = useState(user.mobileNumber || "");
  const [targetCefrLevel, setTargetCefrLevel] = useState(user.targetCefrLevel || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${user.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, mobileNumber, targetCefrLevel: targetCefrLevel || null, password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to edit user");
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card animate-scaleIn" style={{ width: "100%", maxWidth: "440px", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px" }}>✕</button>
        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Edit Candidate</h2>
        <p className="text-secondary" style={{ fontSize: "14px", marginBottom: "24px" }}>Editing: <strong style={{ color: "var(--text-primary)" }}>{user.name}</strong></p>
        
        {error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>⚠️ {error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">Email</label>
            <input type="email" className="form-input" value={email} onChange={e => setEmail(e.target.value)} required />
          </div>

          <div className="form-group">
            <label className="form-label">Mobile Number</label>
            <input type="tel" className="form-input" value={mobileNumber} onChange={e => setMobileNumber(e.target.value)} />
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
            <label className="form-label">New Password (Optional)</label>
            <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} minLength={8} placeholder="Leave blank to keep current password" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", marginTop: "8px" }}>
            {loading ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </div>
  );
}
