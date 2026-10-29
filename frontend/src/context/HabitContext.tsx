import { createContext, useContext, useState, ReactNode, useCallback, useEffect } from "react";
import type { LearningVideoPlan } from "@/lib/learningVideos";
import { useAuth } from "./AuthContext";
import {
  GUEST_LEARNING_PLANS_KEY,
  GUEST_TEMPLATE_DATA_KEY,
  GUEST_TRACKER_HABITS_KEY,
  readGuestJson,
  writeGuestJson,
} from "@/lib/guestStorage";

type Difficulty = "easy" | "medium" | "hard";

export interface TrackerHabit {
  id: number;
  title: string;
  streak: number;
  completed: boolean;
  xp: number;
  difficulty: Difficulty;
  category: string;
  icon: string;
}

export interface TemplateCompletionData {
  templateId: string;
  templateName: string;
  habits: { habitId: string; name: string; icon: string }[];
  completions: Record<string, Record<number, boolean>>; // habitId -> day -> done
  totalDays: number;
}

interface HabitContextType {
  // Tracker data
  trackerHabits: TrackerHabit[];
  setTrackerHabits: (habits: TrackerHabit[]) => void;

  // Template data
  templateData: Record<string, TemplateCompletionData>;
  setTemplateData: (templateId: string, data: TemplateCompletionData) => void;

  // Learning video timetable data
  learningVideoPlans: LearningVideoPlan[];
  setLearningVideoPlans: (plans: LearningVideoPlan[]) => void;
}

const HabitContext = createContext<HabitContextType | undefined>(undefined);

export const HabitProvider = ({ children }: { children: ReactNode }) => {
  const { user, loading } = useAuth();
  const [trackerHabits, setTrackerHabits] = useState<TrackerHabit[]>(() =>
    readGuestJson<TrackerHabit[]>(GUEST_TRACKER_HABITS_KEY, [])
  );
  const [templateData, setTemplateDataState] = useState<Record<string, TemplateCompletionData>>(() =>
    readGuestJson<Record<string, TemplateCompletionData>>(GUEST_TEMPLATE_DATA_KEY, {})
  );
  const [learningVideoPlans, setLearningVideoPlans] = useState<LearningVideoPlan[]>(() =>
    readGuestJson<LearningVideoPlan[]>(GUEST_LEARNING_PLANS_KEY, [])
  );

  const setTemplateData = useCallback((templateId: string, data: TemplateCompletionData) => {
    setTemplateDataState((prev) => ({ ...prev, [templateId]: data }));
  }, []);

  // Guest data lives in localStorage until the user signs up, then guestSync
  // pushes it to the API and clears these keys. Skip writes while the session
  // is being restored so logged-in users don't get empty guest keys recreated.
  useEffect(() => {
    if (user || loading) return;
    writeGuestJson(GUEST_TRACKER_HABITS_KEY, trackerHabits);
  }, [user, loading, trackerHabits]);

  useEffect(() => {
    if (user || loading) return;
    writeGuestJson(GUEST_TEMPLATE_DATA_KEY, templateData);
  }, [user, loading, templateData]);

  useEffect(() => {
    if (user || loading) return;
    writeGuestJson(GUEST_LEARNING_PLANS_KEY, learningVideoPlans);
  }, [user, loading, learningVideoPlans]);

  return (
    <HabitContext.Provider
      value={{ trackerHabits, setTrackerHabits, templateData, setTemplateData, learningVideoPlans, setLearningVideoPlans }}
    >
      {children}
    </HabitContext.Provider>
  );
};

export const useHabitContext = () => {
  const ctx = useContext(HabitContext);
  if (!ctx) throw new Error("useHabitContext must be used within HabitProvider");
  return ctx;
};
