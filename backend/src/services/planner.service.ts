import { format, subDays } from "date-fns";
import { Task } from "../models/Task";
import { Note } from "../models/Note";
import { TimeEntry } from "../models/TimeEntry";
import { AppError } from "../utils/AppError";

const today = () => format(new Date(), "yyyy-MM-dd");

const dateRange = (from?: string, to?: string) => ({
  from: from || format(subDays(new Date(), 29), "yyyy-MM-dd"),
  to: to || today(),
});

const serializeTask = (row: {
  _id: unknown;
  title: string;
  category: string;
  date: string;
  time: string;
  completed: boolean;
  createdAt: Date;
}) => ({
  id: String(row._id),
  title: row.title,
  category: row.category,
  date: row.date,
  time: row.time,
  completed: row.completed,
  createdAt: row.createdAt.toISOString(),
});

const serializeNote = (row: { _id: unknown; text: string; date: string; time: string; createdAt: Date }) => ({
  id: String(row._id),
  text: row.text,
  date: row.date,
  time: row.time,
  createdAt: row.createdAt.toISOString(),
});

const serializeEntry = (row: {
  _id: unknown;
  habit?: { toString(): string } | null;
  label: string;
  date: string;
  slot: number;
  hours: number;
}) => ({
  id: String(row._id),
  habitId: row.habit ? String(row.habit) : null,
  label: row.label,
  date: row.date,
  slot: row.slot,
  hours: row.hours,
});

export const plannerService = {
  async listTasks(userId: string, query: { date?: string; from?: string; to?: string }) {
    const filter: Record<string, unknown> = { user: userId };
    if (query.date) {
      filter.date = query.date;
    } else {
      const range = dateRange(query.from, query.to);
      filter.date = { $gte: range.from, $lte: range.to };
    }
    const rows = await Task.find(filter).sort({ date: 1, time: 1, createdAt: 1 });
    return rows.map((row) => serializeTask(row));
  },

  async createTask(userId: string, input: { title: string; category?: string; date?: string; time?: string }) {
    const row = await Task.create({
      user: userId,
      title: input.title,
      category: input.category || "Personal",
      date: input.date || today(),
      time: input.time || "09:00",
    });
    return serializeTask(row);
  },

  async updateTask(
    userId: string,
    taskId: string,
    input: Partial<{ title: string; category: string; date: string; time: string; completed: boolean }>
  ) {
    const row = await Task.findOneAndUpdate({ _id: taskId, user: userId }, { $set: input }, { new: true });
    if (!row) throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
    return serializeTask(row);
  },

  async removeTask(userId: string, taskId: string) {
    const row = await Task.findOneAndDelete({ _id: taskId, user: userId });
    if (!row) throw new AppError("Task not found", 404, "TASK_NOT_FOUND");
  },

  async listNotes(userId: string, query: { from?: string; to?: string }) {
    const range = dateRange(query.from, query.to);
    const rows = await Note.find({ user: userId, date: { $gte: range.from, $lte: range.to } }).sort({
      date: -1,
      time: -1,
    });
    return rows.map((row) => serializeNote(row));
  },

  async createNote(userId: string, input: { text: string; date?: string; time?: string }) {
    const row = await Note.create({
      user: userId,
      text: input.text,
      date: input.date || today(),
      time: input.time || format(new Date(), "HH:mm"),
    });
    return serializeNote(row);
  },

  async updateNote(userId: string, noteId: string, input: Partial<{ text: string; date: string; time: string }>) {
    const row = await Note.findOneAndUpdate({ _id: noteId, user: userId }, { $set: input }, { new: true });
    if (!row) throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
    return serializeNote(row);
  },

  async removeNote(userId: string, noteId: string) {
    const row = await Note.findOneAndDelete({ _id: noteId, user: userId });
    if (!row) throw new AppError("Note not found", 404, "NOTE_NOT_FOUND");
  },

  async listTime(userId: string, query: { from?: string; to?: string }) {
    const range = dateRange(query.from, query.to);
    const rows = await TimeEntry.find({ user: userId, date: { $gte: range.from, $lte: range.to } }).sort({
      date: 1,
      slot: 1,
    });
    const entries = rows.map((row) => serializeEntry(row));
    const totalHours = Math.round(entries.reduce((sum, entry) => sum + entry.hours, 0) * 10) / 10;
    return { entries, totalHours, from: range.from, to: range.to };
  },

  async setTimeCell(
    userId: string,
    input: { habitId?: string; label?: string; date: string; slot: number; hours: number }
  ) {
    const filter = {
      user: userId,
      habit: input.habitId || null,
      date: input.date,
      slot: input.slot,
    };
    if (input.hours <= 0) {
      await TimeEntry.deleteOne(filter);
      return null;
    }
    const row = await TimeEntry.findOneAndUpdate(
      filter,
      { $set: { hours: input.hours, label: input.label || "Focus" } },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return serializeEntry(row);
  },
};
