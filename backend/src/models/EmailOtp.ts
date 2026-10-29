import crypto from "crypto";
import mongoose, { Document, Model, Schema } from "mongoose";
import { env } from "../config/env";

export type EmailOtpPurpose = "signup" | "login";

export interface IEmailOtp extends Document {
  email: string;
  purpose: EmailOtpPurpose;
  otpHash: string;
  expiresAt: Date;
  attempts: number;
  consumedAt?: Date;
  createdAt: Date;
  updatedAt: Date;
}

interface EmailOtpModel extends Model<IEmailOtp> {
  hashOtp(email: string, otp: string): string;
}

const emailOtpSchema = new Schema<IEmailOtp, EmailOtpModel>(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    purpose: {
      type: String,
      enum: ["signup", "login"],
      required: true,
      index: true,
    },
    otpHash: {
      type: String,
      required: true,
      select: false,
    },
    expiresAt: {
      type: Date,
      required: true,
    },
    attempts: {
      type: Number,
      default: 0,
      min: 0,
    },
    consumedAt: Date,
  },
  { timestamps: true }
);

emailOtpSchema.index({ email: 1, purpose: 1, consumedAt: 1 });
emailOtpSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 60 * 60 * 24 });

emailOtpSchema.statics.hashOtp = (email: string, otp: string) =>
  crypto
    .createHmac("sha256", env.jwtAccessSecret)
    .update(`${email.toLowerCase()}:${otp}`)
    .digest("hex");

export const EmailOtp = mongoose.model<IEmailOtp, EmailOtpModel>("EmailOtp", emailOtpSchema);
