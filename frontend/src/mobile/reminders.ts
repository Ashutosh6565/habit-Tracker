import { Capacitor } from "@capacitor/core";
import { LocalNotifications } from "@capacitor/local-notifications";
import { hourValueLabel } from "./date";
import { readLocal, writeLocal } from "./localStore";

export type ReminderStatus = "scheduled" | "skipped" | "denied" | "unsupported" | "failed";
export type ReminderResult = { status: ReminderStatus; at: Date[] };

type Registry = Record<string, number[]>;
type UpcomingEntry = { date: string; slot: number; hours: number; label: string };

const REGISTRY_NAME = "reminders";
const native = () => Capacitor.isNativePlatform();
const webTimers = new Map<number, number>();

const keyFor = (date: string, slot: number) => `${date}#${slot}`;

const idFor = (date: string, slot: number, kind: 0 | 1) => {
  let hash = 2166136261;
  const seed = `${date}#${slot}#${kind}`;
  for (let index = 0; index < seed.length; index += 1) {
    hash ^= seed.charCodeAt(index);
    hash = Math.imul(hash, 16777619);
  }
  return ((hash >>> 0) % 2_000_000_000) + 1;
};

const readRegistry = (userId: string): Registry => readLocal<Registry>(userId, REGISTRY_NAME) ?? {};
const writeRegistry = (userId: string, registry: Registry) => writeLocal(userId, REGISTRY_NAME, registry);

const blockTimes = (date: string, slot: number, hours: number) => {
  const start = new Date(`${date}T00:00:00`);
  start.setHours(slot, 0, 0, 0);
  return { start, end: new Date(start.getTime() + Math.round(hours * 60) * 60_000) };
};

export const reminderPermission = async (request: boolean): Promise<boolean> => {
  if (native()) {
    try {
      const current = await LocalNotifications.checkPermissions();
      if (current.display === "granted") return true;
      if (!request) return false;
      const asked = await LocalNotifications.requestPermissions();
      return asked.display === "granted";
    } catch {
      return false;
    }
  }
  if (typeof Notification === "undefined") return false;
  if (Notification.permission === "granted") return true;
  if (!request) return false;
  try {
    return (await Notification.requestPermission()) === "granted";
  } catch {
    return false;
  }
};

const cancelIds = async (ids: number[]) => {
  for (const id of ids) {
    const timer = webTimers.get(id);
    if (timer) {
      window.clearTimeout(timer);
      webTimers.delete(id);
    }
  }
  if (!native() || ids.length === 0) return;
  try {
    await LocalNotifications.cancel({ notifications: ids.map((id) => ({ id })) });
  } catch {
    // Cancelling is best-effort.
  }
};

const showWebNotification = (title: string, body: string) => {
  try {
    new Notification(title, { body, tag: title });
  } catch {
    // Some browsers block constructor notifications outside a service worker.
  }
};

const scheduleWeb = (id: number, at: Date, title: string, body: string) => {
  const delay = at.getTime() - Date.now();
  if (delay <= 0 || delay > 7 * 24 * 60 * 60_000) return;
  const timer = window.setTimeout(() => {
    showWebNotification(title, body);
    webTimers.delete(id);
  }, delay);
  webTimers.set(id, timer);
};

export const cancelBlockReminders = async (userId: string, date: string, slot: number) => {
  const registry = readRegistry(userId);
  const key = keyFor(date, slot);
  const ids = registry[key];
  if (!ids) return;
  await cancelIds(ids);
  delete registry[key];
  writeRegistry(userId, registry);
};

export const scheduleBlockReminders = async (
  userId: string,
  entry: UpcomingEntry,
  requestPermission: boolean
): Promise<ReminderResult> => {
  const { start, end } = blockTimes(entry.date, entry.slot, entry.hours);
  const now = Date.now();
  const events = [
    {
      id: idFor(entry.date, entry.slot, 0),
      at: start,
      title: `${entry.label} starts now`,
      body: `Your ${hourValueLabel(entry.slot)}–${hourValueLabel(entry.slot + entry.hours)} block begins. ${
        entry.hours >= 1 ? `${entry.hours}h planned.` : "Small block, real progress."
      }`,
    },
    ...(entry.hours >= 0.5
      ? [
          {
            id: idFor(entry.date, entry.slot, 1),
            at: end,
            title: `${entry.label} wrapped up`,
            body: `Block finished. Log how it went and keep the streak alive.`,
          },
        ]
      : []),
  ].filter((event) => event.at.getTime() > now + 30_000);

  const key = keyFor(entry.date, entry.slot);
  const registry = readRegistry(userId);
  if (registry[key]) await cancelIds(registry[key]);
  delete registry[key];

  if (events.length === 0) {
    writeRegistry(userId, registry);
    return { status: "skipped", at: [] };
  }

  const allowed = await reminderPermission(requestPermission);
  if (!allowed) {
    writeRegistry(userId, registry);
    return { status: typeof Notification === "undefined" && !native() ? "unsupported" : "denied", at: [] };
  }

  try {
    if (native()) {
      await LocalNotifications.schedule({
        notifications: events.map((event) => ({
          id: event.id,
          title: event.title,
          body: event.body,
          schedule: { at: event.at, allowWhileIdle: true },
        })),
      });
    } else {
      events.forEach((event) => scheduleWeb(event.id, event.at, event.title, event.body));
    }
    registry[key] = events.map((event) => event.id);
    writeRegistry(userId, registry);
    return { status: "scheduled", at: events.map((event) => event.at) };
  } catch {
    return { status: "failed", at: [] };
  }
};

export const syncUpcomingReminders = async (userId: string, entries: UpcomingEntry[]) => {
  const allowed = await reminderPermission(false);
  if (!allowed) return;
  const registry = readRegistry(userId);
  const soon = entries
    .filter((entry) => {
      if (entry.hours <= 0) return false;
      const { start } = blockTimes(entry.date, entry.slot, entry.hours);
      const delta = start.getTime() - Date.now();
      return delta > 60_000 && delta < 36 * 60 * 60_000;
    })
    .slice(0, 10);
  for (const entry of soon) {
    if (registry[keyFor(entry.date, entry.slot)]) continue;
    try {
      await scheduleBlockReminders(userId, entry, false);
    } catch {
      // Never let reminder syncing interrupt the timetable.
    }
  }
};
