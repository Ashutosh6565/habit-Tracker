import { Types } from "mongoose";
import { HabitProgress } from "../models/HabitProgress";
import { XpEvent, type XpEventType } from "../models/XpEvent";

type XpTotal = { _id: null; total: number };

export const xpService = {
  async lifetimeXp(userId: string) {
    const user = new Types.ObjectId(userId);
    const [habitTotals, bonusTotals] = await Promise.all([
      HabitProgress.aggregate<XpTotal>([
        { $match: { user, completed: true } },
        { $group: { _id: null, total: { $sum: "$xpEarned" } } },
      ]),
      XpEvent.aggregate<XpTotal>([
        { $match: { user } },
        { $group: { _id: null, total: { $sum: "$amount" } } },
      ]),
    ]);

    const habitXp = Math.max(0, habitTotals[0]?.total ?? 0);
    const bonusXp = Math.max(0, bonusTotals[0]?.total ?? 0);
    return habitXp + bonusXp;
  },

  /** Awards bonus XP once per reference. Returns true when newly awarded. */
  async award(userId: string, type: XpEventType, ref: string, amount: number, description: string) {
    if (amount <= 0) return false;
    try {
      const result = await XpEvent.updateOne(
        { user: userId, ref },
        { $setOnInsert: { type, amount, description } },
        { upsert: true }
      );
      return result.upsertedCount > 0;
    } catch (error) {
      if ((error as { code?: number }).code === 11000) return false;
      throw error;
    }
  },
};
