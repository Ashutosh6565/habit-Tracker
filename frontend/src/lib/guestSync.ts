import { api } from "./api";
import {
  GUEST_LEARNING_PLANS_KEY,
  GUEST_TEMPLATE_DATA_KEY,
  GUEST_TRACKER_HABITS_KEY,
  readGuestJson,
  removeGuestKey,
  writeGuestJson,
} from "./guestStorage";
import type { LearningVideoPlan } from "./learningVideos";

interface GuestHabitSnapshot {
  title: string;
  category: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
  xp: number;
  completed: boolean;
}

interface GuestTemplateSnapshot {
  templateId: string;
  templateName: string;
  habits: { habitId: string; name: string; icon: string }[];
  completions: Record<string, Record<number, boolean>>;
  totalDays: number;
}

export interface GuestSnapshot {
  habits: GuestHabitSnapshot[];
  templates: GuestTemplateSnapshot[];
  learningPlans: LearningVideoPlan[];
}

export const captureGuestSnapshot = (): GuestSnapshot => ({
  habits: readGuestJson<GuestHabitSnapshot[]>(GUEST_TRACKER_HABITS_KEY, []),
  templates: Object.values(readGuestJson<Record<string, GuestTemplateSnapshot>>(GUEST_TEMPLATE_DATA_KEY, {})),
  learningPlans: readGuestJson<LearningVideoPlan[]>(GUEST_LEARNING_PLANS_KEY, []),
});

export const hasGuestData = (snapshot: GuestSnapshot) =>
  snapshot.habits.length > 0 || snapshot.templates.length > 0 || snapshot.learningPlans.length > 0;

export const pushGuestSnapshotToServer = async (snapshot: GuestSnapshot) => {
  if (!hasGuestData(snapshot)) return;

  let existingTitles: Set<string>;
  try {
    const habits = await api.habits.list();
    existingTitles = new Set(habits.map((h) => h.title.toLowerCase()));
  } catch {
    existingTitles = new Set();
  }

  let remainingHabits = [...snapshot.habits];
  for (const habit of snapshot.habits) {
    if (existingTitles.has(habit.title.toLowerCase())) {
      remainingHabits = remainingHabits.filter((h) => h !== habit);
      writeGuestJson(GUEST_TRACKER_HABITS_KEY, remainingHabits);
      continue;
    }
    try {
      const created = await api.habits.create({
        title: habit.title,
        xp: habit.xp,
        difficulty: habit.difficulty,
        category: habit.category,
        icon: habit.icon,
      });
      if (habit.completed) {
        await api.habits.setProgress(created.id, true).catch(() => undefined);
      }
      remainingHabits = remainingHabits.filter((h) => h !== habit);
      writeGuestJson(GUEST_TRACKER_HABITS_KEY, remainingHabits);
    } catch {
      // keep remaining habits in storage so a later login can retry
      break;
    }
  }

  const templatesMap = readGuestJson<Record<string, GuestTemplateSnapshot>>(GUEST_TEMPLATE_DATA_KEY, {});
  for (const template of snapshot.templates) {
    try {
      await api.templates.upsert({
        templateId: template.templateId,
        templateName: template.templateName,
        habits: template.habits,
        completions: template.completions,
        totalDays: template.totalDays,
      });
      delete templatesMap[template.templateId];
      writeGuestJson(GUEST_TEMPLATE_DATA_KEY, templatesMap);
    } catch {
      break;
    }
  }

  let remainingPlans = [...snapshot.learningPlans];
  for (const plan of snapshot.learningPlans) {
    try {
      await api.learning.upsert(plan);
      remainingPlans = remainingPlans.filter((item) => item !== plan);
      writeGuestJson(GUEST_LEARNING_PLANS_KEY, remainingPlans);
    } catch {
      break;
    }
  }

  if (remainingHabits.length === 0) removeGuestKey(GUEST_TRACKER_HABITS_KEY);
  if (Object.keys(templatesMap).length === 0) removeGuestKey(GUEST_TEMPLATE_DATA_KEY);
  if (remainingPlans.length === 0) removeGuestKey(GUEST_LEARNING_PLANS_KEY);
};
