import { z } from "zod";

export const templateHabitSchema = z.object({
  habitId: z.string().min(1).max(120),
  name: z.string().min(1).max(140),
  icon: z.string().min(1).max(16).default("✓"),
});

export const upsertTemplateProgressSchema = z.object({
  templateId: z.string().min(1).max(120),
  templateName: z.string().min(1).max(160),
  habits: z.array(templateHabitSchema).min(1).max(100),
  completions: z.record(z.record(z.coerce.number(), z.boolean())),
  totalDays: z.number().int().min(1).max(366),
  moodRatings: z.record(z.coerce.number(), z.number().int().min(1).max(10)).optional(),
  notes: z.string().max(4000).optional(),
});

export const templateIdParamSchema = z.object({
  templateId: z.string().min(1).max(120),
});

export const templateUnlockTierSchema = z.enum(["free", "starter", "premium"]);

const catalogBaseSchema = z.object({
  templateId: z.string().trim().min(1).max(120).optional(),
  name: z.string().trim().min(2).max(160),
  description: z.string().trim().min(2).max(500),
  icon: z.string().trim().min(1).max(40).optional().default("Check"),
  color: z.string().trim().min(1).max(80).optional().default("gradient-primary"),
  month: z.string().trim().min(3).max(20).optional().default("January"),
  year: z.number().int().min(2024).max(2100).optional().default(2026),
  totalDays: z.number().int().min(1).max(366),
  habits: z.array(templateHabitSchema).min(1).max(100),
  unlockTier: templateUnlockTierSchema.default("premium"),
  isActive: z.boolean().optional().default(true),
  sortOrder: z.number().int().optional().default(0),
});

export const createCatalogTemplateSchema = catalogBaseSchema;

export const updateCatalogTemplateSchema = catalogBaseSchema.partial().omit({ templateId: true });
