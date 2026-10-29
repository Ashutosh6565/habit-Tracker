import { Habit } from "../models/Habit";
import { HabitProgress } from "../models/HabitProgress";
import { Notification } from "../models/Notification";
import { User, type IUser } from "../models/User";
import { logger } from "../utils/logger";
import { habitService } from "./habit.service";
import { notificationService } from "./notification.service";

const SCHEDULER_INTERVAL_MS = 15 * 60 * 1000;

interface ZonedClock {
  date: string;
  hour: number;
  weekday: string;
}

const zonedClock = (date: Date, timeZone: string): ZonedClock => {
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      hour12: false,
      weekday: "short",
    }).formatToParts(date);
    const map: Record<string, string> = {};
    for (const part of parts) {
      if (part.type !== "literal") map[part.type] = part.value;
    }
    return {
      date: `${map.year}-${map.month}-${map.day}`,
      hour: Number(map.hour) % 24,
      weekday: map.weekday,
    };
  } catch {
    return {
      date: date.toISOString().slice(0, 10),
      hour: date.getUTCHours(),
      weekday: date.toLocaleDateString("en-US", { weekday: "short", timeZone: "UTC" }),
    };
  }
};

const alreadySent = (userId: string, type: "daily_reminder" | "weekly_report", localDate: string) =>
  Notification.exists({ user: userId, type, "metadata.localDate": localDate });

const sendDailyReminder = async (user: IUser, localDate: string) => {
  if (await alreadySent(user.id, "daily_reminder", localDate)) return false;

  const habits = await Habit.find({ user: user.id, isArchived: false });
  if (habits.length === 0) return false;

  const completed = await HabitProgress.find({
    user: user.id,
    date: localDate,
    completed: true,
  }).select("habit");
  const completedIds = new Set(completed.map((row) => String(row.habit)));
  const pending = habits.filter((habit) => !completedIds.has(habit.id));
  if (pending.length === 0) return false;

  const preview = pending.slice(0, 5).map((habit) => habit.title).join(", ");
  const message =
    `You still have ${pending.length} habit${pending.length === 1 ? "" : "s"} to complete today: ` +
    `${preview}${pending.length > 5 ? ", …" : ""}. Keep your streak alive.`;

  await notificationService.create({
    userId: user.id,
    type: "daily_reminder",
    channel: "email",
    title: "Your habits are waiting",
    message,
    metadata: { localDate },
  });
  return true;
};

const sendWeeklyReport = async (user: IUser, localDate: string) => {
  if (await alreadySent(user.id, "weekly_report", localDate)) return false;

  const summary = await habitService.summary(user.id);
  if (summary.habits.length === 0) return false;

  const message =
    `This week you completed ${summary.stats.weeklyCompleted} check-ins across ` +
    `${summary.stats.totalHabits} habits. Your best streak is ${summary.stats.bestStreak} ` +
    `day${summary.stats.bestStreak === 1 ? "" : "s"}. Open Analytics to see the full picture.`;

  await notificationService.create({
    userId: user.id,
    type: "weekly_report",
    channel: "email",
    title: "Your weekly Habbiters report",
    message,
    metadata: { localDate },
  });
  return true;
};

let timer: NodeJS.Timeout | null = null;
let running = false;

export const reminderService = {
  async runPass(now = new Date()) {
    const users = await User.find({
      "settings.emailNotifications": true,
      $or: [{ "settings.dailyReminders": true }, { "settings.weeklyReports": true }],
    });

    let reminders = 0;
    let reports = 0;

    for (const user of users) {
      const clock = zonedClock(now, user.settings.timezone);
      if (user.settings.dailyReminders && clock.hour === user.settings.reminderHour) {
        try {
          if (await sendDailyReminder(user, clock.date)) reminders += 1;
        } catch (error) {
          logger.error("Failed to send daily reminder", {
            userId: user.id,
            error: error instanceof Error ? error.message : error,
          });
        }
      }
      if (user.settings.weeklyReports && clock.weekday === "Sun" && clock.hour === 18) {
        try {
          if (await sendWeeklyReport(user, clock.date)) reports += 1;
        } catch (error) {
          logger.error("Failed to send weekly report", {
            userId: user.id,
            error: error instanceof Error ? error.message : error,
          });
        }
      }
    }

    return { reminders, reports };
  },

  start(intervalMs = SCHEDULER_INTERVAL_MS) {
    if (timer) return;
    const tick = async () => {
      if (running) return;
      running = true;
      try {
        const result = await this.runPass();
        if (result.reminders || result.reports) {
          logger.info("Notification scheduler sent emails", result);
        }
      } catch (error) {
        logger.error("Notification scheduler failed", {
          error: error instanceof Error ? error.message : error,
        });
      } finally {
        running = false;
      }
    };
    timer = setInterval(tick, intervalMs);
    // Never keep the process alive only for the scheduler.
    timer.unref();
    void tick();
  },

  stop() {
    if (timer) clearInterval(timer);
    timer = null;
  },
};
