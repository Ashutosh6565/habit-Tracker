import { z } from "zod";

export const signupSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(8).max(128),
});

export const requestSignupOtpSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const verifySignupOtpSchema = signupSchema.extend({
  otp: z.string().trim().regex(/^\d{6}$/, "Verification code must be 6 digits"),
});

export const requestLoginOtpSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const verifyLoginOtpSchema = requestLoginOtpSchema.extend({
  otp: z.string().trim().regex(/^\d{6}$/, "Verification code must be 6 digits"),
  rememberMe: z.boolean().optional().default(false),
});

export const loginSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
  password: z.string().min(1),
  rememberMe: z.boolean().optional().default(false),
});

export const googleLoginSchema = z.object({
  credential: z.string().min(20),
  rememberMe: z.boolean().optional().default(true),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().email().toLowerCase(),
});

export const resetPasswordSchema = z.object({
  token: z.string().min(20),
  password: z.string().min(8).max(128),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1),
  newPassword: z.string().min(8).max(128),
});

export const refreshSchema = z.object({
  refreshToken: z.string().optional(),
});
