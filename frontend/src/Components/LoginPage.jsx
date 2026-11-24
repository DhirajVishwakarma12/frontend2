import { useState } from "react";
import "../Style/login.css";

export default function LoginPage({ onLogin }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event) {
    event.preventDefault();
    if (isSubmitting) return;
    if (!email.trim() || !password) {
      setError("Enter your work email and password to continue.");
      return;
    }
    setError("");
    setIsSubmitting(true);
    try {
      await onLogin(email.trim(), password);
    } catch (loginError) {
      setError(loginError.message || "Sign-in failed. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-story" aria-label="IET LOGISTICS PRIVATE LTD">
        <div className="login-story-inner">
          <a className="login-brand" href="#login" aria-label="IET LOGISTICS PRIVATE LTD home">
            <span className="login-brand-mark" aria-hidden="true">✦</span>
            <span>IET LOGISTICS PRIVATE LTD</span>
          </a>
          <div className="login-story-copy">
            <span className="login-kicker">SHIPPING, MADE SIMPLE</span>
            <h1>Every shipment<br />starts with a<br /><em>clear picture.</em></h1>
            <p>Manage proforma invoices with clarity, care, and confidence.</p>
          </div>
          <div className="login-story-footer"><span>01</span><span className="login-footer-line" /><span>BUILT FOR YOUR BUSINESS</span></div>
        </div>
        <div className="login-orbit login-orbit-one" aria-hidden="true" />
        <div className="login-orbit login-orbit-two" aria-hidden="true" />
      </section>

      <section className="login-panel" id="login">
        <div className="login-form-wrap">
          <div className="login-mobile-brand"><span className="login-brand-mark" aria-hidden="true">✦</span> IET LOGISTICS PRIVATE LTD</div>
          <div className="login-heading">
            <span className="login-kicker">YOUR WORKSPACE</span>
            <h2>Welcome back</h2>
            <p>Sign in to continue to your billing workspace.</p>
          </div>

          <form className="login-form" onSubmit={handleSubmit} noValidate>
            <label htmlFor="login-email">Work email</label>
            <div className="login-input-wrap">
              <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="2.5" y="4" width="15" height="12" rx="2"/><path d="m3.5 5 6.5 5.25L16.5 5"/></svg>
              <input id="login-email" type="email" autoComplete="username" placeholder="you@company.com" value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>

            <div className="login-password-label"><label htmlFor="login-password">Password</label><button className="login-text-button" type="button" onClick={() => setError("Please contact your workspace administrator to reset your password.")}>Forgot password?</button></div>
            <div className="login-input-wrap">
              <svg viewBox="0 0 20 20" aria-hidden="true"><rect x="3.5" y="8.5" width="13" height="9" rx="2"/><path d="M6.5 8.5V6a3.5 3.5 0 0 1 7 0v2.5M10 12v2"/></svg>
              <input id="login-password" type={showPassword ? "text" : "password"} autoComplete="current-password" placeholder="Enter your password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <button className="login-show-password" type="button" aria-label={showPassword ? "Hide password" : "Show password"} onClick={() => setShowPassword((visible) => !visible)}>{showPassword ? "Hide" : "Show"}</button>
            </div>
            {error && <p className="login-error" role="alert">{error}</p>}
            <button className="login-submit" type="submit" disabled={isSubmitting}>Sign in <span aria-hidden="true">→</span></button>
          </form>

          <p className="login-help">Need access? Contact your administrator</p>
          <div className="login-security"><span aria-hidden="true">✓</span> Secure workspace access</div>
        </div>
        <footer className="login-copyright">© {new Date().getFullYear()} IET LOGISTICS PRIVATE LTD</footer>
      </section>
    </main>
  );
}
