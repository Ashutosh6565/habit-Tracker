import { z } from "zod";

export const planCodes = [
  "starter_monthly",
  "premium_all_monthly",
  "premium_monthly",
  "premium_yearly",
  "premium_lifetime",
] as const;

export const checkoutSchema = z.object({
  plan: z.enum(planCodes),
});

export const createPaymentClaimSchema = z.object({
  plan: z.enum(planCodes),
  reference: z
    .string()
    .trim()
    .min(6, "Enter the Razorpay payment ID or UTR")
    .max(160),
  note: z.string().trim().max(500).optional(),
});

export const reviewPaymentClaimSchema = z.object({
  action: z.enum(["approve", "reject"]),
  plan: z.enum(planCodes).optional(),
  durationMonths: z.number().int().min(1).max(120).optional(),
  note: z.string().trim().max(500).optional(),
});

export const paymentClaimIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid payment id"),
});
