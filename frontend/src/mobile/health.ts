import { useEffect, useMemo, useState } from "react";
import { todayISO } from "./date";
import { readLocal, writeLocal } from "./localStore";

export type HealthDay = {
  sleep: number;
  water: number;
  mood: number | null;
  movement: number;
  updatedAt: string;
};

export type HealthState = { days: Record<string, HealthDay> };

export type VitalityParts = { sleep: number; water: number; mood: number; movement: number };
export type VitalityLabel = "Primed" | "Steady" | "Running low";
export type Vitality = {
  score: number;
  label: VitalityLabel;
  parts: VitalityParts;
  maxes: VitalityParts;
  tip: string;
};

export const WATER_GOAL = 8;
export const SLEEP_TARGET = 8;
export const MOOD_LABELS = ["Rough", "Low", "Okay", "Good", "Great"];

const clamp01 = (value: number) => Math.max(0, Math.min(1, value));

export const emptyHealth = (): HealthState => ({ days: {} });

export const defaultHealthDay = (): HealthDay => ({
  sleep: 7,
  water: 0,
  mood: null,
  movement: 0,
  updatedAt: new Date().toISOString(),
});

export const readHealth = (userId: string): HealthState => {
  const stored = readLocal<HealthState>(userId, "health");
  if (!stored || typeof stored !== "object" || !stored.days || typeof stored.days !== "object") return emptyHealth();
  return stored;
};

export const healthDayFor = (state: HealthState, iso: string): HealthDay => state.days[iso] ?? defaultHealthDay();

export const computeVitality = (day: HealthDay, movementDone = day.movement): Vitality => {
  const parts: VitalityParts = {
    sleep: Math.round(40 * clamp01(1 - Math.abs(day.sleep - SLEEP_TARGET) / 4)),
    water: Math.round(25 * clamp01(day.water / WATER_GOAL)),
    mood: day.mood == null ? 7 : Math.round(15 * clamp01((day.mood - 1) / 4)),
    movement: Math.round(20 * clamp01(movementDone / 2)),
  };
  const score = Math.max(0, Math.min(100, parts.sleep + parts.water + parts.mood + parts.movement));
  const maxes: VitalityParts = { sleep: 40, water: 25, mood: 15, movement: 20 };
  const ratios: { key: keyof VitalityParts; ratio: number }[] = [
    { key: "sleep", ratio: parts.sleep / maxes.sleep },
    { key: "water", ratio: parts.water / maxes.water },
    { key: "mood", ratio: parts.mood / maxes.mood },
    { key: "movement", ratio: parts.movement / maxes.movement },
  ];
  const weakest = ratios.reduce((low, row) => (row.ratio < low.ratio ? row : low), ratios[0]);
  const label: VitalityLabel = score >= 80 ? "Primed" : score >= 55 ? "Steady" : "Running low";
  const tip =
    weakest.key === "sleep"
      ? "Lights out 30 minutes earlier tonight — sleep is your strongest lever."
      : weakest.key === "water"
        ? "Drink one more glass now. Hydration lifts focus within 20 minutes."
        : weakest.key === "mood"
          ? "Two minutes of slow breathing can reset a tense mood."
          : weakest.key === "movement"
            ? "A 10-minute walk counts. Movement is the fastest way to raise this score."
            : "Protect today's routine — you're in a strong place.";
  return { score, label, parts, maxes, tip };
};

export const healthSeries = (state: HealthState, dates: string[], movementToday: number, today: string) =>
  dates.map((iso) => {
    const record = state.days[iso];
    if (iso === today) return computeVitality(record ?? defaultHealthDay(), movementToday).score;
    return record ? computeVitality(record).score : null;
  });

export const useHealth = (userId: string, movementToday: number) => {
  const [state, setState] = useState<HealthState>(() => readHealth(userId));
  const [today, setToday] = useState(todayISO());

  useEffect(() => {
    setState(readHealth(userId));
  }, [userId]);

  useEffect(() => {
    const timer = window.setInterval(() => setToday(todayISO()), 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const day = healthDayFor(state, today);
  const vitality = useMemo(() => computeVitality(day, movementToday), [day, movementToday]);

  const update = (patch: Partial<HealthDay>) => {
    setState((previous) => {
      const current = previous.days[today] ?? defaultHealthDay();
      const next: HealthState = {
        days: {
          ...previous.days,
          [today]: { ...current, ...patch, movement: movementToday, updatedAt: new Date().toISOString() },
        },
      };
      writeLocal(userId, "health", next);
      return next;
    });
  };

  useEffect(() => {
    const record = state.days[today];
    if (!record || record.movement === movementToday) return;
    const next: HealthState = {
      days: { ...state.days, [today]: { ...record, movement: movementToday } },
    };
    writeLocal(userId, "health", next);
    setState(next);
  }, [state.days, today, movementToday, userId]);

  return { state, today, day, vitality, update };
};
