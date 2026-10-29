import { Notification } from "../models/Notification";
import { User } from "../models/User";
import { AppError } from "../utils/AppError";
import { emailService } from "./email.service";

export const notificationService = {
  async list(userId: string) {
    return Notification.find({ user: userId }).sort({ createdAt: -1 }).limit(100);
  },

  async create(input: {
    userId: string;
    type: "daily_reminder" | "missed_habit" | "weekly_report" | "payment" | "system";
    channel: "email" | "in_app";
    title: string;
    message: string;
    metadata?: Record<string, unknown>;
  }) {
    const user = await User.findById(input.userId);
    if (!user) throw new AppError("User not found", 404, "USER_NOT_FOUND");

    const notification = await Notification.create({
      user: user.id,
      type: input.type,
      channel: input.channel,
      title: input.title,
      message: input.message,
      metadata: input.metadata,
      sentAt: input.channel === "email" ? new Date() : undefined,
    });

    if (input.channel === "email" && user.settings.emailNotifications) {
      await emailService.sendReminder(user.email, input.title, input.message);
    }

    return notification;
  },

  async markRead(userId: string, notificationId: string) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, user: userId },
      { $set: { readAt: new Date() } },
      { new: true }
    );
    if (!notification) throw new AppError("Notification not found", 404, "NOTIFICATION_NOT_FOUND");
    return notification;
  },

  async generateWeeklyReport(userId: string, message: string) {
    return this.create({
      userId,
      type: "weekly_report",
      channel: "email",
      title: "Your weekly Habbiters report",
      message,
    });
  },
};
