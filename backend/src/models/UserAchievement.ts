import mongoose, { Document, Schema, Types } from "mongoose";

export interface IUserAchievement extends Document<Types.ObjectId> {
  user: Types.ObjectId;
  achievementId: string;
  xpAwarded: number;
  unlockedAt: Date;
  createdAt: Date;
  updatedAt: Date;
}

const userAchievementSchema = new Schema<IUserAchievement>(
  {
    user: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    achievementId: {
      type: String,
      required: true,
    },
    xpAwarded: {
      type: Number,
      default: 0,
      min: 0,
    },
    unlockedAt: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

userAchievementSchema.index({ user: 1, achievementId: 1 }, { unique: true });

export const UserAchievement = mongoose.model<IUserAchievement>(
  "UserAchievement",
  userAchievementSchema
);
