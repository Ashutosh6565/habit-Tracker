import mongoose, { Document, Schema, Types } from "mongoose";

export type ContactTopic = "general" | "billing" | "bug" | "feature" | "press" | "careers";
export type ContactStatus = "new" | "read" | "replied";

export interface IContactMessage extends Document<Types.ObjectId> {
  name: string;
  email: string;
  topic: ContactTopic;
  subject?: string;
  message: string;
  status: ContactStatus;
  userId?: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const contactMessageSchema = new Schema<IContactMessage>(
  {
    name: { type: String, required: true, trim: true, maxlength: 120 },
    email: { type: String, required: true, trim: true, lowercase: true, maxlength: 200 },
    topic: {
      type: String,
      enum: ["general", "billing", "bug", "feature", "press", "careers"],
      default: "general",
      index: true,
    },
    subject: { type: String, trim: true, maxlength: 200 },
    message: { type: String, required: true, trim: true, maxlength: 5000 },
    status: {
      type: String,
      enum: ["new", "read", "replied"],
      default: "new",
      index: true,
    },
    userId: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

contactMessageSchema.index({ createdAt: -1 });

export const ContactMessage = mongoose.model<IContactMessage>(
  "ContactMessage",
  contactMessageSchema
);
