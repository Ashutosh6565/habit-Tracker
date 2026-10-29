export type CompletionGoalUnit = "days" | "weeks" | "months" | "date";
export type ScheduleStatus = "pending" | "done" | "skipped";
export type SessionSplit = "single" | "double";

export interface CompletionGoal {
  unit: CompletionGoalUnit;
  value: number;
  targetDate?: string;
}

export interface LearningVideo {
  id: string;
  youtubeUrl: string;
  videoId: string;
  title: string;
  thumbnailUrl: string;
  totalDurationSeconds: number;
  targetTotalDays: number;
  dailyChunkSeconds: number;
  scheduledStartTime: string;
  splitIntoSessions: boolean;
  sessionSplit: SessionSplit;
  createdAt: string;
}

export interface ScheduleChunk {
  id: string;
  videoId: string;
  dayNumber: number;
  date: string;
  videoStartSeconds: number;
  videoEndSeconds: number;
  videoStartTimestamp: string;
  videoEndTimestamp: string;
  scheduledClockTime: string;
  estimatedSessionLengthSeconds: number;
  status: ScheduleStatus;
}

export interface HabitEntry {
  id: string;
  template: "Learning / Video Courses";
  scheduleChunkId: string;
  date: string;
  completed: boolean;
  streakCount: number;
}

export interface LearningVideoPlan {
  video: LearningVideo;
  chunks: ScheduleChunk[];
  habitEntries: HabitEntry[];
}

export interface ScheduleConflict {
  date: string;
  firstVideoId: string;
  secondVideoId: string;
  firstTitle: string;
  secondTitle: string;
  startsAt: string;
}

export interface VideoMetadata {
  videoId: string;
  title: string;
  thumbnailUrl: string;
  totalDurationSeconds?: number;
}

export const LEARNING_TEMPLATE_ID = "learning-video-courses";
export const LEARNING_TEMPLATE_NAME = "Learning / Video Courses";

export const extractYouTubeVideoId = (input: string) => {
  const value = input.trim();
  if (!value) return "";

  try {
    const url = new URL(value);
    const hostname = url.hostname.replace(/^www\./, "");

    if (hostname === "youtu.be") {
      return url.pathname.split("/").filter(Boolean)[0] || "";
    }

    if (hostname.endsWith("youtube.com")) {
      if (url.pathname === "/watch") return url.searchParams.get("v") || "";
      if (url.pathname.startsWith("/shorts/") || url.pathname.startsWith("/embed/")) {
        return url.pathname.split("/").filter(Boolean)[1] || "";
      }
    }
  } catch {
    return "";
  }

  return "";
};

export const isPlaylistUrl = (input: string) => {
  try {
    const url = new URL(input.trim());
    return url.searchParams.has("list") && !url.searchParams.has("v");
  } catch {
    return false;
  }
};

export const parseDurationToSeconds = (input: string) => {
  const value = input.trim();
  if (!value) return 0;

  const parts = value.split(":").map((part) => Number(part));
  if (parts.some((part) => Number.isNaN(part) || part < 0)) return 0;

  if (parts.length === 1) return Math.round(parts[0] * 60);
  if (parts.length === 2) return parts[0] * 60 + parts[1];
  if (parts.length === 3) return parts[0] * 3600 + parts[1] * 60 + parts[2];

  return 0;
};

export const parseIso8601Duration = (duration: string) => {
  const match = duration.match(/^P(?:\d+Y)?(?:\d+M)?(?:\d+W)?(?:\d+D)?T?(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/);
  if (!match) return 0;

  const [, hours = "0", minutes = "0", seconds = "0"] = match;
  return Number(hours) * 3600 + Number(minutes) * 60 + Number(seconds);
};

export const formatVideoTime = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.floor((safeSeconds % 3600) / 60);
  const remainder = safeSeconds % 60;

  return [hours, minutes, remainder].map((value) => String(value).padStart(2, "0")).join(":");
};

export const formatCompactDuration = (seconds: number) => {
  const safeSeconds = Math.max(0, Math.round(seconds));
  const hours = Math.floor(safeSeconds / 3600);
  const minutes = Math.round((safeSeconds % 3600) / 60);

  if (hours > 0 && minutes > 0) return `${hours}h ${minutes}m`;
  if (hours > 0) return `${hours}h`;
  return `${Math.max(1, minutes)}m`;
};

export const toMinutesSinceMidnight = (time: string) => {
  const trimmed = time.trim();
  const meridiemMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)$/i);
  if (meridiemMatch) {
    let hours = Number(meridiemMatch[1]);
    const minutes = Number(meridiemMatch[2]);
    const marker = meridiemMatch[3].toUpperCase();
    if (marker === "PM" && hours !== 12) hours += 12;
    if (marker === "AM" && hours === 12) hours = 0;
    return hours * 60 + minutes;
  }

  const parts = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (!parts) return 0;
  return Number(parts[1]) * 60 + Number(parts[2]);
};

export const formatClockTime = (time: string) => {
  const totalMinutes = toMinutesSinceMidnight(time);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const marker = hours >= 12 ? "PM" : "AM";
  const displayHour = hours % 12 || 12;
  return `${displayHour}:${String(minutes).padStart(2, "0")} ${marker}`;
};

export const normalizeTargetDays = (goal: CompletionGoal, start = new Date()) => {
  if (goal.unit === "weeks") return Math.max(1, Math.ceil(goal.value * 7));
  if (goal.unit === "months") return Math.max(1, Math.ceil(goal.value * 30));
  if (goal.unit === "date" && goal.targetDate) {
    const startDate = new Date(start.getFullYear(), start.getMonth(), start.getDate());
    const targetDate = new Date(`${goal.targetDate}T00:00:00`);
    const diff = Math.ceil((targetDate.getTime() - startDate.getTime()) / 86_400_000) + 1;
    return Math.max(1, diff);
  }
  return Math.max(1, Math.ceil(goal.value));
};

export const getLocalDateString = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
};

export const buildHabitEntriesForChunks = (chunks: ScheduleChunk[]) => {
  let streakCount = 0;

  return chunks.map((chunk) => {
    if (chunk.status === "done") streakCount += 1;
    else streakCount = 0;

    return {
      id: `habit-${chunk.id}`,
      template: LEARNING_TEMPLATE_NAME,
      scheduleChunkId: chunk.id,
      date: chunk.date,
      completed: chunk.status === "done",
      streakCount,
    } satisfies HabitEntry;
  });
};

export const buildLearningVideoPlan = (
  input: Omit<LearningVideo, "targetTotalDays" | "dailyChunkSeconds"> & { targetTotalDays: number; dailyChunkSeconds?: number },
  existingStatuses: Record<string, ScheduleStatus> = {},
  startDate = new Date()
): LearningVideoPlan => {
  const totalDays = Math.max(1, input.targetTotalDays);
  const totalMinutes = Math.max(1, Math.round(input.totalDurationSeconds / 60));
  const baseMinutes = Math.max(1, Math.round(totalMinutes / totalDays));
  const dailyChunkSeconds = baseMinutes * 60;
  const chunks: ScheduleChunk[] = [];
  const planStartDate = new Date(startDate.getFullYear(), startDate.getMonth(), startDate.getDate());

  let cursorSeconds = 0;

  for (let index = 0; index < totalDays; index += 1) {
    const isLastDay = index === totalDays - 1;
    const startSeconds = cursorSeconds;
    const endSeconds = isLastDay
      ? input.totalDurationSeconds
      : Math.min(input.totalDurationSeconds, startSeconds + dailyChunkSeconds);
    const dayDate = new Date(planStartDate);
    dayDate.setDate(planStartDate.getDate() + index);
    const chunkId = `${input.id}-day-${index + 1}`;
    const date = getLocalDateString(dayDate);
    const status = existingStatuses[chunkId] || "pending";

    chunks.push({
      id: chunkId,
      videoId: input.id,
      dayNumber: index + 1,
      date,
      videoStartSeconds: startSeconds,
      videoEndSeconds: endSeconds,
      videoStartTimestamp: formatVideoTime(startSeconds),
      videoEndTimestamp: formatVideoTime(endSeconds),
      scheduledClockTime: input.scheduledStartTime,
      estimatedSessionLengthSeconds: Math.max(0, endSeconds - startSeconds),
      status,
    });

    cursorSeconds = endSeconds;
  }

  return {
    video: {
      ...input,
      targetTotalDays: totalDays,
      dailyChunkSeconds,
    },
    chunks,
    habitEntries: buildHabitEntriesForChunks(chunks),
  };
};

export const recalculateRemainingLearningPlan = (plan: LearningVideoPlan, targetTotalDays: number) => {
  const completedChunks = plan.chunks.filter((chunk) => chunk.status === "done");
  const lastCompletedChunk = completedChunks[completedChunks.length - 1];
  const completedDays = completedChunks.length;
  const remainingStartSeconds = lastCompletedChunk?.videoEndSeconds || 0;
  const remainingSeconds = Math.max(0, plan.video.totalDurationSeconds - remainingStartSeconds);
  const remainingDays = remainingSeconds > 0 ? Math.max(1, Math.ceil(targetTotalDays - completedDays)) : 0;

  if (remainingDays === 0) {
    const chunks = completedChunks.map((chunk, index) => ({ ...chunk, dayNumber: index + 1 }));
    return {
      ...plan,
      video: {
        ...plan.video,
        targetTotalDays: chunks.length,
        dailyChunkSeconds: plan.video.dailyChunkSeconds,
      },
      chunks,
      habitEntries: buildHabitEntriesForChunks(chunks),
    };
  }

  const startDate = lastCompletedChunk ? new Date(`${lastCompletedChunk.date}T00:00:00`) : new Date();
  if (lastCompletedChunk) startDate.setDate(startDate.getDate() + 1);

  const remainingPlan = buildLearningVideoPlan(
    {
      ...plan.video,
      totalDurationSeconds: remainingSeconds,
      targetTotalDays: remainingDays,
    },
    {},
    startDate
  );

  const pendingChunks = remainingPlan.chunks.map((chunk, index) => {
    const videoStartSeconds = chunk.videoStartSeconds + remainingStartSeconds;
    const videoEndSeconds = chunk.videoEndSeconds + remainingStartSeconds;
    const dayNumber = completedDays + index + 1;

    return {
      ...chunk,
      id: `${plan.video.id}-day-${dayNumber}`,
      dayNumber,
      videoStartSeconds,
      videoEndSeconds,
      videoStartTimestamp: formatVideoTime(videoStartSeconds),
      videoEndTimestamp: formatVideoTime(videoEndSeconds),
      status: "pending" as const,
    };
  });

  const chunks = [...completedChunks, ...pendingChunks].map((chunk, index) => ({
    ...chunk,
    dayNumber: index + 1,
  }));

  return {
    ...plan,
    video: {
      ...plan.video,
      targetTotalDays: chunks.length,
      dailyChunkSeconds: remainingPlan.video.dailyChunkSeconds,
    },
    chunks,
    habitEntries: buildHabitEntriesForChunks(chunks),
  };
};

export const getTodayDateString = () => getLocalDateString(new Date());

export const calculateProgressPercent = (chunks: ScheduleChunk[]) => {
  if (chunks.length === 0) return 0;
  return Math.round((chunks.filter((chunk) => chunk.status === "done").length / chunks.length) * 100);
};

export const detectScheduleConflicts = (plans: LearningVideoPlan[]) => {
  const conflicts: ScheduleConflict[] = [];
  const allChunks = plans.flatMap((plan) =>
    plan.chunks.map((chunk) => ({
      ...chunk,
      videoTitle: plan.video.title,
    }))
  );

  for (let i = 0; i < allChunks.length; i += 1) {
    for (let j = i + 1; j < allChunks.length; j += 1) {
      const first = allChunks[i];
      const second = allChunks[j];
      if (first.date !== second.date || first.videoId === second.videoId) continue;

      const firstStart = toMinutesSinceMidnight(first.scheduledClockTime);
      const firstEnd = firstStart + Math.ceil(first.estimatedSessionLengthSeconds / 60);
      const secondStart = toMinutesSinceMidnight(second.scheduledClockTime);
      const secondEnd = secondStart + Math.ceil(second.estimatedSessionLengthSeconds / 60);

      if (firstStart < secondEnd && secondStart < firstEnd) {
        conflicts.push({
          date: first.date,
          firstVideoId: first.videoId,
          secondVideoId: second.videoId,
          firstTitle: first.videoTitle,
          secondTitle: second.videoTitle,
          startsAt: formatClockTime(first.scheduledClockTime),
        });
      }
    }
  }

  return conflicts;
};

export const getFallbackVideoMetadata = (youtubeUrl: string): VideoMetadata | null => {
  const videoId = extractYouTubeVideoId(youtubeUrl);
  if (!videoId) return null;

  return {
    videoId,
    title: `YouTube course ${videoId}`,
    thumbnailUrl: `https://img.youtube.com/vi/${videoId}/hqdefault.jpg`,
  };
};
