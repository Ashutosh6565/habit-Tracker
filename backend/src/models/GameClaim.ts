import mongoose, { Document, Schema, Types } from "mongoose";

export interface IGameClaim extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  gameId: string;
  date: string;
  xpAwarded: number;
  createdAt: Date;
  updatedAt: Date;
}

const gameClaimSchema = new Schema<IGameClaim>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    gameId: {
      type: String,
      required: true,
    },
    date: {
      type: String,
      required: true,
      match: /^\d{4}-\d{2}-\d{2}$/,
    },
    xpAwarded: {
      type: Number,
      required: true,
      min: 0,
    },
  },
  { timestamps: true }
);

gameClaimSchema.index({ user: 1, gameId: 1, date: 1 }, { unique: true });

export const GameClaim = mongoose.model<IGameClaim>("GameClaim", gameClaimSchema);
