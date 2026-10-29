import type { HabitHistoryDto, PlannerTaskDto, PlannerTimeDto } from "@/lib/api";
import { lastNDays, toISO, todayISO } from "./date";

export interface MomentumInput {
  habitsDone: number;
  habitsTotal: number;
  tasksDone: number;
  tasksTotal: number;
  focusHours: number;
  bestStreak: number;
}

export interface MomentumBreakdown {
  score: number;
  habits: number;
  tasks: number | null;
  focus: number;
  streak: number;
  label: string;
}

export type MomentumAction = "templates" | "today" | "tasks" | "time";

export interface MomentumMove {
  label: string;
  action: MomentumAction;
}

export interface MomentumDay {
  date: string;
  score: number;
  isToday: boolean;
}

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

const labelFor = (score: number) => {
  if (score >= 85) return "On fire";
  if (score >= 65) return "Strong";
  if (score >= 40) return "Building";
  if (score >= 15) return "Warming up";
  return "Fresh start";
};

export const computeMomentum = (input: MomentumInput): MomentumBreakdown => {
  const habits = input.habitsTotal > 0 ? clamp01(input.habitsDone / input.habitsTotal) : 0;
  const tasks = input.tasksTotal > 0 ? clamp01(input.tasksDone / input.tasksTotal) : null;
  const focus = clamp01(input.focusHours / 2);
  const streak = clamp01(input.bestStreak / 21);

  // With no tasks on the day, their weight moves to habits and focus.
  const weights =
    tasks === null
      ? { habits: 0.55, tasks: 0, focus: 0.3, streak: 0.15 }
      : { habits: 0.45, tasks: 0.2, focus: 0.2, streak: 0.15 };

  const score = Math.round(
    100 * (habits * weights.habits + (tasks ?? 0) * weights.tasks + focus * weights.focus + streak * weights.streak)
  );

  return {
    score,
    habits: Math.round(habits * 100),
    tasks: tasks === null ? null : Math.round(tasks * 100),
    focus: Math.round(focus * 100),
    streak: Math.round(streak * 100),
    label: labelFor(score),
  };
};

export const nextMoveFor = (input: MomentumInput, breakdown: MomentumBreakdown): MomentumMove => {
  if (input.habitsTotal === 0) return { label: "Pick a starter template", action: "templates" };
  if (breakdown.habits < 60) {
    const left = Math.max(1, input.habitsTotal - input.habitsDone);
    return { label: left === 1 ? "Check off your last habit" : `Check off ${Math.min(2, left)} habits`, action: "today" };
  }
  if (breakdown.tasks !== null && breakdown.tasks < 60) {
    return { label: "Finish one open task", action: "tasks" };
  }
  if (breakdown.focus < 30) return { label: "Log 20 minutes of focus", action: "time" };
  if (breakdown.score >= 85) return { label: "Bank a 10-min block for tomorrow", action: "time" };
  return { label: "Plan tomorrow's first task", action: "tasks" };
};

export const buildMomentumSeries = ({
  history,
  tasks,
  time,
  bestStreak,
  days = 7,
}: {
  history?: HabitHistoryDto;
  tasks: PlannerTaskDto[];
  time?: PlannerTimeDto;
  bestStreak: number;
  days?: number;
}): MomentumDay[] => {
  const today = todayISO();
  return lastNDays(days).map((date) => {
    const iso = toISO(date);
    const row = history?.daily.find((entry) => entry.date === iso);
    const dayTasks = tasks.filter((task) => task.date === iso);
    const focusHours = (time?.entries || [])
      .filter((entry) => entry.date === iso)
      .reduce((sum, entry) => sum + entry.hours, 0);
    const breakdown = computeMomentum({
      habitsDone: row?.completed || 0,
      habitsTotal: row?.total || 0,
      tasksDone: dayTasks.filter((task) => task.completed).length,
      tasksTotal: dayTasks.length,
      focusHours,
      bestStreak,
    });
    return { date: iso, score: breakdown.score, isToday: iso === today };
  });
};
