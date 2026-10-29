import type { ReactNode } from "react";
import { Check, X } from "lucide-react";
import { dayLetter, dayShort, todayISO, toISO } from "./date";

export const toneClass: Record<string, string> = {
  Health: "health",
  Fitness: "fitness",
  Study: "study",
  Work: "work",
  Personal: "personal",
  Finance: "finance",
};

export const CategoryPill = ({ category }: { category: string }) => (
  <span className={`hb-cat ${toneClass[category] || "personal"}`}>{category}</span>
);

export const Ring = ({
  value,
  display,
  label,
  tone,
  onClick,
  ariaLabel,
}: {
  value: number;
  display: string;
  label: string;
  tone: "green" | "purple" | "coral" | "blue";
  onClick?: () => void;
  ariaLabel?: string;
}) => {
  const radius = 27;
  const circumference = 2 * Math.PI * radius;
  const clamped = Math.max(0, Math.min(1, value));
  const content = (
    <>
      <div className="hb-ring-visual">
        <svg viewBox="0 0 64 64" aria-hidden="true">
          <circle className="hb-ring-track" cx="32" cy="32" r={radius} fill="none" strokeWidth="5" />
          <circle
            cx="32"
            cy="32"
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth="5"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={circumference * (1 - clamped)}
          />
        </svg>
        <span className="hb-ring-value">{display}</span>
      </div>
      <span className="hb-ring-label">{label}</span>
    </>
  );

  if (!onClick) {
    return <div className={`hb-ring is-${tone}`}>{content}</div>;
  }

  return (
    <button type="button" className={`hb-ring is-${tone}`} onClick={onClick} aria-label={ariaLabel || label}>
      {content}
    </button>
  );
};

export const WeekStrip = ({
  days,
  marks,
  selected,
  onSelect,
}: {
  days: Date[];
  marks?: Set<string>;
  selected?: string;
  onSelect?: (iso: string) => void;
}) => {
  const today = todayISO();
  return (
    <div className="hb-week">
      {days.map((day) => {
        const iso = toISO(day);
        const classes = [
          "hb-day",
          iso === today ? "is-today" : "",
          marks?.has(iso) ? "is-done" : "",
        ]
          .filter(Boolean)
          .join(" ");
        return (
          <button
            key={iso}
            type="button"
            className={classes}
            style={selected === iso && iso !== today ? { borderColor: "rgba(93,234,107,.45)" } : undefined}
            onClick={() => onSelect?.(iso)}
          >
            <span>{dayShort(day)}</span>
            <strong>{day.getDate()}</strong>
          </button>
        );
      })}
    </div>
  );
};

export const Sheet = ({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
}) => (
  <div className="hb-sheet-backdrop" onClick={onClose} role="presentation">
    <div className="hb-sheet" onClick={(event) => event.stopPropagation()} role="dialog" aria-label={title}>
      <div className="hb-sheet-grab" />
      <h3>{title}</h3>
      {children}
    </div>
  </div>
);

export const SheetClose = ({ onClose }: { onClose: () => void }) => (
  <button type="button" className="hb-icon-btn" onClick={onClose} aria-label="Close">
    <X size={18} />
  </button>
);

export const CheckMark = ({ checked }: { checked: boolean }) => (
  <span className={`hb-task-check ${checked ? "is-on" : ""}`}>
    <Check size={12} strokeWidth={3} />
  </span>
);

export const DotRow = ({
  days,
  completed,
  todayIso,
}: {
  days: Date[];
  completed: Set<string>;
  todayIso: string;
}) => (
  <>
    <div className="hb-dots">
      {days.map((day) => {
        const iso = toISO(day);
        const done = completed.has(iso);
        return (
          <span key={iso} className={`hb-dot ${done ? "is-done" : ""} ${iso === todayIso && !done ? "is-today-void" : ""}`}>
            {done ? <Check size={8} strokeWidth={4} /> : null}
          </span>
        );
      })}
    </div>
    <div className="hb-dot-labels">
      {days.map((day) => (
        <span key={toISO(day)}>{dayLetter(day)}</span>
      ))}
    </div>
  </>
);

export const Loading = ({ label = "Loading your day" }: { label?: string }) => (
  <div className="hb-loading">
    <span className="hb-spinner" />
    {label}
  </div>
);

export const MB_CATEGORIES = ["Health", "Fitness", "Study", "Work", "Personal", "Finance"] as const;

export const MB_ICONS = ["🎯", "🏃", "📚", "💧", "🧘", "🧠", "💪", "✍️", "🌙", "🥗", "💻", "🎸"];

export const toTone = (category: string) => toneClass[category] || "personal";
