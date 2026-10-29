import mongoose, { Document, Schema, Types } from "mongoose";

export interface IPayment extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  subscription?: Types.ObjectId;
  provider: "stripe" | "razorpay" | "manual";
  providerPaymentId?: string;
  providerSessionId?: string;
  amount: number;
  currency: string;
  status: "pending" | "paid" | "failed" | "refunded";
  plan: string;
  claimReference?: string;
  reviewNote?: string;
  reviewedBy?: Types.ObjectId;
  reviewedAt?: Date;
  invoiceUrl?: string;
  receiptUrl?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const paymentSchema = new Schema<IPayment>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    subscription: {
      type: Schema.Types.ObjectId,
      ref: "Subscription",
    },
    provider: {
      type: String,
      enum: ["stripe", "razorpay", "manual"],
      required: true,
    },
    providerPaymentId: { type: String, index: true, sparse: true },
    providerSessionId: { type: String, index: true, sparse: true },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    currency: {
      type: String,
      default: "usd",
      lowercase: true,
    },
    status: {
      type: String,
      enum: ["pending", "paid", "failed", "refunded"],
      default: "pending",
      index: true,
    },
    plan: {
      type: String,
      required: true,
      index: true,
    },
    claimReference: {
      type: String,
      trim: true,
      maxlength: 160,
      index: true,
      sparse: true,
    },
    reviewNote: {
      type: String,
      trim: true,
      maxlength: 500,
    },
    reviewedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
    reviewedAt: Date,
    invoiceUrl: String,
    receiptUrl: String,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

paymentSchema.index({ user: 1, createdAt: -1 });
paymentSchema.index({ provider: 1, status: 1, createdAt: -1 });

export const Payment = mongoose.model<IPayment>("Payment", paymentSchema);
