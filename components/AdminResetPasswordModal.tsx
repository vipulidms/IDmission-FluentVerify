"use client";
import { useState } from "react";

interface Props {
  userId: string;
  userName: string;
  onClose: () => void;
  onSuccess: () => void;
}

export default function AdminResetPasswordModal({ userId, userName, onClose, onSuccess }: Props) {
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    try {
      const res = await fetch(`/api/admin/users/${userId}/password`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to reset password");
      
      onSuccess();
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: "fixed", inset: 0, zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}>
      <div className="glass-card animate-scaleIn" style={{ width: "100%", maxWidth: "400px", padding: "32px", position: "relative" }}>
        <button onClick={onClose} style={{ position: "absolute", top: "20px", right: "20px", background: "none", border: "none", color: "var(--text-muted)", cursor: "pointer", fontSize: "20px" }}>✕</button>
        <h2 style={{ fontSize: "20px", fontWeight: 800, marginBottom: "8px" }}>Reset Password</h2>
        <p className="text-secondary" style={{ fontSize: "14px", marginBottom: "24px" }}>For candidate: <strong style={{ color: "var(--text-primary)" }}>{userName}</strong></p>
        
        {error && <div className="alert alert-error" style={{ marginBottom: "16px" }}>⚠️ {error}</div>}
        
        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="form-group">
            <label className="form-label">New Password</label>
            <input type="text" className="form-input" value={password} onChange={e => setPassword(e.target.value)} required minLength={8} placeholder="Minimum 8 characters" />
          </div>

          <button type="submit" className="btn btn-primary" disabled={loading} style={{ width: "100%", padding: "14px", marginTop: "8px" }}>
            {loading ? "Updating..." : "Update Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
