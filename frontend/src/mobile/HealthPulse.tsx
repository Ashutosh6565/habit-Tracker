import { useMemo, useState, type CSSProperties } from "react";
import { Activity, Droplets, Moon, Plus, Sparkles, Minus } from "lucide-react";
import { lastNDays, toISO } from "./date";
import { MOOD_LABELS, WATER_GOAL, healthSeries, useHealth } from "./health";
import { Sheet } from "./shared";

const MOOD_FACES = ["😞", "😕", "😐", "🙂", "😄"];

const dialTone = (score: number) => (score >= 80 ? "high" : score >= 55 ? "mid" : "low");

const VitalityDial = ({ score }: { score: number }) => (
  <div
    className={`hb-vitality-dial is-${dialTone(score)}`}
    style={{ "--vitality": `${Math.max(0, Math.min(100, score)) * 3.6}deg` } as CSSProperties}
    aria-label={`Vitality ${score} out of 100`}
  >
    <div className="hb-vitality-inner">
      <strong>{score}</strong>
      <span>vitality</span>
    </div>
  </div>
);

export const HealthPulse = ({
  userId,
  movementDone,
}: {
  userId: string;
  movementDone: number;
}) => {
  const { state, today, day, vitality, update } = useHealth(userId, movementDone);
  const [open, setOpen] = useState(false);
  const lastSeven = useMemo(() => lastNDays(7), []);
  const series = useMemo(
    () => healthSeries(state, lastSeven.map(toISO), movementDone, today),
    [state, lastSeven, movementDone, today]
  );
  const recorded = series.filter((value): value is number => value != null);
  const peak = Math.max(1, ...recorded);
  const moodLabel = day.mood ? MOOD_LABELS[day.mood - 1] : "Log mood";

  return (
    <>
      <section className="hb-pulse">
        <div className="hb-pulse-head">
          <div>
            <span className="hb-kicker">Health pulse</span>
            <strong>Sleep, water, mood, movement</strong>
          </div>
          <button type="button" className="hb-rail-all" onClick={() => setOpen(true)}>
            Details →
          </button>
        </div>

        <div className="hb-pulse-body">
          <VitalityDial score={vitality.score} />
          <div className="hb-pulse-copy">
            <span className={`hb-pulse-tag is-${dialTone(vitality.score)}`}>
              <Activity size={11} /> {vitality.label}
            </span>
            <p>{vitality.tip}</p>
            <div className="hb-pulse-bars" aria-hidden="true">
              {series.map((value, index) => (
                <span
                  key={toISO(lastSeven[index])}
                  className={`${value == null ? "is-empty" : ""} ${index === series.length - 1 ? "is-today" : ""}`}
                  style={{
                    height: `${value == null ? 16 : Math.max(18, (value / peak) * 100)}%`,
                    animationDelay: `${index * 45}ms`,
                  }}
                />
              ))}
            </div>
          </div>
        </div>

        <div className="hb-pulse-actions">
          <button
            type="button"
            className="hb-pulse-water"
            onClick={() => update({ water: Math.min(12, day.water + 1) })}
            aria-label="Add a glass of water"
          >
            <Droplets size={14} />
            <span key={day.water} className="hb-pulse-water-count">
              {day.water}/{WATER_GOAL}
            </span>
            <span className="hb-pulse-water-plus">+1</span>
          </button>
          <button type="button" className="hb-pulse-chip" onClick={() => setOpen(true)}>
            <Moon size={13} /> {day.sleep}h sleep
          </button>
          <button type="button" className="hb-pulse-chip" onClick={() => setOpen(true)}>
            {day.mood ? MOOD_FACES[day.mood - 1] : "🙂"} {moodLabel}
          </button>
        </div>
      </section>

      {open && (
        <Sheet title="Health pulse" onClose={() => setOpen(false)}>
          <div className="hb-pulse-sheet-hero">
            <VitalityDial score={vitality.score} />
            <div>
              <span className={`hb-pulse-tag is-${dialTone(vitality.score)}`}>
                <Sparkles size={11} /> {vitality.label}
              </span>
              <p>{vitality.tip}</p>
            </div>
          </div>

          <span className="hb-sheet-label">Sleep last night</span>
          <div className="hb-stepper">
            <button
              type="button"
              className="hb-step-btn"
              onClick={() => update({ sleep: Math.max(0, Math.round((day.sleep - 0.5) * 2) / 2) })}
              aria-label="Less sleep"
            >
              <Minus size={15} />
            </button>
            <strong>{day.sleep} h</strong>
            <button
              type="button"
              className="hb-step-btn"
              onClick={() => update({ sleep: Math.min(12, Math.round((day.sleep + 0.5) * 2) / 2) })}
              aria-label="More sleep"
            >
              <Plus size={15} />
            </button>
          </div>

          <span className="hb-sheet-label">
            Water · {day.water} of {WATER_GOAL} glasses
          </span>
          <div className="hb-water-grid">
            {Array.from({ length: WATER_GOAL }, (_, index) => (
              <button
                key={index}
                type="button"
                className={`hb-water-glass ${index < day.water ? "is-on" : ""}`}
                onClick={() => update({ water: index + 1 === day.water ? index : index + 1 })}
                aria-label={`Set water to ${index + 1} glasses`}
              >
                <Droplets size={14} />
              </button>
            ))}
          </div>

          <span className="hb-sheet-label">Mood right now</span>
          <div className="hb-mood-row">
            {MOOD_FACES.map((face, index) => {
              const value = index + 1;
              return (
                <button
                  key={value}
                  type="button"
                  className={`hb-mood ${day.mood === value ? "is-on" : ""}`}
                  onClick={() => update({ mood: day.mood === value ? null : value })}
                  aria-label={MOOD_LABELS[index]}
                  aria-pressed={day.mood === value}
                >
                  <span>{face}</span>
                  {MOOD_LABELS[index]}
                </button>
              );
            })}
          </div>

          <span className="hb-sheet-label">Where your score comes from</span>
          <div className="hb-vitality-parts">
            {(
              [
                ["Sleep", vitality.parts.sleep, vitality.maxes.sleep, Moon],
                ["Water", vitality.parts.water, vitality.maxes.water, Droplets],
                ["Mood", vitality.parts.mood, vitality.maxes.mood, Sparkles],
                ["Movement", vitality.parts.movement, vitality.maxes.movement, Activity],
              ] as const
            ).map(([label, value, max, Icon]) => (
              <div key={label} className="hb-vitality-part">
                <span className="hb-vitality-part-label">
                  <Icon size={12} /> {label}
                  <em>
                    {value}/{max}
                  </em>
                </span>
                <span className="hb-vitality-track">
                  <span style={{ width: `${Math.round((value / max) * 100)}%` }} />
                </span>
              </div>
            ))}
          </div>

          <div className="hb-pulse-move">
            <Activity size={13} />
            Movement is scored from Health &amp; Fitness habits you complete today.
          </div>

          <div className="hb-coach-privacy">
            Saved on this device, so your health log stays even when you're offline.
          </div>
          <button type="button" className="hb-btn-ghost" onClick={() => setOpen(false)}>
            Done
          </button>
        </Sheet>
      )}
    </>
  );
};
