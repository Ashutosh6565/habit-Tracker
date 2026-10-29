import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ArrowLeft, AlertTriangle, Camera, Loader2, Save, Trash2, User } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { api, getApiErrorMessage } from "@/lib/api";

const Profile = () => {
  const { user, setUser, signOut } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [fullName, setFullName] = useState("");
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState("");
  const [deletePassword, setDeletePassword] = useState("");
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    if (!user) return;
    setFullName(user.fullName || "");
    setAvatarUrl(user.avatarUrl || null);
    setLoading(false);
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;

    if (file.size > 2 * 1024 * 1024) {
      toast({ title: "File too large", description: "Max 2MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const data = await api.users.uploadAvatar(file);
      setAvatarUrl(data.avatarUrl || null);
      setUser(data.user);
      toast({ title: "Avatar updated!" });
    } catch (error) {
      toast({ title: "Upload failed", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const data = await api.users.updateProfile({ fullName: fullName.trim() });
      setUser(data.user);
      toast({ title: "Profile saved!" });
    } catch (error) {
      toast({ title: "Error saving", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!user || deleteConfirm !== "DELETE") return;
    setDeleting(true);
    try {
      await api.users.deleteAccount(user.hasPassword ? deletePassword : undefined);
      await signOut().catch(() => {});
      toast({ title: "Account deleted", description: "Your data has been removed." });
      navigate("/", { replace: true });
    } catch (error) {
      toast({ title: "Could not delete account", description: getApiErrorMessage(error), variant: "destructive" });
      setDeleting(false);
    }
  };

  if (loading) {    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-lg">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Profile Settings</h1>
              <p className="text-sm text-muted-foreground">Update your personal information</p>
            </div>
          </div>

          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-card border border-border rounded-2xl p-8">
            {/* Avatar */}
            <div className="flex flex-col items-center mb-8">
              <div className="relative group cursor-pointer" onClick={() => fileInputRef.current?.click()}>
                <div className="w-24 h-24 rounded-full overflow-hidden border-4 border-primary/20 bg-secondary flex items-center justify-center">
                  {avatarUrl ? (
                    <img src={avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                  ) : (
                    <User className="w-10 h-10 text-muted-foreground" />
                  )}
                </div>
                <div className="absolute inset-0 rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  {uploading ? (
                    <Loader2 className="w-6 h-6 text-white animate-spin" />
                  ) : (
                    <Camera className="w-6 h-6 text-white" />
                  )}
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </div>
              <p className="text-xs text-muted-foreground mt-2">Click to upload (max 2MB)</p>
            </div>

            {/* Fields */}
            <div className="space-y-5">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Email</label>
                <input
                  type="email"
                  value={user?.email || ""}
                  disabled
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-secondary text-muted-foreground text-sm cursor-not-allowed"
                />
                <p className="text-xs text-muted-foreground mt-1">Email cannot be changed</p>
              </div>

              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Full Name</label>
                <input
                  type="text"
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Your name"
                  className="w-full px-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>

              <button
                onClick={handleSave}
                disabled={saving}
                className="w-full py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> Save Changes</>}
              </button>
            </div>
          </motion.div>

          {/* Danger zone */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="mt-6 bg-card border border-destructive/30 rounded-2xl p-6"
          >
            <div className="flex items-start gap-3">
              <AlertTriangle className="w-5 h-5 text-destructive shrink-0 mt-0.5" />
              <div className="flex-1">
                <h2 className="font-display font-bold text-foreground">Delete account</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Permanently remove your account, habits, XP, planner tasks, time entries and notes. This cannot be undone.
                </p>

                {!deleteOpen ? (
                  <button
                    onClick={() => setDeleteOpen(true)}
                    className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-xl border border-destructive/40 text-destructive text-sm font-semibold hover:bg-destructive/10 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" /> Delete my account
                  </button>
                ) : (
                  <div className="mt-4 space-y-3">
                    <div>
                      <label className="text-xs font-medium text-foreground mb-1 block">
                        Type <span className="font-mono font-bold">DELETE</span> to confirm
                      </label>
                      <input
                        type="text"
                        value={deleteConfirm}
                        onChange={(e) => setDeleteConfirm(e.target.value)}
                        autoComplete="off"
                        className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                      />
                    </div>
                    {user?.hasPassword && (
                      <div>
                        <label className="text-xs font-medium text-foreground mb-1 block">Current password</label>
                        <input
                          type="password"
                          value={deletePassword}
                          onChange={(e) => setDeletePassword(e.target.value)}
                          autoComplete="current-password"
                          className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                        />
                      </div>
                    )}
                    <div className="flex flex-col sm:flex-row gap-2">
                      <button
                        onClick={handleDeleteAccount}
                        disabled={deleting || deleteConfirm !== "DELETE" || (Boolean(user?.hasPassword) && deletePassword.length === 0)}
                        className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-destructive text-destructive-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-40"
                      >
                        {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Trash2 className="w-4 h-4" /> Permanently delete</>}
                      </button>
                      <button
                        onClick={() => { setDeleteOpen(false); setDeleteConfirm(""); setDeletePassword(""); }}
                        disabled={deleting}
                        className="px-4 py-2 rounded-xl border border-border text-foreground text-sm font-semibold hover:bg-secondary transition-colors disabled:opacity-40"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                <p className="text-xs text-muted-foreground mt-3">
                  Prefer a web page? Use <Link to="/delete-account" className="text-primary hover:underline">habbiters.app/delete-account</Link>.
                </p>
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Profile;
