import mongoose, { Document, Schema, Types } from "mongoose";

export interface ITask extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  title: string;
  category: string;
  date: string;
  time: string;
  completed: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const taskSchema = new Schema<ITask>(
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
      maxlength: 200,
    },
    category: {
      type: String,
      default: "Personal",
      trim: true,
      maxlength: 40,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    time: {
      type: String,
      default: "09:00",
      match: /^\d{2}:\d{2}$/,
    },
    completed: {
      type: Boolean,
      default: false,
      index: true,
    },
  },
  { timestamps: true }
);

taskSchema.index({ user: 1, date: 1, time: 1 });

export const Task = mongoose.model<ITask>("Task", taskSchema);
