const PREFIX = "habbiters.mobile.v1";

const keyFor = (userId: string, name: string) => `${PREFIX}.${userId}.${name}`;

export const readLocal = <T>(userId: string, name: string): T | null => {
  try {
    const raw = localStorage.getItem(keyFor(userId, name));
    return raw ? (JSON.parse(raw) as T) : null;
  } catch {
    return null;
  }
};

export const writeLocal = (userId: string, name: string, value: unknown) => {
  try {
    localStorage.setItem(keyFor(userId, name), JSON.stringify(value));
  } catch {
    // Storage can be full or blocked; the app keeps working from memory.
  }
};

export const removeLocal = (userId: string, name: string) => {
  try {
    localStorage.removeItem(keyFor(userId, name));
  } catch {
    // ignore
  }
};

export const cacheKey = (name: string) => `cache.${name}`;
