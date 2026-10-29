import { format, subDays } from "date-fns";
import { Habit } from "../models/Habit";
import { HabitProgress } from "../models/HabitProgress";
import { TemplateProgress } from "../models/TemplateProgress";
import { habitService } from "./habit.service";

export const analyticsService = {
  async overview(userId: string) {
    const summary = await habitService.summary(userId);
    const templateRows = await TemplateProgress.find({ user: userId });

    const habits = await Habit.find({ user: userId, isArchived: false });
    const today = format(new Date(), "yyyy-MM-dd");
    const todayProgress = await HabitProgress.find({ user: userId, date: today });
    const progressMap = new Map(todayProgress.map((p) => [String(p.habit), p.completed]));

    const categories: Record<string, { total: number; completed: number }> = {};
    const difficulties: Record<string, { total: number; completed: number }> = {};
    for (const habit of habits) {
      categories[habit.category] ||= { total: 0, completed: 0 };
      categories[habit.category].total += 1;
      difficulties[habit.difficulty] ||= { total: 0, completed: 0 };
      difficulties[habit.difficulty].total += 1;
      if (progressMap.get(habit.id)) {
        categories[habit.category].completed += 1;
        difficulties[habit.difficulty].completed += 1;
      }
    }

    const dailyTrend = [];
    for (let i = 13; i >= 0; i -= 1) {
      const date = format(subDays(new Date(), i), "yyyy-MM-dd");
      const completed = await HabitProgress.countDocuments({ user: userId, date, completed: true });
      dailyTrend.push({ date, completed, total: habits.length });
    }

    return {
      stats: summary.stats,
      habits: summary.habits,
      categoryBreakdown: Object.entries(categories).map(([name, data]) => ({
        name,
        ...data,
        rate: data.total ? Math.round((data.completed / data.total) * 100) : 0,
      })),
      difficultyBreakdown: Object.entries(difficulties).map(([name, data]) => ({
        name,
        ...data,
        rate: data.total ? Math.round((data.completed / data.total) * 100) : 0,
      })),
      dailyTrend,
      templates: templateRows.map((template) => ({
        templateId: template.templateId,
        templateName: template.templateName,
        totalDays: template.totalDays,
        habits: template.habits.length,
      })),
    };
  },
};
