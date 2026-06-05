import Link from "next/link";

export default function Footer() {
  return (
    <footer className="footer">
      <div className="container">
        <div className="footer-grid">
          <div>
            <div className="navbar-logo" style={{ marginBottom: "16px" }}>
              <div className="navbar-logo-icon">🌍</div>
              <span>
                <span className="gradient-text">IDmission</span> FluentVerify
              </span>
            </div>
            <p className="footer-brand-desc">
              AI-powered language assessment for English and German. Get accurate CEFR scores in minutes with our advanced AI evaluation system.
            </p>
          </div>

          <div>
            <h4 className="footer-title">Product</h4>
            <ul className="footer-links">
              <li><Link href="/assessment">Start Assessment</Link></li>
              <li><Link href="/assessment?skill=speaking">Speaking Test</Link></li>
              <li><Link href="/assessment?skill=writing">Writing Test</Link></li>
              <li><Link href="/assessment?skill=reading">Reading Test</Link></li>
              <li><Link href="/assessment?skill=listening">Listening Test</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Languages</h4>
            <ul className="footer-links">
              <li><Link href="/assessment?lang=english">🇬🇧 English Assessment</Link></li>
              <li><Link href="/assessment?lang=german">🇩🇪 German Assessment</Link></li>
            </ul>
          </div>

          <div>
            <h4 className="footer-title">Account</h4>
            <ul className="footer-links">
              <li><Link href="/auth/login">Sign In</Link></li>
              <li><Link href="/auth/register">Create Account</Link></li>
              <li><Link href="/dashboard">Dashboard</Link></li>
            </ul>
          </div>
        </div>

        <div className="footer-bottom">
          <span>© {new Date().getFullYear()} IDmission FluentVerify. All rights reserved.</span>
          <span>Powered by Google Gemini AI</span>
        </div>
      </div>
    </footer>
  );
}
