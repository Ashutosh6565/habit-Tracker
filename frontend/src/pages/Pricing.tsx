import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Check, ArrowRight, Star, Crown, ExternalLink, Clock, ShieldCheck, Loader2, AlertCircle, Mail } from "lucide-react";
import { Link, useSearchParams } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { useAuth } from "@/context/AuthContext";
import { api, getApiErrorMessage, type PaymentClaimDto, type PaymentPlanDto, type PlanCode } from "@/lib/api";
import { isNativeApp, openExternal } from "@/lib/native";
import { useToast } from "@/hooks/use-toast";

const formatRupees = (paise: number) => `₹${Math.round(paise / 100)}`;

const basePlans: {
  name: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  highlighted: boolean;
  planCode?: PlanCode;
  tier: "free" | "starter" | "premium";
}[] = [
  {
    name: "Free",
    description: "Start building habits today",
    features: ["Track up to 5 habits", "12 free templates", "Basic analytics", "7-day premium trial"],
    cta: "Get Started",
    highlighted: false,
    tier: "free",
  },
  {
    name: "Starter",
    period: "/month",
    description: "More templates, more structure",
    features: ["Everything in Free", "25 starter templates", "Premium templates stay locked", "Template progress saving", "Email support"],
    cta: "Choose Starter",
    highlighted: false,
    planCode: "starter_monthly",
    tier: "starter",
  },
  {
    name: "Premium All",
    period: "/month",
    description: "Unlock every template, current and future",
    features: ["Everything in Starter", "All 105 templates unlocked", "Unlimited habits", "Advanced analytics & calendar", "Habit reminders", "Export reports"],
    cta: "Go Premium",
    highlighted: true,
    planCode: "premium_all_monthly",
    tier: "premium",
  },
];

const statusStyles: Record<PaymentClaimDto["status"], string> = {
  pending: "bg-amber-500/10 text-amber-600 border-amber-500/30",
  paid: "bg-green-500/10 text-green-600 border-green-500/30",
  failed: "bg-destructive/10 text-destructive border-destructive/30",
  refunded: "bg-secondary text-muted-foreground border-border",
};

const statusLabels: Record<PaymentClaimDto["status"], string> = {
  pending: "Waiting for approval",
  paid: "Approved",
  failed: "Rejected",
  refunded: "Refunded",
};

const Pricing = () => {
  const { subscription, user, refreshSubscription } = useAuth();
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [plansData, setPlansData] = useState<{ paymentLink: string; supportEmail: string; plans: PaymentPlanDto[] } | null>(null);
  const [claims, setClaims] = useState<PaymentClaimDto[]>([]);
  const [selectedPlan, setSelectedPlan] = useState<PlanCode | null>(null);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    api.payments.plans().then(setPlansData).catch(() => setPlansData(null));
  }, []);

  const loadClaims = async () => {
    if (!user) return;
    try {
      const { claims } = await api.payments.myClaims();
      setClaims(claims);
    } catch {
      // Claim history is optional; ignore failures.
    }
  };

  useEffect(() => {
    loadClaims();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const priceFor = useMemo(() => {
    const map: Partial<Record<PlanCode, PaymentPlanDto>> = {};
    plansData?.plans.forEach((plan) => {
      map[plan.code] = plan;
    });
    return map;
  }, [plansData]);

  const latestClaim = claims[0];
  const hasPendingClaim = claims.some((claim) => claim.status === "pending");

  const openPaymentPage = (plan: PlanCode) => {
    if (!user) return;
    // Google Play requires its own billing for digital subscriptions, so the
    // Android build does not route users to the Razorpay page.
    if (isNativeApp) {
      toast({
        title: "Upgrades aren't available in the app yet",
        description: "Your current plan keeps working. Paid plans are managed on the website.",
      });
      return;
    }
    setSelectedPlan(plan);
    if (plansData?.paymentLink) {
      openExternal(plansData.paymentLink);
    }
    setTimeout(() => {
      document.getElementById("payment-claim")?.scrollIntoView({ behavior: "smooth", block: "center" });
    }, 150);
  };

  const submitClaim = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlan) return;
    if (reference.trim().length < 6) {
      toast({ title: "Enter your payment reference", description: "Paste the Razorpay payment ID or UTR from your receipt.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { claim } = await api.payments.createClaim({ plan: selectedPlan, reference: reference.trim(), note: note.trim() || undefined });
      setClaims((prev) => [claim, ...prev]);
      setReference("");
      setNote("");
      toast({
        title: "Payment submitted",
        description: "An admin will verify your payment and activate the plan. You'll get an email once it's approved.",
      });
    } catch (error) {
      toast({ title: "Could not submit payment", description: getApiErrorMessage(error), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const currentTier = subscription?.tier || "free";

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-10">
            <h1 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">Simple Pricing in Rupees</h1>
            <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
              {isNativeApp
                ? "Your plan works across the app and the website. Paid upgrades are not sold inside the Android app."
                : "Start free with a 7-day premium trial. Pay securely on Razorpay, submit your payment reference, and an admin activates your plan."}
            </p>
            {subscription?.isTrialing && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-yellow-500/10 text-yellow-600 text-sm font-medium">
                <Crown className="w-4 h-4" /> Trial: {subscription.daysLeft} days remaining
              </div>
            )}
            {currentTier !== "free" && (
              <div className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 text-green-500 text-sm font-medium">
                <Check className="w-4 h-4" /> Active plan: {currentTier === "starter" ? "Starter" : "Premium All"}
              </div>
            )}
          </div>

          <div className="grid md:grid-cols-3 gap-6 mx-auto">
            {basePlans.map((plan, i) => {
              const active =
                (plan.tier === "starter" && currentTier === "starter") ||
                (plan.tier === "premium" && currentTier === "premium");
              const price = plan.planCode ? priceFor[plan.planCode] : undefined;
              return (
                <motion.div key={plan.name} initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.15 }}
                  className={`p-8 rounded-2xl border relative ${plan.highlighted ? "border-primary/50 bg-card shadow-2xl shadow-primary/10" : "border-border bg-card"}`}>
                  {plan.highlighted && (
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full gradient-primary text-xs font-bold text-primary-foreground flex items-center gap-1">
                      <Star className="w-3 h-3" /> Most Popular
                    </div>
                  )}
                  <h3 className="font-display font-bold text-xl text-foreground">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{plan.description}</p>
                  <div className="mt-6 mb-8">
                    <span className="text-5xl font-display font-bold text-foreground">
                      {plan.tier === "free" ? "₹0" : price ? formatRupees(price.amount) : "—"}
                    </span>
                    {plan.period && <span className="text-muted-foreground text-lg">{plan.period}</span>}
                  </div>
                  <ul className="space-y-3 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-center gap-2.5 text-sm text-muted-foreground">
                        <Check className="w-4 h-4 text-primary flex-shrink-0" /> {f}
                      </li>
                    ))}
                  </ul>
                  {plan.planCode ? (
                    user ? (
                      <button
                        onClick={() => openPaymentPage(plan.planCode!)}
                        disabled={active || hasPendingClaim}
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all disabled:opacity-60 ${
                          plan.highlighted ? "gradient-primary text-primary-foreground hover:opacity-90" : "border border-border text-foreground hover:bg-secondary"
                        }`}>
                        {active ? "Current Plan" : hasPendingClaim ? "Payment under review" : plan.cta}
                        {!active && !hasPendingClaim && <ArrowRight className="w-4 h-4" />}
                      </button>
                    ) : (
                      <Link to="/signup"
                        className={`flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all ${
                          plan.highlighted ? "gradient-primary text-primary-foreground hover:opacity-90" : "border border-border text-foreground hover:bg-secondary"
                        }`}>
                        {plan.cta} <ArrowRight className="w-4 h-4" />
                      </Link>
                    )
                  ) : (
                    <Link to={user ? "/dashboard" : "/signup"}
                      className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-semibold text-sm transition-all border border-border text-foreground hover:bg-secondary">
                      {plan.cta} <ArrowRight className="w-4 h-4" />
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>

          {latestClaim && (
            <div className={`mt-8 rounded-2xl border p-5 ${statusStyles[latestClaim.status]}`}>
              <div className="flex items-start gap-3">
                {latestClaim.status === "pending" ? <Clock className="w-5 h-5 mt-0.5" /> : latestClaim.status === "paid" ? <ShieldCheck className="w-5 h-5 mt-0.5" /> : <AlertCircle className="w-5 h-5 mt-0.5" />}
                <div className="flex-1 text-sm">
                  <p className="font-semibold">
                    {latestClaim.planLabel} · {statusLabels[latestClaim.status]}
                  </p>
                  <p className="opacity-80 mt-0.5">
                    Reference: {latestClaim.reference || "—"} · Submitted {new Date(latestClaim.createdAt).toLocaleDateString()}
                  </p>
                  {latestClaim.reviewNote && <p className="opacity-80 mt-1">Admin note: {latestClaim.reviewNote}</p>}
                  {latestClaim.status === "pending" && (
                    <p className="opacity-80 mt-1">
                      Payments are usually verified within 1–2 business days. You'll receive an email as soon as it's approved.
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {isNativeApp && (
            <div className="mt-10 rounded-2xl border border-border bg-card p-6 text-center">
              <p className="text-sm text-muted-foreground">
                The Android app is free to use. If you already have a paid plan, it applies to this account
                automatically.
              </p>
            </div>
          )}

          {user && !isNativeApp && (
            <div id="payment-claim" className="mt-10 grid lg:grid-cols-[1fr_360px] gap-6 items-start">
              <motion.form onSubmit={submitClaim} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
                className="glass rounded-2xl p-6 md:p-8 space-y-5">
                <div>
                  <h2 className="font-display font-bold text-xl text-foreground">Already paid? Submit your reference</h2>
                  <p className="text-sm text-muted-foreground mt-1">
                    Pay on Razorpay, then paste the payment ID or UTR here. An admin verifies it and activates your plan.
                  </p>
                </div>

                {searchParams.get("plan") && !selectedPlan && (
                  <p className="text-sm text-primary">Selected plan: {searchParams.get("plan")}</p>
                )}

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Plan you paid for</label>
                  <select
                    value={selectedPlan ?? ""}
                    onChange={(e) => setSelectedPlan((e.target.value || null) as PlanCode | null)}
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  >
                    <option value="">Select a plan…</option>
                    {(plansData?.plans || []).map((plan) => (
                      <option key={plan.code} value={plan.code}>
                        {plan.label} — {formatRupees(plan.amount)}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Payment ID / UTR</label>
                  <input
                    value={reference}
                    onChange={(e) => setReference(e.target.value)}
                    placeholder="e.g. pay_Q2f8aXk39Lm or 4382XXXXXXXX"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-1.5 block">Note (optional)</label>
                  <textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    rows={3}
                    placeholder="Anything we should know about this payment?"
                    className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring resize-none"
                  />
                </div>

                <button type="submit" disabled={submitting || !selectedPlan}
                  className="w-full py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50 flex items-center justify-center gap-2">
                  {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
                  Submit payment for verification
                </button>
                <p className="text-xs text-muted-foreground text-center">
                  Only submit after the payment succeeds on Razorpay. Never share OTPs or card details.
                </p>
              </motion.form>

              <div className="space-y-4">
                <div className="glass rounded-2xl p-6">
                  <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4">
                    <ExternalLink className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <h3 className="font-display font-semibold text-foreground mb-1">Pay on Razorpay</h3>
                  <p className="text-sm text-muted-foreground mb-4">Secure UPI, card, and netbanking payments. Use the same amount as the plan you choose.</p>
                  {plansData?.paymentLink ? (
                    <a href={plansData.paymentLink} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline">
                      Open Razorpay payment page <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  ) : (
                    <span className="text-sm text-muted-foreground">Payment link unavailable right now.</span>
                  )}
                </div>

                <div className="glass rounded-2xl p-6">
                  <h3 className="font-display font-semibold text-foreground mb-2">How approval works</h3>
                  <ol className="text-sm text-muted-foreground space-y-2 list-decimal list-inside">
                    <li>Choose a plan and pay on the Razorpay page.</li>
                    <li>Copy the payment ID or UTR from your receipt.</li>
                    <li>Submit the reference above.</li>
                    <li>An admin verifies it and activates your plan.</li>
                  </ol>
                  {plansData?.supportEmail && (
                    <p className="text-xs text-muted-foreground mt-4 flex items-center gap-1.5">
                      <Mail className="w-3.5 h-3.5" /> Need help? {plansData.supportEmail}
                    </p>
                  )}
                </div>
              </div>
            </div>
          )}

          {currentTier !== "free" && (
            <div className="text-center mt-8">
              <button
                onClick={async () => {
                  try {
                    await api.payments.cancel();
                    await refreshSubscription();
                    toast({ title: "Cancellation scheduled", description: "Your plan stays active until the end of the paid period." });
                  } catch (error) {
                    toast({ title: "Unable to cancel subscription", description: getApiErrorMessage(error), variant: "destructive" });
                  }
                }}
                className="text-sm text-muted-foreground hover:text-foreground underline"
              >
                {subscription?.cancelAtPeriodEnd ? "Cancellation scheduled" : "Cancel subscription at period end"}
              </button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default Pricing;
