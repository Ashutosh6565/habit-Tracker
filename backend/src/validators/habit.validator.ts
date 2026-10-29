import { z } from "zod";

export const habitDifficultySchema = z.enum(["easy", "medium", "hard"]);
export const habitFrequencySchema = z.enum(["daily", "weekly", "monthly"]);

export const createHabitSchema = z.object({
  title: z.string().trim().min(1).max(140),
  category: z.string().trim().min(1).max(80).default("General"),
  icon: z.string().trim().min(1).max(16).default("✨"),
  difficulty: habitDifficultySchema.default("easy"),
  frequency: habitFrequencySchema.default("daily"),
  xp: z.number().int().min(0).max(1000).optional(),
  reminderTime: z.string().regex(/^\d{2}:\d{2}$/).optional(),
});

export const updateHabitSchema = createHabitSchema.partial().extend({
  isArchived: z.boolean().optional(),
});

export const habitIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid habit id"),
});

export const toggleProgressSchema = z.object({
  completed: z.boolean(),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  note: z.string().max(1000).optional(),
});

export const listHabitQuerySchema = z.object({
  page: z.coerce.number().int().positive().optional(),
  limit: z.coerce.number().int().positive().max(100).optional(),
  search: z.string().optional(),
  category: z.string().optional(),
  difficulty: habitDifficultySchema.optional(),
  completed: z.enum(["true", "false"]).optional(),
  sortBy: z.string().optional(),
  sortOrder: z.enum(["asc", "desc"]).optional(),
});
