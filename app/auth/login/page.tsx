"use client";
import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Logo from "@/components/Logo";

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email,
      password,
      redirect: false,
    });

    setLoading(false);
    if (result?.error) {
      setError(result.error);
    } else {
      router.push("/dashboard");
      router.refresh();
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
          <div style={{ display: "inline-flex", alignItems: "center", gap: "12px", fontFamily: "Outfit, sans-serif", fontWeight: 800, fontSize: "22px" }}>
            <Logo size="lg" />
            <span><span className="gradient-text">IDmission</span> FluentVerify</span>
          </div>
          <h1 style={{ fontSize: "28px", fontWeight: 800, marginTop: "24px", marginBottom: "8px" }}>Welcome back</h1>
          <p className="text-secondary" style={{ fontSize: "15px" }}>Sign in to your account to continue</p>
        </div>

        {error && (
          <div className="alert alert-error" style={{ marginBottom: "24px" }}>
            ⚠️ {error}
          </div>
        )}

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
          <div className="form-group">
            <label className="form-label">Email address</label>
            <input
              id="login-email"
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
              id="login-password"
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              autoComplete="current-password"
            />
          </div>

          <button
            id="login-submit"
            type="submit"
            className="btn btn-primary"
            disabled={loading}
            style={{ width: "100%", padding: "16px", fontSize: "16px", marginTop: "4px" }}
          >
            {loading ? (
              <>
                <div className="spinner" />
                Signing in...
              </>
            ) : (
              "Sign In"
            )}
          </button>
        </form>

        <div style={{ textAlign: "center", marginTop: "28px" }}>
          <p className="text-secondary" style={{ fontSize: "14px" }}>
            Don&apos;t have an account?{" "}
            <Link href="/auth/register" style={{ color: "var(--text-brand)", fontWeight: 600 }}>
              Create one free
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
