import { useEffect, useRef, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Flame, Mail, Lock, Eye, EyeOff, Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage } from "@/lib/api";

declare global {
  interface Window {
    google?: {
      accounts: {
        id: {
          initialize: (options: { client_id: string; callback: (response: { credential: string }) => void }) => void;
          renderButton: (element: HTMLElement, options: Record<string, unknown>) => void;
        };
      };
    };
  }
}

const Login = () => {
  const [mode, setMode] = useState<"password" | "otp">("password");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [loading, setLoading] = useState(false);
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [devOtp, setDevOtp] = useState<string | undefined>();
  const [cooldown, setCooldown] = useState(0);
  const googleButtonRef = useRef<HTMLDivElement>(null);
  const { signIn, setUser, requestLoginOtp, verifyLoginOtp } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const redirectTo = typeof location.state?.from === "string" ? location.state.from : "/dashboard";
  const { toast } = useToast();
  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown((value) => Math.max(0, value - 1)), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  useEffect(() => {
    if (!googleClientId || !googleButtonRef.current) return;
    const setup = () => {
      window.google?.accounts.id.initialize({
        client_id: googleClientId,
        callback: async (response) => {
          try {
            const data = await api.auth.googleLogin(response.credential, true);
            setUser(data.user);
            navigate(redirectTo);
          } catch (error) {
            toast({ title: "Google login failed", description: getApiErrorMessage(error), variant: "destructive" });
          }
        },
      });
      window.google?.accounts.id.renderButton(googleButtonRef.current!, {
        theme: "outline",
        size: "large",
        width: googleButtonRef.current!.offsetWidth,
      });
    };

    if (window.google) {
      setup();
      return;
    }

    const script = document.createElement("script");
    script.src = "https://accounts.google.com/gsi/client";
    script.async = true;
    script.defer = true;
    script.onload = setup;
    document.body.appendChild(script);
  }, [googleClientId, navigate, setUser, toast]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password) return;
    setLoading(true);
    const { error } = await signIn(email, password, rememberMe);
    setLoading(false);
    if (error) {
      toast({ title: "Login failed", description: getApiErrorMessage(error), variant: "destructive" });
    } else {
      // Small delay to let auth state update
      setTimeout(() => {
        navigate(redirectTo);
      }, 100);
    }
  };

  const handleRequestOtp = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      toast({ title: "Enter a valid email", variant: "destructive" });
      return;
    }
    setSendingOtp(true);
    const result = await requestLoginOtp(email);
    setSendingOtp(false);
    if (result.error) {
      toast({ title: "Could not send login code", description: getApiErrorMessage(result.error), variant: "destructive" });
      return;
    }
    setOtpSent(true);
    setDevOtp(result.devOtp);
    setCooldown(45);
    toast({
      title: result.delivered ? "Login code sent" : "Login code generated",
      description: result.delivered
        ? `Check ${email} for a 6-digit code. It expires in 10 minutes.`
        : "Email delivery is not configured. Use the code shown on this page.",
    });
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.trim().length !== 6) {
      toast({ title: "Enter the 6-digit code", variant: "destructive" });
      return;
    }
    setLoading(true);
    const { error } = await verifyLoginOtp(email, otp.trim(), rememberMe);
    setLoading(false);
    if (error) {
      toast({ title: "Code not accepted", description: getApiErrorMessage(error), variant: "destructive" });
    } else {
      navigate(redirectTo);
    }
  };

  const switchMode = (next: "password" | "otp") => {
    setMode(next);
    setOtp("");
    setOtpSent(false);
    setDevOtp(undefined);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="w-full max-w-md">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center gap-2 mb-6">
            <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
              <Flame className="w-6 h-6 text-primary-foreground" />
            </div>
            <span className="font-display font-bold text-2xl text-foreground">Habbiters</span>
          </Link>
          <h1 className="text-2xl font-display font-bold text-foreground">Welcome back</h1>
          <p className="text-muted-foreground text-sm mt-1">Log in to continue your streak</p>
        </div>

        <div className="bg-card border border-border rounded-2xl p-8">
          <div className="grid grid-cols-2 gap-1 p-1 rounded-xl bg-secondary mb-5">
            <button
              type="button"
              onClick={() => switchMode("password")}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${mode === "password" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Password
            </button>
            <button
              type="button"
              onClick={() => switchMode("otp")}
              className={`py-2 rounded-lg text-sm font-medium transition-colors ${mode === "otp" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}
            >
              Email code
            </button>
          </div>

          {mode === "password" ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com"
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Password</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••••"
                    className="w-full pl-10 pr-10 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input"
                />
                Remember me
              </label>
              <button type="submit" disabled={loading}
                className="block w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Log in"}
              </button>
            </form>
          ) : (
            <form onSubmit={otpSent ? handleVerifyOtp : handleRequestOtp} className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setOtpSent(false); }} placeholder="you@example.com"
                    disabled={otpSent}
                    className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-70" />
                </div>
              </div>

              {otpSent && (
                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">6-digit code</label>
                  <input
                    inputMode="numeric"
                    autoComplete="one-time-code"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    placeholder="123456"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-center text-lg tracking-[0.4em] font-mono focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>
              )}

              {devOtp && (
                <div className="rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-700">
                  Email delivery is off in this environment. Your login code is <strong className="font-mono">{devOtp}</strong>.
                </div>
              )}

              <label className="flex items-center gap-2 text-sm text-muted-foreground">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  className="rounded border-input"
                />
                Remember me
              </label>

              <button type="submit" disabled={loading || sendingOtp}
                className="block w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm text-center hover:opacity-90 transition-opacity disabled:opacity-50">
                {loading || sendingOtp ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : otpSent ? "Verify code & log in" : "Send login code"}
              </button>

              {otpSent && (
                <button type="button" onClick={() => handleRequestOtp()} disabled={cooldown > 0 || sendingOtp}
                  className="block w-full text-center text-xs text-muted-foreground hover:text-foreground disabled:opacity-60">
                  {cooldown > 0 ? `Resend code in ${cooldown}s` : "Didn't get it? Resend code"}
                </button>
              )}
            </form>
          )}
          {googleClientId && (
            <div className="mt-4">
              <div ref={googleButtonRef} className="min-h-10" />
            </div>
          )}
          <div className="mt-4 text-center">
            <Link to="/forgot-password" className="text-sm text-muted-foreground hover:text-foreground">
              Forgot your password?
            </Link>
          </div>
          <div className="mt-3 text-center text-sm text-muted-foreground">
            Don't have an account?{" "}
            <Link to="/signup" className="text-primary font-medium hover:underline">Sign up</Link>
          </div>
        </div>
      </motion.div>
    </div>
  );
};

export default Login;
