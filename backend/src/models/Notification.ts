import mongoose, { Document, Schema, Types } from "mongoose";

export interface INotification extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  type: "daily_reminder" | "missed_habit" | "weekly_report" | "payment" | "system";
  channel: "email" | "in_app";
  title: string;
  message: string;
  readAt?: Date;
  sentAt?: Date;
  metadata?: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

const notificationSchema = new Schema<INotification>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["daily_reminder", "missed_habit", "weekly_report", "payment", "system"],
      required: true,
      index: true,
    },
    channel: {
      type: String,
      enum: ["email", "in_app"],
      default: "in_app",
    },
    title: {
      type: String,
      required: true,
      maxlength: 160,
    },
    message: {
      type: String,
      required: true,
      maxlength: 2000,
    },
    readAt: Date,
    sentAt: Date,
    metadata: Schema.Types.Mixed,
  },
  { timestamps: true }
);

notificationSchema.index({ user: 1, readAt: 1, createdAt: -1 });

export const Notification = mongoose.model<INotification>("Notification", notificationSchema);
