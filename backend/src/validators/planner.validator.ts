import { z } from "zod";

const dateString = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Expected YYYY-MM-DD");
const timeString = z.string().regex(/^\d{2}:\d{2}$/, "Expected HH:mm");
const objectId = z.string().regex(/^[a-f\d]{24}$/i, "Invalid id");

export const taskIdParamSchema = z.object({ id: objectId });

export const createTaskSchema = z.object({
  title: z.string().trim().min(1).max(200),
  category: z.string().trim().min(1).max(40).optional(),
  date: dateString.optional(),
  time: timeString.optional(),
});

export const updateTaskSchema = z.object({
  title: z.string().trim().min(1).max(200).optional(),
  category: z.string().trim().min(1).max(40).optional(),
  date: dateString.optional(),
  time: timeString.optional(),
  completed: z.boolean().optional(),
});

export const taskListQuerySchema = z.object({
  date: dateString.optional(),
  from: dateString.optional(),
  to: dateString.optional(),
});

export const noteIdParamSchema = z.object({ id: objectId });

export const createNoteSchema = z.object({
  text: z.string().trim().min(1).max(2000),
  date: dateString.optional(),
  time: timeString.optional(),
});

export const updateNoteSchema = z.object({
  text: z.string().trim().min(1).max(2000).optional(),
  date: dateString.optional(),
  time: timeString.optional(),
});

export const noteListQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});

export const timeQuerySchema = z.object({
  from: dateString.optional(),
  to: dateString.optional(),
});

export const timeCellSchema = z.object({
  habitId: objectId.optional(),
  label: z.string().trim().min(1).max(60).optional(),
  date: dateString,
  slot: z.coerce.number().int().min(0).max(23),
  hours: z.coerce.number().min(0).max(16),
});

export const habitHistoryQuerySchema = z.object({
  days: z.coerce.number().int().min(1).max(366).optional(),
});
