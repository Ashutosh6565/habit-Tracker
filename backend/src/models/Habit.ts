import mongoose, { Document, Schema, Types } from "mongoose";

export type HabitDifficulty = "easy" | "medium" | "hard";
export type HabitFrequency = "daily" | "weekly" | "monthly";

export interface IHabit extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  title: string;
  slug: string;
  icon: string;
  category: string;
  difficulty: HabitDifficulty;
  frequency: HabitFrequency;
  xp: number;
  reminderTime?: string;
  isArchived: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const habitSchema = new Schema<IHabit>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 140,
    },
    slug: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
    },
    icon: {
      type: String,
      default: "✨",
      maxlength: 16,
    },
    category: {
      type: String,
      default: "General",
      index: true,
    },
    difficulty: {
      type: String,
      enum: ["easy", "medium", "hard"],
      default: "easy",
      index: true,
    },
    frequency: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
      index: true,
    },
    xp: {
      type: Number,
      default: 10,
      min: 0,
      max: 1000,
    },
    reminderTime: String,
    isArchived: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

habitSchema.index({ user: 1, slug: 1 }, { unique: true });
habitSchema.index({ user: 1, category: 1, difficulty: 1, createdAt: -1 });
habitSchema.index({ title: "text", category: "text" });

export const Habit = mongoose.model<IHabit>("Habit", habitSchema);
