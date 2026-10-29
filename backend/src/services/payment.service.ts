import crypto from "crypto";
import { Types, type FilterQuery } from "mongoose";
import type Stripe from "stripe";
import { env } from "../config/env";
import { razorpay } from "../config/razorpay";
import { stripe } from "../config/stripe";
import { Payment, type IPayment } from "../models/Payment";
import { Subscription, type PlanCode } from "../models/Subscription";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { emailService } from "./email.service";
import { subscriptionService } from "./subscription.service";

export type RazorpayPlan = keyof typeof env.planPricingInr;

export const isRazorpayPlan = (plan: string): plan is RazorpayPlan =>
  Object.prototype.hasOwnProperty.call(env.planPricingInr, plan);

const PLAN_LABELS: Record<RazorpayPlan, string> = {
  starter_monthly: "Starter (monthly)",
  premium_all_monthly: "Premium All (monthly)",
  premium_monthly: "Premium (monthly)",
  premium_yearly: "Premium (yearly)",
  premium_lifetime: "Premium Lifetime",
};

const planMonths = (plan: PlanCode) => {
  if (plan === "premium_yearly") return 12;
  if (plan === "premium_lifetime") return 120;
  return 1;
};

const RAZORPAY_PAYMENT_ID = /^pay_[A-Za-z0-9]{8,}$/;

interface GatewayPayment {
  amount?: number;
  currency?: string;
  status?: string;
}

/**
 * Payment-link claims carry a Razorpay payment id when the user copies it from
 * the receipt. Verify it against the API when keys are configured. The public
 * razorpay.me link may belong to a different Razorpay account than API keys, so
 * a lookup miss is reported to the admin instead of rejecting the claim.
 */
const fetchGatewayPayment = async (reference: string): Promise<GatewayPayment | null> => {
  if (env.nodeEnv === "test" || !razorpay || !RAZORPAY_PAYMENT_ID.test(reference)) return null;
  try {
    return (await razorpay.payments.fetch(reference)) as GatewayPayment;
  } catch {
    return null;
  }
};

const formatClaim = (
  payment: {
    _id?: unknown;
    id?: string;
    plan: string;
    status: string;
    amount: number;
    currency: string;
    claimReference?: string;
    reviewNote?: string;
    createdAt: Date;
    reviewedAt?: Date;
    metadata?: Record<string, unknown>;
  },
  user?: { id: string; email: string; fullName: string }
) => ({
  id: String(payment.id || payment._id),
  plan: payment.plan,
  planLabel: PLAN_LABELS[payment.plan as RazorpayPlan] || payment.plan,
  status: payment.status,
  amount: payment.amount,
  currency: payment.currency,
  reference: payment.claimReference || "",
  note: String(payment.metadata?.note || ""),
  reviewNote: payment.reviewNote || "",
  verification: String(payment.metadata?.verification || "unverified"),
  gatewayAmount:
    typeof payment.metadata?.gatewayAmount === "number" ? payment.metadata.gatewayAmount : null,
  createdAt: payment.createdAt.toISOString(),
  reviewedAt: payment.reviewedAt?.toISOString() || null,
  user,
});

const safeCompare = (expected: string, received: string) => {
  const a = Buffer.from(expected);
  const b = Buffer.from(received);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};

const razorpaySignatureValid = (orderId: string, paymentId: string, signature: string) => {
  const expected = crypto
    .createHmac("sha256", env.razorpay.keySecret)
    .update(`${orderId}|${paymentId}`)
    .digest("hex");
  return safeCompare(expected, signature);
};

const planToPriceId = (plan: string) => {
  if (plan === "starter_monthly") return env.stripe.starterPriceId || env.stripe.monthlyPriceId;
  if (plan === "premium_all_monthly") return env.stripe.premiumAllPriceId || env.stripe.monthlyPriceId;
  if (plan === "premium_monthly") return env.stripe.monthlyPriceId;
  if (plan === "premium_yearly") return env.stripe.yearlyPriceId;
  if (plan === "premium_lifetime") return env.stripe.oneTimePriceId;
  return "";
};

export const paymentService = {
  async createCheckoutSession(
    userId: string,
    plan:
      | "starter_monthly"
      | "premium_all_monthly"
      | "premium_monthly"
      | "premium_yearly"
      | "premium_lifetime"
  ) {
    if (!stripe) throw new AppError("Stripe is not configured", 503, "STRIPE_NOT_CONFIGURED");
    const priceId = planToPriceId(plan);
    if (!priceId) throw new AppError(`Stripe price id is missing for ${plan}`, 503, "STRIPE_PRICE_MISSING");

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const mode = plan === "premium_lifetime" ? "payment" : "subscription";
    const session = await stripe.checkout.sessions.create({
      mode,
      customer_email: user.email,
      line_items: [{ price: priceId, quantity: 1 }],
      success_url: `${env.frontendUrl}/pricing?payment=success`,
      cancel_url: `${env.frontendUrl}/pricing?payment=cancelled`,
      metadata: {
        userId,
        plan,
      },
      subscription_data:
        mode === "subscription"
          ? {
              metadata: { userId, plan },
            }
          : undefined,
    });

    await Payment.create({
      user: userId,
      provider: "stripe",
      providerSessionId: session.id,
      amount: 0,
      currency: "usd",
      status: "pending",
      plan,
      metadata: { url: session.url },
    });

    return { id: session.id, url: session.url };
  },

  async listHistory(userId: string) {
    return Payment.find({ user: userId }).sort({ createdAt: -1 });
  },

  plans() {
    return {
      paymentLink: env.razorpay.paymentLink,
      supportEmail: env.supportEmail,
      plans: (Object.keys(env.planPricingInr) as RazorpayPlan[]).map((plan) => ({
        code: plan,
        label: PLAN_LABELS[plan],
        amount: env.planPricingInr[plan],
        currency: "INR",
      })),
    };
  },

  async createClaim(
    userId: string,
    input: { plan: RazorpayPlan; reference: string; note?: string }
  ) {
    if (!isRazorpayPlan(input.plan)) {
      throw new AppError("Unknown plan", 400, "PLAN_INVALID");
    }
    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const pending = await Payment.findOne({
      user: userId,
      provider: "razorpay",
      status: "pending",
      "metadata.method": "payment_link",
    });
    if (pending) {
      throw new AppError(
        "You already have a payment waiting for verification. Contact support if it has been more than 2 business days.",
        409,
        "CLAIM_ALREADY_PENDING"
      );
    }

    const duplicateReference = await Payment.findOne({
      provider: "razorpay",
      claimReference: input.reference,
    });
    if (duplicateReference) {
      throw new AppError(
        "This payment reference was already submitted. Contact support if this is a mistake.",
        409,
        "CLAIM_REFERENCE_USED"
      );
    }

    const amount = env.planPricingInr[input.plan];
    const gatewayPayment = await fetchGatewayPayment(input.reference);
    let verification: "verified" | "not_found" | "skipped" = "skipped";
    const gatewayDetails: Record<string, unknown> = {};

    if (gatewayPayment) {
      const gatewayAmount = Number(gatewayPayment.amount || 0);
      const gatewayStatus = String(gatewayPayment.status || "unknown");
      if (gatewayStatus !== "captured" && gatewayStatus !== "authorized") {
        throw new AppError(
          `Razorpay reports this payment as "${gatewayStatus}". Complete the payment first, then submit the reference.`,
          400,
          "PAYMENT_NOT_COMPLETED"
        );
      }
      if (gatewayAmount !== amount) {
        throw new AppError(
          `The verified payment is ₹${Math.round(gatewayAmount / 100)}, but ${PLAN_LABELS[input.plan]} costs ₹${Math.round(amount / 100)}. Submit the matching plan or contact support.`,
          400,
          "PAYMENT_AMOUNT_MISMATCH"
        );
      }
      verification = "verified";
      Object.assign(gatewayDetails, {
        gatewayAmount,
        gatewayStatus,
        gatewayCurrency: gatewayPayment.currency || "INR",
      });
    } else if (RAZORPAY_PAYMENT_ID.test(input.reference)) {
      verification = "not_found";
    }

    const claim = await Payment.create({
      user: userId,
      provider: "razorpay",
      providerSessionId: `claim_${userId}_${Date.now()}`,
      amount,
      currency: "inr",
      status: "pending",
      plan: input.plan,
      claimReference: input.reference,
      metadata: {
        method: "payment_link",
        note: input.note || "",
        submittedAt: new Date().toISOString(),
        verification,
        ...gatewayDetails,
      },
    });

    void emailService.sendPaymentClaimReceived(user.email, input.reference, PLAN_LABELS[input.plan]);
    if (env.contactInbox) {
      void emailService.sendMail(
        env.contactInbox,
        `New Habbiters payment claim: ${PLAN_LABELS[input.plan]}`,
        `<p>${user.fullName} (${user.email}) submitted payment reference <strong>${input.reference}</strong> for ${PLAN_LABELS[input.plan]} (₹${amount / 100}).</p><p>Review it in the admin panel → Payments.</p>`
      );
    }

    return formatClaim(claim.toObject(), {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    });
  },

  async listClaims(userId: string) {
    const rows = await Payment.find({
      user: userId,
      provider: "razorpay",
      "metadata.method": "payment_link",
    }).sort({ createdAt: -1 });
    return rows.map((row) => formatClaim(row.toObject()));
  },

  async listAdminClaims(status?: string) {
    const filter: FilterQuery<IPayment> = {
      provider: "razorpay",
      "metadata.method": "payment_link",
    };
    if (status && ["pending", "paid", "failed", "refunded"].includes(status)) {
      filter.status = status;
    }
    const rows = await Payment.find(filter)
      .populate<{ user: { id: string; email: string; fullName: string } }>(
        "user",
        "email fullName"
      )
      .sort({ createdAt: -1 });
    return rows.map((row) => {
      const user = row.user as unknown as { id: string; email: string; fullName: string } | null;
      return formatClaim(row.toObject(), user || undefined);
    });
  },

  async reviewClaim(
    adminId: string,
    claimId: string,
    input: { action: "approve" | "reject"; plan?: PlanCode; durationMonths?: number; note?: string }
  ) {
    const claim = await Payment.findOne({
      _id: claimId,
      provider: "razorpay",
      "metadata.method": "payment_link",
    });
    if (!claim) throw new AppError("Payment claim not found", 404, "CLAIM_NOT_FOUND");
    if (claim.status !== "pending") {
      throw new AppError("This claim has already been reviewed", 409, "CLAIM_ALREADY_REVIEWED");
    }

    const user = await User.findById(claim.user);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    claim.reviewedBy = new Types.ObjectId(adminId);
    claim.reviewedAt = new Date();
    claim.reviewNote = input.note;

    if (input.action === "reject") {
      claim.status = "failed";
      await claim.save();
      void emailService.sendPaymentClaimRejected(user.email, claim.claimReference || "", input.note);
      return formatClaim(claim.toObject(), {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
      });
    }

    const plan = (input.plan && isRazorpayPlan(input.plan) ? input.plan : claim.plan) as PlanCode;
    if (!isRazorpayPlan(plan)) {
      throw new AppError("Cannot activate an unknown plan", 400, "PLAN_INVALID");
    }
    const durationMonths = input.durationMonths || planMonths(plan);

    const verifiedAmount =
      claim.metadata?.verification === "verified" ? Number(claim.metadata?.gatewayAmount) : null;
    if (verifiedAmount !== null && verifiedAmount !== env.planPricingInr[plan]) {
      throw new AppError(
        `The verified Razorpay payment (₹${Math.round(verifiedAmount / 100)}) does not match ${PLAN_LABELS[plan]} (₹${Math.round(env.planPricingInr[plan] / 100)}). Reject this claim or ask the user to submit the correct plan.`,
        409,
        "PAYMENT_AMOUNT_MISMATCH"
      );
    }

    claim.status = "paid";
    claim.plan = plan;
    claim.providerPaymentId = claim.claimReference;
    await claim.save();

    const subscription = await subscriptionService.activateRazorpayPlan(
      claim.user,
      plan,
      durationMonths
    );

    void emailService.sendPremiumActivated(
      user.email,
      PLAN_LABELS[plan],
      subscription?.currentPeriodEnd || null
    );

    return formatClaim(claim.toObject(), {
      id: user.id,
      email: user.email,
      fullName: user.fullName,
    });
  },

  async createRazorpayOrder(userId: string, plan: RazorpayPlan) {
    if (!razorpay) throw new AppError("Payments are not configured yet", 503, "PAYMENTS_NOT_CONFIGURED");
    const amount = env.planPricingInr[plan];
    if (!amount) throw new AppError(`No INR price configured for plan ${plan}`, 503, "PLAN_PRICE_MISSING");

    const user = await User.findById(userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const order = await razorpay.orders.create({
      amount,
      currency: "INR",
      receipt: `hb_${userId.slice(-8)}_${Date.now()}`,
      notes: { userId, plan },
    });

    await Payment.create({
      user: userId,
      provider: "razorpay",
      providerSessionId: order.id,
      amount: order.amount as number,
      currency: "inr",
      status: "pending",
      plan,
      metadata: { notes: order.notes },
    });

    return {
      orderId: order.id,
      amount: order.amount as number,
      currency: "INR",
      keyId: env.razorpay.keyId,
      plan,
      user: { name: user.fullName, email: user.email },
    };
  },

  async verifyRazorpayPayment(
    userId: string,
    input: { razorpayOrderId: string; razorpayPaymentId: string; razorpaySignature: string }
  ) {
    if (!razorpay) throw new AppError("Payments are not configured yet", 503, "PAYMENTS_NOT_CONFIGURED");
    if (!razorpaySignatureValid(input.razorpayOrderId, input.razorpayPaymentId, input.razorpaySignature)) {
      throw new AppError("Invalid payment signature", 400, "RAZORPAY_SIGNATURE_INVALID");
    }

    const payment = await Payment.findOne({ providerSessionId: input.razorpayOrderId, user: userId });
    if (!payment) throw new AppError("Order not found for this account", 404, "ORDER_NOT_FOUND");
    if (!isRazorpayPlan(payment.plan)) {
      throw new AppError("Unknown plan on order", 400, "PLAN_INVALID");
    }
    if (payment.status === "paid") {
      const existing = await subscriptionService.getForUser(userId);
      return { subscription: existing, alreadyProcessed: true };
    }

    const order = await razorpay.orders.fetch(input.razorpayOrderId);
    if (order.status !== "paid") {
      throw new AppError("Payment is not completed. If money was deducted it will auto-refund.", 400, "PAYMENT_NOT_COMPLETED");
    }
    if ((order.amount as number) !== payment.amount) {
      throw new AppError("Order amount mismatch", 400, "ORDER_AMOUNT_MISMATCH");
    }

    payment.status = "paid";
    payment.providerPaymentId = input.razorpayPaymentId;
    await payment.save();

    const subscription = await subscriptionService.activateRazorpaySubscription({
      userId,
      plan: payment.plan,
      razorpayOrderId: input.razorpayOrderId,
      razorpayPaymentId: input.razorpayPaymentId,
    });

    return { subscription, alreadyProcessed: false };
  },

  async handleRazorpayWebhook(rawBody: Buffer, signature: string) {
    if (!env.razorpay.webhookSecret) {
      throw new AppError("Razorpay webhook is not configured", 503, "RAZORPAY_WEBHOOK_NOT_CONFIGURED");
    }
    const expected = crypto.createHmac("sha256", env.razorpay.webhookSecret).update(rawBody).digest("hex");
    if (!safeCompare(expected, signature)) {
      throw new AppError("Invalid webhook signature", 400, "RAZORPAY_SIGNATURE_INVALID");
    }

    const event = JSON.parse(rawBody.toString("utf8")) as {
      event?: string;
      payload?: {
        payment?: { entity?: { id?: string; order_id?: string; notes?: { userId?: string; plan?: string } } };
      };
    };

    if (event.event === "payment.captured" || event.event === "order.paid") {
      const entity = event.payload?.payment?.entity;
      const orderId = entity?.order_id;
      const paymentId = entity?.id;
      const userId = entity?.notes?.userId;
      const plan = entity?.notes?.plan;
      if (!orderId || !paymentId || !userId || !plan || !isRazorpayPlan(plan)) return;

      const payment = await Payment.findOne({ providerSessionId: orderId });
      if (!payment || payment.status === "paid") return;

      payment.status = "paid";
      payment.providerPaymentId = paymentId;
      await payment.save();

      await subscriptionService.activateRazorpaySubscription({
        userId,
        plan,
        razorpayOrderId: orderId,
        razorpayPaymentId: paymentId,
      });
    }
  },

  async cancelSubscription(userId: string) {
    if (!stripe) throw new AppError("Stripe is not configured", 503, "STRIPE_NOT_CONFIGURED");
    const sub = await subscriptionService.getForUser(userId);
    if (!sub?.stripeSubscriptionId) {
      throw new AppError("No Stripe subscription found for this account", 404, "SUBSCRIPTION_NOT_FOUND");
    }

    const canceled = await stripe.subscriptions.update(sub.stripeSubscriptionId, {
      cancel_at_period_end: true,
    });

    sub.cancelAtPeriodEnd = true;
    sub.currentPeriodEnd = canceled.current_period_end
      ? new Date(canceled.current_period_end * 1000)
      : sub.currentPeriodEnd;
    await sub.save();
    return sub;
  },

  async handleStripeWebhook(event: Stripe.Event) {
    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = session.metadata?.userId;
      const plan = session.metadata?.plan as PlanCode | undefined;
      if (!userId || !plan) return;

      await Payment.findOneAndUpdate(
        { providerSessionId: session.id },
        {
          $set: {
            status: "paid",
            providerPaymentId:
              typeof session.payment_intent === "string" ? session.payment_intent : undefined,
            amount: session.amount_total || 0,
            currency: session.currency || "usd",
          },
        },
        { new: true }
      );

      if (plan === "premium_lifetime") {
        await subscriptionService.activateStripeSubscription({
          userId,
          plan,
          stripeCustomerId: typeof session.customer === "string" ? session.customer : undefined,
        });
      }
    }

    if (event.type === "customer.subscription.created" || event.type === "customer.subscription.updated") {
      const sub = event.data.object as Stripe.Subscription;
      const userId = sub.metadata?.userId;
      const plan = sub.metadata?.plan as PlanCode | undefined;
      if (!userId || !plan) return;
      await subscriptionService.activateStripeSubscription({
        userId,
        plan,
        stripeCustomerId: typeof sub.customer === "string" ? sub.customer : undefined,
        stripeSubscriptionId: sub.id,
        currentPeriodStart: new Date(sub.current_period_start * 1000),
        currentPeriodEnd: new Date(sub.current_period_end * 1000),
      });
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const stripeSubscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : undefined;
      if (stripeSubscriptionId) {
        await Subscription.findOneAndUpdate(
          { stripeSubscriptionId },
          { $set: { status: "past_due" } }
        );
      }
    }
  },
};
