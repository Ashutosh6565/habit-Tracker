import mongoose, { Document, Schema, Types } from "mongoose";

export interface INote extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  date: string;
  time: string;
  text: string;
  createdAt: Date;
  updatedAt: Date;
}

const noteSchema = new Schema<INote>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
      index: true,
    },
    time: {
      type: String,
      default: "12:00",
      match: /^\d{2}:\d{2}$/,
    },
    text: {
      type: String,
      required: true,
      trim: true,
      maxlength: 2000,
    },
  },
  { timestamps: true }
);

noteSchema.index({ user: 1, date: -1, time: -1 });

export const Note = mongoose.model<INote>("Note", noteSchema);
