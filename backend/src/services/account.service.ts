import fs from "node:fs/promises";
import path from "node:path";
import { AppError } from "../utils/AppError";
import { ContactMessage } from "../models/ContactMessage";
import { EmailOtp } from "../models/EmailOtp";
import { GameClaim } from "../models/GameClaim";
import { Habit } from "../models/Habit";
import { HabitProgress } from "../models/HabitProgress";
import { LearningPlan } from "../models/LearningPlan";
import { Notification } from "../models/Notification";
import { Payment } from "../models/Payment";
import { Subscription } from "../models/Subscription";
import { TemplateProgress } from "../models/TemplateProgress";
import { User } from "../models/User";
import { UserAchievement } from "../models/UserAchievement";
import { XpEvent } from "../models/XpEvent";

export const accountService = {
  /**
   * Play Store policy requires an in-app way to delete an account and its data.
   * Password accounts must confirm the password; OTP-only accounts are already
   * authenticated by a valid session token.
   */
  async deleteAccount(userId: string, currentPassword?: string) {
    const user = await User.findById(userId).select("+password");
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    if (user.password) {
      if (!currentPassword) {
        throw new AppError("Enter your password to delete the account", 400, "PASSWORD_REQUIRED");
      }
      if (!(await user.comparePassword(currentPassword))) {
        throw new AppError("Incorrect password", 401, "INVALID_PASSWORD");
      }
    }

    const { email, avatarUrl } = user;

    await Promise.all([
      Habit.deleteMany({ user: userId }),
      HabitProgress.deleteMany({ user: userId }),
      XpEvent.deleteMany({ user: userId }),
      UserAchievement.deleteMany({ user: userId }),
      Notification.deleteMany({ user: userId }),
      LearningPlan.deleteMany({ user: userId }),
      TemplateProgress.deleteMany({ user: userId }),
      Subscription.deleteMany({ user: userId }),
      Payment.deleteMany({ user: userId }),
      GameClaim.deleteMany({ user: userId }),
      EmailOtp.deleteMany({ email }),
      ContactMessage.deleteMany({ email }),
    ]);
    await User.deleteOne({ _id: userId });

    if (avatarUrl?.startsWith("/uploads/")) {
      await fs.unlink(path.resolve(process.cwd(), avatarUrl.slice(1))).catch(() => {});
    }

    return { deleted: true };
  },
};
