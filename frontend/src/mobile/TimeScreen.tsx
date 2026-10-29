import { useEffect, useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Clock, Flame, Plus, Trash2 } from "lucide-react";
import { useMobileData } from "./useMobileData";
import { hourLabel, shiftISO, shortMonthDay, toISO, todayISO, weekOf } from "./date";
import { Sheet, WeekStrip } from "./shared";

const SLOTS = Array.from({ length: 17 }, (_, index) => index + 6);
const HOUR_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];

export const TimeScreen = ({
  onBack,
  onOpenCalendar,
  addSignal,
}: {
  onBack: () => void;
  onOpenCalendar: () => void;
  addSignal: number;
}) => {
  const { time, setTimeCell } = useMobileData();
  const [selected, setSelected] = useState(todayISO());
  const [editing, setEditing] = useState<{ date: string; slot: number; hours: number; label: string } | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (addSignal > 0) setEditing({ date: selected, slot: 9, hours: 1, label: "Focus" });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSignal]);

  const entries = time?.entries || [];
  const week = useMemo(() => weekOf(selected), [selected]);
  const previousWeek = useMemo(() => weekOf(shiftISO(selected, -7)), [selected]);
  const today = todayISO();
  const selectedWeekSet = useMemo(() => new Set(week.map(toISO)), [week]);

  const weekEntries = entries.filter((entry) => selectedWeekSet.has(entry.date));
  const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const prevWeekSet = useMemo(() => new Set(previousWeek.map(toISO)), [previousWeek]);
  const prevTotal = entries
    .filter((entry) => prevWeekSet.has(entry.date))
    .reduce((sum, entry) => sum + entry.hours, 0);
  const delta = prevTotal ? Math.round(((weekTotal - prevTotal) / prevTotal) * 100) : weekTotal ? 100 : 0;

  const cellHours = (date: string, slot: number) =>
    entries.filter((entry) => entry.date === date && entry.slot === slot).reduce((sum, entry) => sum + entry.hours, 0);

  const dayTotals = week.map((day) => {
    const iso = toISO(day);
    return { iso, hours: entries.filter((entry) => entry.date === iso).reduce((sum, entry) => sum + entry.hours, 0) };
  });
  const peak = Math.max(1, ...dayTotals.map((row) => row.hours));

  const selectedSessions = entries
    .filter((entry) => entry.date === selected)
    .sort((a, b) => a.slot - b.slot);

  const saveCell = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await setTimeCell({
        date: editing.date,
        slot: editing.slot,
        hours: editing.hours,
        label: editing.label,
      });
      setEditing(null);
    } finally {
      setSaving(false);
    }
  };

  const removeSession = (date: string, slot: number) => {
    void setTimeCell({ date, slot, hours: 0 });
  };

  return (
    <div className="hb-screen">
      <div className="hb-page-head">
        <button type="button" className="hb-icon-btn" onClick={onBack} aria-label="Back">
          <ChevronLeft size={19} />
        </button>
        <div className="hb-title">Time Tracker</div>
        <button type="button" className="hb-icon-btn" onClick={onOpenCalendar} aria-label="Open calendar">
          <Clock size={17} />
        </button>
      </div>

      <WeekStrip days={week} selected={selected} onSelect={setSelected} />

      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "-6px 2px 12px" }}>
        <span className="hb-kicker">
          {shortMonthDay(week[0])} – {shortMonthDay(week[6])}
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            type="button"
            className="hb-icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={() => setSelected(shiftISO(selected, -7))}
            aria-label="Previous week"
          >
            <ChevronLeft size={15} />
          </button>
          <button
            type="button"
            className="hb-icon-btn"
            style={{ width: 28, height: 28 }}
            onClick={() => setSelected(shiftISO(selected, 7))}
            aria-label="Next week"
          >
            <ChevronRight size={15} />
          </button>
        </div>
      </div>

      <div className="hb-project">
        <div className="hb-project-icon">
          <Flame size={18} />
        </div>
        <div style={{ flex: 1 }}>
          <div className="hb-project-title">Focus blocks</div>
          <div className="hb-project-meta">
            <Flame size={11} /> {weekTotal.toFixed(1)}h logged this week
          </div>
        </div>
        <button
          type="button"
          className="hb-chip is-active"
          onClick={() => setEditing({ date: selected, slot: 9, hours: 1, label: "Focus" })}
        >
          <Plus size={13} style={{ verticalAlign: "-2px" }} /> Time
        </button>
      </div>

      <div className="hb-grid-wrap">
        <div className="hb-grid-head">
          <span />
          {week.map((day) => (
            <span key={toISO(day)}>{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
          ))}
        </div>
        {SLOTS.map((slot) => (
          <div key={slot} className="hb-time-row">
            <span className="hb-time-label">{hourLabel(slot)}</span>
            {week.map((day) => {
              const iso = toISO(day);
              const hours = cellHours(iso, slot);
              const level = hours >= 3 ? "lvl-3" : hours >= 1.5 ? "lvl-2" : "";
              return (
                <button
                  key={`${iso}-${slot}`}
                  type="button"
                  className={`hb-cell ${hours ? `has-hours ${level}` : ""} ${iso === today ? "is-today" : ""}`}
                  onClick={() => setEditing({ date: iso, slot, hours: hours || 1, label: "Focus" })}
                >
                  {hours ? hours : "–"}
                </button>
              );
            })}
          </div>
        ))}
      </div>

      <div className="hb-total">
        <div>
          <div className="hb-total-label">Weekly total</div>
          <div className="hb-total-value">
            {weekTotal.toFixed(1)}
            <em>h</em>
          </div>
        </div>
        <div className={`hb-total-delta ${delta < 0 ? "is-down" : ""}`}>
          {delta >= 0 ? "↑" : "↓"} {Math.abs(delta)}%
          <small>vs last week</small>
        </div>
        <div className="hb-bars" aria-hidden="true">
          {dayTotals.map((row) => (
            <span key={row.iso} style={{ height: `${Math.max(6, (row.hours / peak) * 100)}%` }} />
          ))}
        </div>
      </div>

      <div className="hb-panel">
        <div className="hb-panel-head">
          <Clock size={14} />
          <h4>{new Date(`${selected}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" })}</h4>
        </div>
        {selectedSessions.length === 0 ? (
          <div className="hb-muted" style={{ fontSize: 12, lineHeight: 1.6 }}>
            No time logged on this day. Tap any cell in the grid to add a block.
          </div>
        ) : (
          selectedSessions.map((session) => (
            <div key={session.id} className="hb-insight" style={{ borderBottom: "1px solid rgba(255,255,255,.05)" }}>
              <div className="hb-insight-icon" style={{ background: "rgba(139,108,246,.16)", color: "#a68bfa" }}>
                <Clock size={14} />
              </div>
              <div style={{ flex: 1 }}>
                <strong>
                  {session.label} · {hourLabel(session.slot)}
                </strong>
                <span>{session.hours}h logged</span>
              </div>
              <button
                type="button"
                className="hb-note-del"
                onClick={() => removeSession(session.date, session.slot)}
                aria-label="Remove time block"
              >
                <Trash2 size={14} />
              </button>
            </div>
          ))
        )}
      </div>

      {editing && (
        <Sheet
          title={`${
            editing.date === today
              ? "Today"
              : new Date(`${editing.date}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" })
          } · ${hourLabel(editing.slot)}`}
          onClose={() => setEditing(null)}
        >
          <span className="hb-sheet-label">Hours</span>
          <div className="hb-options">
            {HOUR_OPTIONS.map((hours) => (
              <button
                key={hours}
                type="button"
                className={`hb-option ${editing.hours === hours ? "is-active" : ""}`}
                onClick={() => setEditing({ ...editing, hours })}
              >
                {hours === 0 ? "Clear" : `${hours}h`}
              </button>
            ))}
          </div>
          <span className="hb-sheet-label">Label</span>
          <div className="hb-options">
            {["Focus", "Work", "Study", "Health", "Learning"].map((label) => (
              <button
                key={label}
                type="button"
                className={`hb-option ${editing.label === label ? "is-active" : ""}`}
                onClick={() => setEditing({ ...editing, label })}
              >
                {label}
              </button>
            ))}
          </div>
          <button type="button" className="hb-btn-primary" disabled={saving} onClick={() => void saveCell()}>
            {saving ? "Saving…" : editing.hours === 0 ? "Clear block" : "Save time block"}
          </button>
        </Sheet>
      )}
    </div>
  );
};
