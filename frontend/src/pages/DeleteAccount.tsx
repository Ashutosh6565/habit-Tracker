import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AlertTriangle, Loader2, LogIn, Trash2 } from "lucide-react";
import StaticPage from "@/components/StaticPage";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage } from "@/lib/api";

const DeleteAccount = () => {
  const { user, loading, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [confirmText, setConfirmText] = useState("");
  const [password, setPassword] = useState("");
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    document.title = "Delete your account — Habbiters";
  }, []);

  const handleDelete = async () => {
    if (confirmText !== "DELETE") return;
    setDeleting(true);
    setError(null);
    try {
      await api.users.deleteAccount(user?.hasPassword ? password : undefined);
      await signOut().catch(() => {});
      toast({ title: "Account deleted", description: "Your data has been removed." });
      navigate("/", { replace: true });
    } catch (err) {
      const message = getApiErrorMessage(err);
      setError(message);
      toast({ title: "Could not delete account", description: message, variant: "destructive" });
    } finally {
      setDeleting(false);
    }
  };

  return (
    <StaticPage
      title="Delete your account"
      subtitle="Remove your Habbiters account and everything attached to it. This cannot be undone."
      icon={Trash2}
      eyebrow="Account"
      meta="Applies to the Habbiters website and the Habbiters Android app."
    >
      <div className="container mx-auto max-w-3xl space-y-6">
        <div className="glass rounded-2xl p-6 md:p-8">
          <h2 className="text-xl font-display font-bold text-foreground mb-3">What gets deleted</h2>
          <ul className="space-y-2 text-sm text-muted-foreground">
            {[
              "Your profile, email, and avatar",
              "All habits, streaks, check-ins, and progress history",
              "Templates, learning plans, and notes you created",
              "XP, levels, achievements, and game claims",
              "Subscription and payment records tied to your account",
              "Any pending verification codes and contact messages sent with your email",
            ].map((item) => (
              <li key={item} className="flex items-start gap-2.5">
                <span className="w-1.5 h-1.5 rounded-full bg-primary mt-1.5 shrink-0" />
                {item}
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground mt-4">
            Deletion happens immediately. We keep no backup copy of your personal data.
          </p>
        </div>

        <div className="glass rounded-2xl p-6 md:p-8">
          {loading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : user ? (
            <>
              <div className="flex items-start gap-3 rounded-xl border border-destructive/30 bg-destructive/5 p-4 mb-6">
                <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
                <p className="text-sm text-foreground">
                  You are signed in as <span className="font-semibold">{user.email}</span>. Deleting is permanent.
                </p>
              </div>

              <label className="text-sm font-medium text-foreground mb-1.5 block">
                Type <span className="font-mono font-bold">DELETE</span> to confirm
              </label>
              <input
                type="text"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="DELETE"
                autoComplete="off"
                className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />

              {user.hasPassword && (
                <>
                  <label className="text-sm font-medium text-foreground mb-1.5 block mt-4">Current password</label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    autoComplete="current-password"
                    className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </>
              )}

              {error && <p className="text-sm text-destructive mt-4">{error}</p>}

              <button
                onClick={handleDelete}
                disabled={deleting || confirmText !== "DELETE" || (user.hasPassword && password.length === 0)}
                className="mt-6 w-full py-2.5 rounded-xl bg-destructive text-destructive-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Delete my account</>}
              </button>
            </>
          ) : (
            <>
              <h2 className="text-xl font-display font-bold text-foreground mb-3">Sign in to delete</h2>
              <p className="text-sm text-muted-foreground mb-5">
                For your safety, account deletion only works from the account itself. Sign in, then return to this
                page.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  to="/login"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  <LogIn className="w-4 h-4" /> Sign in
                </Link>
                <Link
                  to="/contact"
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-xl border border-border text-foreground font-semibold text-sm hover:bg-secondary transition-colors"
                >
                  Contact support
                </Link>
              </div>
              <p className="text-xs text-muted-foreground mt-5">
                Lost access to your account? Email{" "}
                <a href="mailto:support@habbiters.app" className="text-primary hover:underline">support@habbiters.app</a>{" "}
                from the address on the account and we will verify and delete it for you.
              </p>
            </>
          )}
        </div>
      </div>
    </StaticPage>
  );
};

export default DeleteAccount;
