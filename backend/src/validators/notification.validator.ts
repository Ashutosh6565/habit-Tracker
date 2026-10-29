import { z } from "zod";

export const createNotificationSchema = z.object({
  userId: z.string().regex(/^[a-f\d]{24}$/i).optional(),
  type: z.enum(["daily_reminder", "missed_habit", "weekly_report", "payment", "system"]).default("system"),
  channel: z.enum(["email", "in_app"]).default("in_app"),
  title: z.string().min(1).max(160),
  message: z.string().min(1).max(2000),
});

export const notificationIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i),
});
