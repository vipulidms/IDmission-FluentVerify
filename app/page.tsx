import Link from "next/link";

export default function HomePage() {
  return (
    <div>
      {/* ===== HERO ===== */}
      <section className="hero">
        <div className="hero-bg">
          <div className="hero-orb hero-orb-1" />
          <div className="hero-orb hero-orb-2" />
          <div className="hero-orb hero-orb-3" />
        </div>
        <div className="container">
          <div className="hero-content animate-fadeInUp">
            <div className="hero-badge">
              ✨ AI-Powered Language Assessment
            </div>

            <h1 className="hero-title">
              Master{" "}
              <span className="gradient-text">English & German</span>
              <br />
              with AI Assessment
            </h1>

            <p className="hero-description">
              Get instant, accurate CEFR-aligned scores across Speaking, Writing, Listening,
              and Reading. Powered by Google Gemini AI — trusted by thousands of learners worldwide.
            </p>

            {/* Language Badges */}
            <div className="lang-badges">
              <div className="lang-badge">
                <span className="lang-flag">🇬🇧</span>
                <span>English</span>
              </div>
              <div className="lang-badge">
                <span className="lang-flag">🇩🇪</span>
                <span>Deutsch</span>
              </div>
            </div>

            {/* CTA Buttons */}
            <div className="hero-cta">
              <Link href="/assessment" className="btn btn-primary btn-lg">
                Start Free Assessment →
              </Link>
            </div>

            {/* Stats */}
            <div className="hero-stats stagger-children">
              <div className="animate-fadeInUp">
                <div className="hero-stat-value">A1–C2</div>
                <div className="hero-stat-label">CEFR Levels Covered</div>
              </div>
              <div className="animate-fadeInUp">
                <div className="hero-stat-value">4</div>
                <div className="hero-stat-label">Language Skills</div>
              </div>
              <div className="animate-fadeInUp">
                <div className="hero-stat-value">2</div>
                <div className="hero-stat-label">Languages Available</div>
              </div>
              <div className="animate-fadeInUp">
                <div className="hero-stat-value">&lt;60s</div>
                <div className="hero-stat-label">AI Feedback Time</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== SKILLS SECTION ===== */}
      <section className="section" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <div className="hero-badge" style={{ display: "inline-flex" }}>
              📊 Four Core Skills
            </div>
            <h2 style={{ fontSize: "clamp(32px, 5vw, 48px)", fontWeight: 900, marginTop: "16px", marginBottom: "16px" }}>
              Complete Language{" "}
              <span className="gradient-text">Proficiency</span>
            </h2>
            <p className="text-secondary" style={{ fontSize: "18px", maxWidth: "560px", margin: "0 auto" }}>
              Our AI evaluates all four CEFR-recognized language skills for a complete picture of your proficiency.
            </p>
          </div>

          <div className="skill-grid">
            {/* Speaking */}
            <Link href="/assessment?skill=speaking" style={{ textDecoration: "none" }}>
              <div className="glass-card skill-card" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.08) 0%, rgba(139,92,246,0.05) 100%)" }}>
                <div className="skill-card-icon" style={{ background: "linear-gradient(135deg, rgba(99,102,241,0.2), rgba(139,92,246,0.15))" }}>
                  🎤
                </div>
                <div className="skill-card-title">Speaking</div>
                <div className="skill-card-description">
                  Record your voice response to prompts. Our AI evaluates pronunciation, fluency, grammar, and vocabulary range.
                </div>
                <div style={{ marginTop: "20px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "var(--text-brand)" }}>
                  Start Speaking Test →
                </div>
              </div>
            </Link>

            {/* Writing */}
            <div style={{ textDecoration: "none", opacity: 0.6 }}>
              <div className="glass-card skill-card" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.08) 0%, rgba(6,182,212,0.05) 100%)" }}>
                <div className="skill-card-icon" style={{ background: "linear-gradient(135deg, rgba(16,185,129,0.2), rgba(6,182,212,0.15))" }}>
                  ✍️
                </div>
                <div className="skill-card-title">Writing <span style={{ fontSize: "12px", background: "rgba(0,0,0,0.1)", padding: "4px 8px", borderRadius: "12px", marginLeft: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Coming Soon</span></div>
                <div className="skill-card-description">
                  Respond to prompts in writing. Scored on grammar accuracy, vocabulary range, coherence, and task achievement.
                </div>
              </div>
            </div>

            {/* Listening */}
            <div style={{ textDecoration: "none", opacity: 0.6 }}>
              <div className="glass-card skill-card" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.08) 0%, rgba(251,191,36,0.05) 100%)" }}>
                <div className="skill-card-icon" style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.2), rgba(251,191,36,0.15))" }}>
                  👂
                </div>
                <div className="skill-card-title">Listening <span style={{ fontSize: "12px", background: "rgba(0,0,0,0.1)", padding: "4px 8px", borderRadius: "12px", marginLeft: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Coming Soon</span></div>
                <div className="skill-card-description">
                  Listen to authentic audio clips and answer comprehension questions. Tests understanding of natural speech.
                </div>
              </div>
            </div>

            {/* Reading */}
            <div style={{ textDecoration: "none", opacity: 0.6 }}>
              <div className="glass-card skill-card" style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.08) 0%, rgba(251,113,133,0.05) 100%)" }}>
                <div className="skill-card-icon" style={{ background: "linear-gradient(135deg, rgba(244,63,94,0.2), rgba(251,113,133,0.15))" }}>
                  📖
                </div>
                <div className="skill-card-title">Reading <span style={{ fontSize: "12px", background: "rgba(0,0,0,0.1)", padding: "4px 8px", borderRadius: "12px", marginLeft: "12px", color: "var(--text-muted)", fontWeight: "normal" }}>Coming Soon</span></div>
                <div className="skill-card-description">
                  Read authentic passages and answer comprehension questions. Evaluates understanding, inference, and vocabulary.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ===== HOW IT WORKS ===== */}
      <section className="section">
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "60px" }}>
            <h2 style={{ fontSize: "clamp(30px, 4vw, 44px)", fontWeight: 900, marginBottom: "16px" }}>
              How It <span className="gradient-text">Works</span>
            </h2>
            <p className="text-secondary" style={{ fontSize: "17px" }}>
              Get your CEFR score in three simple steps
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "32px" }}>
            {[
              { step: "01", icon: "🎯", title: "Choose Language & Skill", desc: "Select English or German, then pick which skill you want to assess — Speaking, Writing, Listening, or Reading." },
              { step: "02", icon: "⚡", title: "Complete the Assessment", desc: "Record your voice, write a response, or answer comprehension questions. Each test takes 5–15 minutes." },
              { step: "03", icon: "📊", title: "Get Your CEFR Score", desc: "Receive instant AI feedback with your CEFR level (A1–C2), detailed scores, and personalized improvement tips." },
            ].map((item) => (
              <div key={item.step} className="glass-card" style={{ padding: "32px", textAlign: "center" }}>
                <div style={{
                  width: "56px",
                  height: "56px",
                  borderRadius: "50%",
                  background: "var(--gradient-brand)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  margin: "0 auto 20px",
                  fontSize: "13px",
                  fontWeight: 800,
                  color: "white",
                  boxShadow: "var(--shadow-glow)",
                }}>
                  {item.step}
                </div>
                <div style={{ fontSize: "36px", marginBottom: "12px" }}>{item.icon}</div>
                <h3 style={{ fontSize: "20px", fontWeight: 700, marginBottom: "12px" }}>{item.title}</h3>
                <p className="text-secondary" style={{ fontSize: "14px", lineHeight: "1.7" }}>{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CEFR SECTION ===== */}
      <section className="section" style={{ background: "var(--bg-secondary)" }}>
        <div className="container">
          <div style={{ textAlign: "center", marginBottom: "48px" }}>
            <h2 style={{ fontSize: "clamp(28px, 4vw, 42px)", fontWeight: 900, marginBottom: "16px" }}>
              CEFR Level <span className="gradient-text">Reference</span>
            </h2>
            <p className="text-secondary">International standard used by Cambridge, IELTS, Goethe-Institut and more</p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px" }}>
            {[
              { level: "A1", label: "Beginner", desc: "Basic everyday expressions", score: "0–20", color: "#10b981" },
              { level: "A2", label: "Elementary", desc: "Simple familiar topics", score: "21–35", color: "#10b981" },
              { level: "B1", label: "Intermediate", desc: "Clear standard input", score: "36–55", color: "#6366f1" },
              { level: "B2", label: "Upper-Intermediate", desc: "Complex texts and topics", score: "56–75", color: "#6366f1" },
              { level: "C1", label: "Advanced", desc: "Demanding professional texts", score: "76–90", color: "#f59e0b" },
              { level: "C2", label: "Mastery", desc: "Virtually everything", score: "91–100", color: "#f59e0b" },
            ].map((item) => (
              <div key={item.level} className="glass-card" style={{ padding: "24px", textAlign: "center" }}>
                <div style={{
                  fontSize: "36px",
                  fontWeight: 900,
                  fontFamily: "Outfit, sans-serif",
                  color: item.color,
                  marginBottom: "8px",
                }}>
                  {item.level}
                </div>
                <div style={{ fontWeight: 700, fontSize: "16px", marginBottom: "6px" }}>{item.label}</div>
                <div className="text-secondary" style={{ fontSize: "12px", lineHeight: "1.5" }}>{item.desc}</div>
                <div style={{ fontSize: "11px", color: item.color, marginTop: "8px", fontWeight: 600 }}>Score: {item.score}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ===== CTA SECTION ===== */}
      <section className="section">
        <div className="container">
          <div style={{
            textAlign: "center",
            padding: "80px 40px",
            background: "linear-gradient(135deg, rgba(99,102,241,0.1) 0%, rgba(139,92,246,0.08) 100%)",
            border: "1px solid var(--border-brand)",
            borderRadius: "var(--radius-xl)",
            position: "relative",
            overflow: "hidden",
          }}>
            <div style={{
              position: "absolute",
              top: "-50%",
              right: "-10%",
              width: "400px",
              height: "400px",
              background: "radial-gradient(circle, rgba(99,102,241,0.15), transparent)",
              borderRadius: "50%",
              filter: "blur(60px)",
            }} />
            <h2 style={{ fontSize: "clamp(28px, 4vw, 44px)", fontWeight: 900, marginBottom: "16px", position: "relative" }}>
              Ready to Discover Your{" "}
              <span className="gradient-text">Language Level?</span>
            </h2>
            <p className="text-secondary" style={{ fontSize: "18px", marginBottom: "36px", position: "relative" }}>
              Join thousands of learners who use IDmission FluentVerify to assess and improve their language skills.
            </p>
            <div style={{ display: "flex", gap: "16px", justifyContent: "center", flexWrap: "wrap", position: "relative" }}>
              <Link href="/assessment" className="btn btn-primary btn-lg">
                Start Free Assessment
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
