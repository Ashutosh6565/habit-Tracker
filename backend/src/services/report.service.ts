import { format, subDays } from "date-fns";
import { Habit } from "../models/Habit";
import { HabitProgress } from "../models/HabitProgress";
import { TemplateProgress } from "../models/TemplateProgress";
import { habitService } from "./habit.service";

export type ReportType = "habits" | "templates" | "daily";

const escapeCsv = (value: unknown) => {
  const text = String(value ?? "");
  return /[",\r\n]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
};

const toCsv = (headers: string[], rows: unknown[][]) =>
  [headers, ...rows].map((row) => row.map(escapeCsv).join(",")).join("\r\n");

const habitsReport = async (userId: string) => {
  const summary = await habitService.summary(userId);
  const rows = summary.habits.map((habit) => [
    habit.title,
    habit.category,
    habit.difficulty,
    habit.frequency,
    habit.xp,
    habit.streak,
    habit.completed ? "yes" : "no",
    habit.createdAt.slice(0, 10),
  ]);
  return {
    filename: `habbiters-habits-${format(new Date(), "yyyy-MM-dd")}.csv`,
    csv: toCsv(
      ["Habit", "Category", "Difficulty", "Frequency", "XP", "Current streak", "Completed today", "Created"],
      rows
    ),
  };
};

const templatesReport = async (userId: string) => {
  const templates = await TemplateProgress.find({ user: userId }).sort({ updatedAt: -1 });
  const rows = templates.map((template) => {
    const habitCount = Math.max(1, template.habits.length);
    const totalChecks = template.totalDays * habitCount;
    let completedChecks = 0;
    for (const habit of template.habits) {
      const days = template.completions?.get(habit.habitId) || {};
      completedChecks += Object.values(days).filter(Boolean).length;
    }
    const rate = totalChecks ? Math.round((completedChecks / totalChecks) * 100) : 0;
    return [
      template.templateName,
      template.totalDays,
      template.habits.length,
      completedChecks,
      totalChecks,
      `${rate}%`,
      template.updatedAt.toISOString().slice(0, 10),
    ];
  });
  return {
    filename: `habbiters-templates-${format(new Date(), "yyyy-MM-dd")}.csv`,
    csv: toCsv(
      ["Template", "Days", "Habits", "Completed checks", "Total checks", "Completion rate", "Last updated"],
      rows
    ),
  };
};

const dailyReport = async (userId: string) => {
  const habitCount = await Habit.countDocuments({ user: userId, isArchived: false });
  const rows: unknown[][] = [];
  for (let i = 29; i >= 0; i -= 1) {
    const date = format(subDays(new Date(), i), "yyyy-MM-dd");
    const completed = await HabitProgress.countDocuments({ user: userId, date, completed: true });
    const rate = habitCount ? Math.round((completed / habitCount) * 100) : 0;
    rows.push([date, completed, habitCount, `${rate}%`]);
  }
  return {
    filename: `habbiters-daily-trend-${format(new Date(), "yyyy-MM-dd")}.csv`,
    csv: toCsv(["Date", "Completed habits", "Total habits", "Consistency"], rows),
  };
};

export const reportService = {
  async exportCsv(userId: string, type: ReportType) {
    if (type === "templates") return templatesReport(userId);
    if (type === "daily") return dailyReport(userId);
    return habitsReport(userId);
  },
};
