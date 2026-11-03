import { useEffect, useMemo, useRef, useState } from "react";
import { Bell, BellOff, ChevronLeft, ChevronRight, Clock, Flame, Plus, Trash2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useMobileData } from "./useMobileData";
import { hourLabel, hourValueLabel, shiftISO, shortMonthDay, toISO, todayISO, weekOf } from "./date";
import { Sheet, WeekStrip } from "./shared";
import { cancelBlockReminders, reminderPermission, scheduleBlockReminders, syncUpcomingReminders } from "./reminders";

const SLOTS = Array.from({ length: 17 }, (_, index) => index + 6);
const HOUR_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];
const LABELS = ["Focus", "Work", "Study", "Health", "Learning"];

type Editing = { date: string; slot: number; hours: number; label: string; remind: boolean };

const clockTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const dayTitle = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "short", day: "numeric", month: "short" });

export const TimeScreen = ({
  onBack,
  onOpenCalendar,
  addSignal,
}: {
  onBack: () => void;
  onOpenCalendar: () => void;
  addSignal: number;
}) => {
  const { user } = useAuth();
  const userId = user?.id || "guest";
  const { time, setTimeCell, notify } = useMobileData();
  const [selected, setSelected] = useState(todayISO());
  const [editing, setEditing] = useState<Editing | null>(null);
  const [saving, setSaving] = useState(false);
  const [now, setNow] = useState(() => new Date());
  const [remindersOn, setRemindersOn] = useState(false);
  const gridRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    void reminderPermission(false).then(setRemindersOn);
  }, []);

  const today = todayISO();
  const currentHour = now.getHours();
  const entries = time?.entries || [];
  const week = useMemo(() => weekOf(selected), [selected]);
  const previousWeek = useMemo(() => weekOf(shiftISO(selected, -7)), [selected]);
  const selectedWeekSet = useMemo(() => new Set(week.map(toISO)), [week]);

  useEffect(() => {
    if (!time?.entries) return;
    void syncUpcomingReminders(userId, time.entries);
  }, [time?.entries, userId]);

  useEffect(() => {
    if (!selectedWeekSet.has(today) || currentHour < 6 || currentHour > 22) return;
    const timer = window.setTimeout(() => {
      gridRef.current?.querySelector(".hb-time-row.is-now")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 400);
    return () => window.clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (addSignal > 0) setEditing({ date: selected, slot: 9, hours: 1, label: "Focus", remind: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [addSignal]);

  const weekEntries = entries.filter((entry) => selectedWeekSet.has(entry.date));
  const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const prevWeekSet = useMemo(() => new Set(previousWeek.map(toISO)), [previousWeek]);
  const prevTotal = entries
    .filter((entry) => prevWeekSet.has(entry.date))
    .reduce((sum, entry) => sum + entry.hours, 0);
  const delta = prevTotal ? Math.round(((weekTotal - prevTotal) / prevTotal) * 100) : weekTotal ? 100 : 0;

  const cellEntries = (date: string, slot: number) =>
    entries.filter((entry) => entry.date === date && entry.slot === slot && entry.hours > 0);
  const cellHours = (date: string, slot: number) => cellEntries(date, slot).reduce((sum, entry) => sum + entry.hours, 0);

  const dayTotals = week.map((day) => {
    const iso = toISO(day);
    return { iso, hours: entries.filter((entry) => entry.date === iso).reduce((sum, entry) => sum + entry.hours, 0) };
  });
  const peak = Math.max(1, ...dayTotals.map((row) => row.hours));

  const selectedSessions = entries
    .filter((entry) => entry.date === selected && entry.hours > 0)
    .sort((a, b) => a.slot - b.slot);

  const liveBlock = entries
    .filter((entry) => entry.date === today && entry.hours > 0 && entry.slot <= currentHour && entry.slot + entry.hours > currentHour)
    .sort((a, b) => a.slot - b.slot)[0];

  const openEditor = (date: string, slot: number, hours: number, label: string) =>
    setEditing({ date, slot, hours, label, remind: true });

  const saveCell = async () => {
    if (!editing) return;
    setSaving(true);
    try {
      await setTimeCell({
        date: editing.date,
        slot: editing.slot,
        hours: editing.hours,
        label: editing.label.trim() || "Focus",
      });
      if (editing.hours <= 0) {
        await cancelBlockReminders(userId, editing.date, editing.slot);
        notify("Block cleared");
      } else if (editing.remind) {
        const result = await scheduleBlockReminders(
          userId,
          { date: editing.date, slot: editing.slot, hours: editing.hours, label: editing.label.trim() || "Focus" },
          true
        );
        void reminderPermission(false).then(setRemindersOn);
        notify(
          result.status === "scheduled"
            ? `Alarms set · ${result.at.map(clockTime).join(" & ")}`
            : result.status === "denied"
              ? "Block saved. Allow notifications to get alarms."
              : result.status === "unsupported"
                ? "Block saved. Alarms fire in the Android app."
                : result.status === "failed"
                  ? "Block saved, but the alarm could not be set."
                  : "Block saved. That time has already passed."
        );
      } else {
        await cancelBlockReminders(userId, editing.date, editing.slot);
        notify("Block saved without an alarm");
      }
      setEditing(null);
    } catch {
      // The data layer already shows the failure toast.
    } finally {
      setSaving(false);
    }
  };

  const removeSession = async (date: string, slot: number) => {
    await cancelBlockReminders(userId, date, slot);
    await setTimeCell({ date, slot, hours: 0 });
  };

  const endsLabel = editing ? hourValueLabel(editing.slot + editing.hours) : "";
  const startLabel = editing ? hourValueLabel(editing.slot) : "";

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

      <div className="hb-now-bar">
        <span className="hb-now-pill">
          <span className="hb-now-dot" />
          {clockTime(now)}
        </span>
        <span className="hb-now-text" key={liveBlock ? `${liveBlock.date}-${liveBlock.slot}` : "idle"}>
          {liveBlock ? (
            <>
              <strong>{liveBlock.label}</strong> until {hourValueLabel(liveBlock.slot + liveBlock.hours)}
            </>
          ) : (
            "Clock-aligned timetable · alarms set automatically"
          )}
        </span>
        <span className={`hb-now-flag ${remindersOn ? "is-on" : ""}`} title={remindersOn ? "Alarms allowed" : "Alarms not allowed"}>
          {remindersOn ? <Bell size={13} /> : <BellOff size={13} />}
        </span>
      </div>

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
          onClick={() => openEditor(selected, Math.min(22, Math.max(6, currentHour)), 1, "Focus")}
        >
          <Plus size={13} style={{ verticalAlign: "-2px" }} /> Time
        </button>
      </div>

      <div className="hb-grid-wrap" ref={gridRef}>
        <div className="hb-grid-head">
          <span />
          {week.map((day) => (
            <span key={toISO(day)}>{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
          ))}
        </div>
        {SLOTS.map((slot) => {
          const isNowRow = selectedWeekSet.has(today) && slot === currentHour;
          return (
            <div
              key={slot}
              className={`hb-time-row ${isNowRow ? "is-now" : ""}`}
              style={{ animationDelay: `${(slot - 6) * 24}ms` }}
            >
              <span className="hb-time-label">
                {isNowRow && <span className="hb-now-dot" />}
                {hourLabel(slot)}
              </span>
              {week.map((day) => {
                const iso = toISO(day);
                const rows = cellEntries(iso, slot);
                const hours = cellHours(iso, slot);
                const label = rows[0]?.label || "";
                const level = hours >= 3 ? "lvl-3" : hours >= 1.5 ? "lvl-2" : "";
                return (
                  <button
                    key={`${iso}-${slot}-${hours}`}
                    type="button"
                    className={`hb-cell ${hours ? `has-hours ${level}` : ""} ${iso === today ? "is-today" : ""} ${
                      iso === today && slot === currentHour ? "is-current" : ""
                    }`}
                    title={hours ? `${label} · ${hours}h` : "Add a time block"}
                    onClick={() => openEditor(iso, slot, hours || 1, label || "Focus")}
                  >
                    {hours ? (
                      <>
                        <span className="hb-cell-label">{label}</span>
                        <span className="hb-cell-hours">{hours}h</span>
                      </>
                    ) : (
                      "–"
                    )}
                  </button>
                );
              })}
            </div>
          );
        })}
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
                  {session.hours !== 1 ? ` – ${hourValueLabel(session.slot + session.hours)}` : ""}
                </strong>
                <span>
                  {session.hours}h logged · {session.date === today ? "today" : dayTitle(session.date)}
                </span>
              </div>
              <button
                type="button"
                className="hb-note-del"
                onClick={() => void removeSession(session.date, session.slot)}
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
          title={`${editing.date === today ? "Today" : dayTitle(editing.date)} · ${startLabel}${
            editing.hours > 0 ? ` – ${endsLabel}` : ""
          }`}
          onClose={() => setEditing(null)}
        >
          <span className="hb-sheet-label">Caption</span>
          <input
            className="hb-input"
            value={editing.label}
            maxLength={24}
            placeholder="What is this block?"
            onChange={(event) => setEditing({ ...editing, label: event.target.value })}
          />
          <div className="hb-options" style={{ marginTop: 8 }}>
            {LABELS.map((label) => (
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

          {editing.hours > 0 && (
            <button
              type="button"
              className={`hb-remind ${editing.remind ? "is-on" : ""}`}
              onClick={() => setEditing({ ...editing, remind: !editing.remind })}
              aria-pressed={editing.remind}
            >
              {editing.remind ? <Bell size={16} /> : <BellOff size={16} />}
              <span className="hb-remind-copy">
                <strong>Set alarms</strong>
                <span>
                  {startLabel}
                  {editing.hours >= 0.5 ? ` and ${endsLabel}` : ""} — text included in the alert
                </span>
              </span>
              <span className={`hb-toggle ${editing.remind ? "is-on" : ""}`} />
            </button>
          )}

          <button type="button" className="hb-btn-primary" disabled={saving} onClick={() => void saveCell()}>
            {saving
              ? "Saving…"
              : editing.hours === 0
                ? "Clear block"
                : editing.remind
                  ? `Save at ${startLabel} & set alarm`
                  : "Save time block"}
          </button>
        </Sheet>
      )}
    </div>
  );
};
