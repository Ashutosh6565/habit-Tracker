import { useState } from "react";
import { Leaf } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

type Mode = "signin" | "signup";

export const MobileAuth = () => {
  const { signIn, signUp, requestLoginOtp, verifyLoginOtp } = useAuth();
  const [mode, setMode] = useState<Mode>("signin");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpMode, setOtpMode] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);

  const submitPassword = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result =
        mode === "signin" ? await signIn(email.trim(), password, true) : await signUp(email.trim(), password, fullName.trim());
      if (result.error) setError(result.error.message);
    } finally {
      setBusy(false);
    }
  };

  const sendCode = async () => {
    setError(null);
    setBusy(true);
    try {
      const result = await requestLoginOtp(email.trim());
      if (result.error) {
        setError(result.error.message);
        return;
      }
      setOtpSent(true);
    } finally {
      setBusy(false);
    }
  };

  const submitCode = async (event: React.FormEvent) => {
    event.preventDefault();
    setError(null);
    setBusy(true);
    try {
      const result = await verifyLoginOtp(email.trim(), otp.trim(), true);
      if (result.error) setError(result.error.message);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hb-auth">
      <div className="hb-auth-brand">
        <span className="hb-auth-logo">
          <Leaf size={22} />
        </span>
        <strong>Habbiters</strong>
      </div>

      <h1>{otpMode ? "Sign in with a code" : mode === "signin" ? "Welcome back" : "Build better days"}</h1>
      <p>
        {otpMode
          ? "We'll email you a six-digit code. No password needed."
          : mode === "signin"
            ? "Sign in to pick up your streaks, habits and notes right where you left off."
            : "Create a free account. Every habit template is included — no paywalls, ever."}
      </p>

      {otpMode ? (
        <form onSubmit={otpSent ? submitCode : (event) => { event.preventDefault(); void sendCode(); }}>
          <span className="hb-sheet-label">Email</span>
          <input
            className="hb-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
            disabled={otpSent}
          />
          {otpSent && (
            <>
              <span className="hb-sheet-label">Six-digit code</span>
              <input
                className="hb-input"
                inputMode="numeric"
                autoComplete="one-time-code"
                placeholder="123456"
                maxLength={6}
                value={otp}
                onChange={(event) => setOtp(event.target.value.replace(/\D/g, ""))}
                required
              />
            </>
          )}
          {error && <div className="hb-error">{error}</div>}
          <button type="submit" className="hb-btn-primary" disabled={busy || !email}>
            {busy ? "Please wait…" : otpSent ? "Verify and sign in" : "Email me a code"}
          </button>
          <button
            type="button"
            className="hb-btn-ghost"
            onClick={() => {
              setOtpMode(false);
              setOtpSent(false);
              setOtp("");
              setError(null);
            }}
          >
            Use password instead
          </button>
        </form>
      ) : (
        <form onSubmit={submitPassword}>
          {mode === "signup" && (
            <>
              <span className="hb-sheet-label">Full name</span>
              <input
                className="hb-input"
                autoComplete="name"
                placeholder="Ashutosh Kumar"
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
                required
              />
            </>
          )}
          <span className="hb-sheet-label">Email</span>
          <input
            className="hb-input"
            type="email"
            inputMode="email"
            autoComplete="email"
            placeholder="you@example.com"
            value={email}
            onChange={(event) => setEmail(event.target.value)}
            required
          />
          <span className="hb-sheet-label">Password</span>
          <input
            className="hb-input"
            type="password"
            autoComplete={mode === "signin" ? "current-password" : "new-password"}
            placeholder="At least 8 characters"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            minLength={8}
            required
          />
          {error && <div className="hb-error">{error}</div>}
          <button type="submit" className="hb-btn-primary" disabled={busy}>
            {busy ? "Please wait…" : mode === "signin" ? "Sign in" : "Create free account"}
          </button>
          <div className="hb-auth-switch" style={{ marginTop: 12 }}>
            <button type="button" onClick={() => { setOtpMode(true); setError(null); }}>
              Sign in with an email code
            </button>
          </div>
        </form>
      )}

      <div className="hb-auth-switch">
        {mode === "signin" ? (
          <>
            New to Habbiters?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signup");
                setError(null);
              }}
            >
              Create an account
            </button>
          </>
        ) : (
          <>
            Already have an account?{" "}
            <button
              type="button"
              onClick={() => {
                setMode("signin");
                setError(null);
              }}
            >
              Sign in
            </button>
          </>
        )}
      </div>
    </div>
  );
};
