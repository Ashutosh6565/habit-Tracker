import { z } from "zod";

const scheduleStatusSchema = z.enum(["pending", "done", "skipped"]);

const learningVideoSchema = z.object({
  id: z.string().min(1).max(160),
  youtubeUrl: z.string().url().max(600),
  videoId: z.string().min(1).max(40),
  title: z.string().min(1).max(300),
  thumbnailUrl: z.string().max(600),
  totalDurationSeconds: z.number().int().min(1).max(604_800),
  targetTotalDays: z.number().int().min(1).max(366),
  dailyChunkSeconds: z.number().int().min(1).max(604_800),
  scheduledStartTime: z.string().min(1).max(20),
  splitIntoSessions: z.boolean(),
  sessionSplit: z.enum(["single", "double"]),
  createdAt: z.string().max(60),
});

const scheduleChunkSchema = z.object({
  id: z.string().min(1).max(200),
  videoId: z.string().min(1).max(160),
  dayNumber: z.number().int().min(1).max(400),
  date: z.string().min(1).max(20),
  videoStartSeconds: z.number().min(0),
  videoEndSeconds: z.number().min(0),
  videoStartTimestamp: z.string().max(20),
  videoEndTimestamp: z.string().max(20),
  scheduledClockTime: z.string().max(20),
  estimatedSessionLengthSeconds: z.number().min(0),
  status: scheduleStatusSchema,
});

const habitEntrySchema = z.object({
  id: z.string().min(1).max(220),
  template: z.string().min(1).max(160),
  scheduleChunkId: z.string().min(1).max(200),
  date: z.string().min(1).max(20),
  completed: z.boolean(),
  streakCount: z.number().int().min(0),
});

export const upsertLearningPlanSchema = z.object({
  video: learningVideoSchema,
  chunks: z.array(scheduleChunkSchema).min(1).max(400),
  habitEntries: z.array(habitEntrySchema).max(400),
});

export const learningPlanIdParamSchema = z.object({
  planId: z.string().min(1).max(160),
});
