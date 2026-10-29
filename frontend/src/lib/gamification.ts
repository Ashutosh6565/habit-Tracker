export interface LevelMilestone {
  level: number;
  name: string;
}

export const LEVEL_MILESTONES: LevelMilestone[] = [
  { level: 1, name: "Beginner" },
  { level: 3, name: "Starter" },
  { level: 5, name: "Habit Builder" },
  { level: 8, name: "Focused Mind" },
  { level: 10, name: "Discipline Master" },
  { level: 12, name: "Streak Hunter" },
  { level: 15, name: "Consistency King" },
  { level: 18, name: "Elite Performer" },
  { level: 20, name: "Productivity Legend" },
  { level: 25, name: "Grandmaster" },
];

export const levelName = (level: number) =>
  [...LEVEL_MILESTONES].reverse().find((milestone) => milestone.level <= level)?.name ??
  "Beginner";
