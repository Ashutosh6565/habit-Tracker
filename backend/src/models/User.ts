import bcrypt from "bcryptjs";
import crypto from "crypto";
import mongoose, { Document, Model, Schema, Types } from "mongoose";
import type { PermissionKey, PermissionOverride } from "../config/permissions";

export type UserRole = "user" | "admin";
export type AuthProvider = "local" | "google";

export interface IUser extends Document<Types.ObjectId> {
  email: string;
  password?: string;
  fullName: string;
  avatarUrl?: string;
  role: UserRole;
  provider: AuthProvider;
  googleId?: string;
  isEmailVerified: boolean;
  permissionOverrides: Map<PermissionKey, PermissionOverride>;
  refreshTokenHash?: string;
  refreshTokenExpiresAt?: Date;
  passwordResetTokenHash?: string;
  passwordResetExpiresAt?: Date;
  passwordChangedAt?: Date;
  lastLoginAt?: Date;
  settings: {
    timezone: string;
    reminderHour: number;
    emailNotifications: boolean;
    dailyReminders: boolean;
    missedHabitAlerts: boolean;
    weeklyReports: boolean;
    darkMode: boolean;
  };
  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidate: string): Promise<boolean>;
  setPasswordResetToken(): string;
  setRefreshToken(token: string, expiresAt: Date): void;
}

interface UserModel extends Model<IUser> {
  hashToken(token: string): string;
}

const userSchema = new Schema<IUser, UserModel>(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    password: {
      type: String,
      select: false,
      minlength: 8,
    },
    fullName: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    avatarUrl: String,
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
      index: true,
    },
    provider: {
      type: String,
      enum: ["local", "google"],
      default: "local",
    },
    googleId: {
      type: String,
      sparse: true,
      index: true,
    },
    isEmailVerified: {
      type: Boolean,
      default: false,
    },
    permissionOverrides: {
      type: Map,
      of: {
        type: String,
        enum: ["allow", "deny"],
      },
      default: {},
    },
    refreshTokenHash: {
      type: String,
      select: false,
    },
    refreshTokenExpiresAt: {
      type: Date,
      select: false,
    },
    passwordResetTokenHash: {
      type: String,
      select: false,
    },
    passwordResetExpiresAt: {
      type: Date,
      select: false,
    },
    passwordChangedAt: Date,
    lastLoginAt: Date,
    settings: {
      timezone: { type: String, default: "UTC" },
      reminderHour: { type: Number, default: 8, min: 0, max: 23 },
      emailNotifications: { type: Boolean, default: true },
      dailyReminders: { type: Boolean, default: true },
      missedHabitAlerts: { type: Boolean, default: true },
      weeklyReports: { type: Boolean, default: true },
      darkMode: { type: Boolean, default: false },
    },
  },
  { timestamps: true }
);

userSchema.pre("save", async function hashPassword(next) {
  if (!this.isModified("password") || !this.password) return next();
  this.password = await bcrypt.hash(this.password, 12);
  this.passwordChangedAt = new Date(Date.now() - 1000);
  next();
});

userSchema.methods.comparePassword = async function comparePassword(candidate: string) {
  if (!this.password) return false;
  return bcrypt.compare(candidate, this.password);
};

userSchema.methods.setPasswordResetToken = function setPasswordResetToken() {
  const token = crypto.randomBytes(32).toString("hex");
  this.passwordResetTokenHash = User.hashToken(token);
  this.passwordResetExpiresAt = new Date(Date.now() + 1000 * 60 * 15);
  return token;
};

userSchema.methods.setRefreshToken = function setRefreshToken(token: string, expiresAt: Date) {
  this.refreshTokenHash = User.hashToken(token);
  this.refreshTokenExpiresAt = expiresAt;
};

userSchema.statics.hashToken = (token: string) =>
  crypto.createHash("sha256").update(token).digest("hex");

export const User = mongoose.model<IUser, UserModel>("User", userSchema);
