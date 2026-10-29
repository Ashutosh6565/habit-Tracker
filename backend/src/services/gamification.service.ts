import { differenceInCalendarDays, endOfWeek, format, parseISO, startOfWeek, subDays } from "date-fns";
import { Types } from "mongoose";
import {
  ACHIEVEMENTS,
  DAILY_CHALLENGES,
  GAMES,
  type GamificationMetrics,
} from "../config/gamification";
import { GameClaim } from "../models/GameClaim";
import { HabitProgress } from "../models/HabitProgress";
import { TemplateProgress } from "../models/TemplateProgress";
import { User } from "../models/User";
import { UserAchievement } from "../models/UserAchievement";
import { XpEvent } from "../models/XpEvent";
import { AppError } from "../utils/AppError";
import { XP_PER_LEVEL, levelFromXp, xpIntoLevel } from "../utils/xp";
import { xpService } from "./xp.service";

const todayKey = () => format(new Date(), "yyyy-MM-dd");

interface ProgressRow {
  habit: Types.ObjectId;
  date: string;
  completedAt?: Date;
  xpEarned: number;
}

const longestRun = (dates: Set<string>) => {
  const sorted = [...dates].sort();
  let best = 0;
  let run = 0;
  let previous: Date | null = null;
  for (const value of sorted) {
    const current = parseISO(value);
    run = previous && differenceInCalendarDays(current, previous) === 1 ? run + 1 : 1;
    best = Math.max(best, run);
    previous = current;
  }
  return best;
};

const currentRun = (dates: Set<string>) => {
  let streak = 0;
  for (let i = 0; i < 366; i += 1) {
    if (!dates.has(format(subDays(new Date(), i), "yyyy-MM-dd"))) break;
    streak += 1;
  }
  return streak;
};

const collectMetrics = async (userId: string): Promise<GamificationMetrics> => {
  const today = todayKey();
  const weekStart = format(startOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");
  const weekEnd = format(endOfWeek(new Date(), { weekStartsOn: 1 }), "yyyy-MM-dd");

  const [rows, weeklyCompleted, templatesUsed, gamesPlayedToday, hasNoteToday] = await Promise.all([
    HabitProgress.find({ user: userId, completed: true })
      .select("habit date completedAt xpEarned")
      .lean<ProgressRow[]>(),
    HabitProgress.countDocuments({
      user: userId,
      completed: true,
      date: { $gte: weekStart, $lte: weekEnd },
    }),
    TemplateProgress.countDocuments({ user: userId }),
    GameClaim.countDocuments({ user: userId, date: today }),
    HabitProgress.exists({
      user: userId,
      date: today,
      note: { $exists: true, $nin: [null, ""] },
    }),
  ]);

  const byHabit = new Map<string, Set<string>>();
  const byDay = new Map<string, number>();
  let earlyBird = false;
  let nightOwl = false;
  let completedToday = 0;
  let todayXP = 0;

  for (const row of rows) {
    const habitId = String(row.habit);
    if (!byHabit.has(habitId)) byHabit.set(habitId, new Set());
    byHabit.get(habitId)!.add(row.date);
    byDay.set(row.date, (byDay.get(row.date) ?? 0) + 1);

    if (row.date === today) {
      completedToday += 1;
      todayXP += row.xpEarned ?? 0;
    }

    if (row.completedAt) {
      const hour = new Date(row.completedAt).getHours();
      if (hour < 8) earlyBird = true;
      if (hour >= 22) nightOwl = true;
    }
  }

  let longestStreak = 0;
  let currentStreak = 0;
  for (const dates of byHabit.values()) {
    longestStreak = Math.max(longestStreak, longestRun(dates));
    currentStreak = Math.max(currentStreak, currentRun(dates));
  }

  return {
    totalCompletions: rows.length,
    longestStreak,
    currentStreak,
    level: 1,
    earlyBird,
    nightOwl,
    templatesUsed,
    bestDayCompletions: Math.max(0, ...byDay.values()),
    completedToday,
    weeklyCompleted,
    gamesPlayedToday,
    hasNoteToday: Boolean(hasNoteToday),
    todayXP,
  };
};

const syncAchievements = async (userId: string, metrics: GamificationMetrics) => {
  const stored = await UserAchievement.find({ user: userId }).lean();
  const unlocked = new Map(stored.map((row) => [row.achievementId, row.unlockedAt]));

  for (let pass = 0; pass < 3; pass += 1) {
    const eligible = ACHIEVEMENTS.filter(
      (achievement) => !unlocked.has(achievement.id) && achievement.check(metrics)
    );
    if (eligible.length === 0) break;

    for (const achievement of eligible) {
      try {
        await UserAchievement.create({
          user: userId,
          achievementId: achievement.id,
          xpAwarded: achievement.xpReward,
          unlockedAt: new Date(),
        });
      } catch (error) {
        if ((error as { code?: number }).code !== 11000) throw error;
      }
      await xpService.award(
        userId,
        "achievement",
        `achievement:${achievement.id}`,
        achievement.xpReward,
        `Unlocked ${achievement.title}`
      );
      unlocked.set(achievement.id, new Date());
    }

    metrics.level = levelFromXp(await xpService.lifetimeXp(userId));
  }

  return unlocked;
};

const computeStreaks = async (userIds: string[]) => {
  if (userIds.length === 0) return new Map<string, number>();
  const since = format(subDays(new Date(), 366), "yyyy-MM-dd");
  const rows = await HabitProgress.find({
    user: { $in: userIds },
    completed: true,
    date: { $gte: since },
  })
    .select("user habit date")
    .lean<Array<{ user: Types.ObjectId; habit: Types.ObjectId; date: string }>>();

  const byUser = new Map<string, Map<string, Set<string>>>();
  for (const row of rows) {
    const userId = String(row.user);
    if (!byUser.has(userId)) byUser.set(userId, new Map());
    const habits = byUser.get(userId)!;
    const habitId = String(row.habit);
    if (!habits.has(habitId)) habits.set(habitId, new Set());
    habits.get(habitId)!.add(row.date);
  }

  const streaks = new Map<string, number>();
  for (const [userId, habits] of byUser) {
    let best = 0;
    for (const dates of habits.values()) best = Math.max(best, currentRun(dates));
    streaks.set(userId, best);
  }
  return streaks;
};

export const gamificationService = {
  async overview(userId: string) {
    const today = todayKey();
    const metrics = await collectMetrics(userId);
    metrics.level = levelFromXp(await xpService.lifetimeXp(userId));

    const claims = await GameClaim.find({ user: userId, date: today }).select("gameId").lean();
    const claimedGames = new Set(claims.map((claim) => claim.gameId));

    const challengeRefs = DAILY_CHALLENGES.map((challenge) => `challenge:${challenge.id}:${today}`);
    const awardedRefs = new Set(
      (await XpEvent.find({ user: userId, ref: { $in: challengeRefs } }).select("ref").lean()).map(
        (event) => event.ref
      )
    );

    const challenges = [];
    for (const challenge of DAILY_CHALLENGES) {
      const ref = `challenge:${challenge.id}:${today}`;
      const progress = Math.min(challenge.target, challenge.progress(metrics));
      const completed = progress >= challenge.target;
      let claimed = awardedRefs.has(ref);
      if (completed && !claimed) {
        claimed = await xpService.award(
          userId,
          "challenge",
          ref,
          challenge.xpReward,
          challenge.title
        );
      }
      challenges.push({
        id: challenge.id,
        title: challenge.title,
        xpReward: challenge.xpReward,
        target: challenge.target,
        progress,
        completed,
        claimed,
      });
    }

    const unlocked = await syncAchievements(userId, metrics);
    const totalXP = await xpService.lifetimeXp(userId);

    return {
      stats: {
        totalXP,
        todayXP: metrics.todayXP,
        level: levelFromXp(totalXP),
        xpIntoLevel: xpIntoLevel(totalXP),
        xpForNextLevel: XP_PER_LEVEL,
        bestStreak: metrics.currentStreak,
        longestStreak: metrics.longestStreak,
        completedToday: metrics.completedToday,
        weeklyCompleted: metrics.weeklyCompleted,
        totalCompletions: metrics.totalCompletions,
        gamesPlayedToday: metrics.gamesPlayedToday,
      },
      achievements: ACHIEVEMENTS.map((achievement) => ({
        id: achievement.id,
        title: achievement.title,
        description: achievement.description,
        xpReward: achievement.xpReward,
        unlocked: unlocked.has(achievement.id),
        unlockedAt: unlocked.get(achievement.id) ?? null,
      })),
      challenges,
      games: GAMES.map((game) => ({
        id: game.id,
        xpReward: game.xpReward,
        claimedToday: claimedGames.has(game.id),
      })),
    };
  },

  async claimGame(userId: string, gameId: string) {
    const game = GAMES.find((entry) => entry.id === gameId);
    if (!game) throw new AppError("Game not found", 404, "GAME_NOT_FOUND");

    const date = todayKey();
    const existing = await GameClaim.findOne({ user: userId, gameId, date });
    if (existing) {
      throw new AppError("You already claimed this game's XP today.", 409, "GAME_ALREADY_CLAIMED");
    }

    try {
      await GameClaim.create({ user: userId, gameId, date, xpAwarded: game.xpReward });
    } catch (error) {
      if ((error as { code?: number }).code === 11000) {
        throw new AppError("You already claimed this game's XP today.", 409, "GAME_ALREADY_CLAIMED");
      }
      throw error;
    }

    await xpService.award(
      userId,
      "game",
      `game:${gameId}:${date}`,
      game.xpReward,
      `Played ${gameId}`
    );
    const totalXP = await xpService.lifetimeXp(userId);

    return {
      gameId,
      xpEarned: game.xpReward,
      totalXP,
      level: levelFromXp(totalXP),
      xpIntoLevel: xpIntoLevel(totalXP),
      xpForNextLevel: XP_PER_LEVEL,
    };
  },

  async leaderboard(userId: string) {
    const [habitTotals, bonusTotals] = await Promise.all([
      HabitProgress.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $match: { completed: true, xpEarned: { $gt: 0 } } },
        { $group: { _id: "$user", total: { $sum: "$xpEarned" } } },
      ]),
      XpEvent.aggregate<{ _id: Types.ObjectId; total: number }>([
        { $group: { _id: "$user", total: { $sum: "$amount" } } },
      ]),
    ]);

    const xpByUser = new Map<string, number>();
    for (const row of [...habitTotals, ...bonusTotals]) {
      const id = String(row._id);
      xpByUser.set(id, (xpByUser.get(id) ?? 0) + Math.max(0, row.total));
    }
    if (!xpByUser.has(userId)) xpByUser.set(userId, 0);

    const ranked = [...xpByUser.entries()]
      .map(([id, xp]) => ({ userId: id, xp }))
      .sort((a, b) => b.xp - a.xp);

    const selected = ranked.slice(0, 10);
    const currentIndex = ranked.findIndex((entry) => entry.userId === userId);
    if (currentIndex >= selected.length) selected.push(ranked[currentIndex]);

    const users = await User.find({ _id: { $in: selected.map((entry) => entry.userId) } })
      .select("fullName")
      .lean<Array<{ _id: Types.ObjectId; fullName: string }>>();
    const names = new Map(users.map((user) => [String(user._id), user.fullName]));
    const streaks = await computeStreaks(selected.map((entry) => entry.userId));

    return {
      entries: selected.map((entry) => ({
        rank: ranked.findIndex((row) => row.userId === entry.userId) + 1,
        userId: entry.userId,
        name: names.get(entry.userId) || "Habit user",
        xp: entry.xp,
        streak: streaks.get(entry.userId) ?? 0,
        isCurrentUser: entry.userId === userId,
      })),
    };
  },
};
