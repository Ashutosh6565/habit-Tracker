import mongoose, { Document, Schema, Types } from "mongoose";

export interface ILearningPlan extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  planId: string;
  video: Record<string, unknown>;
  chunks: Record<string, unknown>[];
  habitEntries: Record<string, unknown>[];
  createdAt: Date;
  updatedAt: Date;
}

const learningPlanSchema = new Schema<ILearningPlan>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    planId: {
      type: String,
      required: true,
      trim: true,
      maxlength: 160,
    },
    video: {
      type: Schema.Types.Mixed,
      required: true,
    },
    chunks: {
      type: Schema.Types.Mixed,
      default: [],
    },
    habitEntries: {
      type: Schema.Types.Mixed,
      default: [],
    },
  },
  { timestamps: true }
);

learningPlanSchema.index({ user: 1, planId: 1 }, { unique: true });

export const LearningPlan = mongoose.model<ILearningPlan>("LearningPlan", learningPlanSchema);
