import { addDays, addMonths } from "date-fns";
import { Types } from "mongoose";
import { Subscription, type ISubscription, type PlanCode, type SubscriptionStatus } from "../models/Subscription";

export type SubscriptionTier = "free" | "starter" | "premium";

const hasActiveTrial = (subscription?: ISubscription | null) =>
  Boolean(
    subscription &&
      subscription.status === "trial" &&
      subscription.trialEnd &&
      subscription.trialEnd > new Date()
  );

export const getSubscriptionTier = (subscription?: ISubscription | null): SubscriptionTier => {
  if (!subscription) return "free";
  const active =
    subscription.status === "active" &&
    (subscription.plan === "premium_lifetime" ||
      !subscription.currentPeriodEnd ||
      subscription.currentPeriodEnd > new Date());
  if (!active) return "free";
  if (subscription.plan === "starter_monthly") return "starter";
  if (
    subscription.plan === "premium_all_monthly" ||
    subscription.plan === "premium_monthly" ||
    subscription.plan === "premium_yearly" ||
    subscription.plan === "premium_lifetime"
  ) {
    return "premium";
  }
  return "free";
};

/**
 * Effective access level. The 7-day trial is marketed as a premium trial, so a
 * live trial grants premium access even though the paid tier stays "free".
 */
export const getAccessTier = (subscription?: ISubscription | null): SubscriptionTier => {
  if (hasActiveTrial(subscription)) return "premium";
  return getSubscriptionTier(subscription);
};

export const isSubscriptionPremium = (subscription?: ISubscription | null) => {
  return getAccessTier(subscription) === "premium";
};

export const isSubscriptionStarter = (subscription?: ISubscription | null) =>
  getAccessTier(subscription) === "starter";

export const isSubscriptionActive = (subscription?: ISubscription | null) => {
  if (!subscription) return false;
  return getAccessTier(subscription) !== "free";
};

export const formatSubscription = (subscription?: ISubscription | null) => {
  const trialEnd = subscription?.trialEnd || null;
  const now = new Date();
  const daysLeft = trialEnd
    ? Math.max(0, Math.ceil((trialEnd.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)))
    : 0;
  const isTrialing = hasActiveTrial(subscription);
  const accessTier = getAccessTier(subscription);

  return {
    status: subscription?.status || "none",
    plan: subscription?.plan || "free",
    tier: getSubscriptionTier(subscription),
    accessTier,
    trialEnd: trialEnd?.toISOString() || null,
    currentPeriodEnd: subscription?.currentPeriodEnd?.toISOString() || null,
    cancelAtPeriodEnd: subscription?.cancelAtPeriodEnd || false,
    isActive: accessTier !== "free",
    isPremium: accessTier === "premium",
    isStarter: accessTier === "starter",
    isTrialing,
    daysLeft,
  };
};

export const subscriptionService = {
  async ensureTrial(userId: Types.ObjectId | string) {
    const existing = await Subscription.findOne({ user: userId });
    if (existing) return existing;

    const start = new Date();
    return Subscription.create({
      user: userId,
      plan: "free",
      status: "trial",
      provider: "manual",
      trialStart: start,
      trialEnd: addDays(start, 7),
    });
  },

  async getForUser(userId: Types.ObjectId | string) {
    return Subscription.findOne({ user: userId });
  },

  async updateManual(
    userId: Types.ObjectId | string,
    status: SubscriptionStatus,
    durationMonths = 1,
    plan: PlanCode = "premium_all_monthly"
  ) {
    const updates: Partial<ISubscription> = {
      status,
      provider: "manual",
      plan: status === "active" ? plan : "free",
    };

    if (status === "active") {
      updates.currentPeriodStart = new Date();
      updates.currentPeriodEnd = addMonths(new Date(), durationMonths);
      updates.cancelAtPeriodEnd = false;
    } else if (status === "trial") {
      updates.trialStart = new Date();
      updates.trialEnd = addDays(new Date(), 7);
      updates.currentPeriodStart = undefined;
      updates.currentPeriodEnd = undefined;
    } else {
      updates.currentPeriodStart = undefined;
      updates.currentPeriodEnd = undefined;
      updates.cancelAtPeriodEnd = false;
    }

    return Subscription.findOneAndUpdate(
      { user: userId },
      { $set: updates },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },

  async activateRazorpayPlan(
    userId: Types.ObjectId | string,
    plan: PlanCode,
    durationMonths: number
  ) {
    const periodEnd = plan === "premium_lifetime" ? undefined : addMonths(new Date(), durationMonths);
    return Subscription.findOneAndUpdate(
      { user: userId },
      {
        $set: {
          plan,
          status: "active",
          provider: "razorpay",
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },

  async activateRazorpaySubscription(params: {
    userId: Types.ObjectId | string;
    plan: PlanCode;
    razorpayOrderId: string;
    razorpayPaymentId: string;
  }) {
    const periodEnd =
      params.plan === "premium_lifetime"
        ? undefined
        : params.plan === "premium_yearly"
          ? addMonths(new Date(), 12)
          : addMonths(new Date(), 1);

    return Subscription.findOneAndUpdate(
      { user: params.userId },
      {
        $set: {
          plan: params.plan,
          status: "active",
          provider: "razorpay",
          currentPeriodStart: new Date(),
          currentPeriodEnd: periodEnd,
          cancelAtPeriodEnd: false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },

  async activateStripeSubscription(params: {
    userId: Types.ObjectId | string;
    plan: PlanCode;
    stripeCustomerId?: string;
    stripeSubscriptionId?: string;
    currentPeriodStart?: Date;
    currentPeriodEnd?: Date;
  }) {
    return Subscription.findOneAndUpdate(
      { user: params.userId },
      {
        $set: {
          plan: params.plan,
          status: "active",
          provider: "stripe",
          stripeCustomerId: params.stripeCustomerId,
          stripeSubscriptionId: params.stripeSubscriptionId,
          currentPeriodStart: params.currentPeriodStart || new Date(),
          currentPeriodEnd: params.currentPeriodEnd,
          cancelAtPeriodEnd: false,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
  },
};
