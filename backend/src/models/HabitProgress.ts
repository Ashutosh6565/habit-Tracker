import mongoose, { Document, Schema, Types } from "mongoose";

export interface IHabitProgress extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  habit: Types.ObjectId;
  date: string;
  period: "daily" | "weekly" | "monthly";
  completed: boolean;
  completedAt?: Date;
  xpEarned: number;
  note?: string;
  createdAt: Date;
  updatedAt: Date;
}

const habitProgressSchema = new Schema<IHabitProgress>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    habit: {
      type: Schema.Types.ObjectId,
      ref: "Habit",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    period: {
      type: String,
      enum: ["daily", "weekly", "monthly"],
      default: "daily",
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
    completedAt: Date,
    xpEarned: {
      type: Number,
      default: 0,
      min: 0,
    },
    note: {
      type: String,
      maxlength: 1000,
    },
  },
  { timestamps: true }
);

habitProgressSchema.index({ user: 1, habit: 1, date: 1 }, { unique: true });
habitProgressSchema.index({ user: 1, date: 1, completed: 1 });

export const HabitProgress = mongoose.model<IHabitProgress>("HabitProgress", habitProgressSchema);
