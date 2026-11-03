import type {
  AnalyticsOverviewDto,
  ApiHabit,
  HabitHistoryDto,
  PlannerNoteDto,
  PlannerTaskDto,
  PlannerTimeDto,
} from "@/lib/api";
import { shiftISO, todayISO } from "./date";
import { cacheKey, readLocal, removeLocal, writeLocal } from "./localStore";

/** The mobile shell runs under this local-only identity until the visitor signs up. */
export const GUEST_USER_ID = "guest";

type GuestHabitSummary = { habits: ApiHabit[]; stats: Record<string, number> };

const PREVIEW_KEYS = ["summary", "history", "analytics", "tasks", "notes", "time"] as const;

const HABITS: ApiHabit[] = [
  { id: "demo-walk", title: "Morning walk", category: "Health", icon: "🚶", difficulty: "easy", streak: 6, completed: true, xp: 15 },
  { id: "demo-read", title: "Read 10 pages", category: "Learning", icon: "📚", difficulty: "easy", streak: 1, completed: false, xp: 15 },
  { id: "demo-focus", title: "Deep work block", category: "Work", icon: "🎯", difficulty: "medium", streak: 0, completed: false, xp: 20 },
  { id: "demo-sleep", title: "Sleep before 11", category: "Health", icon: "🌙", difficulty: "easy", streak: 0, completed: false, xp: 15 },
];

// Indexes into the 14 demo days (0 = oldest), so the preview matches today's date.
const DONE_DAYS: Record<string, number[]> = {
  "demo-walk": [0, 1, 2, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13],
  "demo-read": [1, 2, 4, 6, 8, 10, 12],
  "demo-focus": [0, 1, 3, 5, 7, 9, 11],
  "demo-sleep": [2, 3, 5, 6, 7, 9, 10, 11, 12],
};

export const ensureGuestPreview = () => {
  if (readLocal<GuestHabitSummary>(GUEST_USER_ID, cacheKey("summary"))) return;

  const today = todayISO();
  const days = Array.from({ length: 14 }, (_, index) => shiftISO(today, index - 13));
  const datesFor = (habitId: string) => (DONE_DAYS[habitId] || []).map((index) => days[index]);

  const daily = days.map((date) => ({
    date,
    completed: HABITS.filter((habit) => datesFor(habit.id).includes(date)).length,
    total: HABITS.length,
  }));
  const history: HabitHistoryDto = {
    days,
    habits: HABITS.map((habit) => ({
      id: habit.id,
      title: habit.title,
      icon: habit.icon,
      category: habit.category,
      dates: datesFor(habit.id),
    })),
    daily,
  };

  const stats: Record<string, number> = {
    totalHabits: HABITS.length,
    completedToday: HABITS.filter((habit) => habit.completed).length,
    completionPercentage: Math.round((HABITS.filter((habit) => habit.completed).length / HABITS.length) * 100),
    bestStreak: Math.max(...HABITS.map((habit) => habit.streak)),
    todayXP: 15,
    totalXP: 385,
    level: 3,
    weeklyCompleted: daily.slice(-7).reduce((sum, row) => sum + row.completed, 0),
    monthlyCompleted: daily.reduce((sum, row) => sum + row.completed, 0),
  };

  const categoryBreakdown = Array.from(new Set(HABITS.map((habit) => habit.category))).map((name) => {
    const rows = HABITS.filter((habit) => habit.category === name);
    const completed = rows.filter((habit) => habit.completed).length;
    return { name, total: rows.length, completed, rate: Math.round((completed / rows.length) * 100) };
  });
  const difficultyBreakdown = (["easy", "medium", "hard"] as const)
    .map((name) => {
      const rows = HABITS.filter((habit) => habit.difficulty === name);
      const completed = rows.filter((habit) => habit.completed).length;
      return { name: name[0].toUpperCase() + name.slice(1), total: rows.length, completed, rate: rows.length ? Math.round((completed / rows.length) * 100) : 0 };
    })
    .filter((row) => row.total > 0);
  const analytics: AnalyticsOverviewDto = {
    stats,
    habits: HABITS,
    categoryBreakdown,
    difficultyBreakdown,
    dailyTrend: daily.map(({ date, completed, total }) => ({ date, completed, total })),
    templates: [],
  };

  const tasks: PlannerTaskDto[] = [
    { id: "demo-task-1", title: "Plan tomorrow", category: "Personal", date: today, time: "18:00", completed: false, createdAt: `${today}T08:00:00.000Z` },
    { id: "demo-task-2", title: "Call mom", category: "Personal", date: today, time: "20:00", completed: true, createdAt: `${today}T08:05:00.000Z` },
  ];
  const notes: PlannerNoteDto[] = [
    { id: "demo-note-1", text: "Great energy after the morning walk. Kept the phone away until breakfast.", date: today, time: "08:30", createdAt: `${today}T08:30:00.000Z` },
    { id: "demo-note-2", text: "Deep work felt easier once the first block was scheduled the night before.", date: shiftISO(today, -1), time: "21:10", createdAt: `${shiftISO(today, -1)}T21:10:00.000Z` },
  ];
  const time: PlannerTimeDto = {
    entries: [
      { id: "demo-time-1", habitId: "demo-walk", label: "Morning walk", date: today, slot: 7, hours: 1 },
      { id: "demo-time-2", habitId: "demo-focus", label: "Deep work", date: shiftISO(today, -1), slot: 9, hours: 2 },
      { id: "demo-time-3", habitId: "demo-read", label: "Reading", date: shiftISO(today, -1), slot: 18, hours: 0.5 },
    ],
    totalHours: 3.5,
    from: shiftISO(today, -97),
    to: shiftISO(today, 14),
  };

  writeLocal(GUEST_USER_ID, cacheKey("summary"), { habits: HABITS, stats });
  writeLocal(GUEST_USER_ID, cacheKey("history"), history);
  writeLocal(GUEST_USER_ID, cacheKey("analytics"), analytics);
  writeLocal(GUEST_USER_ID, cacheKey("tasks"), tasks);
  writeLocal(GUEST_USER_ID, cacheKey("notes"), notes);
  writeLocal(GUEST_USER_ID, cacheKey("time"), time);
};

/** Drops the demo so a freshly created account never inherits preview data. */
export const clearGuestPreview = () => {
  for (const name of PREVIEW_KEYS) removeLocal(GUEST_USER_ID, cacheKey(name));
};
