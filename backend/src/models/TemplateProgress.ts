import mongoose, { Document, Schema, Types } from "mongoose";

interface TemplateHabit {
  habitId: string;
  name: string;
  icon: string;
}

export interface ITemplateProgress extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  templateId: string;
  templateName: string;
  habits: TemplateHabit[];
  completions: Map<string, Record<string, boolean>>;
  totalDays: number;
  moodRatings: Record<string, number>;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const templateProgressSchema = new Schema<ITemplateProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    templateId: {
      type: String,
      required: true,
      trim: true,
      index: true,
    },
    templateName: {
      type: String,
      required: true,
      trim: true,
    },
    habits: [
      {
        habitId: { type: String, required: true },
        name: { type: String, required: true },
        icon: { type: String, default: "✓" },
      },
    ],
    completions: {
      type: Map,
      of: Schema.Types.Mixed,
      default: {},
    },
    totalDays: {
      type: Number,
      required: true,
      min: 1,
      max: 366,
    },
    moodRatings: {
      type: Schema.Types.Mixed,
      default: {},
    },
    notes: {
      type: String,
      maxlength: 4000,
    },
  },
  { timestamps: true }
);

templateProgressSchema.index({ user: 1, templateId: 1 }, { unique: true });

export const TemplateProgress = mongoose.model<ITemplateProgress>(
  "TemplateProgress",
  templateProgressSchema
);
