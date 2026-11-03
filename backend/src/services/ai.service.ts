import { env } from "../config/env";
import { logger } from "../utils/logger";
import { templateService } from "./template.service";

export const AI_FOCUS_AREAS = [
  "Sleep",
  "Fitness",
  "Focus",
  "Study",
  "Money",
  "Calm",
  "Health",
  "Creative",
] as const;

export type AiFocusArea = (typeof AI_FOCUS_AREAS)[number];
export type AiExperience = "new" | "some" | "consistent";

export interface AiRecommendInput {
  goal?: string;
  focusAreas: AiFocusArea[];
  minutesPerDay: number;
  experience: AiExperience;
}

interface CatalogTemplate {
  templateId: string;
  name: string;
  description: string;
  icon: string;
  habits: { habitId: string; name: string; icon: string }[];
}

export interface AiRecommendation extends CatalogTemplate {
  reason: string;
}

export interface AiRecommendationResponse {
  source: "gemini" | "rules";
  summary: string;
  recommendations: AiRecommendation[];
}

const FOCUS_KEYWORDS: Record<AiFocusArea, string[]> = {
  Sleep: ["sleep", "insomnia", "night", "evening", "wind-down", "rest", "wake", "bedtime"],
  Fitness: ["fitness", "gym", "workout", "run", "strength", "muscle", "weight", "steps", "yoga", "move"],
  Focus: ["focus", "deep work", "distraction", "productiv", "phone", "social media", "flow"],
  Study: ["study", "exam", "learn", "read", "book", "course", "college", "school", "language"],
  Money: ["money", "saving", "budget", "invest", "spend", "finance", "debt", "wealth"],
  Calm: ["calm", "stress", "anxiety", "mindful", "medit", "breath", "mental", "gratitude"],
  Health: ["health", "water", "nutrition", "diet", "skin", "posture", "energy", "meal", "doctor"],
  Creative: ["creative", "write", "draw", "music", "art", "design", "journal", "photo"],
};

const FOCUS_CATEGORY: Record<AiFocusArea, string> = {
  Sleep: "Health",
  Fitness: "Fitness",
  Focus: "Work",
  Study: "Study",
  Money: "Finance",
  Calm: "Health",
  Health: "Health",
  Creative: "Personal",
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "have", "want", "need", "would", "like",
  "more", "less", "every", "day", "daily", "each", "into", "from", "about", "really",
  "some", "when", "then", "than", "very", "just", "also", "get", "make", "feel", "more",
]);

const tokenize = (input: string) =>
  Array.from(
    new Set(
      input
        .toLowerCase()
        .split(/[^a-z0-9]+/)
        .filter((token) => token.length > 2 && !STOP_WORDS.has(token))
    )
  );

const templateCategory = (template: CatalogTemplate) => {
  const text = `${template.name} ${template.description}`.toLowerCase();
  if (/money|financ|saving|invest|budget|wealth|debt|expense/.test(text)) return "Finance";
  if (/fitness|gym|workout|running|\brun\b|yoga|strength|muscle|sport|swim|cycl|walk|weight loss|marathon|cardio/.test(text)) {
    return "Fitness";
  }
  if (/health|sleep|hydrat|nutrition|diet|water|wellness|self-care|medit|mindful|skin|posture|energy|stress/.test(text)) {
    return "Health";
  }
  if (/study|learn|exam|read|book|language|school|college|revision|notes|course|skill|journal|academic/.test(text)) {
    return "Study";
  }
  if (/work|productiv|focus|career|business|deep|office|project|cod(e|ing)|entrepreneur|network/.test(text)) {
    return "Work";
  }
  return "Personal";
};

const stableNoise = (value: string) => {
  let hash = 0;
  for (let index = 0; index < value.length; index += 1) {
    hash = (hash * 31 + value.charCodeAt(index)) % 997;
  }
  return (hash % 100) / 100;
};

const loadCatalog = async (): Promise<CatalogTemplate[]> => {
  const { templates } = await templateService.listCatalog();
  return templates
    .filter((row): row is NonNullable<typeof row> => Boolean(row))
    .map((row) => ({
      templateId: row.templateId,
      name: row.name,
      description: row.description,
      icon: row.icon,
      habits: row.habits.map((habit) => ({ habitId: habit.habitId, name: habit.name, icon: habit.icon })),
    }));
};

const timeFitScore = (habitCount: number, input: AiRecommendInput) => {
  let score = 0;
  if (input.minutesPerDay <= 15) score += habitCount <= 5 ? 7 : -3;
  else if (input.minutesPerDay >= 45) score += habitCount >= 7 ? 3 : 0;

  if (input.experience === "new") score += habitCount <= 5 ? 6 : -2;
  if (input.experience === "consistent") score += habitCount >= 7 ? 4 : 0;
  return score;
};

const buildReason = (template: CatalogTemplate, input: AiRecommendInput) => {
  const focus = input.focusAreas.slice(0, 2).map((area) => area.toLowerCase()).join(" and ");
  const lead = focus ? `Built around ${focus}` : "Matched to the goal you described";
  const pace =
    input.minutesPerDay <= 15
      ? "short habits that fit a busy day"
      : `${template.habits.length} habits that fit ${input.minutesPerDay} minutes a day`;
  const level = input.experience === "new" && template.habits.length <= 5 ? ", beginner-friendly" : "";
  return `${lead} — ${pace}${level}.`;
};

const buildSummary = (input: AiRecommendInput) => {
  const focus = input.focusAreas.length
    ? input.focusAreas.slice(0, 3).map((area) => area.toLowerCase()).join(", ")
    : `the goal you described`;
  return `Picked for ${focus} with about ${input.minutesPerDay} minutes a day. Start with one routine, then add the rest when it sticks.`;
};

const applyPicks = (
  catalog: CatalogTemplate[],
  picks: { templateId: string; reason: string }[]
): AiRecommendation[] => {
  const byId = new Map(catalog.map((template) => [template.templateId, template]));
  const seen = new Set<string>();
  const rows: AiRecommendation[] = [];
  for (const pick of picks) {
    const template = byId.get(String(pick.templateId));
    if (!template || seen.has(template.templateId)) continue;
    seen.add(template.templateId);
    rows.push({ ...template, reason: String(pick.reason || "").trim().slice(0, 180) });
    if (rows.length === 3) break;
  }
  return rows;
};

const ruleBasedRecommendation = (
  catalog: CatalogTemplate[],
  input: AiRecommendInput
): AiRecommendationResponse => {
  const tokens = tokenize(`${input.goal || ""} ${input.focusAreas.join(" ")}`);
  const focusCategories = new Set(input.focusAreas.map((area) => FOCUS_CATEGORY[area]));

  const scored = catalog
    .map((template) => {
      const name = template.name.toLowerCase();
      const description = template.description.toLowerCase();
      const habits = template.habits.map((habit) => habit.name.toLowerCase()).join(" ");
      let score = 0;

      for (const token of tokens) {
        if (name.includes(token)) score += 4;
        if (description.includes(token)) score += 2;
        if (habits.includes(token)) score += 1;
      }

      for (const area of input.focusAreas) {
        if (FOCUS_KEYWORDS[area].some((word) => `${name} ${description} ${habits}`.includes(word))) score += 6;
      }

      if (focusCategories.has(templateCategory(template))) score += 4;
      score += timeFitScore(template.habits.length, input);
      score += stableNoise(template.templateId);
      return { template, score };
    })
    .sort((left, right) => right.score - left.score);

  const picks = scored.slice(0, 3).map(({ template }) => ({
    templateId: template.templateId,
    reason: buildReason(template, input),
  }));

  return {
    source: "rules",
    summary: buildSummary(input),
    recommendations: applyPicks(catalog, picks),
  };
};

interface GeminiPayload {
  candidates?: { content?: { parts?: { text?: string }[] } }[];
}

const geminiRecommendation = async (
  catalog: CatalogTemplate[],
  input: AiRecommendInput
): Promise<AiRecommendationResponse | null> => {
  if (!env.gemini.apiKey) return null;

  const catalogText = catalog
    .map(
      (template) =>
        `- ${template.templateId} | ${template.name} | ${template.description} | habits: ${template.habits
          .map((habit) => habit.name)
          .join(", ")}`
    )
    .join("\n");

  const prompt = [
    "Profile",
    `Goal: ${input.goal?.trim() || "not specified"}`,
    `Focus areas: ${input.focusAreas.length ? input.focusAreas.join(", ") : "not specified"}`,
    `Time available: ${input.minutesPerDay} minutes per day`,
    `Experience: ${input.experience}`,
    "",
    "Catalog (choose only from these ids):",
    catalogText,
    "",
    "Pick the three routines that best fit this person. Respect their available time and experience level.",
    "Return JSON with a one-sentence summary and exactly three recommendations.",
    "Each reason must be one short sentence (max 18 words), concrete and personal. Never invent template ids.",
  ].join("\n");

  // The flash model answers 503 while it is saturated, so fall back to the
  // preview model and keep every attempt inside a 25s budget.
  const models = [env.gemini.model, "gemini-3-flash-preview"];
  const deadline = Date.now() + 25_000;
  const maxAttempts = 3;
  const retryPause = (attempt: number) =>
    new Promise((resolve) => setTimeout(resolve, 600 * attempt));
  for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
    const remaining = deadline - Date.now();
    if (remaining < 1_000) break;
    const model = models[Math.min(attempt - 1, models.length - 1)];
    try {
      const response = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-goog-api-key": env.gemini.apiKey,
          },
          body: JSON.stringify({
            systemInstruction: {
              parts: [
                {
                  text:
                    "You are Habbiters' habit coach. You recommend beginner-friendly routines from a fixed catalog. " +
                    "You are warm, specific and honest. You never mention medical, financial or mental-health outcomes.",
                },
              ],
            },
            contents: [{ role: "user", parts: [{ text: prompt }] }],
            generationConfig: {
              temperature: 0.4,
              maxOutputTokens: 768,
              thinkingConfig: { thinkingLevel: "LOW" },
              responseMimeType: "application/json",
              responseSchema: {
                type: "object",
                properties: {
                  summary: { type: "string" },
                  recommendations: {
                    type: "array",
                    items: {
                      type: "object",
                      properties: {
                        templateId: { type: "string" },
                        reason: { type: "string" },
                      },
                      required: ["templateId", "reason"],
                    },
                  },
                },
                required: ["summary", "recommendations"],
              },
            },
          }),
          signal: AbortSignal.timeout(remaining),
        }
      );

      if (!response.ok) {
        const detail = await response.text().catch(() => "");
        logger.warn("Gemini recommendation request failed", {
          status: response.status,
          attempt,
          model,
          detail: detail.slice(0, 300),
        });
        const retryable = response.status === 429 || response.status >= 500;
        if (!retryable || attempt === maxAttempts) return null;
        await retryPause(attempt);
        continue;
      }

      const payload = (await response.json()) as GeminiPayload;
      const text = (payload.candidates?.[0]?.content?.parts || [])
        .map((part) => part.text || "")
        .join("")
        .trim();
      if (!text) return null;

      const parsed = JSON.parse(text.replace(/^```(?:json)?/i, "").replace(/```$/, "").trim()) as {
        summary?: string;
        recommendations?: { templateId?: string; reason?: string }[];
      };

      const picks = (parsed.recommendations || [])
        .filter((row): row is { templateId: string; reason?: string } => Boolean(row?.templateId))
        .map((row) => ({ templateId: String(row.templateId), reason: String(row.reason || "") }));
      const recommendations = applyPicks(catalog, picks);
      if (recommendations.length < 2) return null;

      return {
        source: "gemini",
        summary: String(parsed.summary || "").trim().slice(0, 240) || buildSummary(input),
        recommendations,
      };
    } catch (error) {
      logger.warn("Gemini recommendation unavailable, using rules", {
        attempt,
        error: error instanceof Error ? error.message : error,
      });
      const aborted =
        error instanceof Error && /abort|timeout/i.test(`${error.name} ${error.message}`);
      if (aborted || attempt === maxAttempts) return null;
      await retryPause(attempt);
    }
  }
  return null;
};

export const aiService = {
  async recommend(input: AiRecommendInput): Promise<AiRecommendationResponse> {
    const catalog = await loadCatalog();
    if (!catalog.length) {
      return {
        source: "rules",
        summary: "Templates are loading. Try again in a moment.",
        recommendations: [],
      };
    }

    if (env.gemini.apiKey) {
      const result = await geminiRecommendation(catalog, input);
      if (result) return result;
    }

    return ruleBasedRecommendation(catalog, input);
  },
};
