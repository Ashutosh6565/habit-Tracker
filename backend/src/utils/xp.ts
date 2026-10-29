export const XP_PER_LEVEL = 100;

export const levelFromXp = (xp: number) => Math.floor(Math.max(0, xp) / XP_PER_LEVEL) + 1;

export const xpIntoLevel = (xp: number) => Math.max(0, xp) % XP_PER_LEVEL;
