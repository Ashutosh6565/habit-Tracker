import { z } from "zod";

export const updateSettingsSchema = z.object({
  timezone: z.string().min(1).max(80).optional(),
  reminderHour: z.number().int().min(0).max(23).optional(),
  emailNotifications: z.boolean().optional(),
  dailyReminders: z.boolean().optional(),
  missedHabitAlerts: z.boolean().optional(),
  weeklyReports: z.boolean().optional(),
  darkMode: z.boolean().optional(),
});
