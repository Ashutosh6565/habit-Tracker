import { endOfMonth, endOfWeek, format, startOfMonth, startOfWeek, subDays } from "date-fns";
import slugify from "slugify";
import { FilterQuery } from "mongoose";
import { Habit, type HabitDifficulty, type IHabit } from "../models/Habit";
import { HabitProgress } from "../models/HabitProgress";
import { AppError } from "../utils/AppError";
import { xpService } from "./xp.service";
import { XP_PER_LEVEL, levelFromXp, xpIntoLevel } from "../utils/xp";

const toSlug = (title: string) =>
  slugify(title, { lower: true, strict: true, trim: true }) || `habit-${Date.now()}`;

const difficultyXp = (difficulty: HabitDifficulty) =>
  difficulty === "hard" ? 30 : difficulty === "medium" ? 20 : 10;

const buildUniqueSlug = async (userId: string, title: string, existingId?: string) => {
  const base = toSlug(title);
  let slug = base;
  let suffix = 1;
  while (
    await Habit.exists({
      user: userId,
      slug,
      ...(existingId ? { _id: { $ne: existingId } } : {}),
    })
  ) {
    slug = `${base}-${suffix++}`;
  }
  return slug;
};

const getCurrentStreak = async (habitId: string, userId: string) => {
  let streak = 0;
  for (let i = 0; i < 365; i += 1) {
    const day = format(subDays(new Date(), i), "yyyy-MM-dd");
    const progress = await HabitProgress.findOne({ user: userId, habit: habitId, date: day });
    if (!progress?.completed) break;
    streak += 1;
  }
  return streak;
};

const formatHabit = async (habit: IHabit, date = format(new Date(), "yyyy-MM-dd")) => {
  const progress = await HabitProgress.findOne({ habit: habit.id, user: habit.user, date });
  const streak = await getCurrentStreak(habit.id, String(habit.user));
  return {
    id: habit.id,
    title: habit.title,
    slug: habit.slug,
    streak,
    completed: Boolean(progress?.completed),
    xp: habit.xp,
    difficulty: habit.difficulty,
    frequency: habit.frequency,
    category: habit.category,
    icon: habit.icon,
    reminderTime: habit.reminderTime || null,
    createdAt: habit.createdAt.toISOString(),
    updatedAt: habit.updatedAt.toISOString(),
  };
};

export const habitService = {
  async list(userId: string, options: {
    search?: string;
    category?: string;
    difficulty?: HabitDifficulty;
    completed?: "true" | "false";
    skip: number;
    limit: number;
    sort: Record<string, 1 | -1>;
  }) {
    const filter: FilterQuery<IHabit> = { user: userId, isArchived: false };
    if (options.category) filter.category = options.category;
    if (options.difficulty) filter.difficulty = options.difficulty;
    if (options.search) filter.$text = { $search: options.search };

    const [habits, total] = await Promise.all([
      Habit.find(filter).sort(options.sort).skip(options.skip).limit(options.limit),
      Habit.countDocuments(filter),
    ]);

    const formatted = await Promise.all(habits.map((habit) => formatHabit(habit)));
    const data =
      options.completed === undefined
        ? formatted
        : formatted.filter((habit) => String(habit.completed) === options.completed);

    return { data, total };
  },

  async create(userId: string, input: {
    title: string;
    category: string;
    icon: string;
    difficulty: HabitDifficulty;
    frequency?: "daily" | "weekly" | "monthly";
    xp?: number;
    reminderTime?: string;
  }) {
    const habit = await Habit.create({
      user: userId,
      title: input.title,
      slug: await buildUniqueSlug(userId, input.title),
      category: input.category,
      icon: input.icon,
      difficulty: input.difficulty,
      frequency: input.frequency || "daily",
      xp: input.xp ?? difficultyXp(input.difficulty),
      reminderTime: input.reminderTime,
    });
    return formatHabit(habit);
  },

  async update(userId: string, habitId: string, input: Partial<IHabit>) {
    const update: Partial<IHabit> = { ...input };
    if (input.title) update.slug = await buildUniqueSlug(userId, input.title, habitId);
    const habit = await Habit.findOneAndUpdate(
      { _id: habitId, user: userId },
      { $set: update },
      { new: true }
    );
    if (!habit) throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
    return formatHabit(habit);
  },

  async remove(userId: string, habitId: string) {
    const habit = await Habit.findOneAndDelete({ _id: habitId, user: userId });
    if (!habit) throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
    await HabitProgress.deleteMany({ habit: habitId, user: userId });
  },

  async setProgress(userId: string, habitId: string, input: { completed: boolean; date?: string; note?: string }) {
    const habit = await Habit.findOne({ _id: habitId, user: userId });
    if (!habit) throw new AppError("Habit not found", 404, "HABIT_NOT_FOUND");
    const date = input.date || format(new Date(), "yyyy-MM-dd");

    await HabitProgress.findOneAndUpdate(
      { user: userId, habit: habitId, date },
      {
        $set: {
          completed: input.completed,
          completedAt: input.completed ? new Date() : undefined,
          xpEarned: input.completed ? habit.xp : 0,
          note: input.note,
          period: habit.frequency,
        },
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    return formatHabit(habit, date);
  },

  async history(userId: string, days = 30) {
    const habits = await Habit.find({ user: userId, isArchived: false }).sort({ createdAt: 1 });
    const dayList: string[] = [];
    for (let i = days - 1; i >= 0; i -= 1) {
      dayList.push(format(subDays(new Date(), i), "yyyy-MM-dd"));
    }

    const rows = await HabitProgress.find({
      user: userId,
      date: { $gte: dayList[0] },
      completed: true,
    }).select("habit date");

    const byHabit = new Map<string, string[]>();
    const byDate = new Map<string, number>();
    for (const row of rows) {
      const key = String(row.habit);
      byHabit.set(key, [...(byHabit.get(key) || []), row.date]);
      byDate.set(row.date, (byDate.get(row.date) || 0) + 1);
    }

    return {
      days: dayList,
      habits: habits.map((habit) => ({
        id: habit.id,
        title: habit.title,
        icon: habit.icon,
        category: habit.category,
        dates: byHabit.get(habit.id) || [],
      })),
      daily: dayList.map((date) => ({
        date,
        completed: byDate.get(date) || 0,
        total: habits.length,
      })),
    };
  },

  async summary(userId: string) {
    const today = format(new Date(), "yyyy-MM-dd");
    const habits = await Habit.find({ user: userId, isArchived: false });
    const formatted = await Promise.all(habits.map((habit) => formatHabit(habit, today)));
    const completed = formatted.filter((habit) => habit.completed);
    const todayXP = completed.reduce((sum, habit) => sum + habit.xp, 0);
    const totalXP = await xpService.lifetimeXp(userId);
    const bestStreak = Math.max(0, ...formatted.map((habit) => habit.streak));

    const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
    const monthStart = format(startOfMonth(new Date()), "yyyy-MM-dd");
    const monthEnd = format(endOfMonth(new Date()), "yyyy-MM-dd");

    const [weeklyCompleted, monthlyCompleted] = await Promise.all([
      HabitProgress.countDocuments({ user: userId, date: { $gte: weekStart, $lte: weekEnd }, completed: true }),
      HabitProgress.countDocuments({ user: userId, date: { $gte: monthStart, $lte: monthEnd }, completed: true }),
    ]);

    return {
      habits: formatted,
      stats: {
        completedToday: completed.length,
        totalHabits: habits.length,
        totalXP,
        todayXP,
        level: levelFromXp(totalXP),
        xpIntoLevel: xpIntoLevel(totalXP),
        xpForNextLevel: XP_PER_LEVEL,
        bestStreak,
        completionPercentage: habits.length ? Math.round((completed.length / habits.length) * 100) : 0,
        weeklyCompleted,
        monthlyCompleted,
      },
    };
  },
};
