import { z } from "zod";

export const contactMessageSchema = z.object({
  name: z.string().trim().min(2).max(120),
  email: z.string().trim().email().toLowerCase(),
  topic: z.enum(["general", "billing", "bug", "feature", "press", "careers"]).default("general"),
  subject: z.string().trim().max(200).optional(),
  message: z.string().trim().min(10, "Message must be at least 10 characters").max(5000),
});

export const contactStatusSchema = z.object({
  status: z.enum(["new", "read", "replied"]),
});

export const contactIdParamSchema = z.object({
  id: z.string().regex(/^[a-f\d]{24}$/i, "Invalid message id"),
});
