import { z } from "zod";
import { permissionKeys } from "../config/permissions";
import { planCodes } from "./payment.validator";

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  avatarUrl: z.string().url().optional().nullable(),
});

export const deleteAccountSchema = z.object({
  confirm: z.literal("DELETE"),
  currentPassword: z.string().min(8).max(128).optional(),
});

export const adminUpdateUserSchema = z.object({
  fullName: z.string().trim().min(2).max(120).optional(),
  email: z.string().trim().email().toLowerCase().optional(),
  role: z.enum(["user", "admin"]).optional(),
});

export const adminSubscriptionSchema = z.object({
  status: z.enum(["none", "trial", "active", "past_due", "canceled", "expired"]),
  durationMonths: z.number().int().positive().max(36).optional(),
  plan: z.enum(planCodes).optional(),
});

export const permissionOverrideValueSchema = z.enum(["allow", "deny", "inherit"]);

export const adminPermissionSchema = z.object({
  overrides: z.record(z.enum(permissionKeys), permissionOverrideValueSchema),
});

export const objectIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid id"),
});
