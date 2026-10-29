export interface GamificationMetrics {
  totalCompletions: number;
  longestStreak: number;
  currentStreak: number;
  level: number;
  earlyBird: boolean;
  nightOwl: boolean;
  templatesUsed: number;
  bestDayCompletions: number;
  completedToday: number;
  todayXP: number;
  weeklyCompleted: number;
  gamesPlayedToday: number;
  hasNoteToday: boolean;
}

export interface AchievementDefinition {
  id: string;
  title: string;
  description: string;
  xpReward: number;
  check: (metrics: GamificationMetrics) => boolean;
}

export const ACHIEVEMENTS: AchievementDefinition[] = [
  {
    id: "first_step",
    title: "First Step",
    description: "Complete your first habit",
    xpReward: 10,
    check: (m) => m.totalCompletions >= 1,
  },
  {
    id: "week_warrior",
    title: "Week Warrior",
    description: "7-day streak",
    xpReward: 50,
    check: (m) => m.longestStreak >= 7,
  },
  {
    id: "month_master",
    title: "Month Master",
    description: "30-day streak",
    xpReward: 200,
    check: (m) => m.longestStreak >= 30,
  },
  {
    id: "century_club",
    title: "Century Club",
    description: "100 habits completed",
    xpReward: 100,
    check: (m) => m.totalCompletions >= 100,
  },
  {
    id: "early_bird",
    title: "Early Bird",
    description: "Complete habits before 8 AM",
    xpReward: 30,
    check: (m) => m.earlyBird,
  },
  {
    id: "champion",
    title: "Champion",
    description: "Reach Level 20",
    xpReward: 500,
    check: (m) => m.level >= 20,
  },
  {
    id: "night_owl",
    title: "Night Owl",
    description: "Complete habits after 10 PM",
    xpReward: 25,
    check: (m) => m.nightOwl,
  },
  {
    id: "iron_will",
    title: "Iron Will",
    description: "50-day streak",
    xpReward: 350,
    check: (m) => m.longestStreak >= 50,
  },
  {
    id: "explorer",
    title: "Explorer",
    description: "Try 10 different templates",
    xpReward: 75,
    check: (m) => m.templatesUsed >= 10,
  },
  {
    id: "diamond_habit",
    title: "Diamond Habit",
    description: "500 habits completed",
    xpReward: 1000,
    check: (m) => m.totalCompletions >= 500,
  },
  {
    id: "speed_demon",
    title: "Speed Demon",
    description: "Complete 5 habits in one day",
    xpReward: 60,
    check: (m) => m.bestDayCompletions >= 5,
  },
  {
    id: "summit",
    title: "Summit",
    description: "Reach Level 25",
    xpReward: 800,
    check: (m) => m.level >= 25,
  },
];

export interface ChallengeDefinition {
  id: string;
  title: string;
  xpReward: number;
  target: number;
  progress: (metrics: GamificationMetrics) => number;
}

export const DAILY_CHALLENGES: ChallengeDefinition[] = [
  {
    id: "habits_5",
    title: "Complete 5 habits today",
    xpReward: 30,
    target: 5,
    progress: (m) => m.completedToday,
  },
  {
    id: "keep_streak",
    title: "Maintain your streak",
    xpReward: 15,
    target: 1,
    progress: (m) => (m.completedToday > 0 ? 1 : 0),
  },
  {
    id: "games_2",
    title: "Play 2 mini games",
    xpReward: 20,
    target: 2,
    progress: (m) => m.gamesPlayedToday,
  },
  {
    id: "note_today",
    title: "Add a note to a habit",
    xpReward: 10,
    target: 1,
    progress: (m) => (m.hasNoteToday ? 1 : 0),
  },
];

export interface GameDefinition {
  id: string;
  xpReward: number;
}

export const GAMES: GameDefinition[] = [
  { id: "tap_frenzy", xpReward: 15 },
  { id: "memory_match", xpReward: 30 },
  { id: "habit_quiz", xpReward: 25 },
  { id: "reflex_rush", xpReward: 20 },
  { id: "streak_saver", xpReward: 35 },
  { id: "count_master", xpReward: 20 },
  { id: "pattern_pro", xpReward: 40 },
  { id: "speed_sort", xpReward: 25 },
  { id: "focus_zone", xpReward: 30 },
  { id: "balance_beam", xpReward: 45 },
];
