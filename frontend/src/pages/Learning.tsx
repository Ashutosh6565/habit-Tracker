import { FormEvent, useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  BarChart3,
  CalendarDays,
  Check,
  Clock3,
  Flame,
  GraduationCap,
  LayoutGrid,
  Loader2,
  PlayCircle,
  Plus,
  RotateCcw,
  Sparkles,
  Target,
  Timer,
  Trash2,
  TrendingUp,
  Video,
  Youtube,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import { Progress } from "@/components/ui/progress";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";
import { useHabitContext } from "@/context/HabitContext";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage } from "@/lib/api";
import {
  GUEST_LEARNING_PLANS_KEY,
  readGuestJson,
  writeGuestJson,
} from "@/lib/guestStorage";
import {
  buildLearningVideoPlan,
  calculateProgressPercent,
  detectScheduleConflicts,
  extractYouTubeVideoId,
  formatClockTime,
  formatCompactDuration,
  formatVideoTime,
  getFallbackVideoMetadata,
  getTodayDateString,
  isPlaylistUrl,
  LEARNING_TEMPLATE_ID,
  LEARNING_TEMPLATE_NAME,
  normalizeTargetDays,
  parseDurationToSeconds,
  recalculateRemainingLearningPlan,
  type CompletionGoalUnit,
  type LearningVideoPlan,
  type ScheduleChunk,
  type ScheduleStatus,
  type VideoMetadata,
} from "@/lib/learningVideos";

type FormState = {
  youtubeUrl: string;
  title: string;
  duration: string;
  goalUnit: CompletionGoalUnit;
  goalValue: string;
  targetDate: string;
  scheduledStartTime: string;
  splitIntoSessions: boolean;
};

const emptyForm: FormState = {
  youtubeUrl: "",
  title: "",
  duration: "",
  goalUnit: "days",
  goalValue: "10",
  targetDate: "",
  scheduledStartTime: "10:00",
  splitIntoSessions: false,
};

const statusStyles: Record<ScheduleStatus, string> = {
  pending: "border-border bg-secondary/60 text-muted-foreground",
  done: "border-success/30 bg-success/10 text-success",
  skipped: "border-destructive/30 bg-destructive/10 text-destructive",
};

const statusLabels: Record<ScheduleStatus, string> = {
  pending: "Pending",
  done: "Done",
  skipped: "Skipped",
};

const learningTodayLabel = new Intl.DateTimeFormat(undefined, {
  weekday: "long",
  month: "short",
  day: "numeric",
}).format(new Date());

const LEGACY_PLANS_KEY = "habbiters_learning_video_plans";

const readLegacyPlans = () => {
  try {
    const raw = localStorage.getItem(LEGACY_PLANS_KEY);
    if (!raw) return [] as LearningVideoPlan[];
    const parsed = JSON.parse(raw) as LearningVideoPlan[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [] as LearningVideoPlan[];
  }
};

const loadGuestPlans = () => {
  const current = readGuestJson<LearningVideoPlan[]>(GUEST_LEARNING_PLANS_KEY, []);
  return current.length > 0 ? current : readLegacyPlans();
};

const getCompletionSummary = (plan: LearningVideoPlan) => {
  const doneChunks = plan.chunks.filter((chunk) => chunk.status === "done");
  const watchedSeconds = doneChunks.reduce(
    (total, chunk) => total + Math.max(0, chunk.videoEndSeconds - chunk.videoStartSeconds),
    0
  );
  const pendingChunks = plan.chunks.filter((chunk) => chunk.status === "pending");
  const remainingDays = pendingChunks.length;
  const progress = calculateProgressPercent(plan.chunks);
  const doneDates = new Set(doneChunks.map((chunk) => chunk.date));

  let streak = 0;
  for (let index = plan.chunks.length - 1; index >= 0; index -= 1) {
    if (plan.chunks[index].status !== "done") break;
    streak += 1;
  }

  const onTrack = remainingDays === 0 || doneDates.size >= Math.min(doneChunks.length, plan.chunks.length);

  return { watchedSeconds, remainingDays, progress, streak, onTrack };
};

const getChunkDisplayDate = (date: string) =>
  new Intl.DateTimeFormat(undefined, { month: "short", day: "numeric" }).format(new Date(`${date}T00:00:00`));

const Learning = () => {
  const { setLearningVideoPlans, setTemplateData } = useHabitContext();
  const { user, loading: authLoading, guestSyncTick } = useAuth();
  const { toast } = useToast();
  const [plans, setPlans] = useState<LearningVideoPlan[]>(loadGuestPlans);
  const [ready, setReady] = useState(false);
  const persistedRef = useRef<Record<string, string>>({});
  const [form, setForm] = useState<FormState>(emptyForm);
  const [metadata, setMetadata] = useState<VideoMetadata | null>(null);
  const [fetchingMetadata, setFetchingMetadata] = useState(false);
  const [manualDurationRequired, setManualDurationRequired] = useState(false);

  const today = getTodayDateString();
  const allChunks = useMemo(
    () =>
      plans
        .flatMap((plan) => plan.chunks.map((chunk) => ({ ...chunk, video: plan.video })))
        .sort((a, b) => a.date.localeCompare(b.date) || a.scheduledClockTime.localeCompare(b.scheduledClockTime)),
    [plans]
  );
  const todayChunks = useMemo(
    () =>
      allChunks
        .filter((chunk) => chunk.date === today)
        .sort((a, b) => a.scheduledClockTime.localeCompare(b.scheduledClockTime)),
    [allChunks, today]
  );
  const conflicts = useMemo(() => detectScheduleConflicts(plans), [plans]);
  const totalWatchedSeconds = useMemo(
    () =>
      plans.reduce(
        (total, plan) =>
          total +
          plan.chunks
            .filter((chunk) => chunk.status === "done")
            .reduce((sum, chunk) => sum + Math.max(0, chunk.videoEndSeconds - chunk.videoStartSeconds), 0),
        0
      ),
    [plans]
  );
  const overallProgress = useMemo(() => {
    const chunkCount = plans.reduce((total, plan) => total + plan.chunks.length, 0);
    if (chunkCount === 0) return 0;
    const doneCount = plans.reduce(
      (total, plan) => total + plan.chunks.filter((chunk) => chunk.status === "done").length,
      0
    );
    return Math.round((doneCount / chunkCount) * 100);
  }, [plans]);

  useEffect(() => {
    if (authLoading) return;
    if (!user) {
      setPlans(loadGuestPlans());
      setReady(true);
      return;
    }

    let cancelled = false;
    (async () => {
      try {
        const localPlans = loadGuestPlans();
        const data = await api.learning.list();
        let serverPlans = data.plans;
        let syncedFromLocal = false;

        // Courses saved by older builds lived only in localStorage. Import them
        // once when the account has no server plans yet.
        if (serverPlans.length === 0 && localPlans.length > 0) {
          let importFailed = false;
          for (const plan of localPlans) {
            try {
              await api.learning.upsert(plan);
            } catch {
              importFailed = true;
            }
          }
          if (importFailed) {
            serverPlans = localPlans;
          } else {
            serverPlans = (await api.learning.list()).plans;
            syncedFromLocal = true;
          }
        }

        if (cancelled) return;
        setPlans(serverPlans);
        if (syncedFromLocal || serverPlans === data.plans) {
          persistedRef.current = Object.fromEntries(
            serverPlans.map((plan) => [plan.video.id, JSON.stringify(plan)])
          );
        }
        if (syncedFromLocal) localStorage.removeItem(LEGACY_PLANS_KEY);
      } catch {
        // Keep the local list; saves below will retry on the next change.
      } finally {
        if (!cancelled) setReady(true);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [user, authLoading, guestSyncTick]);

  useEffect(() => {
    if (authLoading || !ready) return;

    setLearningVideoPlans(plans);
    setTemplateData(LEARNING_TEMPLATE_ID, {
      templateId: LEARNING_TEMPLATE_ID,
      templateName: LEARNING_TEMPLATE_NAME,
      habits: plans.map((plan) => ({
        habitId: plan.video.id,
        name: plan.video.title,
        icon: "Video",
      })),
      completions: plans.reduce<Record<string, Record<number, boolean>>>((acc, plan) => {
        acc[plan.video.id] = plan.chunks.reduce<Record<number, boolean>>((chunkAcc, chunk) => {
          chunkAcc[chunk.dayNumber] = chunk.status === "done";
          return chunkAcc;
        }, {});
        return acc;
      }, {}),
      totalDays: Math.max(1, ...plans.map((plan) => plan.chunks.length)),
    });

    if (!user) {
      writeGuestJson(GUEST_LEARNING_PLANS_KEY, plans);
      return;
    }

    const timer = setTimeout(() => {
      plans.forEach((plan) => {
        const snapshot = JSON.stringify(plan);
        if (persistedRef.current[plan.video.id] === snapshot) return;
        persistedRef.current[plan.video.id] = snapshot;
        void api.learning.upsert(plan).catch(() => {
          delete persistedRef.current[plan.video.id];
        });
      });
    }, 600);

    return () => clearTimeout(timer);
  }, [plans, user, authLoading, ready, setLearningVideoPlans, setTemplateData]);

  const updateForm = <K extends keyof FormState>(key: K, value: FormState[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const fetchVideoMetadata = async () => {
    if (isPlaylistUrl(form.youtubeUrl)) {
      toast({
        title: "Single video needed",
        description: "Playlist links are not combined yet. Paste a single YouTube video URL.",
        variant: "destructive",
      });
      return;
    }

    const videoId = extractYouTubeVideoId(form.youtubeUrl);
    if (!videoId) {
      toast({
        title: "Invalid YouTube URL",
        description: "Paste a YouTube watch, shorts, embed, or youtu.be link.",
        variant: "destructive",
      });
      return;
    }

    setFetchingMetadata(true);
    setManualDurationRequired(false);

    try {
      const data = await api.habits.youtubeMetadata(form.youtubeUrl);
      setMetadata(data);
      setForm((prev) => ({
        ...prev,
        title: data.title || prev.title,
        duration: data.totalDurationSeconds ? formatVideoTime(data.totalDurationSeconds) : prev.duration,
      }));
      if (!data.totalDurationSeconds) setManualDurationRequired(true);
      toast({
        title: data.totalDurationSeconds ? "Video details fetched" : "Add duration manually",
        description: data.totalDurationSeconds
          ? `${data.title} is ready for scheduling.`
          : "The title and thumbnail loaded, but YouTube did not expose a duration.",
      });
    } catch (error) {
      const fallback = getFallbackVideoMetadata(form.youtubeUrl);
      setMetadata(fallback);
      if (fallback) setForm((prev) => ({ ...prev, title: prev.title || fallback.title }));
      setManualDurationRequired(true);
      toast({
        title: "Manual duration needed",
        description: getApiErrorMessage(error),
      });
    } finally {
      setFetchingMetadata(false);
    }
  };

  const addVideoPlan = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (isPlaylistUrl(form.youtubeUrl)) {
      toast({
        title: "Playlist links are not supported",
        description: "Use a single video link so each timetable can track one course cleanly.",
        variant: "destructive",
      });
      return;
    }

    const fallback = getFallbackVideoMetadata(form.youtubeUrl);
    const videoId = metadata?.videoId || fallback?.videoId || "";
    const durationSeconds = parseDurationToSeconds(form.duration);
    const title = form.title.trim() || metadata?.title || fallback?.title || "";
    const goalValue = Number(form.goalValue);

    if (!videoId || !title || durationSeconds <= 0 || !Number.isFinite(goalValue) || goalValue <= 0) {
      toast({
        title: "Check the video details",
        description: "A valid URL, title, duration, and completion goal are required.",
        variant: "destructive",
      });
      return;
    }

    const targetTotalDays = normalizeTargetDays({
      unit: form.goalUnit,
      value: goalValue,
      targetDate: form.targetDate,
    });

    const plan = buildLearningVideoPlan({
      id: `video-${videoId}-${Date.now()}`,
      youtubeUrl: form.youtubeUrl.trim(),
      videoId,
      title,
      thumbnailUrl: metadata?.thumbnailUrl || fallback?.thumbnailUrl || `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
      totalDurationSeconds: durationSeconds,
      targetTotalDays,
      scheduledStartTime: form.scheduledStartTime,
      splitIntoSessions: form.splitIntoSessions,
      sessionSplit: form.splitIntoSessions ? "double" : "single",
      createdAt: new Date().toISOString(),
    });

    setPlans((prev) => [plan, ...prev]);
    setForm(emptyForm);
    setMetadata(null);
    setManualDurationRequired(false);
    toast({
      title: "Timetable generated",
      description: `${title} is split into ${targetTotalDays} daily chunks.`,
    });
  };

  const updateChunkStatus = (chunk: ScheduleChunk, status: ScheduleStatus) => {
    setPlans((prev) =>
      prev.map((plan) => {
        if (plan.video.id !== chunk.videoId) return plan;
        const chunks = plan.chunks.map((item) => (item.id === chunk.id ? { ...item, status } : item));
        return {
          ...plan,
          chunks,
          habitEntries: plan.habitEntries.map((entry) =>
            entry.scheduleChunkId === chunk.id ? { ...entry, completed: status === "done" } : entry
          ),
        };
      })
    );
  };

  const recalculatePlan = (plan: LearningVideoPlan) => {
    const nextDays = window.prompt("Target total days for this course?", String(plan.video.targetTotalDays));
    if (!nextDays) return;
    const targetDays = Math.max(1, Math.ceil(Number(nextDays)));
    if (!Number.isFinite(targetDays)) return;

    setPlans((prev) => prev.map((item) => (item.video.id === plan.video.id ? recalculateRemainingLearningPlan(item, targetDays) : item)));
    toast({
      title: "Timetable recalculated",
      description: "Completed chunks were kept, and only the remaining plan was rebuilt.",
    });
  };

  const deletePlan = async (plan: LearningVideoPlan) => {
    if (!window.confirm(`Delete "${plan.video.title}" and its timetable? This cannot be undone.`)) return;
    const previous = plans;
    delete persistedRef.current[plan.video.id];
    setPlans((prev) => prev.filter((item) => item.video.id !== plan.video.id));

    if (!user) return;

    try {
      await api.learning.remove(plan.video.id);
    } catch (error) {
      setPlans(previous);
      toast({
        title: "Could not delete course",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    }
  };

  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-8">
            <div className="grid gap-6 lg:grid-cols-[1.25fr_0.75fr] lg:items-end">
              <div>
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  <GraduationCap className="h-3.5 w-3.5" />
                  {LEARNING_TEMPLATE_NAME}
                </div>
                <h1 className="text-3xl md:text-5xl font-display font-bold tracking-tight text-foreground">
                  Video courses, turned into daily momentum.
                </h1>
                <p className="mt-3 max-w-2xl text-base text-muted-foreground">
                  Paste a course video, pick a finish goal, schedule a start time, and each daily chunk becomes a learning habit.
                </p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <StatTile icon={Video} label="Active videos" value={plans.length} />
                <StatTile icon={Timer} label="Watched" value={formatCompactDuration(totalWatchedSeconds)} />
                <StatTile icon={Target} label="Overall" value={`${overallProgress}%`} />
                <StatTile icon={AlertTriangle} label="Conflicts" value={conflicts.length} tone={conflicts.length > 0 ? "warning" : "default"} />
              </div>
            </div>
          </motion.div>

          {conflicts.length > 0 && (
            <div className="mb-6 rounded-xl border border-accent/30 bg-accent/10 p-4 text-sm text-foreground">
              <div className="mb-2 flex items-center gap-2 font-semibold">
                <AlertTriangle className="h-4 w-4 text-accent" />
                Schedule overlap warning
              </div>
              <div className="space-y-1 text-muted-foreground">
                {conflicts.slice(0, 3).map((conflict) => (
                  <p key={`${conflict.date}-${conflict.firstVideoId}-${conflict.secondVideoId}`}>
                    {getChunkDisplayDate(conflict.date)} at {conflict.startsAt}: {conflict.firstTitle} overlaps with {conflict.secondTitle}.
                  </p>
                ))}
              </div>
            </div>
          )}

          <div className="grid gap-6 xl:grid-cols-[390px_1fr]">
            <section className="rounded-xl border border-border bg-card p-5 shadow-sm">
              <div className="mb-5 flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <Youtube className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="font-display text-lg font-bold text-foreground">Add Video</h2>
                  <p className="text-xs text-muted-foreground">Auto-fetch details, then generate the timetable.</p>
                </div>
              </div>

              <form onSubmit={addVideoPlan} className="space-y-4">
                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">YouTube URL</label>
                  <div className="flex gap-2">
                    <input
                      value={form.youtubeUrl}
                      onChange={(event) => updateForm("youtubeUrl", event.target.value)}
                      placeholder="https://www.youtube.com/watch?v=..."
                      className="h-10 min-w-0 flex-1 rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                    <button
                      type="button"
                      onClick={fetchVideoMetadata}
                      disabled={fetchingMetadata}
                      className="flex h-10 w-10 items-center justify-center rounded-lg border border-border bg-secondary text-foreground transition-colors hover:bg-secondary/80 disabled:opacity-60"
                      title="Fetch video details"
                    >
                      {fetchingMetadata ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
                    </button>
                  </div>
                </div>

                {metadata && (
                  <div className="flex gap-3 rounded-lg border border-border bg-secondary/40 p-3">
                    <img src={metadata.thumbnailUrl} alt="" className="h-16 w-24 rounded-md object-cover" />
                    <div className="min-w-0">
                      <p className="line-clamp-2 text-sm font-semibold text-foreground">{metadata.title}</p>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {metadata.totalDurationSeconds ? formatCompactDuration(metadata.totalDurationSeconds) : "Duration needs manual entry"}
                      </p>
                    </div>
                  </div>
                )}

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Video title</label>
                  <input
                    value={form.title}
                    onChange={(event) => updateForm("title", event.target.value)}
                    placeholder="Course name"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                </div>

                <div>
                  <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Duration</label>
                  <input
                    value={form.duration}
                    onChange={(event) => updateForm("duration", event.target.value)}
                    placeholder="HH:MM:SS"
                    className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                  />
                  {manualDurationRequired && (
                    <p className="mt-1.5 text-xs text-accent">Auto duration was unavailable. Enter the course length manually.</p>
                  )}
                </div>

                <div className="grid grid-cols-[1fr_120px] gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Finish goal</label>
                    <input
                      type="number"
                      step="0.1"
                      min="0.1"
                      value={form.goalValue}
                      onChange={(event) => updateForm("goalValue", event.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Unit</label>
                    <select
                      value={form.goalUnit}
                      onChange={(event) => updateForm("goalUnit", event.target.value as CompletionGoalUnit)}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    >
                      <option value="days">Days</option>
                      <option value="weeks">Weeks</option>
                      <option value="months">Months</option>
                      <option value="date">By date</option>
                    </select>
                  </div>
                </div>

                {form.goalUnit === "date" && (
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Target date</label>
                    <input
                      type="date"
                      value={form.targetDate}
                      onChange={(event) => updateForm("targetDate", event.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                )}

                <div className="grid grid-cols-[1fr_128px] gap-3">
                  <div>
                    <label className="mb-1.5 block text-xs font-semibold text-muted-foreground">Daily start time</label>
                    <input
                      type="time"
                      value={form.scheduledStartTime}
                      onChange={(event) => updateForm("scheduledStartTime", event.target.value)}
                      className="h-10 w-full rounded-lg border border-input bg-background px-3 text-sm outline-none focus:ring-2 focus:ring-ring"
                    />
                  </div>
                  <div className="rounded-lg border border-border bg-secondary/40 px-3 py-2">
                    <span className="block text-[11px] font-semibold uppercase text-muted-foreground">Normalizes to</span>
                    <span className="text-sm font-bold text-foreground">
                      {normalizeTargetDays({
                        unit: form.goalUnit,
                        value: Number(form.goalValue) || 1,
                        targetDate: form.targetDate,
                      })}{" "}
                      days
                    </span>
                  </div>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-border bg-secondary/40 p-3">
                  <div>
                    <p className="text-sm font-semibold text-foreground">Split daily chunk</p>
                    <p className="text-xs text-muted-foreground">Creates two shorter sessions per day.</p>
                  </div>
                  <Switch checked={form.splitIntoSessions} onCheckedChange={(checked) => updateForm("splitIntoSessions", checked)} />
                </div>

                <button
                  type="submit"
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-lg gradient-primary text-sm font-semibold text-primary-foreground shadow-sm transition-opacity hover:opacity-90"
                >
                  <Plus className="h-4 w-4" />
                  Generate Timetable
                </button>
              </form>
            </section>

            <section>
              <Tabs defaultValue="today" className="w-full">
                <TabsList className="mb-5 grid h-auto w-full grid-cols-2 gap-1 rounded-xl bg-secondary p-1 md:grid-cols-4">
                  <TabsTrigger value="today" className="gap-2 rounded-lg py-2">
                    <Clock3 className="h-4 w-4" />
                    Today
                  </TabsTrigger>
                  <TabsTrigger value="timetable" className="gap-2 rounded-lg py-2">
                    <CalendarDays className="h-4 w-4" />
                    Timetable
                  </TabsTrigger>
                  <TabsTrigger value="habits" className="gap-2 rounded-lg py-2">
                    <LayoutGrid className="h-4 w-4" />
                    Template
                  </TabsTrigger>
                  <TabsTrigger value="progress" className="gap-2 rounded-lg py-2">
                    <BarChart3 className="h-4 w-4" />
                    Progress
                  </TabsTrigger>
                </TabsList>

                <TabsContent value="today" className="mt-0">
                  <TodaySchedule chunks={todayChunks} onUpdateStatus={updateChunkStatus} />
                </TabsContent>

                <TabsContent value="timetable" className="mt-0">
                  <TimetableView
                    plans={plans}
                    onUpdateStatus={updateChunkStatus}
                    onRecalculate={recalculatePlan}
                    onDelete={deletePlan}
                  />
                </TabsContent>

                <TabsContent value="habits" className="mt-0">
                  <HabitTemplateView plans={plans} onUpdateStatus={updateChunkStatus} />
                </TabsContent>

                <TabsContent value="progress" className="mt-0">
                  <ProgressView plans={plans} />
                </TabsContent>
              </Tabs>
            </section>
          </div>
        </div>
      </main>
    </div>
  );
};

const StatTile = ({
  icon: Icon,
  label,
  value,
  tone = "default",
}: {
  icon: LucideIcon;
  label: string;
  value: string | number;
  tone?: "default" | "warning";
}) => (
  <div className="rounded-xl border border-border bg-card p-4">
    <div className="mb-3 flex items-center justify-between">
      <span className="text-xs font-semibold text-muted-foreground">{label}</span>
      <Icon className={`h-4 w-4 ${tone === "warning" ? "text-accent" : "text-primary"}`} />
    </div>
    <p className="font-display text-2xl font-bold text-foreground">{value}</p>
  </div>
);

const EmptyPanel = ({ title, body }: { title: string; body: string }) => (
  <div className="rounded-xl border border-dashed border-border bg-card p-10 text-center">
    <PlayCircle className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
    <h3 className="font-display text-lg font-bold text-foreground">{title}</h3>
    <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">{body}</p>
  </div>
);

const TodaySchedule = ({
  chunks,
  onUpdateStatus,
}: {
  chunks: Array<ScheduleChunk & { video: LearningVideoPlan["video"] }>;
  onUpdateStatus: (chunk: ScheduleChunk, status: ScheduleStatus) => void;
}) => {
  if (chunks.length === 0) {
    return <EmptyPanel title="No video sessions today" body="Add a course or keep working through future timetable rows." />;
  }

  return (
    <div className="space-y-4">
      <div className="rounded-xl border border-border bg-card p-5">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <h2 className="font-display text-xl font-bold text-foreground">Today's Schedule</h2>
            <p className="text-sm text-muted-foreground">{learningTodayLabel}</p>
          </div>
          <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">{chunks.length} sessions</span>
        </div>

        <div className="space-y-3">
          {chunks.map((chunk) => (
            <div key={chunk.id} className="grid gap-3 rounded-xl border border-border bg-secondary/30 p-3 md:grid-cols-[104px_1fr_auto] md:items-center">
              <div>
                <p className="text-lg font-display font-bold text-foreground">{formatClockTime(chunk.scheduledClockTime)}</p>
                <p className="text-xs text-muted-foreground">{formatCompactDuration(chunk.estimatedSessionLengthSeconds)}</p>
              </div>
              <div className="flex min-w-0 gap-3">
                <img src={chunk.video.thumbnailUrl} alt="" className="h-14 w-20 rounded-md object-cover" />
                <div className="min-w-0">
                  <h3 className="truncate text-sm font-semibold text-foreground">{chunk.video.title}</h3>
                  <p className="text-xs text-muted-foreground">
                    Day {chunk.dayNumber}: {chunk.videoStartTimestamp} - {chunk.videoEndTimestamp}
                  </p>
                  {chunk.video.splitIntoSessions && (
                    <p className="mt-1 text-xs text-primary">
                      Split into 2 x {formatCompactDuration(chunk.estimatedSessionLengthSeconds / 2)}
                    </p>
                  )}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => onUpdateStatus(chunk, "done")}
                  className="flex h-9 items-center gap-1.5 rounded-lg bg-success px-3 text-xs font-semibold text-success-foreground"
                >
                  <Check className="h-3.5 w-3.5" />
                  Done
                </button>
                <button
                  onClick={() => onUpdateStatus(chunk, "skipped")}
                  className="h-9 rounded-lg border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground"
                >
                  Skip
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const TimetableView = ({
  plans,
  onUpdateStatus,
  onRecalculate,
  onDelete,
}: {
  plans: LearningVideoPlan[];
  onUpdateStatus: (chunk: ScheduleChunk, status: ScheduleStatus) => void;
  onRecalculate: (plan: LearningVideoPlan) => void;
  onDelete: (plan: LearningVideoPlan) => void;
}) => {
  if (plans.length === 0) {
    return <EmptyPanel title="No timetables yet" body="Generate your first video plan to see daily, weekly, and monthly chunks." />;
  }

  return (
    <div className="space-y-5">
      {plans.map((plan) => {
        const progress = calculateProgressPercent(plan.chunks);
        const weeks = Array.from({ length: Math.ceil(plan.chunks.length / 7) }, (_, index) => plan.chunks.slice(index * 7, index * 7 + 7));
        const monthEnd = plan.chunks[plan.chunks.length - 1];

        return (
          <div key={plan.video.id} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div className="flex gap-3">
                <img src={plan.video.thumbnailUrl} alt="" className="h-20 w-32 rounded-lg object-cover" />
                <div>
                  <h2 className="font-display text-xl font-bold text-foreground">{plan.video.title}</h2>
                  <p className="text-sm text-muted-foreground">
                    {formatCompactDuration(plan.video.totalDurationSeconds)} over {plan.video.targetTotalDays} days - starts {formatClockTime(plan.video.scheduledStartTime)}
                  </p>
                  <div className="mt-3 flex flex-wrap gap-2">
                    <Badge>{formatCompactDuration(plan.video.dailyChunkSeconds)} per day</Badge>
                    <Badge>{progress}% complete</Badge>
                    {plan.video.splitIntoSessions && <Badge>2 sessions/day</Badge>}
                  </div>
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => onRecalculate(plan)}
                  className="flex h-9 items-center justify-center gap-2 rounded-lg border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary"
                >
                  <RotateCcw className="h-3.5 w-3.5" />
                  Recalculate remaining
                </button>
                <button
                  onClick={() => onDelete(plan)}
                  className="flex h-9 items-center justify-center gap-2 rounded-lg border border-destructive/40 px-3 text-xs font-semibold text-destructive transition-colors hover:bg-destructive/10"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                  Delete course
                </button>
              </div>
            </div>

            <div className="mb-5">
              <Progress value={progress} className="h-2" />
            </div>

            <div className="mb-5 grid gap-3 md:grid-cols-2">
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Weekly summary</p>
                <div className="mt-2 space-y-1 text-sm text-foreground">
                  {weeks.slice(0, 4).map((week, index) => (
                    <p key={index}>
                      Week {index + 1}: {week[0]?.videoStartTimestamp} - {week[week.length - 1]?.videoEndTimestamp}
                    </p>
                  ))}
                </div>
              </div>
              <div className="rounded-lg border border-border bg-secondary/30 p-3">
                <p className="text-xs font-semibold text-muted-foreground">Monthly summary</p>
                <p className="mt-2 text-sm text-foreground">
                  By {monthEnd ? getChunkDisplayDate(monthEnd.date) : "the end"}: 00:00:00 - {monthEnd?.videoEndTimestamp || "00:00:00"} completed.
                </p>
              </div>
            </div>

            <div className="overflow-hidden rounded-lg border border-border">
              <div className="grid grid-cols-[72px_1fr_132px_118px] bg-secondary/60 px-3 py-2 text-xs font-semibold text-muted-foreground">
                <span>Day</span>
                <span>Video range</span>
                <span>Clock time</span>
                <span>Status</span>
              </div>
              <div className="max-h-[460px] overflow-auto">
                {plan.chunks.map((chunk) => (
                  <div key={chunk.id} className="grid grid-cols-[72px_1fr_132px_118px] items-center border-t border-border px-3 py-2 text-sm">
                    <span className="font-semibold text-foreground">{chunk.dayNumber}</span>
                    <div>
                      <p className="font-medium text-foreground">
                        {chunk.videoStartTimestamp} - {chunk.videoEndTimestamp}
                      </p>
                      <p className="text-xs text-muted-foreground">{getChunkDisplayDate(chunk.date)}</p>
                    </div>
                    <span className="text-muted-foreground">{formatClockTime(chunk.scheduledClockTime)}</span>
                    <select
                      value={chunk.status}
                      onChange={(event) => onUpdateStatus(chunk, event.target.value as ScheduleStatus)}
                      className={`h-8 rounded-md border px-2 text-xs font-semibold outline-none ${statusStyles[chunk.status]}`}
                    >
                      <option value="pending">Pending</option>
                      <option value="done">Done</option>
                      <option value="skipped">Skipped</option>
                    </select>
                  </div>
                ))}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};

const HabitTemplateView = ({
  plans,
  onUpdateStatus,
}: {
  plans: LearningVideoPlan[];
  onUpdateStatus: (chunk: ScheduleChunk, status: ScheduleStatus) => void;
}) => {
  if (plans.length === 0) {
    return <EmptyPanel title="Learning template is empty" body="Added videos will appear as separate learning habit rows with streaks and progress." />;
  }

  return (
    <div className="rounded-xl border border-border bg-card p-5">
      <div className="mb-5 flex flex-col gap-2 md:flex-row md:items-end md:justify-between">
        <div>
          <h2 className="font-display text-xl font-bold text-foreground">{LEARNING_TEMPLATE_NAME}</h2>
          <p className="text-sm text-muted-foreground">Separate from your regular habits, focused only on scheduled course chunks.</p>
        </div>
        <Badge>{plans.reduce((total, plan) => total + plan.habitEntries.filter((entry) => entry.completed).length, 0)} chunks done</Badge>
      </div>

      <div className="space-y-4">
        {plans.map((plan) => {
          const summary = getCompletionSummary(plan);
          const nextChunk = plan.chunks.find((chunk) => chunk.status === "pending") || plan.chunks[plan.chunks.length - 1];

          return (
            <div key={plan.video.id} className="rounded-xl border border-border bg-secondary/30 p-4">
              <div className="mb-4 flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
                <div className="flex min-w-0 gap-3">
                  <img src={plan.video.thumbnailUrl} alt="" className="h-14 w-20 rounded-md object-cover" />
                  <div className="min-w-0">
                    <h3 className="truncate font-semibold text-foreground">{plan.video.title}</h3>
                    <p className="text-xs text-muted-foreground">
                      Next: Day {nextChunk?.dayNumber} at {nextChunk ? formatClockTime(nextChunk.scheduledClockTime) : "done"}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <span className="flex items-center gap-1 rounded-full bg-streak/10 px-2.5 py-1 text-xs font-semibold text-streak">
                    <Flame className="h-3 w-3" />
                    {summary.streak} streak
                  </span>
                  <span className="rounded-full bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary">
                    {summary.progress}%
                  </span>
                </div>
              </div>

              <Progress value={summary.progress} className="mb-4 h-2" />

              <div className="grid gap-2 sm:grid-cols-2 lg:grid-cols-4">
                {plan.chunks.slice(0, 12).map((chunk) => (
                  <button
                    key={chunk.id}
                    onClick={() => onUpdateStatus(chunk, chunk.status === "done" ? "pending" : "done")}
                    className={`rounded-lg border p-3 text-left transition-colors ${statusStyles[chunk.status]}`}
                  >
                    <span className="block text-xs font-semibold">Day {chunk.dayNumber}</span>
                    <span className="mt-1 block text-xs">
                      {chunk.videoStartTimestamp} - {chunk.videoEndTimestamp}
                    </span>
                    <span className="mt-2 block text-[11px] font-semibold uppercase">{statusLabels[chunk.status]}</span>
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const ProgressView = ({
  plans,
}: {
  plans: LearningVideoPlan[];
  
}) => {
  if (plans.length === 0) {
    return <EmptyPanel title="Progress starts after your first course" body="Your watched hours, remaining days, and on-track signals will appear here." />;
  }

  return (
    <div className="grid gap-5 lg:grid-cols-2">
      {plans.map((plan) => {
        const summary = getCompletionSummary(plan);
        const ringStyle = {
          background: `conic-gradient(hsl(var(--primary)) ${summary.progress * 3.6}deg, hsl(var(--secondary)) 0deg)`,
        };

        return (
          <div key={plan.video.id} className="rounded-xl border border-border bg-card p-5">
            <div className="mb-5 flex gap-4">
              <div className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full" style={ringStyle}>
                <div className="flex h-16 w-16 items-center justify-center rounded-full bg-card">
                  <span className="font-display text-lg font-bold text-foreground">{summary.progress}%</span>
                </div>
              </div>
              <div className="min-w-0">
                <h3 className="line-clamp-2 font-display text-lg font-bold text-foreground">{plan.video.title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">
                  {summary.onTrack ? "On track" : "Needs attention"} - {summary.remainingDays} days remaining
                </p>
              </div>
            </div>

            <div className="grid grid-cols-3 gap-3">
              <MiniMetric icon={Timer} label="Watched" value={formatCompactDuration(summary.watchedSeconds)} />
              <MiniMetric icon={CalendarDays} label="Remaining" value={`${summary.remainingDays}d`} />
              <MiniMetric icon={TrendingUp} label="Daily" value={formatCompactDuration(plan.video.dailyChunkSeconds)} />
            </div>
          </div>
        );
      })}
    </div>
  );
};

const Badge = ({ children }: { children: React.ReactNode }) => (
  <span className="rounded-full border border-border bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">{children}</span>
);

const MiniMetric = ({ icon: Icon, label, value }: { icon: LucideIcon; label: string; value: string }) => (
  <div className="rounded-lg border border-border bg-secondary/40 p-3">
    <Icon className="mb-2 h-4 w-4 text-primary" />
    <p className="text-[11px] font-semibold uppercase text-muted-foreground">{label}</p>
    <p className="mt-1 font-display text-lg font-bold text-foreground">{value}</p>
  </div>
);

export default Learning;
