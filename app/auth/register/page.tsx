"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { signIn } from "next-auth/react";

export default function RegisterPage() {
  const router = useRouter();
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [mobileNumber, setMobileNumber] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [targetCefrLevel, setTargetCefrLevel] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (password !== confirmPassword) {
      setError("Passwords do not match");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ firstName, lastName, mobileNumber, email, password, targetCefrLevel: targetCefrLevel || null }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Registration failed");
        setLoading(false);
        return;
      }

      // Auto sign in after registration
      const signInResult = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (signInResult?.error) {
        router.push("/auth/login");
      } else {
        router.push("/dashboard");
        router.refresh();
      }
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="page-wrapper" style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", padding: "24px" }}>
      {/* Background */}
      <div style={{ position: "fixed", inset: 0, background: "var(--gradient-hero)", zIndex: 0 }}>
        <div className="hero-orb hero-orb-1" />
        <div className="hero-orb hero-orb-2" />
      </div>

      <div className="animate-scaleIn" style={{
        position: "relative",
        zIndex: 1,
        width: "100%",
        maxWidth: "440px",
        background: "rgba(13, 17, 23, 0.85)",
        backdropFilter: "blur(24px)",
        border: "1px solid var(--border-glass)",
        borderRadius: "var(--radius-xl)",
        padding: "48px 40px",
        boxShadow: "var(--shadow-lg), var(--shadow-glow)",
      }}>
        {/* Logo */}
        <div style={{ textAlign: "center", marginBottom: "36px" }}>
          <div style={{ display: "inline-flex", alignItems: "center", fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "24px" }}>
            <span className="gradient-text">FluentVerify</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginTop: "24px", marginBottom: "8px" }}>Create your account</h1>
          <p className="text-secondary" style={{ fontSize: "15px" }}>Start your language assessment journey</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "18px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "18px" }}>
          <div className="form-group">
            <label className="form-label">First Name</label>
            <input
              id="register-firstname"
              type="text"
              className="form-input"
              placeholder="John"
              value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              required
              autoComplete="given-name"
            />
          </div>
          <div className="form-group">
            <label className="form-label">Last Name</label>
            <input
              id="register-lastname"
              type="text"
              className="form-input"
              placeholder="Doe"
              value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              required
              autoComplete="family-name"
            />
          </div>
        </div>

        <div className="form-group">
          <label className="form-label">Mobile Number</label>
          <input
            id="register-mobile"
            type="tel"
            className="form-input"
            placeholder="+1 (555) 000-0000"
            value={mobileNumber}
            onChange={(e) => setMobileNumber(e.target.value)}
            autoComplete="tel"
          />
        </div>

          <div className="form-group">
            <label className="form-label">Email Address</label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="email"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              id="register-password"
              type="password"
              className="form-input"
              placeholder="Minimum 8 characters"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="new-password"
              minLength={8}
            />
          </div>

          <div className="form-group">
            <label className="form-label">Confirm Password</label>
            <input
              id="register-confirm-password"
              type="password"
              className="form-input"
              placeholder="Repeat your password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              autoComplete="new-password"
            />
          </div>

          <div className="form-group">
            <label className="form-label">Target CEFR Level (Optional)</label>
            <select className="form-input" value={targetCefrLevel} onChange={e => setTargetCefrLevel(e.target.value)}>
              <option value="">None (Assess all levels)</option>
              <option value="A1">A1 - Beginner</option>
              <option value="A2">A2 - Elementary</option>
              <option value="B1">B1 - Intermediate</option>
              <option value="B2">B2 - Upper-Intermediate</option>
              <option value="C1">C1 - Advanced</option>
              <option value="C2">C2 - Mastery</option>
            </select>
            <p style={{ fontSize: "12px", color: "var(--text-muted)", marginTop: "4px" }}>Select this if you are practicing for a specific level.</p>
          </div>

          <button
            id="register-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "16px", fontSize: "16px", marginTop: "4px" }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Creating account...
              </>
            ) : (
              "Create Account"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <p className="text-secondary" style={{ fontSize: "14px" }}>
            Already have an account?{" "}
            <Link href="/auth/login" style={{ color: "var(--text-brand)", fontWeight: 600 }}>
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
