import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Shield, Users, Crown, Search, Check, X, Loader2, ArrowLeft, Pencil, Save, CreditCard, KeyRound, LayoutTemplate, Plus, Trash2, Inbox, MailOpen, CircleDollarSign, Clock } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import Navbar from "@/components/Navbar";
import { api, getApiErrorMessage, type ContactMessageDto, type PaymentClaimDto, type PermissionDefinition, type PermissionOverride, type PlanCode, type TemplateCatalogDto, type TemplateUnlockTier } from "@/lib/api";

interface UserRow {
  id: string;
  email: string | null;
  full_name: string | null;
  created_at: string;
  role?: "user" | "admin";
  permissions?: Record<string, boolean>;
  permissionOverrides?: Record<string, PermissionOverride>;
  subscription?: {
    status: string;
    plan?: string;
    tier?: "free" | "starter" | "premium";
    trial_end: string;
    current_period_end: string | null;
  };
}

type TemplateForm = {
  templateId?: string;
  name: string;
  description: string;
  icon: string;
  color: string;
  month: string;
  year: number;
  totalDays: number;
  unlockTier: TemplateUnlockTier;
  isActive: boolean;
  sortOrder: number;
  habitsText: string;
};

const emptyTemplateForm: TemplateForm = {
  name: "",
  description: "",
  icon: "Check",
  color: "gradient-primary",
  month: "January",
  year: 2026,
  totalDays: 30,
  unlockTier: "premium",
  isActive: true,
  sortOrder: 0,
  habitsText: "Daily check-in|✓\nReview progress|★",
};

const planLabels: Record<string, string> = {
  starter_monthly: "Starter",
  premium_all_monthly: "Premium All",
  premium_monthly: "Premium legacy",
  premium_yearly: "Premium yearly",
  premium_lifetime: "Lifetime",
};

const Admin = () => {
  const { user, isAdmin, loading: authLoading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [updating, setUpdating] = useState<string | null>(null);
  const [editingUser, setEditingUser] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<{ full_name: string; email: string }>({ full_name: "", email: "" });
  const [subModal, setSubModal] = useState<UserRow | null>(null);
  const [permissionModal, setPermissionModal] = useState<UserRow | null>(null);
  const [subForm, setSubForm] = useState<{ status: string; duration: number; plan: PlanCode }>({
    status: "active",
    duration: 1,
    plan: "premium_all_monthly",
  });
  const [permissionCatalog, setPermissionCatalog] = useState<PermissionDefinition[]>([]);
  const [templates, setTemplates] = useState<TemplateCatalogDto[]>([]);
  const [templateForm, setTemplateForm] = useState<TemplateForm>(emptyTemplateForm);
  const [editingTemplateId, setEditingTemplateId] = useState<string | null>(null);
  const [permissionForm, setPermissionForm] = useState<Record<string, PermissionOverride>>({});
  const [savingEdit, setSavingEdit] = useState(false);
  const [savingSub, setSavingSub] = useState(false);
  const [savingPermissions, setSavingPermissions] = useState(false);
  const [savingTemplate, setSavingTemplate] = useState(false);
  const [claims, setClaims] = useState<PaymentClaimDto[]>([]);
  const [loadingClaims, setLoadingClaims] = useState(false);
  const [reviewingClaim, setReviewingClaim] = useState<string | null>(null);
  const [messages, setMessages] = useState<ContactMessageDto[]>([]);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [messageFilter, setMessageFilter] = useState<"all" | "new" | "read" | "replied">("all");

  useEffect(() => {
    if (!authLoading && !isAdmin) navigate("/dashboard");
  }, [authLoading, isAdmin, navigate]);

  useEffect(() => {
    if (isAdmin) {
      fetchUsers();
      fetchPermissionCatalog();
      fetchTemplates();
      fetchClaims();
      fetchMessages();
    }
  }, [isAdmin]);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const data = await api.users.listAdminUsers();
      setUsers(data.users);
    } catch (error) {
      toast({ title: "Error loading users", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissionCatalog = async () => {
    try {
      const data = await api.users.permissionCatalog();
      setPermissionCatalog(data.permissions);
    } catch (error) {
      toast({ title: "Error loading permissions", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const fetchTemplates = async () => {
    try {
      const data = await api.templates.catalog(true);
      setTemplates(data.templates);
    } catch (error) {
      toast({ title: "Error loading templates", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const fetchClaims = async () => {
    setLoadingClaims(true);
    try {
      const data = await api.payments.adminClaims();
      setClaims(data.claims);
    } catch (error) {
      toast({ title: "Error loading payments", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setLoadingClaims(false);
    }
  };

  const fetchMessages = async () => {
    setLoadingMessages(true);
    try {
      const data = await api.contact.listAdmin();
      setMessages(data.messages);
    } catch (error) {
      toast({ title: "Error loading messages", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setLoadingMessages(false);
    }
  };

  const reviewClaim = async (claim: PaymentClaimDto, action: "approve" | "reject") => {
    const label = action === "approve" ? "Approve this payment and activate the plan?" : "Reject this payment claim?";
    if (!window.confirm(label)) return;
    setReviewingClaim(claim.id);
    try {
      if (action === "reject") {
        const note = window.prompt("Reason for rejection (shown to the user):") || undefined;
        await api.payments.reviewClaim(claim.id, { action, note });
        toast({ title: "Payment rejected", description: "The user has been notified by email." });
      } else {
        await api.payments.reviewClaim(claim.id, { action });
        toast({ title: "Plan activated", description: `${claim.user?.email || "User"} now has ${claim.planLabel}.` });
      }
      await Promise.all([fetchClaims(), fetchUsers()]);
    } catch (error) {
      toast({ title: "Could not review payment", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setReviewingClaim(null);
    }
  };

  const updateMessageStatus = async (id: string, status: ContactMessageDto["status"]) => {
    try {
      const { message } = await api.contact.updateStatus(id, status);
      setMessages((prev) => prev.map((row) => (row.id === id ? message : row)));
    } catch (error) {
      toast({ title: "Could not update message", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const deleteMessage = async (id: string) => {
    if (!window.confirm("Delete this message permanently?")) return;
    try {
      await api.contact.remove(id);
      setMessages((prev) => prev.filter((row) => row.id !== id));
    } catch (error) {
      toast({ title: "Could not delete message", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const togglePremium = async (userId: string, currentStatus: string) => {
    setUpdating(userId);
    const newStatus = currentStatus === "active" ? "expired" : "active";
    try {
      await api.users.updateAdminSubscription(userId, { status: newStatus, durationMonths: 1 });
      toast({ title: newStatus === "active" ? "All access activated" : "All access revoked" });
      fetchUsers();
    } catch (error) {
      toast({ title: "Error updating subscription", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setUpdating(null);
    }
  };

  const startEdit = (u: UserRow) => {
    setEditingUser(u.id);
    setEditForm({ full_name: u.full_name || "", email: u.email || "" });
  };

  const saveEdit = async () => {
    if (!editingUser) return;
    setSavingEdit(true);
    try {
      await api.users.updateAdminUser(editingUser, {
        fullName: editForm.full_name,
        email: editForm.email,
      });
      toast({ title: "Profile updated" });
      setEditingUser(null);
      fetchUsers();
    } catch (error) {
      toast({ title: "Error updating profile", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSavingEdit(false);
    }
  };

  const openSubModal = (u: UserRow) => {
    setSubModal(u);
    setSubForm({
      status: u.subscription?.status || "trial",
      duration: 1,
      plan: (u.subscription?.plan as PlanCode) || "premium_all_monthly",
    });
  };

  const openPermissionModal = (u: UserRow) => {
    setPermissionModal(u);
    setPermissionForm(u.permissionOverrides || {});
  };

  const setPermissionOverride = (key: string, value: PermissionOverride) => {
    setPermissionForm((prev) => ({ ...prev, [key]: value }));
  };

  const savePermissions = async () => {
    if (!permissionModal) return;
    setSavingPermissions(true);
    try {
      await api.users.updateAdminPermissions(permissionModal.id, permissionForm);
      toast({ title: "Permissions updated" });
      setPermissionModal(null);
      fetchUsers();
    } catch (error) {
      toast({ title: "Error updating permissions", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSavingPermissions(false);
    }
  };

  const saveSub = async () => {
    if (!subModal) return;
    setSavingSub(true);
    try {
      await api.users.updateAdminSubscription(subModal.id, {
        status: subForm.status,
        durationMonths: subForm.duration,
        plan: subForm.status === "active" ? subForm.plan : undefined,
      });
      toast({ title: "Subscription updated" });
      setSubModal(null);
      fetchUsers();
    } catch (error) {
      toast({ title: "Error updating subscription", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSavingSub(false);
    }
  };

  const parseTemplateHabits = (value: string) =>
    value
      .split("\n")
      .map((line, index) => {
        const [name, icon = "✓"] = line.split("|").map((part) => part.trim());
        return name ? { habitId: `habit_${index + 1}`, name, icon } : null;
      })
      .filter(Boolean) as { habitId: string; name: string; icon: string }[];

  const startTemplateEdit = (template: TemplateCatalogDto) => {
    setEditingTemplateId(template.templateId);
    setTemplateForm({
      templateId: template.templateId,
      name: template.name,
      description: template.description,
      icon: template.icon,
      color: template.color,
      month: template.month,
      year: template.year,
      totalDays: template.totalDays,
      unlockTier: template.unlockTier,
      isActive: template.isActive,
      sortOrder: template.sortOrder,
      habitsText: template.habits.map((habit) => `${habit.name}|${habit.icon}`).join("\n"),
    });
  };

  const resetTemplateForm = () => {
    setEditingTemplateId(null);
    setTemplateForm(emptyTemplateForm);
  };

  const saveTemplate = async () => {
    const habits = parseTemplateHabits(templateForm.habitsText);
    if (!templateForm.name.trim() || habits.length === 0) {
      toast({ title: "Template needs a name and at least one habit", variant: "destructive" });
      return;
    }
    setSavingTemplate(true);
    try {
      const payload = {
        templateId: templateForm.templateId,
        name: templateForm.name,
        description: templateForm.description,
        icon: templateForm.icon,
        color: templateForm.color,
        month: templateForm.month,
        year: templateForm.year,
        totalDays: templateForm.totalDays,
        unlockTier: templateForm.unlockTier,
        isActive: templateForm.isActive,
        sortOrder: templateForm.sortOrder,
        habits,
      };
      if (editingTemplateId) {
        await api.templates.updateCatalog(editingTemplateId, payload);
        toast({ title: "Template updated" });
      } else {
        await api.templates.createCatalog({ ...payload, templateId: payload.templateId || templateForm.name });
        toast({ title: "Template created" });
      }
      resetTemplateForm();
      fetchTemplates();
    } catch (error) {
      toast({ title: "Error saving template", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSavingTemplate(false);
    }
  };

  const deactivateTemplate = async (templateId: string) => {
    setSavingTemplate(true);
    try {
      await api.templates.deleteCatalog(templateId);
      toast({ title: "Template deactivated" });
      fetchTemplates();
    } catch (error) {
      toast({ title: "Error deactivating template", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSavingTemplate(false);
    }
  };

  const filtered = users.filter((u) =>
    (u.email || "").toLowerCase().includes(search.toLowerCase()) ||
    (u.full_name || "").toLowerCase().includes(search.toLowerCase())
  );

  if (authLoading || (!isAdmin && !authLoading)) return null;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-5xl">
          <div className="flex items-center gap-3 mb-8">
            <button onClick={() => navigate("/dashboard")} className="p-2 rounded-xl hover:bg-secondary text-muted-foreground">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="w-12 h-12 rounded-2xl gradient-primary flex items-center justify-center">
              <Shield className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-2xl font-display font-bold text-foreground">Admin Dashboard</h1>
              <p className="text-sm text-muted-foreground">Manage users & subscriptions</p>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-4 mb-8">
            {[
              { label: "Total Users", value: users.length, icon: Users },
              { label: "All Access", value: users.filter((u) => u.subscription?.status === "active").length, icon: Crown },
              { label: "Trialing", value: users.filter((u) => u.subscription?.status === "trial").length, icon: Shield },
            ].map((s) => (
              <div key={s.label} className="glass rounded-2xl p-4 flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <s.icon className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="text-xs text-muted-foreground">{s.label}</p>
                  <p className="text-xl font-display font-bold text-foreground">{s.value}</p>
                </div>
              </div>
            ))}
          </div>

          {/* Search */}
          <div className="relative mb-6">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search users..."
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
          </div>

          {/* Users Table */}
          {loading ? (
            <div className="flex justify-center py-20"><Loader2 className="w-8 h-8 animate-spin text-primary" /></div>
          ) : (
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase">User</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase">Joined</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="text-left px-6 py-4 text-xs font-medium text-muted-foreground uppercase">Trial Ends</th>
                      <th className="text-right px-6 py-4 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filtered.map((u) => {
                      const status = u.subscription?.status || "none";
                      const trialEnd = u.subscription?.trial_end ? new Date(u.subscription.trial_end) : null;
                      const trialExpired = trialEnd && trialEnd < new Date() && status === "trial";
                      const isEditing = editingUser === u.id;
                      return (
                        <tr key={u.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                          <td className="px-6 py-4">
                            {isEditing ? (
                              <div className="space-y-1.5">
                                <input value={editForm.full_name} onChange={(e) => setEditForm({ ...editForm, full_name: e.target.value })}
                                  placeholder="Full name"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                                <input value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                                  placeholder="Email"
                                  className="w-full px-2.5 py-1.5 rounded-lg border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                              </div>
                            ) : (
                              <>
                                <p className="text-sm font-medium text-foreground">{u.full_name || "—"}</p>
                                <p className="text-xs text-muted-foreground">{u.email || "—"}</p>
                              </>
                            )}
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {new Date(u.created_at).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4">
                            <span className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium ${
                              status === "active" ? "bg-green-500/10 text-green-500" :
                              status === "trial" && !trialExpired ? "bg-yellow-500/10 text-yellow-500" :
                              "bg-red-500/10 text-red-500"
                            }`}>
                              {status === "active" ? <><Check className="w-3 h-3" /> {u.subscription?.tier === "starter" ? "Starter" : "Premium"}</> :
                               status === "trial" && !trialExpired ? "Trial" :
                               trialExpired ? "Expired" : "None"}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-sm text-muted-foreground">
                            {trialEnd ? trialEnd.toLocaleDateString() : "—"}
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center justify-end gap-2">
                              {isEditing ? (
                                <>
                                  <button onClick={saveEdit} disabled={savingEdit}
                                    className="p-1.5 rounded-lg bg-green-500/10 text-green-500 hover:bg-green-500/20 transition-colors">
                                    {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                                  </button>
                                  <button onClick={() => setEditingUser(null)}
                                    className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors">
                                    <X className="w-3.5 h-3.5" />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEdit(u)} title="Edit profile"
                                    className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                                    <Pencil className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => openSubModal(u)} title="Manage subscription"
                                    className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                                    <CreditCard className="w-3.5 h-3.5" />
                                  </button>
                                  <button onClick={() => openPermissionModal(u)} title="Manage permissions"
                                    className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                                    <KeyRound className="w-3.5 h-3.5" />
                                  </button>
                                  {u.id !== user?.id && (
                                    <button
                                      onClick={() => togglePremium(u.id, status)}
                                      disabled={updating === u.id}
                                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                                        status === "active"
                                          ? "bg-red-500/10 text-red-500 hover:bg-red-500/20"
                                          : "gradient-primary text-primary-foreground hover:opacity-90"
                                      }`}
                                    >
                                  {updating === u.id ? <Loader2 className="w-3 h-3 animate-spin" /> :
                                        status === "active" ? "Revoke" : "Grant Access"}
                                    </button>
                                  )}
                                </>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              {filtered.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No users found.</div>
              )}
            </div>
          )}

          <div className="mt-8 grid lg:grid-cols-[1fr_360px] gap-6">
            <div className="bg-card border border-border rounded-2xl overflow-hidden">
              <div className="p-5 border-b border-border flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                    <LayoutTemplate className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <h2 className="font-display font-bold text-foreground">Template Access</h2>
                    <p className="text-xs text-muted-foreground">Free, Starter, and Premium gates are enforced on the server.</p>
                  </div>
                </div>
                <button onClick={resetTemplateForm}
                  className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-input text-xs font-medium text-foreground hover:bg-secondary">
                  <Plus className="w-3.5 h-3.5" /> New
                </button>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-border">
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Template</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Unlock</th>
                      <th className="text-left px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Status</th>
                      <th className="text-right px-5 py-3 text-xs font-medium text-muted-foreground uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {templates.map((template) => (
                      <tr key={template.templateId} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                        <td className="px-5 py-4">
                          <p className="text-sm font-medium text-foreground">{template.name}</p>
                          <p className="text-xs text-muted-foreground">{template.habits.length} habits · {template.templateId}</p>
                        </td>
                        <td className="px-5 py-4">
                          <span className="text-xs px-2.5 py-1 rounded-full bg-secondary text-secondary-foreground capitalize">
                            {template.unlockTier}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <span className={`text-xs px-2.5 py-1 rounded-full ${template.isActive ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                            {template.isActive ? "Active" : "Inactive"}
                          </span>
                        </td>
                        <td className="px-5 py-4">
                          <div className="flex items-center justify-end gap-2">
                            <button onClick={() => startTemplateEdit(template)}
                              className="p-1.5 rounded-lg bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80 transition-colors">
                              <Pencil className="w-3.5 h-3.5" />
                            </button>
                            <button onClick={() => deactivateTemplate(template.templateId)} disabled={savingTemplate || !template.isActive}
                              className="p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20 transition-colors disabled:opacity-40">
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              {templates.length === 0 && (
                <div className="text-center py-12 text-muted-foreground text-sm">No admin templates yet. Add one from the form.</div>
              )}
            </div>

            <div className="bg-card border border-border rounded-2xl p-5">
              <h2 className="font-display font-bold text-foreground mb-1">{editingTemplateId ? "Edit Template" : "Add Template"}</h2>
              <p className="text-xs text-muted-foreground mb-4">Use one habit per line as Name|Icon.</p>
              <div className="space-y-3">
                <input value={templateForm.name} onChange={(e) => setTemplateForm({ ...templateForm, name: e.target.value })}
                  placeholder="Template name"
                  className="w-full px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                <textarea value={templateForm.description} onChange={(e) => setTemplateForm({ ...templateForm, description: e.target.value })}
                  placeholder="Short description"
                  className="w-full h-20 px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                <div className="grid grid-cols-2 gap-2">
                  <input value={templateForm.icon} onChange={(e) => setTemplateForm({ ...templateForm, icon: e.target.value })}
                    placeholder="Lucide icon"
                    className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <select value={templateForm.unlockTier} onChange={(e) => setTemplateForm({ ...templateForm, unlockTier: e.target.value as TemplateUnlockTier })}
                    className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                    <option value="free">Free</option>
                    <option value="starter">Starter</option>
                    <option value="premium">Premium</option>
                  </select>
                </div>
                <div className="grid grid-cols-3 gap-2">
                  <input type="number" value={templateForm.totalDays} onChange={(e) => setTemplateForm({ ...templateForm, totalDays: Number(e.target.value) })}
                    className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input value={templateForm.month} onChange={(e) => setTemplateForm({ ...templateForm, month: e.target.value })}
                    className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                  <input type="number" value={templateForm.year} onChange={(e) => setTemplateForm({ ...templateForm, year: Number(e.target.value) })}
                    className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring" />
                </div>
                <textarea value={templateForm.habitsText} onChange={(e) => setTemplateForm({ ...templateForm, habitsText: e.target.value })}
                  className="w-full h-32 px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm resize-none focus:outline-none focus:ring-2 focus:ring-ring" />
                <label className="flex items-center gap-2 text-sm text-muted-foreground">
                  <input type="checkbox" checked={templateForm.isActive} onChange={(e) => setTemplateForm({ ...templateForm, isActive: e.target.checked })} />
                  Active in template library
                </label>
                <div className="flex gap-2">
                  <button onClick={saveTemplate} disabled={savingTemplate}
                    className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                    {savingTemplate ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : editingTemplateId ? "Save Template" : "Add Template"}
                  </button>
                  {editingTemplateId && (
                    <button onClick={resetTemplateForm}
                      className="px-4 py-2.5 rounded-xl border border-input text-foreground text-sm font-medium hover:bg-secondary">
                      Clear
                    </button>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Payment approvals */}
          <div className="mt-8 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <CircleDollarSign className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground">Payment Approvals</h2>
                  <p className="text-xs text-muted-foreground">
                    Razorpay payment-link claims. Approving activates the plan and emails the user.
                  </p>
                </div>
              </div>
              <button onClick={fetchClaims} disabled={loadingClaims}
                className="inline-flex items-center gap-2 px-3 py-2 rounded-xl border border-input text-xs font-medium text-foreground hover:bg-secondary disabled:opacity-50">
                {loadingClaims ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null} Refresh
              </button>
            </div>
            {loadingClaims ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : claims.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground text-sm">No payment claims submitted yet.</div>
            ) : (
              <div className="divide-y divide-border/60">
                {claims.map((claim) => (
                  <div key={claim.id} className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">{claim.user?.fullName || claim.user?.email || "Unknown user"}</p>
                        <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold ${
                          claim.status === "pending" ? "bg-amber-500/10 text-amber-600"
                            : claim.status === "paid" ? "bg-green-500/10 text-green-600"
                            : "bg-red-500/10 text-red-500"
                        }`}>
                          {claim.status}
                        </span>
                      </div>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {claim.user?.email || "—"} · {claim.planLabel} · ₹{Math.round(claim.amount / 100)}
                      </p>
                      <p className="text-xs text-muted-foreground mt-1 break-all">
                        Ref: <span className="font-mono text-foreground">{claim.reference || "—"}</span>
                        {" · "}
                        {new Date(claim.createdAt).toLocaleString()}
                      </p>
                      <p className="mt-1.5">
                        <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold ${
                          claim.verification === "verified"
                            ? "bg-green-500/10 text-green-600"
                            : claim.verification === "not_found"
                              ? "bg-amber-500/10 text-amber-600"
                              : "bg-secondary text-muted-foreground"
                        }`}>
                          {claim.verification === "verified"
                            ? `Razorpay API verified · ₹${Math.round((claim.gatewayAmount || 0) / 100)}`
                            : claim.verification === "not_found"
                              ? "Not found in Razorpay API — verify manually"
                              : "Manual verification needed"}
                        </span>
                      </p>
                      {claim.note && <p className="text-xs text-muted-foreground mt-1">User note: {claim.note}</p>}
                      {claim.reviewNote && <p className="text-xs text-muted-foreground mt-1">Admin note: {claim.reviewNote}</p>}
                    </div>
                    {claim.status === "pending" ? (
                      <div className="flex items-center gap-2 shrink-0">
                        <button onClick={() => reviewClaim(claim, "approve")} disabled={reviewingClaim !== null}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20 disabled:opacity-50">
                          {reviewingClaim === claim.id ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : "Approve"}
                        </button>
                        <button onClick={() => reviewClaim(claim, "reject")} disabled={reviewingClaim !== null}
                          className="px-3 py-1.5 rounded-lg text-xs font-medium bg-red-500/10 text-red-500 hover:bg-red-500/20 disabled:opacity-50">
                          Reject
                        </button>
                      </div>
                    ) : (
                      <span className="text-xs text-muted-foreground flex items-center gap-1.5 shrink-0">
                        <Clock className="w-3.5 h-3.5" />
                        {claim.reviewedAt ? new Date(claim.reviewedAt).toLocaleDateString() : "Reviewed"}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Contact inbox */}
          <div className="mt-8 bg-card border border-border rounded-2xl overflow-hidden">
            <div className="p-5 border-b border-border flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                  <Inbox className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <h2 className="font-display font-bold text-foreground">Contact Inbox</h2>
                  <p className="text-xs text-muted-foreground">Messages from the Contact page. Reply by email directly.</p>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                {(["all", "new", "read", "replied"] as const).map((filter) => (
                  <button key={filter} onClick={() => setMessageFilter(filter)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      messageFilter === filter ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                    }`}>
                    {filter}
                  </button>
                ))}
              </div>
            </div>
            {loadingMessages ? (
              <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div>
            ) : (
              (() => {
                const visibleMessages = messages.filter((m) => messageFilter === "all" || m.status === messageFilter);
                if (visibleMessages.length === 0) {
                  return <div className="text-center py-10 text-muted-foreground text-sm">No messages in this view.</div>;
                }
                return (
                  <div className="divide-y divide-border/60">
                    {visibleMessages.map((message) => (
                      <div key={message.id} className="p-5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="flex flex-wrap items-center gap-2">
                            <p className="text-sm font-semibold text-foreground">{message.name}</p>
                            <span className="text-xs text-muted-foreground">{message.email}</span>
                            <span className="text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full bg-secondary text-muted-foreground font-semibold">
                              {message.topic}
                            </span>
                            <span className={`text-[10px] uppercase tracking-wide px-2 py-0.5 rounded-full font-semibold ${
                              message.status === "new" ? "bg-primary/10 text-primary"
                                : message.status === "replied" ? "bg-green-500/10 text-green-600"
                                : "bg-secondary text-muted-foreground"
                            }`}>
                              {message.status}
                            </span>
                          </div>
                          <span className="text-xs text-muted-foreground">{new Date(message.createdAt).toLocaleString()}</span>
                        </div>
                        {message.subject && <p className="text-xs font-medium text-foreground mt-2">{message.subject}</p>}
                        <p className="text-sm text-muted-foreground mt-1 whitespace-pre-wrap">{message.message}</p>
                        <div className="flex items-center gap-2 mt-3">
                          <a href={`mailto:${message.email}?subject=${encodeURIComponent(`Re: ${message.subject || "Your message to Habbiters"}`)}`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-foreground hover:bg-secondary/80">
                            <MailOpen className="w-3.5 h-3.5" /> Reply
                          </a>
                          {message.status !== "read" && (
                            <button onClick={() => updateMessageStatus(message.id, "read")}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-secondary text-muted-foreground hover:text-foreground">
                              Mark read
                            </button>
                          )}
                          {message.status !== "replied" && (
                            <button onClick={() => updateMessageStatus(message.id, "replied")}
                              className="px-3 py-1.5 rounded-lg text-xs font-medium bg-green-500/10 text-green-600 hover:bg-green-500/20">
                              Mark replied
                            </button>
                          )}
                          <button onClick={() => deleteMessage(message.id)}
                            className="ml-auto p-1.5 rounded-lg bg-red-500/10 text-red-500 hover:bg-red-500/20">
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                );
              })()
            )}
          </div>
        </div>
      </div>

      {/* Subscription Management Modal */}
      {subModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setSubModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-md mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Manage Subscription</h2>
            <p className="text-sm text-muted-foreground mb-5">{subModal.full_name || subModal.email}</p>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-foreground mb-1.5 block">Status</label>
                <select value={subForm.status} onChange={(e) => setSubForm({ ...subForm, status: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                  <option value="trial">Trial</option>
                  <option value="active">Active (All Access)</option>
                  <option value="expired">Expired</option>
                </select>
              </div>

              {subForm.status === "active" && (
                <>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Plan</label>
                    <select value={subForm.plan} onChange={(e) => setSubForm({ ...subForm, plan: e.target.value as PlanCode })}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      <option value="starter_monthly">Starter</option>
                      <option value="premium_all_monthly">Premium All</option>
                      <option value="premium_yearly">Premium Yearly</option>
                      <option value="premium_lifetime">Lifetime</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-foreground mb-1.5 block">Duration (months)</label>
                    <select value={subForm.duration} onChange={(e) => setSubForm({ ...subForm, duration: Number(e.target.value) })}
                      className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                      {[1, 3, 6, 12].map((m) => (
                        <option key={m} value={m}>{m} month{m > 1 ? "s" : ""}</option>
                      ))}
                    </select>
                  </div>
                </>
              )}

              <div className="bg-secondary/50 rounded-xl p-3 text-xs text-muted-foreground">
                <p><strong>Current:</strong> {subModal.subscription?.status || "none"}</p>
                {subModal.subscription?.plan && (
                  <p><strong>Plan:</strong> {planLabels[subModal.subscription.plan] || subModal.subscription.plan}</p>
                )}
                {subModal.subscription?.current_period_end && (
                  <p><strong>Access until:</strong> {new Date(subModal.subscription.current_period_end).toLocaleDateString()}</p>
                )}
              </div>

              <div className="flex gap-3">
                <button onClick={() => setSubModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-input text-foreground text-sm font-medium hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button onClick={saveSub} disabled={savingSub}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {savingSub ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Changes"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}

      {/* Permission Management Modal */}
      {permissionModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm" onClick={() => setPermissionModal(null)}>
          <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="bg-card border border-border rounded-2xl p-6 w-full max-w-3xl max-h-[85vh] overflow-y-auto mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-lg font-display font-bold text-foreground mb-1">Manage Permissions</h2>
            <p className="text-sm text-muted-foreground mb-5">{permissionModal.full_name || permissionModal.email}</p>

            <div className="space-y-5">
              {Array.from(new Set(permissionCatalog.map((p) => p.group))).map((group) => (
                <div key={group}>
                  <h3 className="text-xs font-semibold uppercase text-muted-foreground mb-2">{group}</h3>
                  <div className="space-y-2">
                    {permissionCatalog.filter((p) => p.group === group).map((permission) => {
                      const effective = permissionModal.permissions?.[permission.key];
                      const override = permissionForm[permission.key] || "inherit";
                      return (
                        <div key={permission.key} className="rounded-xl border border-border bg-secondary/20 p-3">
                          <div className="flex flex-col md:flex-row md:items-center gap-3 justify-between">
                            <div>
                              <div className="flex items-center gap-2">
                                <p className="text-sm font-semibold text-foreground">{permission.label}</p>
                                <span className={`text-[10px] px-2 py-0.5 rounded-full ${effective ? "bg-green-500/10 text-green-500" : "bg-red-500/10 text-red-500"}`}>
                                  {effective ? "Allowed" : "Denied"}
                                </span>
                              </div>
                              <p className="text-xs text-muted-foreground mt-0.5">{permission.description}</p>
                            </div>
                            <select value={override} onChange={(e) => setPermissionOverride(permission.key, e.target.value as PermissionOverride)}
                              className="px-3 py-2 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring">
                              <option value="inherit">Inherit plan/role</option>
                              <option value="allow">Force allow</option>
                              <option value="deny">Force deny</option>
                            </select>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              <div className="flex gap-3 pt-2">
                <button onClick={() => setPermissionModal(null)}
                  className="flex-1 py-2.5 rounded-xl border border-input text-foreground text-sm font-medium hover:bg-secondary transition-colors">
                  Cancel
                </button>
                <button onClick={savePermissions} disabled={savingPermissions}
                  className="flex-1 py-2.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
                  {savingPermissions ? <Loader2 className="w-4 h-4 animate-spin mx-auto" /> : "Save Permissions"}
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default Admin;
