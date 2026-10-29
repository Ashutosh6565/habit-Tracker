import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITimeEntry extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  habit?: Types.ObjectId | null;
  label: string;
  date: string;
  slot: number;
  hours: number;
  createdAt: Date;
  updatedAt: Date;
}

const timeEntrySchema = new Schema<ITimeEntry>(
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
      default: null,
      index: true,
    },
    label: {
      type: String,
      default: "Focus",
      trim: true,
      maxlength: 60,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    slot: {
      type: Number,
      required: true,
      min: 0,
      max: 23,
    },
    hours: {
      type: Number,
      required: true,
      min: 0,
      max: 16,
    },
  },
  { timestamps: true }
);

timeEntrySchema.index({ user: 1, habit: 1, date: 1, slot: 1 }, { unique: true });

export const TimeEntry = mongoose.model<ITimeEntry>("TimeEntry", timeEntrySchema);
