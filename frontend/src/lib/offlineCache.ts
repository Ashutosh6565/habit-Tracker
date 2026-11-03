const PREFIX = "habbiters.web.cache.v1";

const keyFor = (userId: string, name: string) => `${PREFIX}.${userId}.${name}`;

type CachedValue<T> = { value: T; savedAt: string };

export const readCache = <T>(userId: string, name: string): T | null => {
  try {
    const raw = localStorage.getItem(keyFor(userId, name));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedValue<T>;
    return parsed && "value" in parsed ? parsed.value : null;
  } catch {
    return null;
  }
};

export const readCacheSavedAt = (userId: string, name: string): string | null => {
  try {
    const raw = localStorage.getItem(keyFor(userId, name));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CachedValue<unknown>;
    return parsed?.savedAt || null;
  } catch {
    return null;
  }
};

export const writeCache = (userId: string, name: string, value: unknown) => {
  try {
    localStorage.setItem(keyFor(userId, name), JSON.stringify({ value, savedAt: new Date().toISOString() }));
  } catch {
    // Quota or privacy mode: the app keeps working from memory.
  }
};

export const clearCache = (userId: string) => {
  try {
    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${PREFIX}.${userId}.`))
      .forEach((key) => localStorage.removeItem(key));
  } catch {
    // ignore
  }
};
