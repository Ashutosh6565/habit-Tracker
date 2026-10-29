import { createContext, useCallback, useContext, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  api,
  type AnalyticsOverviewDto,
  type ApiHabit,
  type HabitHistoryDto,
  type PlannerNoteDto,
  type PlannerTaskDto,
  type PlannerTimeDto,
} from "@/lib/api";
import { shiftISO, todayISO } from "./date";

export type HabitSummary = { habits: ApiHabit[]; stats: Record<string, number> };

interface HabitDraft {
  title: string;
  category: string;
  icon: string;
  difficulty: "easy" | "medium" | "hard";
}

interface TaskDraft {
  title: string;
  category: string;
  date: string;
  time: string;
}

interface MobileDataValue {
  summary?: HabitSummary;
  history?: HabitHistoryDto;
  analytics?: AnalyticsOverviewDto;
  tasks: PlannerTaskDto[];
  notes: PlannerNoteDto[];
  time?: PlannerTimeDto;
  isLoading: boolean;
  toast: string | null;
  notify: (message: string) => void;
  toggleHabit: (habit: ApiHabit) => void;
  createHabit: (draft: HabitDraft) => Promise<void>;
  toggleTask: (task: PlannerTaskDto) => void;
  addTask: (draft: TaskDraft) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addNote: (text: string, date: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setTimeCell: (input: { habitId?: string; label?: string; date: string; slot: number; hours: number }) => Promise<void>;
}

const MobileDataContext = createContext<MobileDataValue | undefined>(undefined);

export const MobileDataProvider = ({ children }: { children: ReactNode }) => {
  const queryClient = useQueryClient();
  const [toast, setToast] = useState<string | null>(null);

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2200);
  }, []);

  const summaryQuery = useQuery({
    queryKey: ["hb", "summary"],
    queryFn: () => api.habits.summary(),
    staleTime: 20_000,
  });

  const historyQuery = useQuery({
    queryKey: ["hb", "history"],
    queryFn: () => api.habits.history(182),
    staleTime: 60_000,
  });

  const analyticsQuery = useQuery({
    queryKey: ["hb", "analytics"],
    queryFn: () => api.analytics.overview(),
    staleTime: 60_000,
  });

  const tasksQuery = useQuery({
    queryKey: ["hb", "tasks"],
    queryFn: async () => (await api.planner.tasks({ from: shiftISO(todayISO(), -30), to: shiftISO(todayISO(), 14) })).tasks,
    staleTime: 20_000,
  });

  const notesQuery = useQuery({
    queryKey: ["hb", "notes"],
    queryFn: async () => (await api.planner.notes({ from: shiftISO(todayISO(), -120) })).notes,
    staleTime: 30_000,
  });

  const timeQuery = useQuery({
    queryKey: ["hb", "time"],
    queryFn: () => api.planner.time(shiftISO(todayISO(), -97), shiftISO(todayISO(), 14)),
    staleTime: 30_000,
  });

  const refreshDerived = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: ["hb", "summary"] });
    void queryClient.invalidateQueries({ queryKey: ["hb", "history"] });
    void queryClient.invalidateQueries({ queryKey: ["hb", "analytics"] });
  }, [queryClient]);

  const toggleMutation = useMutation({
    mutationFn: ({ habit }: { habit: ApiHabit }) => api.habits.setProgress(habit.id, !habit.completed),
    onMutate: async ({ habit }) => {
      await queryClient.cancelQueries({ queryKey: ["hb", "summary"] });
      const previous = queryClient.getQueryData<HabitSummary>(["hb", "summary"]);
      if (previous) {
        queryClient.setQueryData<HabitSummary>(["hb", "summary"], {
          stats: previous.stats,
          habits: previous.habits.map((row) =>
            row.id === habit.id
              ? { ...row, completed: !row.completed, streak: row.completed ? Math.max(0, row.streak - 1) : row.streak + 1 }
              : row
          ),
        });
      }
      return { previous };
    },
    onError: (_error, _variables, context) => {
      if (context?.previous) queryClient.setQueryData(["hb", "summary"], context.previous);
      notify("Could not save that check-in.");
    },
    onSuccess: (updated) => {
      if (!updated.completed) return;
      notify(updated.streak > 1 ? `Streak up to ${updated.streak} days 🔥` : "Nice — day one done ✅");
    },
    onSettled: refreshDerived,
  });

  const createHabitMutation = useMutation({
    mutationFn: (draft: HabitDraft) => api.habits.create(draft),
    onSuccess: () => {
      refreshDerived();
      notify("Habit added");
    },
    onError: () => notify("Could not add that habit."),
  });

  const taskToggleMutation = useMutation({
    mutationFn: (task: PlannerTaskDto) => api.planner.updateTask(task.id, { completed: !task.completed }),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: ["hb", "tasks"] });
      const previous = queryClient.getQueryData<PlannerTaskDto[]>(["hb", "tasks"]);
      queryClient.setQueryData<PlannerTaskDto[]>(["hb", "tasks"], (rows) =>
        (rows || []).map((row) => (row.id === task.id ? { ...row, completed: !row.completed } : row))
      );
      return { previous };
    },
    onError: (_error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(["hb", "tasks"], context.previous);
      notify("Could not update task.");
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (draft: TaskDraft) => api.planner.createTask(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hb", "tasks"] });
      notify("Task added");
    },
    onError: () => notify("Could not add task."),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.planner.removeTask(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hb", "tasks"] });
      notify("Task removed");
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ text, date }: { text: string; date: string }) => api.planner.createNote({ text, date }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hb", "notes"] });
      notify("Note saved");
    },
    onError: () => notify("Could not save note."),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => api.planner.removeNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hb", "notes"] });
    },
  });

  const timeMutation = useMutation({
    mutationFn: (input: { habitId?: string; label?: string; date: string; slot: number; hours: number }) =>
      api.planner.setTimeCell(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ["hb", "time"] });
    },
    onError: () => notify("Could not save that time block."),
  });

  const value = useMemo<MobileDataValue>(
    () => ({
      summary: summaryQuery.data,
      history: historyQuery.data,
      analytics: analyticsQuery.data,
      tasks: tasksQuery.data || [],
      notes: notesQuery.data || [],
      time: timeQuery.data,
      isLoading: summaryQuery.isLoading,
      toast,
      notify,
      toggleHabit: (habit) => toggleMutation.mutate({ habit }),
      createHabit: (draft) => createHabitMutation.mutateAsync(draft).then(() => undefined),
      toggleTask: (task) => taskToggleMutation.mutate(task),
      addTask: (draft) => addTaskMutation.mutateAsync(draft).then(() => undefined),
      deleteTask: (id) => deleteTaskMutation.mutateAsync(id).then(() => undefined),
      addNote: (text, date) => addNoteMutation.mutateAsync({ text, date }).then(() => undefined),
      deleteNote: (id) => deleteNoteMutation.mutateAsync(id).then(() => undefined),
      setTimeCell: (input) => timeMutation.mutateAsync(input).then(() => undefined),
    }),
    [
      summaryQuery.data,
      historyQuery.data,
      analyticsQuery.data,
      tasksQuery.data,
      notesQuery.data,
      timeQuery.data,
      summaryQuery.isLoading,
      toast,
      notify,
      toggleMutation,
      createHabitMutation,
      taskToggleMutation,
      addTaskMutation,
      deleteTaskMutation,
      addNoteMutation,
      deleteNoteMutation,
      timeMutation,
    ]
  );

  return <MobileDataContext.Provider value={value}>{children}</MobileDataContext.Provider>;
};

export const useMobileData = () => {
  const context = useContext(MobileDataContext);
  if (!context) throw new Error("useMobileData must be used inside MobileDataProvider");
  return context;
};
