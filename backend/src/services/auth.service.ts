import { OAuth2Client } from "google-auth-library";
import { env } from "../config/env";
import { EmailOtp } from "../models/EmailOtp";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import {
  getRefreshExpiry,
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/tokens";
import { emailService } from "./email.service";
import { subscriptionService } from "./subscription.service";

const googleClient = env.googleClientId ? new OAuth2Client(env.googleClientId) : null;
const OTP_EXPIRY_MINUTES = 10;
const MAX_OTP_ATTEMPTS = 5;
const OTP_COOLDOWN_SECONDS = 45;

const generateOtp = () => String(Math.floor(100000 + Math.random() * 900000));

type OtpSender = (email: string, otp: string) => Promise<boolean>;

const issueOtp = async (email: string, purpose: "signup" | "login", sender: OtpSender) => {
  const latest = await EmailOtp.findOne({ email, purpose }).sort({ createdAt: -1 });
  if (latest) {
    const elapsedMs = Date.now() - latest.createdAt.getTime();
    if (elapsedMs < OTP_COOLDOWN_SECONDS * 1000) {
      const waitSeconds = Math.ceil((OTP_COOLDOWN_SECONDS * 1000 - elapsedMs) / 1000);
      throw new AppError(
        `Please wait ${waitSeconds}s before requesting another code.`,
        429,
        "OTP_COOLDOWN"
      );
    }
  }

  const otp = generateOtp();
  await EmailOtp.updateMany(
    { email, purpose, consumedAt: { $exists: false } },
    { $set: { consumedAt: new Date() } }
  );
  await EmailOtp.create({
    email,
    purpose,
    otpHash: EmailOtp.hashOtp(email, otp),
    expiresAt: new Date(Date.now() + OTP_EXPIRY_MINUTES * 60 * 1000),
  });

  const delivered = await sender(email, otp);
  return {
    expiresInMinutes: OTP_EXPIRY_MINUTES,
    delivered,
    // Only expose the code when email cannot be delivered and we are not in production.
    devOtp: !delivered && !env.isProduction ? otp : undefined,
  };
};

const consumeOtp = async (email: string, purpose: "signup" | "login", otp: string) => {
  const record = await EmailOtp.findOne({
    email,
    purpose,
    consumedAt: { $exists: false },
    expiresAt: { $gt: new Date() },
  })
    .select("+otpHash")
    .sort({ createdAt: -1 });

  if (!record) throw new AppError("Verification code is invalid or expired", 400, "OTP_INVALID");
  if (record.attempts >= MAX_OTP_ATTEMPTS) {
    throw new AppError("Too many verification attempts. Request a new code.", 429, "OTP_ATTEMPTS_EXCEEDED");
  }

  record.attempts += 1;
  const matches = record.otpHash === EmailOtp.hashOtp(email, otp);
  if (!matches) {
    await record.save({ validateBeforeSave: false });
    throw new AppError("Verification code is invalid or expired", 400, "OTP_INVALID");
  }

  record.consumedAt = new Date();
  await record.save({ validateBeforeSave: false });
};

const toAuthResponse = async (userId: string, rememberMe = false) => {
  const user = await User.findById(userId).select("+refreshTokenHash +refreshTokenExpiresAt");
  if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

  const accessToken = signAccessToken(user);
  const refreshToken = signRefreshToken(user, rememberMe);
  user.setRefreshToken(refreshToken, getRefreshExpiry(rememberMe));
  user.lastLoginAt = new Date();
  await user.save();

  const subscription = await subscriptionService.ensureTrial(user.id);
  return { user, accessToken, refreshToken, subscription };
};

export const authService = {
  async requestSignupOtp(input: { email: string }) {
    const existing = await User.findOne({ email: input.email });
    if (existing) throw new AppError("Email is already registered", 409, "EMAIL_EXISTS");

    return issueOtp(input.email, "signup", emailService.sendSignupOtp.bind(emailService));
  },

  async verifySignupOtp(input: { email: string; password: string; fullName: string; otp: string }) {
    const existing = await User.findOne({ email: input.email });
    if (existing) throw new AppError("Email is already registered", 409, "EMAIL_EXISTS");

    await consumeOtp(input.email, "signup", input.otp);

    const user = await User.create({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      provider: "local",
      isEmailVerified: true,
    });
    await subscriptionService.ensureTrial(user.id);
    return user;
  },

  async requestLoginOtp(input: { email: string }) {
    const user = await User.findOne({ email: input.email });
    // Do not reveal whether the account exists.
    if (!user) {
      return { expiresInMinutes: OTP_EXPIRY_MINUTES, delivered: false, devOtp: undefined };
    }
    return issueOtp(input.email, "login", emailService.sendLoginOtp.bind(emailService));
  },

  async verifyLoginOtp(input: { email: string; otp: string; rememberMe?: boolean }) {
    await consumeOtp(input.email, "login", input.otp);

    const user = await User.findOne({ email: input.email });
    if (!user) throw new AppError("No account found for this email", 404, "USER_NOT_FOUND");
    if (!user.isEmailVerified) {
      user.isEmailVerified = true;
      await user.save({ validateBeforeSave: false });
    }
    return toAuthResponse(user.id, input.rememberMe);
  },

  async signup(input: { email: string; password: string; fullName: string }) {
    const existing = await User.findOne({ email: input.email });
    if (existing) throw new AppError("Email is already registered", 409, "EMAIL_EXISTS");

    const user = await User.create({
      email: input.email,
      password: input.password,
      fullName: input.fullName,
      provider: "local",
      isEmailVerified: false,
    });
    await subscriptionService.ensureTrial(user.id);
    return user;
  },

  async login(input: { email: string; password: string; rememberMe?: boolean }) {
    const user = await User.findOne({ email: input.email }).select("+password +refreshTokenHash +refreshTokenExpiresAt");
    if (!user || !(await user.comparePassword(input.password))) {
      throw new AppError("Invalid email or password", 401, "INVALID_CREDENTIALS");
    }
    return toAuthResponse(user.id, input.rememberMe);
  },

  async googleLogin(input: { credential: string; rememberMe?: boolean }) {
    if (!googleClient) {
      throw new AppError("Google login is not configured", 503, "GOOGLE_NOT_CONFIGURED");
    }

    const ticket = await googleClient.verifyIdToken({
      idToken: input.credential,
      audience: env.googleClientId,
    });
    const payload = ticket.getPayload();
    if (!payload?.email) throw new AppError("Google account has no email", 400, "GOOGLE_EMAIL_MISSING");

    const user = await User.findOneAndUpdate(
      { email: payload.email.toLowerCase() },
      {
        $setOnInsert: {
          email: payload.email.toLowerCase(),
          fullName: payload.name || payload.email,
          provider: "google",
          isEmailVerified: Boolean(payload.email_verified),
        },
        $set: {
          googleId: payload.sub,
          avatarUrl: payload.picture,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    ).select("+refreshTokenHash +refreshTokenExpiresAt");

    await subscriptionService.ensureTrial(user.id);
    return toAuthResponse(user.id, input.rememberMe);
  },

  async refresh(refreshToken: string) {
    const payload = verifyRefreshToken(refreshToken);
    if (payload.type !== "refresh") throw new AppError("Invalid refresh token", 401, "INVALID_TOKEN");

    const hash = User.hashToken(refreshToken);
    const user = await User.findById(payload.sub).select("+refreshTokenHash +refreshTokenExpiresAt");
    if (
      !user ||
      user.refreshTokenHash !== hash ||
      !user.refreshTokenExpiresAt ||
      user.refreshTokenExpiresAt < new Date()
    ) {
      throw new AppError("Invalid refresh token", 401, "INVALID_REFRESH_TOKEN");
    }

    const accessToken = signAccessToken(user);
    return { user, accessToken };
  },

  async logout(userId?: string) {
    if (userId) {
      await User.findByIdAndUpdate(userId, {
        $unset: { refreshTokenHash: "", refreshTokenExpiresAt: "" },
      });
    }
  },

  async forgotPassword(email: string) {
    const user = await User.findOne({ email }).select("+passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) return;

    const token = user.setPasswordResetToken();
    await user.save({ validateBeforeSave: false });
    const resetUrl = `${env.frontendUrl}/reset-password?token=${token}`;
    await emailService.sendPasswordReset(user.email, resetUrl);
  },

  async resetPassword(token: string, password: string) {
    const hash = User.hashToken(token);
    const user = await User.findOne({
      passwordResetTokenHash: hash,
      passwordResetExpiresAt: { $gt: new Date() },
    }).select("+password +passwordResetTokenHash +passwordResetExpiresAt");
    if (!user) throw new AppError("Password reset token is invalid or expired", 400, "INVALID_RESET_TOKEN");

    user.password = password;
    user.passwordResetTokenHash = undefined;
    user.passwordResetExpiresAt = undefined;
    await user.save();
  },

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findById(userId).select("+password");
    if (!user || !(await user.comparePassword(currentPassword))) {
      throw new AppError("Current password is incorrect", 400, "INVALID_CURRENT_PASSWORD");
    }
    user.password = newPassword;
    await user.save();
  },
};
