import mongoose, { Document, Schema, Types } from "mongoose";

export type SubscriptionStatus =
  | "none"
  | "trial"
  | "active"
  | "past_due"
  | "canceled"
  | "expired";

export type PlanCode =
  | "free"
  | "starter_monthly"
  | "premium_all_monthly"
  | "premium_monthly"
  | "premium_yearly"
  | "premium_lifetime";

export interface ISubscription extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  plan: PlanCode;
  status: SubscriptionStatus;
  provider: "manual" | "stripe" | "razorpay";
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  trialStart?: Date;
  trialEnd?: Date;
  currentPeriodStart?: Date;
  currentPeriodEnd?: Date;
  cancelAtPeriodEnd: boolean;
  canceledAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

const subscriptionSchema = new Schema<ISubscription>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
      index: true,
    },
    plan: {
      type: String,
      enum: [
        "free",
        "starter_monthly",
        "premium_all_monthly",
        "premium_monthly",
        "premium_yearly",
        "premium_lifetime",
      ],
      default: "free",
      index: true,
    },
    status: {
      type: String,
      enum: ["none", "trial", "active", "past_due", "canceled", "expired"],
      default: "trial",
      index: true,
    },
    provider: {
      type: String,
      enum: ["manual", "stripe", "razorpay"],
      default: "manual",
    },
    stripeCustomerId: { type: String, index: true, sparse: true },
    stripeSubscriptionId: { type: String, index: true, sparse: true },
    trialStart: Date,
    trialEnd: Date,
    currentPeriodStart: Date,
    currentPeriodEnd: Date,
    cancelAtPeriodEnd: {
      type: Boolean,
      default: false,
    },
    canceledAt: Date,
  },
  { timestamps: true }
);

subscriptionSchema.index({ status: 1, currentPeriodEnd: 1 });

export const Subscription = mongoose.model<ISubscription>("Subscription", subscriptionSchema);
