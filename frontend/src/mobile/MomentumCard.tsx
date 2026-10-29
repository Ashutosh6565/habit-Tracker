import { useState } from "react";
import { ChevronRight } from "lucide-react";
import type { MomentumBreakdown, MomentumDay, MomentumMove } from "./momentum";
import { Sheet } from "./shared";

const Meter = ({ label, value, hint }: { label: string; value: number | null; hint?: string }) => (
  <div className="hb-meter">
    <div className="hb-meter-head">
      <span>{label}</span>
      <strong>{value === null ? "No tasks" : `${value}%`}</strong>
    </div>
    <div className="hb-meter-track">
      <span className="hb-meter-fill" style={{ width: `${value ?? 0}%` }} />
    </div>
    {hint && <div className="hb-meter-hint">{hint}</div>}
  </div>
);

export const MomentumCard = ({
  breakdown,
  series,
  move,
  onOpenTime,
  onOpenTasks,
  onOpenTemplates,
}: {
  breakdown: MomentumBreakdown;
  series: MomentumDay[];
  move: MomentumMove;
  onOpenTime: () => void;
  onOpenTasks: () => void;
  onOpenTemplates: () => void;
}) => {
  const [open, setOpen] = useState(false);
  const yesterday = series.length > 1 ? series[series.length - 2] : undefined;
  const delta = yesterday ? breakdown.score - yesterday.score : 0;

  const go = (action: MomentumMove["action"]) => {
    setOpen(false);
    if (action === "time") onOpenTime();
    else if (action === "tasks") onOpenTasks();
    else if (action === "templates") onOpenTemplates();
  };

  return (
    <>
      <button
        type="button"
        className="hb-momentum"
        onClick={() => setOpen(true)}
        aria-label={`Momentum ${breakdown.score} out of 100. Next move: ${move.label}`}
      >
        <span className="hb-momentum-top">
          <span className="hb-momentum-scorebox">
            <span className="hb-kicker">Momentum</span>
            <span className="hb-momentum-score">
              {breakdown.score}
              <small>/100</small>
            </span>
            <span className="hb-momentum-label">{breakdown.label}</span>
          </span>
          <span className="hb-momentum-bars" aria-hidden="true">
            {series.map((day) => (
              <span
                key={day.date}
                className={`hb-momentum-bar ${day.isToday ? "is-today" : ""}`}
                style={{ height: `${Math.max(8, day.score)}%` }}
              />
            ))}
          </span>
        </span>
        <span className="hb-momentum-delta">
          {delta === 0
            ? "Habits + tasks + focus, in one score"
            : `${delta > 0 ? "↑" : "↓"} ${Math.abs(delta)} vs yesterday`}
        </span>
        <span className="hb-momentum-next">
          <span className="hb-momentum-next-label">Next move</span>
          <strong>{move.label}</strong>
          <ChevronRight size={14} />
        </span>
      </button>

      {open && (
        <Sheet title="Your momentum" onClose={() => setOpen(false)}>
          <div className="hb-momentum-sheet-score">
            {breakdown.score}
            <small>/100 · {breakdown.label}</small>
          </div>

          <Meter label="Habits" value={breakdown.habits} hint="Share of today's habits checked off" />
          <Meter
            label="Tasks"
            value={breakdown.tasks}
            hint={breakdown.tasks === null ? "No tasks scheduled today — this weight moves to habits and focus" : "Tasks completed today"}
          />
          <Meter label="Focus" value={breakdown.focus} hint="Targets two focused hours" />
          <Meter label="Streak" value={breakdown.streak} hint="Builds toward a 21-day best streak" />

          <p className="hb-momentum-note">
            One score that blends habits, tasks and focus hours — so a single missed checkbox never defines your day.
          </p>

          <button type="button" className="hb-btn-primary" onClick={() => go(move.action)}>
            {move.label}
          </button>
          <button type="button" className="hb-btn-ghost" onClick={() => setOpen(false)}>
            Close
          </button>
        </Sheet>
      )}
    </>
  );
};
