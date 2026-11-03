import { z } from "zod";
import { AI_FOCUS_AREAS } from "../services/ai.service";

export const aiRecommendSchema = z
  .object({
    goal: z.string().trim().max(400).optional().default(""),
    focusAreas: z.array(z.enum(AI_FOCUS_AREAS)).max(6).optional().default([]),
    minutesPerDay: z.number().int().min(5).max(240).optional().default(20),
    experience: z.enum(["new", "some", "consistent"]).optional().default("some"),
  })
  .refine((value) => value.goal.length >= 2 || value.focusAreas.length > 0, {
    message: "Add a goal or pick at least one focus area",
    path: ["goal"],
  });
