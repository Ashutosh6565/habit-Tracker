export const GUEST_TRACKER_HABITS_KEY = "habbiters_guest_tracker_habits";
export const GUEST_TEMPLATE_DATA_KEY = "habbiters_guest_template_data";
export const GUEST_LEARNING_PLANS_KEY = "habbiters_guest_learning_plans";

export const readGuestJson = <T>(key: string, fallback: T): T => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
};

export const writeGuestJson = (key: string, value: unknown) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage full or unavailable — guest data simply won't persist
  }
};

export const removeGuestKey = (key: string) => {
  try {
    localStorage.removeItem(key);
  } catch {
    // ignore
  }
};
