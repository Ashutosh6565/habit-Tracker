import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import {
  Bell,
  BellOff,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Clock3,
  Flame,
  Loader2,
  Plus,
  Trash2,
  WifiOff,
  X,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, type PlannerTimeEntryDto } from "@/lib/api";
import { hourLabel, hourValueLabel, shiftISO, shortMonthDay, toISO, todayISO, weekOf } from "@/mobile/date";
import { readLocal, writeLocal } from "@/mobile/localStore";

const SLOTS = Array.from({ length: 17 }, (_, index) => index + 6);
const HOUR_OPTIONS = [0, 0.5, 1, 1.5, 2, 2.5, 3, 4, 5, 6];
const LABELS = ["Focus", "Work", "Study", "Health", "Learning"];
const START_HOUR = 6;
const END_HOUR = 22;

type Editor = { date: string; slot: number; hours: number; label: string; remind: boolean };
type PendingCell = { date: string; slot: number; hours: number; label: string };
type PendingMap = Record<string, PendingCell>;

const cellKey = (date: string, slot: number) => `${date}|${slot}`;
const clockTime = (date: Date) => date.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });
const dayTitle = (iso: string) =>
  new Date(`${iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "long", day: "numeric", month: "short" });

const Planner = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const reduced = useReducedMotion();
  const userId = user?.id || "guest";

  const [entries, setEntries] = useState<PlannerTimeEntryDto[]>(() => readLocal<PlannerTimeEntryDto[]>(userId, "timeEntries") || []);
  const [reminders, setReminders] = useState<Record<string, boolean>>(() => readLocal<Record<string, boolean>>(userId, "timeReminders") || {});
  const [pendingCount, setPendingCount] = useState(() => Object.keys(readLocal<PendingMap>(userId, "timePending") || {}).length);
  const [selected, setSelected] = useState(todayISO());
  const [now, setNow] = useState(() => new Date());
  const [editing, setEditing] = useState<Editor | null>(null);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(Boolean(user));
  const [offline, setOffline] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission | "unsupported">(() =>
    typeof Notification === "undefined" ? "unsupported" : Notification.permission
  );
  const gridRef = useRef<HTMLDivElement>(null);
  const firedRef = useRef<Record<string, string>>(readLocal<Record<string, string>>(userId, "timeFired") || {});

  const today = todayISO();
  const currentHour = now.getHours();
  const week = useMemo(() => weekOf(selected), [selected]);
  const weekIsos = useMemo(() => week.map(toISO), [week]);
  const weekSet = useMemo(() => new Set(weekIsos), [weekIsos]);
  const previousWeek = useMemo(() => weekOf(shiftISO(selected, -7)), [selected]);
  const previousSet = useMemo(() => new Set(previousWeek.map(toISO)), [previousWeek]);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(new Date()), 30_000);
    return () => window.clearInterval(timer);
  }, []);

  useEffect(() => {
    writeLocal(userId, "timeEntries", entries);
  }, [entries, userId]);

  useEffect(() => {
    writeLocal(userId, "timeReminders", reminders);
  }, [reminders, userId]);

  const flushPending = useCallback(async () => {
    if (!user) return;
    const queue = readLocal<PendingMap>(userId, "timePending") || {};
    const keys = Object.keys(queue);
    if (keys.length === 0) return;
    const remaining: PendingMap = {};
    for (const key of keys) {
      const cell = queue[key];
      try {
        const result = await api.planner.setTimeCell(cell);
        setEntries((prev) => {
          const without = prev.filter((entry) => !(entry.date === cell.date && entry.slot === cell.slot));
          return cell.hours > 0 && result.entry ? [...without, result.entry] : without;
        });
      } catch {
        remaining[key] = cell;
      }
    }
    writeLocal(userId, "timePending", remaining);
    setPendingCount(Object.keys(remaining).length);
    if (Object.keys(remaining).length === 0) setOffline(false);
  }, [user, userId]);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    (async () => {
      setLoading(true);
      const from = shiftISO(todayISO(), -56);
      const to = shiftISO(todayISO(), 84);
      try {
        const data = await api.planner.time(from, to);
        if (cancelled) return;
        const queue = readLocal<PendingMap>(userId, "timePending") || {};
        const pendingEntries = Object.values(queue).map<PlannerTimeEntryDto>((cell) => ({
          id: `local-${cellKey(cell.date, cell.slot)}`,
          habitId: null,
          label: cell.label,
          date: cell.date,
          slot: cell.slot,
          hours: cell.hours,
        }));
        setEntries((prev) => {
          const outside = prev.filter((entry) => entry.date < from || entry.date > to);
          const server = data.entries.filter(
            (entry) => !queue[cellKey(entry.date, entry.slot)]
          );
          return [...outside, ...server, ...pendingEntries];
        });
        setOffline(false);
        void flushPending();
      } catch {
        if (!cancelled) setOffline(true);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, userId, flushPending]);

  useEffect(() => {
    if (!weekSet.has(today) || currentHour < START_HOUR || currentHour > END_HOUR) return;
    const timer = window.setTimeout(() => {
      gridRef.current?.querySelector(".web-time-row.is-now")?.scrollIntoView({ block: "center", behavior: "smooth" });
    }, 450);
    return () => window.clearTimeout(timer);
  }, [selected, weekSet, today, currentHour]);

  useEffect(() => {
    const check = () => {
      const moment = new Date();
      const iso = toISO(moment);
      const minutes = moment.getHours() * 60 + moment.getMinutes();
      let changed = false;
      entries.forEach((entry) => {
        if (entry.date !== iso || entry.hours <= 0) return;
        if (!reminders[cellKey(entry.date, entry.slot)]) return;
        const start = entry.slot * 60;
        const end = start + Math.round(entry.hours * 60);
        const checks = [
          {
            key: `${cellKey(entry.date, entry.slot)}:start`,
            at: start,
            title: `${entry.label} starts now`,
            body: `Your ${entry.label} block runs until ${hourValueLabel(entry.slot + entry.hours)}.`,
          },
          {
            key: `${cellKey(entry.date, entry.slot)}:end`,
            at: end,
            title: `${entry.label} block complete`,
            body: `You planned ${entry.hours}h. Log the win and move to the next block.`,
          },
        ];
        checks.forEach(({ key, at, title, body }) => {
          if (minutes < at || minutes >= at + 1) return;
          if (firedRef.current[key] === iso) return;
          firedRef.current[key] = iso;
          changed = true;
          toast({ title, description: body });
          if (typeof Notification !== "undefined" && Notification.permission === "granted") {
            try {
              new Notification(title, { body, tag: key });
            } catch {
              // Notification can fail on locked-down browsers; the in-app toast still fires.
            }
          }
        });
      });
      if (changed) writeLocal(userId, "timeFired", firedRef.current);
    };
    check();
    const timer = window.setInterval(check, 30_000);
    return () => window.clearInterval(timer);
  }, [entries, reminders, toast, userId]);

  const weekEntries = entries.filter((entry) => weekSet.has(entry.date));
  const weekTotal = weekEntries.reduce((sum, entry) => sum + entry.hours, 0);
  const previousTotal = entries
    .filter((entry) => previousSet.has(entry.date))
    .reduce((sum, entry) => sum + entry.hours, 0);
  const delta = previousTotal ? Math.round(((weekTotal - previousTotal) / previousTotal) * 100) : weekTotal ? 100 : 0;

  const cellHours = (date: string, slot: number) =>
    entries
      .filter((entry) => entry.date === date && entry.slot === slot && entry.hours > 0)
      .reduce((sum, entry) => sum + entry.hours, 0);
  const cellLabel = (date: string, slot: number) =>
    entries.find((entry) => entry.date === date && entry.slot === slot && entry.hours > 0)?.label || "";

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

  const alarmCount = weekEntries.filter((entry) => entry.hours > 0 && reminders[cellKey(entry.date, entry.slot)]).length;

  const openEditor = (date: string, slot: number, hours: number, label: string) =>
    setEditing({ date, slot, hours, label, remind: reminders[cellKey(date, slot)] ?? true });

  const askPermission = async () => {
    if (typeof Notification === "undefined") {
      toast({ title: "Browser alarms unavailable", description: "This browser does not support notifications. In-tab alerts still work." });
      return;
    }
    const result = await Notification.requestPermission();
    setPermission(result);
    toast({
      title: result === "granted" ? "Alarms enabled" : "Alarms not enabled",
      description:
        result === "granted"
          ? "Start and end alarms will include the block caption."
          : "Allow notifications in your browser settings to get alarms when the tab is in the background.",
    });
  };

  const saveCell = async () => {
    if (!editing) return;
    const label = editing.label.trim() || "Focus";
    const hours = editing.hours;
    const key = cellKey(editing.date, editing.slot);
    const existing = entries.find((entry) => entry.date === editing.date && entry.slot === editing.slot);
    const optimistic: PlannerTimeEntryDto = {
      id: existing?.id || `local-${key}`,
      habitId: existing?.habitId ?? null,
      label,
      date: editing.date,
      slot: editing.slot,
      hours,
    };

    setSaving(true);
    setEntries((prev) => [
      ...prev.filter((entry) => !(entry.date === editing.date && entry.slot === editing.slot)),
      ...(hours > 0 ? [optimistic] : []),
    ]);
    setReminders((prev) => ({ ...prev, [key]: hours > 0 && editing.remind }));

    if (user) {
      const queue = readLocal<PendingMap>(userId, "timePending") || {};
      queue[key] = { date: editing.date, slot: editing.slot, hours, label };
      writeLocal(userId, "timePending", queue);
      setPendingCount(Object.keys(queue).length);
      try {
        const result = await api.planner.setTimeCell({ date: editing.date, slot: editing.slot, hours, label });
        setEntries((prev) => {
          const without = prev.filter((entry) => !(entry.date === editing.date && entry.slot === editing.slot));
          return hours > 0 && result.entry ? [...without, result.entry] : without;
        });
        const currentQueue = readLocal<PendingMap>(userId, "timePending") || {};
        delete currentQueue[key];
        writeLocal(userId, "timePending", currentQueue);
        setPendingCount(Object.keys(currentQueue).length);
        setOffline(false);
      } catch {
        setOffline(true);
        toast({ title: "Saved on this device", description: "The API did not respond. This block will sync automatically." });
      }
    }

    if (hours > 0 && editing.remind) {
      toast({
        title: "Alarms set",
        description:
          `${hourValueLabel(editing.slot)}${hours >= 0.5 ? ` and ${hourValueLabel(editing.slot + hours)}` : ""} — the alert includes “${label}”.` +
          (permission === "granted" ? "" : " Allow notifications to hear them outside this tab."),
      });
    }
    setSaving(false);
    setEditing(null);
  };

  const removeSession = async (entry: PlannerTimeEntryDto) => {
    const key = cellKey(entry.date, entry.slot);
    setEntries((prev) => prev.filter((item) => !(item.date === entry.date && item.slot === entry.slot)));
    setReminders((prev) => ({ ...prev, [key]: false }));
    if (!user) return;
    const queue = readLocal<PendingMap>(userId, "timePending") || {};
    queue[key] = { date: entry.date, slot: entry.slot, hours: 0, label: entry.label };
    writeLocal(userId, "timePending", queue);
    setPendingCount(Object.keys(queue).length);
    try {
      await api.planner.setTimeCell({ date: entry.date, slot: entry.slot, hours: 0, label: entry.label });
      const currentQueue = readLocal<PendingMap>(userId, "timePending") || {};
      delete currentQueue[key];
      writeLocal(userId, "timePending", currentQueue);
      setPendingCount(Object.keys(currentQueue).length);
    } catch {
      setOffline(true);
    }
  };

  const startLabel = editing ? hourValueLabel(editing.slot) : "";
  const endLabel = editing ? hourValueLabel(editing.slot + editing.hours) : "";

  if (loading && entries.length === 0) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="px-4 pb-16 pt-24">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            initial={reduced ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mb-7 flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between"
          >
            <div>
              <span className="sticker-chip border-primary/30 bg-primary/10 text-primary">
                <Clock3 className="h-3.5 w-3.5" /> Clock-aligned timetable
              </span>
              <h1 className="mt-4 font-display text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
                Your day, aligned to the <span className="text-gradient-primary">clock</span>.
              </h1>
              <p className="mt-3 max-w-2xl text-muted-foreground">
                Log time blocks with captions, see the current hour light up, and get an alarm when each block starts and ends.
                Blocks save on this device first, then sync.
              </p>
            </div>

            <div className="web-now-banner">
              <span className="web-live-dot" />
              <span className="font-display text-lg font-bold text-foreground">{clockTime(now)}</span>
              <span className="text-sm text-muted-foreground">
                {liveBlock ? (
                  <>
                    <strong className="text-foreground">{liveBlock.label}</strong> until {hourValueLabel(liveBlock.slot + liveBlock.hours)}
                  </>
                ) : (
                  "No block running right now"
                )}
              </span>
              <button
                type="button"
                onClick={askPermission}
                className={`web-alarm-toggle ${permission === "granted" ? "is-on" : ""}`}
                title={permission === "granted" ? "Browser alarms allowed" : "Enable browser alarms"}
              >
                {permission === "granted" ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                {permission === "granted" ? "Alarms on" : permission === "unsupported" ? "In-app alerts" : "Enable alarms"}
              </button>
            </div>
          </motion.div>

          {offline && (
            <div className="mb-5 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm">
              <WifiOff className="h-4 w-4 text-accent" />
              Offline — blocks are saved on this device
              {pendingCount > 0 ? ` (${pendingCount} waiting to sync)` : ""}. They will sync when the API responds.
            </div>
          )}

          <div className="mb-5 grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            <SummaryTile icon={Flame} label="Logged this week" value={`${weekTotal.toFixed(1)}h`} />
            <SummaryTile
              icon={Clock3}
              label="vs last week"
              value={`${delta >= 0 ? "+" : ""}${delta}%`}
              tone={delta < 0 ? "warning" : "default"}
            />
            <SummaryTile icon={CalendarDays} label="Blocks this week" value={`${weekEntries.filter((e) => e.hours > 0).length}`} />
            <SummaryTile icon={Bell} label="Alarms set" value={`${alarmCount}`} />
          </div>

          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-2">
              <button type="button" className="web-icon-btn" onClick={() => setSelected(shiftISO(selected, -7))} aria-label="Previous week">
                <ChevronLeft className="h-4 w-4" />
              </button>
              <span className="min-w-[9.5rem] text-center text-sm font-semibold text-foreground">
                {shortMonthDay(week[0])} – {shortMonthDay(week[6])}
              </span>
              <button type="button" className="web-icon-btn" onClick={() => setSelected(shiftISO(selected, 7))} aria-label="Next week">
                <ChevronRight className="h-4 w-4" />
              </button>
              <button
                type="button"
                onClick={() => setSelected(todayISO())}
                className="ml-1 rounded-lg border border-border bg-card px-3 py-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
              >
                Today
              </button>
            </div>
            <button
              type="button"
              onClick={() => openEditor(selected, Math.min(END_HOUR, Math.max(START_HOUR, currentHour)), 1, "Focus")}
              className="inline-flex items-center gap-2 rounded-xl gradient-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
            >
              <Plus className="h-4 w-4" /> Add time block
            </button>
          </div>

          <div ref={gridRef} className="web-grid-card">
            <div className="min-w-[720px]">
              <div className="web-time-row web-time-head">
                <span />
                {week.map((day) => {
                  const iso = toISO(day);
                  return (
                    <button
                      key={iso}
                      type="button"
                      onClick={() => setSelected(iso)}
                      className={`web-day-head ${iso === today ? "is-today" : ""} ${iso === selected ? "is-selected" : ""}`}
                    >
                      <span>{day.toLocaleDateString("en-US", { weekday: "short" })}</span>
                      <strong>{day.getDate()}</strong>
                    </button>
                  );
                })}
              </div>

              {SLOTS.map((slot) => {
                const isNowRow = weekSet.has(today) && slot === currentHour;
                return (
                  <div key={slot} className={`web-time-row ${isNowRow ? "is-now" : ""}`}>
                    <span className="web-time-label">
                      {isNowRow && <span className="web-live-dot" />}
                      {hourLabel(slot)}
                    </span>
                    {week.map((day) => {
                      const iso = toISO(day);
                      const hours = cellHours(iso, slot);
                      const label = cellLabel(iso, slot);
                      const level = hours >= 3 ? "lvl-3" : hours >= 1.5 ? "lvl-2" : hours > 0 ? "lvl-1" : "";
                      return (
                        <button
                          key={`${iso}-${slot}-${hours}`}
                          type="button"
                          onClick={() => openEditor(iso, slot, hours || 1, label || "Focus")}
                          className={`web-time-cell ${hours > 0 ? `has-hours ${level}` : ""} ${
                            iso === today ? "is-today" : ""
                          } ${iso === today && slot === currentHour ? "is-current" : ""}`}
                          title={hours > 0 ? `${label} · ${hours}h` : "Add a time block"}
                          aria-label={
                            hours > 0
                              ? `${dayTitle(iso)} ${hourLabel(slot)}: ${label}, ${hours} hours`
                              : `Add a time block on ${dayTitle(iso)} at ${hourLabel(slot)}`
                          }
                        >
                          {hours > 0 ? (
                            <>
                              <span className="web-time-caption">{label}</span>
                              <span className="web-time-hours">{hours}h</span>
                            </>
                          ) : (
                            <span className="text-muted-foreground/40">–</span>
                          )}
                        </button>
                      );
                    })}
                  </div>
                );
              })}
            </div>
          </div>

          <div className="mt-4 grid gap-4 lg:grid-cols-[1.6fr_1fr]">
            <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm">
              <div className="mb-3 flex items-center justify-between">
                <h2 className="font-display text-base font-bold text-foreground">
                  {dayTitle(selected)} <span className="ml-1 text-xs font-medium text-muted-foreground">captions shown in every cell</span>
                </h2>
                <span className="text-xs font-semibold text-primary">
                  {selectedSessions.reduce((sum, entry) => sum + entry.hours, 0).toFixed(1)}h
                </span>
              </div>
              {selectedSessions.length === 0 ? (
                <p className="text-sm text-muted-foreground">No time logged. Tap any cell in the grid to add a block.</p>
              ) : (
                <div className="space-y-2">
                  {selectedSessions.map((entry) => (
                    <div key={entry.id} className="flex items-center gap-3 rounded-xl border border-border/60 bg-secondary/30 px-3 py-2.5">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                        <Clock3 className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="truncate text-sm font-semibold text-foreground">
                          {entry.label} · {hourLabel(entry.slot)}
                          {entry.hours !== 1 ? ` – ${hourValueLabel(entry.slot + entry.hours)}` : ""}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {entry.hours}h logged{reminders[cellKey(entry.date, entry.slot)] ? " · alarm on" : ""}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void removeSession(entry)}
                        className="rounded-lg p-2 text-muted-foreground transition-colors hover:bg-destructive/10 hover:text-destructive"
                        aria-label={`Remove ${entry.label} block`}
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm">
              <h2 className="font-display text-base font-bold text-foreground">Daily load</h2>
              <div className="mt-4 flex h-28 items-end gap-2">
                {dayTotals.map((row) => (
                  <div key={row.iso} className="flex flex-1 flex-col items-center gap-1">
                    <span
                      className={`web-load-bar ${row.iso === today ? "is-today" : ""}`}
                      style={{ height: `${Math.max(6, (row.hours / peak) * 100)}%` }}
                      title={`${row.hours}h`}
                    />
                    <span className="text-[10px] uppercase text-muted-foreground">
                      {new Date(`${row.iso}T12:00:00`).toLocaleDateString("en-US", { weekday: "narrow" })}
                    </span>
                  </div>
                ))}
              </div>
              <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                {permission === "granted"
                  ? "Browser alarms are on. Keep a Habbiters tab open (the Android app also fires them in the background)."
                  : "Allow notifications to get start and end alarms with your caption text."}
              </p>
            </div>
          </div>
        </div>
      </main>

      <AnimatePresence>
        {editing && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] flex items-end justify-center bg-black/50 p-0 backdrop-blur-sm sm:items-center sm:p-4"
            onClick={() => setEditing(null)}
          >
            <motion.div
              initial={reduced ? false : { opacity: 0, y: 30, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={reduced ? { opacity: 0 } : { opacity: 0, y: 20, scale: 0.98 }}
              transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
              className="web-sheet w-full max-w-lg"
              onClick={(event) => event.stopPropagation()}
              role="dialog"
              aria-modal="true"
              aria-label="Time block editor"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">Time block</p>
                  <h2 className="mt-1 font-display text-xl font-bold text-foreground">
                    {editing.date === today ? "Today" : dayTitle(editing.date)} · {startLabel}
                    {editing.hours > 0 ? ` – ${endLabel}` : ""}
                  </h2>
                </div>
                <button type="button" onClick={() => setEditing(null)} className="web-icon-btn" aria-label="Close">
                  <X className="h-4 w-4" />
                </button>
              </div>

              <label className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground" htmlFor="block-caption">
                Caption
              </label>
              <input
                id="block-caption"
                value={editing.label}
                maxLength={24}
                placeholder="What is this block?"
                onChange={(event) => setEditing({ ...editing, label: event.target.value })}
                className="mt-2 h-11 w-full rounded-xl border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
              />
              <div className="mt-2 flex flex-wrap gap-2">
                {LABELS.map((label) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setEditing({ ...editing, label })}
                    className={`rounded-full border px-3 py-1.5 text-xs font-semibold transition-colors ${
                      editing.label === label
                        ? "border-primary bg-primary/10 text-primary"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>

              <span className="mt-5 block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Hours</span>
              <div className="mt-2 flex flex-wrap gap-2">
                {HOUR_OPTIONS.map((hours) => (
                  <button
                    key={hours}
                    type="button"
                    onClick={() => setEditing({ ...editing, hours })}
                    className={`rounded-xl border px-3 py-2 text-xs font-semibold transition-colors ${
                      editing.hours === hours
                        ? "border-primary bg-primary text-primary-foreground"
                        : "border-border text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {hours === 0 ? "Clear" : `${hours}h`}
                  </button>
                ))}
              </div>

              {editing.hours > 0 && (
                <button
                  type="button"
                  onClick={() => setEditing({ ...editing, remind: !editing.remind })}
                  className={`mt-5 flex w-full items-center gap-3 rounded-xl border px-4 py-3 text-left transition-colors ${
                    editing.remind ? "border-primary/40 bg-primary/5" : "border-border"
                  }`}
                  aria-pressed={editing.remind}
                >
                  <span className={`flex h-9 w-9 items-center justify-center rounded-lg ${editing.remind ? "bg-primary/15 text-primary" : "bg-secondary text-muted-foreground"}`}>
                    {editing.remind ? <Bell className="h-4 w-4" /> : <BellOff className="h-4 w-4" />}
                  </span>
                  <span className="flex-1">
                    <strong className="block text-sm font-semibold text-foreground">Set start &amp; end alarms</strong>
                    <span className="text-xs text-muted-foreground">
                      {startLabel} and {endLabel} — the caption “{editing.label.trim() || "Focus"}” is included.
                    </span>
                  </span>
                  <span className={`web-switch ${editing.remind ? "is-on" : ""}`} aria-hidden="true" />
                </button>
              )}

              <div className="mt-6 flex gap-2">
                <button
                  type="button"
                  onClick={() => setEditing(null)}
                  className="h-11 flex-1 rounded-xl border border-border text-sm font-semibold text-muted-foreground transition-colors hover:text-foreground"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => void saveCell()}
                  disabled={saving}
                  className="h-11 flex-[1.6] rounded-xl gradient-primary text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60"
                >
                  {saving
                    ? "Saving…"
                    : editing.hours === 0
                      ? "Clear block"
                      : editing.remind
                        ? `Save at ${startLabel} & set alarms`
                        : "Save time block"}
                </button>
              </div>

              <p className="mt-3 text-center text-[11px] text-muted-foreground">
                Saved on this device first. The API syncs in the background.
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const SummaryTile = ({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: typeof Flame;
  label: string;
  value: string;
  tone?: "default" | "warning";
}) => (
  <div className="rounded-2xl border border-border/70 bg-card/75 p-4 backdrop-blur-sm">
    <div className="flex items-center justify-between">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <Icon className={`h-4 w-4 ${tone === "warning" ? "text-accent" : "text-primary"}`} />
    </div>
    <p className="mt-2 font-display text-2xl font-bold text-foreground">{value}</p>
  </div>
);

export default Planner;
