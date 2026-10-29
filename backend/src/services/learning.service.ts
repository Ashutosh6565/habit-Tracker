import { LearningPlan } from "../models/LearningPlan";
import { AppError } from "../utils/AppError";

const MAX_PLANS_PER_USER = 50;

export interface LearningPlanInput {
  video: { id: string; [key: string]: unknown };
  chunks: Record<string, unknown>[];
  habitEntries: Record<string, unknown>[];
}

const formatPlan = (row: {
  planId: string;
  video: Record<string, unknown>;
  chunks: Record<string, unknown>[];
  habitEntries: Record<string, unknown>[];
  updatedAt: Date;
}) => ({
  video: row.video,
  chunks: row.chunks,
  habitEntries: row.habitEntries,
  updatedAt: row.updatedAt.toISOString(),
});

export const learningService = {
  async list(userId: string) {
    const rows = await LearningPlan.find({ user: userId }).sort({ updatedAt: -1 });
    return rows.map(formatPlan);
  },

  async upsert(userId: string, input: LearningPlanInput) {
    const planId = input.video.id;
    const existing = await LearningPlan.exists({ user: userId, planId });
    if (!existing) {
      const planCount = await LearningPlan.countDocuments({ user: userId });
      if (planCount >= MAX_PLANS_PER_USER) {
        throw new AppError(
          `You can keep up to ${MAX_PLANS_PER_USER} learning plans at once. Delete a finished course first.`,
          402,
          "LEARNING_PLAN_LIMIT"
        );
      }
    }

    const row = await LearningPlan.findOneAndUpdate(
      { user: userId, planId },
      { $set: { video: input.video, chunks: input.chunks, habitEntries: input.habitEntries } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return formatPlan(row);
  },

  async remove(userId: string, planId: string) {
    const result = await LearningPlan.findOneAndDelete({ user: userId, planId });
    if (!result) throw new AppError("Learning plan not found", 404, "LEARNING_PLAN_NOT_FOUND");
  },
};
