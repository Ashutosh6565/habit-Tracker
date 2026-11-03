import { type CSSProperties } from "react";
import { Droplets, HeartPulse, Minus, Moon, Plus, Sparkles } from "lucide-react";
import { lastNDays, toISO, todayISO } from "@/mobile/date";
import {
  MOOD_LABELS,
  SLEEP_TARGET,
  WATER_GOAL,
  healthSeries,
  useHealth,
} from "@/mobile/health";

const moodEmoji = ["😖", "😕", "😐", "🙂", "😄"];

export const HealthPulse = ({
  userId,
  movementToday,
  className = "",
}: {
  userId: string;
  movementToday: number;
  className?: string;
}) => {
  const { state, day, vitality, update } = useHealth(userId, movementToday);
  const week = lastNDays(7);
  const series = healthSeries(state, week.map(toISO), movementToday, todayISO());

  const setSleep = (delta: number) =>
    update({ sleep: Math.max(0, Math.min(12, Math.round((day.sleep + delta) * 2) / 2)) });

  return (
    <section
      className={`web-pulse-card relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-sm ${className}`}
    >
      <div aria-hidden className="web-pulse-aura" />
      <div className="relative">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
              <HeartPulse className="h-3.5 w-3.5" /> Health Pulse
            </span>
            <h2 className="mt-2 font-display text-xl font-bold text-foreground">One score for how you actually feel</h2>
            <p className="mt-1 text-xs text-muted-foreground">Sleep, hydration, mood and movement — saved on this device.</p>
          </div>

          <div className="flex items-center gap-3">
            <div
              className={`web-pulse-ring h-20 w-20 rounded-full ${vitality.score >= 80 ? "is-primed" : vitality.score >= 55 ? "is-steady" : "is-low"}`}
              style={{ "--pulse-angle": `${vitality.score * 3.6}deg` } as CSSProperties}
            >
              <span>{vitality.score}</span>
            </div>
            <div>
              <p className="font-display text-sm font-bold text-foreground">{vitality.label}</p>
              <p className="text-xs text-muted-foreground">Vitality / 100</p>
            </div>
          </div>
        </div>

        <div className="mt-5 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="web-pulse-tile">
            <div className="flex items-center justify-between">
              <span className="web-pulse-label"><Moon className="h-3.5 w-3.5" /> Sleep</span>
              <span className="web-pulse-points">{vitality.parts.sleep}/40</span>
            </div>
            <div className="mt-2 flex items-center justify-between gap-2">
              <button type="button" className="web-pulse-step" onClick={() => setSleep(-0.5)} aria-label="Sleep 30 minutes less">
                <Minus className="h-3.5 w-3.5" />
              </button>
              <div className="text-center">
                <span className="font-display text-xl font-bold text-foreground">{day.sleep.toFixed(1)}</span>
                <span className="ml-1 text-xs text-muted-foreground">h</span>
                <p className="text-[10px] text-muted-foreground">target {SLEEP_TARGET}h</p>
              </div>
              <button type="button" className="web-pulse-step" onClick={() => setSleep(0.5)} aria-label="Sleep 30 minutes more">
                <Plus className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          <div className="web-pulse-tile">
            <div className="flex items-center justify-between">
              <span className="web-pulse-label"><Droplets className="h-3.5 w-3.5" /> Water</span>
              <span className="web-pulse-points">{vitality.parts.water}/25</span>
            </div>
            <div className="mt-2 text-xs text-muted-foreground">
              <span className="font-display text-lg font-bold text-foreground">{day.water}</span> / {WATER_GOAL} glasses
            </div>
            <div className="mt-2 flex gap-1">
              {Array.from({ length: WATER_GOAL }, (_, index) => {
                const filled = day.water > index;
                return (
                  <button
                    key={index}
                    type="button"
                    className={`web-water-glass ${filled ? "is-on" : ""}`}
                    onClick={() => update({ water: day.water === index + 1 ? index : index + 1 })}
                    aria-label={`Set water to ${index + 1} of ${WATER_GOAL} glasses`}
                    aria-pressed={filled}
                  >
                    <Droplets className="h-3 w-3" />
                  </button>
                );
              })}
            </div>
          </div>

          <div className="web-pulse-tile">
            <div className="flex items-center justify-between">
              <span className="web-pulse-label"><Sparkles className="h-3.5 w-3.5" /> Mood</span>
              <span className="web-pulse-points">{vitality.parts.mood}/15</span>
            </div>
            <div className="mt-2 flex gap-1">
              {MOOD_LABELS.map((label, index) => (
                <button
                  key={label}
                  type="button"
                  className={`web-mood ${day.mood === index + 1 ? "is-on" : ""}`}
                  onClick={() => update({ mood: index + 1 })}
                  aria-label={`Mood: ${label}`}
                  aria-pressed={day.mood === index + 1}
                  title={label}
                >
                  {moodEmoji[index]}
                </button>
              ))}
            </div>
            <p className="mt-1 text-[10px] text-muted-foreground">{day.mood ? MOOD_LABELS[day.mood - 1] : "How do you feel?"}</p>
          </div>

          <div className="web-pulse-tile">
            <div className="flex items-center justify-between">
              <span className="web-pulse-label"><HeartPulse className="h-3.5 w-3.5" /> Movement</span>
              <span className="web-pulse-points">{vitality.parts.movement}/20</span>
            </div>
            <p className="mt-2 font-display text-xl font-bold text-foreground">
              {Math.min(movementToday, 2)}<span className="text-sm text-muted-foreground">/2</span>
            </p>
            <p className="text-[10px] leading-relaxed text-muted-foreground">
              Health or fitness habits completed today
            </p>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-xl border border-border/60 bg-secondary/40 px-4 py-3">
          <p className="text-xs leading-relaxed text-muted-foreground">
            <span className="font-semibold text-foreground">Next lever:</span> {vitality.tip}
          </p>
          <div className="ml-auto flex items-end gap-1.5" aria-label="Last 7 days vitality">
            {series.map((score, index) => (
              <div key={toISO(week[index])} className="flex flex-col items-center gap-1">
                <span
                  className={`web-pulse-bar ${score === null ? "is-empty" : score >= 80 ? "is-primed" : score >= 55 ? "is-steady" : "is-low"}`}
                  style={{ height: `${Math.max(6, score ?? 6)}%`, animationDelay: `${index * 45}ms` }}
                  title={score === null ? "No entry" : `${score}/100`}
                />
                <span className="text-[9px] uppercase text-muted-foreground">
                  {week[index].toLocaleDateString(undefined, { weekday: "narrow" })}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export default HealthPulse;
