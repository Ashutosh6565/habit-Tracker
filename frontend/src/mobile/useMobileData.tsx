import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useAuth } from "@/context/AuthContext";
import {
  api,
  type AnalyticsOverviewDto,
  type ApiHabit,
  type HabitHistoryDto,
  type PlannerNoteDto,
  type PlannerTaskDto,
  type PlannerTimeDto,
  type TemplateCatalogDto,
} from "@/lib/api";
import { shiftISO, todayISO } from "./date";
import { cacheKey, readLocal, writeLocal } from "./localStore";
import { templateCategory } from "./templates";

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
  templates?: TemplateCatalogDto[];
  tasks: PlannerTaskDto[];
  notes: PlannerNoteDto[];
  time?: PlannerTimeDto;
  isLoading: boolean;
  offline: boolean;
  toast: string | null;
  notify: (message: string) => void;
  toggleHabit: (habit: ApiHabit) => void;
  createHabit: (draft: HabitDraft) => Promise<void>;
  applyTemplate: (
    template: Pick<TemplateCatalogDto, "name" | "description">,
    habits: { name: string; icon: string }[]
  ) => Promise<number>;
  toggleTask: (task: PlannerTaskDto) => void;
  addTask: (draft: TaskDraft) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  addNote: (text: string, date: string) => Promise<void>;
  deleteNote: (id: string) => Promise<void>;
  setTimeCell: (input: { habitId?: string; label?: string; date: string; slot: number; hours: number }) => Promise<void>;
}

const MobileDataContext = createContext<MobileDataValue | undefined>(undefined);

const loadWithCache = async <T,>(
  userId: string,
  name: string,
  fetcher: () => Promise<T>,
  setOffline: (value: boolean) => void
): Promise<T> => {
  try {
    const data = await fetcher();
    writeLocal(userId, cacheKey(name), data);
    setOffline(false);
    return data;
  } catch (error) {
    const cached = readLocal<T>(userId, cacheKey(name));
    if (cached) {
      setOffline(true);
      return cached;
    }
    throw error;
  }
};

export const MobileDataProvider = ({
  children,
  onRequireAuth,
}: {
  children: ReactNode;
  onRequireAuth?: () => void;
}) => {
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const guest = !user;
  const userId = user?.id || "guest";
  const [toast, setToast] = useState<string | null>(null);
  const [offline, setOffline] = useState(() => typeof navigator !== "undefined" && !navigator.onLine);

  useEffect(() => {
    const goOnline = () => setOffline(false);
    const goOffline = () => setOffline(true);
    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);
    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  const qk = useCallback((name: string) => ["hb", userId, name] as const, [userId]);
  const cached = useCallback(
    <T,>(name: string, fetcher: () => Promise<T>) =>
      () =>
        loadWithCache(userId, name, fetcher, setOffline),
    [userId]
  );
  const cachedInitial = useCallback(
    <T,>(name: string) => () => readLocal<T>(userId, cacheKey(name)) ?? undefined,
    [userId]
  );
  const offlineMessage = useCallback(
    (onlineMessage: string) => (navigator.onLine ? onlineMessage : "You're offline — this change wasn't saved."),
    []
  );

  const notify = useCallback((message: string) => {
    setToast(message);
    window.setTimeout(() => setToast((current) => (current === message ? null : current)), 2200);
  }, []);

  const requireAuth = useCallback(() => {
    onRequireAuth?.();
  }, [onRequireAuth]);

  const summaryQuery = useQuery({
    queryKey: qk("summary"),
    queryFn: cached<HabitSummary>("summary", () => api.habits.summary()),
    initialData: cachedInitial<HabitSummary>("summary"),
    initialDataUpdatedAt: 0,
    staleTime: 20_000,
    enabled: !guest,
  });

  const historyQuery = useQuery({
    queryKey: qk("history"),
    queryFn: cached<HabitHistoryDto>("history", () => api.habits.history(182)),
    initialData: cachedInitial<HabitHistoryDto>("history"),
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
    enabled: !guest,
  });

  const analyticsQuery = useQuery({
    queryKey: qk("analytics"),
    queryFn: cached<AnalyticsOverviewDto>("analytics", () => api.analytics.overview()),
    initialData: cachedInitial<AnalyticsOverviewDto>("analytics"),
    initialDataUpdatedAt: 0,
    staleTime: 60_000,
    enabled: !guest,
  });

  const templatesQuery = useQuery({
    queryKey: qk("templates"),
    queryFn: cached<TemplateCatalogDto[]>("templates", async () => (await api.templates.catalog()).templates),
    initialData: cachedInitial<TemplateCatalogDto[]>("templates"),
    initialDataUpdatedAt: 0,
    staleTime: 10 * 60_000,
  });

  const tasksQuery = useQuery({
    queryKey: qk("tasks"),
    queryFn: cached<PlannerTaskDto[]>("tasks", async () => (await api.planner.tasks({ from: shiftISO(todayISO(), -30), to: shiftISO(todayISO(), 14) })).tasks),
    initialData: cachedInitial<PlannerTaskDto[]>("tasks"),
    initialDataUpdatedAt: 0,
    staleTime: 20_000,
    enabled: !guest,
  });

  const notesQuery = useQuery({
    queryKey: qk("notes"),
    queryFn: cached<PlannerNoteDto[]>("notes", async () => (await api.planner.notes({ from: shiftISO(todayISO(), -120) })).notes),
    initialData: cachedInitial<PlannerNoteDto[]>("notes"),
    initialDataUpdatedAt: 0,
    staleTime: 30_000,
    enabled: !guest,
  });

  const timeQuery = useQuery({
    queryKey: qk("time"),
    queryFn: cached<PlannerTimeDto>("time", () => api.planner.time(shiftISO(todayISO(), -97), shiftISO(todayISO(), 14))),
    initialData: cachedInitial<PlannerTimeDto>("time"),
    initialDataUpdatedAt: 0,
    staleTime: 30_000,
    enabled: !guest,
  });

  const refreshDerived = useCallback(() => {
    void queryClient.invalidateQueries({ queryKey: qk("summary") });
    void queryClient.invalidateQueries({ queryKey: qk("history") });
    void queryClient.invalidateQueries({ queryKey: qk("analytics") });
  }, [queryClient, qk]);

  const toggleMutation = useMutation({
    mutationFn: ({ habit }: { habit: ApiHabit }) => api.habits.setProgress(habit.id, !habit.completed),
    onMutate: async ({ habit }) => {
      await queryClient.cancelQueries({ queryKey: qk("summary") });
      const previous = queryClient.getQueryData<HabitSummary>(qk("summary"));
      if (previous) {
        queryClient.setQueryData<HabitSummary>(qk("summary"), {
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
      if (context?.previous) queryClient.setQueryData(qk("summary"), context.previous);
      notify(offlineMessage("Could not save that check-in."));
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
    onError: () => notify(offlineMessage("Could not add that habit.")),
  });

  const applyTemplateMutation = useMutation({
    mutationFn: async ({
      template,
      habits,
    }: {
      template: Pick<TemplateCatalogDto, "name" | "description">;
      habits: { name: string; icon: string }[];
    }) => {
      const category = templateCategory(template);
      for (const habit of habits) {
        await api.habits.create({ title: habit.name, category, icon: habit.icon, difficulty: "easy" });
      }
      return habits.length;
    },
    onSuccess: (count) => {
      refreshDerived();
      notify(`${count} ${count === 1 ? "habit" : "habits"} added from template`);
    },
    onError: () => notify(offlineMessage("Could not add that template. Try again.")),
  });

  const taskToggleMutation = useMutation({
    mutationFn: (task: PlannerTaskDto) => api.planner.updateTask(task.id, { completed: !task.completed }),
    onMutate: async (task) => {
      await queryClient.cancelQueries({ queryKey: qk("tasks") });
      const previous = queryClient.getQueryData<PlannerTaskDto[]>(qk("tasks"));
      queryClient.setQueryData<PlannerTaskDto[]>(qk("tasks"), (rows) =>
        (rows || []).map((row) => (row.id === task.id ? { ...row, completed: !row.completed } : row))
      );
      return { previous };
    },
    onError: (_error, _task, context) => {
      if (context?.previous) queryClient.setQueryData(qk("tasks"), context.previous);
      notify(offlineMessage("Could not update task."));
    },
  });

  const addTaskMutation = useMutation({
    mutationFn: (draft: TaskDraft) => api.planner.createTask(draft),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk("tasks") });
      notify("Task added");
    },
    onError: () => notify(offlineMessage("Could not add task.")),
  });

  const deleteTaskMutation = useMutation({
    mutationFn: (id: string) => api.planner.removeTask(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk("tasks") });
      notify("Task removed");
    },
  });

  const addNoteMutation = useMutation({
    mutationFn: ({ text, date }: { text: string; date: string }) => api.planner.createNote({ text, date }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk("notes") });
      notify("Note saved");
    },
    onError: () => notify(offlineMessage("Could not save note.")),
  });

  const deleteNoteMutation = useMutation({
    mutationFn: (id: string) => api.planner.removeNote(id),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk("notes") });
    },
  });

  const timeMutation = useMutation({
    mutationFn: (input: { habitId?: string; label?: string; date: string; slot: number; hours: number }) =>
      api.planner.setTimeCell(input),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: qk("time") });
    },
    onError: () => notify(offlineMessage("Could not save that time block.")),
  });

  const value = useMemo<MobileDataValue>(
    () => ({
      summary: summaryQuery.data,
      history: historyQuery.data,
      analytics: analyticsQuery.data,
      templates: templatesQuery.data,
      tasks: tasksQuery.data || [],
      notes: notesQuery.data || [],
      time: timeQuery.data,
      isLoading: summaryQuery.isLoading,
      offline,
      toast,
      notify,
      toggleHabit: (habit) => {
        if (guest) return requireAuth();
        toggleMutation.mutate({ habit });
      },
      createHabit: async (draft) => {
        if (guest) return requireAuth();
        await createHabitMutation.mutateAsync(draft);
      },
      applyTemplate: async (template, habits) => {
        if (guest) {
          requireAuth();
          return 0;
        }
        return applyTemplateMutation.mutateAsync({ template, habits });
      },
      toggleTask: (task) => {
        if (guest) return requireAuth();
        taskToggleMutation.mutate(task);
      },
      addTask: async (draft) => {
        if (guest) return requireAuth();
        await addTaskMutation.mutateAsync(draft);
      },
      deleteTask: async (id) => {
        if (guest) return requireAuth();
        await deleteTaskMutation.mutateAsync(id);
      },
      addNote: async (text, date) => {
        if (guest) return requireAuth();
        await addNoteMutation.mutateAsync({ text, date });
      },
      deleteNote: async (id) => {
        if (guest) return requireAuth();
        await deleteNoteMutation.mutateAsync(id);
      },
      setTimeCell: async (input) => {
        if (guest) return requireAuth();
        await timeMutation.mutateAsync(input);
      },
    }),
    [
      summaryQuery.data,
      historyQuery.data,
      analyticsQuery.data,
      templatesQuery.data,
      tasksQuery.data,
      notesQuery.data,
      timeQuery.data,
      summaryQuery.isLoading,
      offline,
      toast,
      notify,
      guest,
      requireAuth,
      toggleMutation,
      createHabitMutation,
      applyTemplateMutation,
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
