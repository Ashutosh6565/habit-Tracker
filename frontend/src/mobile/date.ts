import {
  addDays,
  addMonths,
  endOfMonth,
  endOfWeek,
  format,
  isSameMonth,
  parseISO,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";

export const toISO = (date: Date) => format(date, "yyyy-MM-dd");

export const todayISO = () => toISO(new Date());

export const fromISO = (iso: string) => parseISO(iso);

export const shiftISO = (iso: string, days: number) => toISO(addDays(fromISO(iso), days));

export const startOfWeekISO = (iso: string) => toISO(startOfWeek(fromISO(iso), { weekStartsOn: 1 }));

export const weekOf = (iso: string) => {
  const start = startOfWeek(fromISO(iso), { weekStartsOn: 1 });
  return Array.from({ length: 7 }, (_, index) => addDays(start, index));
};

export const lastNDays = (days: number, anchor = new Date()) =>
  Array.from({ length: days }, (_, index) => addDays(anchor, index - (days - 1)));

export const currentWeek = (anchor = new Date()) =>
  Array.from({ length: 7 }, (_, index) => addDays(startOfWeek(anchor, { weekStartsOn: 1 }), index));

export const monthCells = (cursor: Date) => {
  const first = startOfMonth(cursor);
  const last = endOfMonth(cursor);
  const gridStart = startOfWeek(first, { weekStartsOn: 1 });
  const gridEnd = endOfWeek(last, { weekStartsOn: 1 });
  const cells: { date: Date; inMonth: boolean }[] = [];
  for (let day = gridStart; day <= gridEnd; day = addDays(day, 1)) {
    cells.push({ date: day, inMonth: isSameMonth(day, cursor) });
  }
  return cells;
};

export const shiftMonth = (cursor: Date, delta: number) => addMonths(cursor, delta);

export const heatmapGrid = (weeks = 12) => {
  const currentWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 });
  const start = addDays(currentWeekStart, -(weeks - 1) * 7);
  return Array.from({ length: weeks }, (_, week) =>
    Array.from({ length: 7 }, (_, day) => addDays(start, week * 7 + day))
  );
};

export const previousMonth = (cursor: Date) => subMonths(cursor, 1);

export const dayShort = (date: Date) => format(date, "EEE");
export const dayLetter = (date: Date) => format(date, "EEEEE");
export const monthYear = (date: Date) => format(date, "MMMM yyyy");
export const shortMonthDay = (date: Date) => format(date, "d MMM");
export const longDate = (date: Date) => format(date, "EEE, d MMM yyyy");
export const clockLabel = (date: Date) => format(date, "h:mm a");
export const shortISO = (iso: string) => format(fromISO(iso), "d MMM");
export const monthDayISO = (iso: string) => format(fromISO(iso), "MMM d");

export const hourLabel = (slot: number) => {
  const suffix = slot < 12 ? "AM" : "PM";
  const hour = slot % 12 === 0 ? 12 : slot % 12;
  return `${hour}${suffix}`;
};

export const timeLabel = (value?: string | null) => {
  if (!value) return "";
  const [hours, minutes] = value.split(":").map(Number);
  const suffix = hours < 12 ? "AM" : "PM";
  const hour = hours % 12 === 0 ? 12 : hours % 12;
  return `${hour}:${String(minutes ?? 0).padStart(2, "0")} ${suffix}`;
};

export const initials = (name?: string | null) =>
  (name || "Habbiters")
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() || "")
    .join("");
