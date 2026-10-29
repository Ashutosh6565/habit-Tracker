import mongoose, { Document, Schema, Types } from "mongoose";

export type XpEventType = "achievement" | "challenge" | "game";

export interface IXpEvent extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  type: XpEventType;
  ref: string;
  amount: number;
  description: string;
  createdAt: Date;
  updatedAt: Date;
}

const xpEventSchema = new Schema<IXpEvent>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    type: {
      type: String,
      enum: ["achievement", "challenge", "game"],
      required: true,
    },
    ref: {
      type: String,
      required: true,
    },
    amount: {
      type: Number,
      required: true,
      min: 0,
    },
    description: {
      type: String,
      default: "",
      maxlength: 200,
    },
  },
  { timestamps: true }
);

xpEventSchema.index({ user: 1, ref: 1 }, { unique: true });

export const XpEvent = mongoose.model<IXpEvent>("XpEvent", xpEventSchema);
