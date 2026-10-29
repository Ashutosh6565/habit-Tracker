import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { AlarmClock, BookOpen, Check, Dumbbell, PartyPopper, RotateCcw, Trophy, Zap } from "lucide-react";

const microHabits = [
  { id: "wake", label: "Wake up at 6:00", xp: 15, icon: AlarmClock },
  { id: "move", label: "20 push-ups", xp: 20, icon: Dumbbell },
  { id: "read", label: "Read 10 pages", xp: 15, icon: BookOpen },
] as const;

export default function TryHabitDemo() {
  const [done, setDone] = useState<Set<string>>(new Set());
  const xp = useMemo(
    () => microHabits.reduce((total, habit) => (done.has(habit.id) ? total + habit.xp : total), 0),
    [done]
  );
  const totalXp = microHabits.reduce((total, habit) => total + habit.xp, 0);
  const complete = done.size === microHabits.length;

  const toggle = (id: string) => {
    setDone((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="relative">
      <div className="absolute -inset-6 -z-10 rounded-[2rem] bg-gradient-to-br from-primary/20 via-streak/10 to-xp/20 blur-2xl" />
      <motion.div
        initial={{ opacity: 0, y: 24, rotate: 1.2 }}
        animate={{ opacity: 1, y: 0, rotate: 0 }}
        transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
        className="sticker-card relative overflow-hidden p-6 sm:p-7"
      >
        <div className="flex items-start justify-between gap-3">
          <div>
            <span className="sticker-chip border-primary/30 bg-primary/10 text-primary">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-60" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-primary" />
              </span>
              Live demo
            </span>
            <h3 className="mt-3 font-display text-xl font-bold text-foreground">Your first 60 seconds</h3>
            <p className="mt-1 text-sm text-muted-foreground">Tap what you'd actually do tomorrow.</p>
          </div>
          <div className="flex flex-col items-center rounded-2xl border border-streak/30 bg-streak/10 px-3 py-2">
            <Zap className="h-4 w-4 text-streak" />
            <span className="mt-1 font-display text-lg font-bold text-foreground">{xp}</span>
            <span className="text-[10px] uppercase tracking-wide text-muted-foreground">XP</span>
          </div>
        </div>

        <div className="mt-5 space-y-2.5">
          {microHabits.map((habit) => {
            const checked = done.has(habit.id);
            return (
              <button
                key={habit.id}
                type="button"
                aria-pressed={checked}
                onClick={() => toggle(habit.id)}
                className={`group flex w-full items-center gap-3 rounded-xl border p-3 text-left transition-all ${
                  checked
                    ? "border-primary/40 bg-primary/10"
                    : "border-border bg-background/60 hover:border-primary/30 hover:bg-secondary/60"
                }`}
              >
                <span
                  className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-lg transition-colors ${
                    checked ? "gradient-primary text-primary-foreground" : "bg-secondary text-muted-foreground"
                  }`}
                >
                  {checked ? <Check className="h-4 w-4" strokeWidth={3} /> : <habit.icon className="h-4 w-4" />}
                </span>
                <span className={`flex-1 text-sm font-medium ${checked ? "text-foreground" : "text-foreground/90"}`}>
                  {habit.label}
                </span>
                <span className={`text-[11px] font-semibold ${checked ? "text-primary" : "text-muted-foreground"}`}>
                  +{habit.xp} XP
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-5">
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <motion.div
              className="h-full gradient-primary"
              initial={false}
              animate={{ width: `${(xp / totalXp) * 100}%` }}
              transition={{ duration: 0.45, ease: "easeOut" }}
            />
          </div>
          <div className="mt-2 flex items-center justify-between text-[11px] text-muted-foreground">
            <span>
              {done.size}/{microHabits.length} habits · {xp} of {totalXp} XP
            </span>
            {done.size > 0 && (
              <button
                type="button"
                onClick={() => setDone(new Set())}
                className="inline-flex items-center gap-1 font-medium text-muted-foreground transition-colors hover:text-foreground"
              >
                <RotateCcw className="h-3 w-3" /> Reset
              </button>
            )}
          </div>
        </div>

        <AnimatePresence mode="wait">
          {complete ? (
            <motion.div
              key="complete"
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              className="relative mt-5 overflow-hidden rounded-xl border border-primary/30 bg-primary/10 p-4"
            >
              <div className="flex items-center gap-3">
                <span className="relative flex h-10 w-10 items-center justify-center rounded-full bg-primary/15">
                  <Trophy className="h-5 w-5 text-primary" />
                  <span className="animate-pulse-ring absolute inset-0 rounded-full" />
                </span>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">Day 1 cleared. Streak: 1 🔥</p>
                  <p className="text-xs text-muted-foreground">That's exactly how day 90 starts.</p>
                </div>
                <PartyPopper className="h-5 w-5 text-streak" />
              </div>
              <div aria-hidden className="pointer-events-none absolute inset-0">
                {[...Array(8)].map((_, index) => (
                  <motion.span
                    key={index}
                    className="absolute h-1.5 w-1.5 rounded-full bg-streak"
                    initial={{ opacity: 1, x: "50%", y: "50%", scale: 1 }}
                    animate={{
                      opacity: 0,
                      x: `${12 + index * 11}%`,
                      y: `${index % 2 === 0 ? 8 : 78}%`,
                      scale: 0.4,
                    }}
                    transition={{ duration: 0.9, delay: index * 0.03 }}
                  />
                ))}
              </div>
            </motion.div>
          ) : (
            <motion.p
              key="hint"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="mt-5 text-center text-[11px] text-muted-foreground"
            >
              Complete all three to see your first streak.
            </motion.p>
          )}
        </AnimatePresence>

        <Link
          to="/signup"
          className={`mt-5 flex w-full items-center justify-center gap-2 rounded-xl px-4 py-3 text-sm font-semibold transition-all ${
            complete
              ? "gradient-primary text-primary-foreground hover:opacity-90"
              : "border border-border text-foreground hover:bg-secondary"
          }`}
        >
          {complete ? "Make it real — start free" : "Save this as my Day 1"}
        </Link>
      </motion.div>
    </div>
  );
}
