import type { AiFocusArea, AiRecommendResponseDto, TemplateCatalogDto } from "@/lib/api";

const CATEGORY_RULES: { category: string; pattern: RegExp }[] = [
  { category: "Finance", pattern: /money|financ|saving|invest|budget|wealth|debt|expense/i },
  { category: "Fitness", pattern: /fitness|gym|workout|running|\brun\b|yoga|strength|muscle|sport|swim|cycl|walk|weight loss|mobility|sprint|marathon|cardio|stretch/i },
  { category: "Health", pattern: /health|sleep|hydrat|nutrition|diet|water|wellness|self-care|self care|medit|mindful|skin|dental|posture|energy|stress|screens|sugar|meal|food/i },
  { category: "Study", pattern: /study|learn|exam|read|book|language|school|college|revision|notes|course|skill|vocab|math|science|journal|academic/i },
  { category: "Work", pattern: /work|productiv|focus|career|business|deep|office|project|cod(e|ing)|entrepreneur|network|meeting|email/i },
];

export const AI_FOCUS: {
  id: AiFocusArea;
  label: string;
  emoji: string;
  pattern: RegExp;
  category: string;
}[] = [
  { id: "Sleep", label: "Sleep better", emoji: "🌙", pattern: /sleep|night|evening|rest|bedtime|wake/i, category: "Health" },
  { id: "Fitness", label: "Get fit", emoji: "💪", pattern: /fitness|gym|workout|run|strength|muscle|steps|yoga/i, category: "Fitness" },
  { id: "Focus", label: "Focus deeply", emoji: "🎯", pattern: /focus|deep work|distraction|productiv|phone/i, category: "Work" },
  { id: "Study", label: "Study & learn", emoji: "📚", pattern: /study|exam|learn|read|book|course|college|language/i, category: "Study" },
  { id: "Money", label: "Save money", emoji: "💰", pattern: /money|saving|budget|invest|spend|finance|debt/i, category: "Finance" },
  { id: "Calm", label: "Feel calmer", emoji: "🧘", pattern: /calm|stress|anxiety|mindful|medit|breath|gratitude/i, category: "Health" },
  { id: "Health", label: "Feel healthier", emoji: "💧", pattern: /health|water|nutrition|diet|skin|posture|energy|meal/i, category: "Health" },
  { id: "Creative", label: "Create daily", emoji: "✍️", pattern: /creative|write|draw|music|art|design|journal|photo/i, category: "Personal" },
];

export const templateCategory = (template: Pick<TemplateCatalogDto, "name" | "description">) => {
  const haystack = `${template.name} ${template.description}`;
  return CATEGORY_RULES.find((rule) => rule.pattern.test(haystack))?.category || "Personal";
};

export const templateEmoji = (template: TemplateCatalogDto) => template.habits[0]?.icon || "✨";

export const matchesTemplate = (template: TemplateCatalogDto, query: string) => {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return (
    template.name.toLowerCase().includes(needle) ||
    template.description.toLowerCase().includes(needle) ||
    template.habits.some((habit) => habit.name.toLowerCase().includes(needle))
  );
};

const STOP_WORDS = new Set([
  "the", "and", "for", "with", "that", "this", "have", "want", "need", "would", "like",
  "more", "less", "every", "day", "daily", "each", "into", "from", "about", "really",
  "some", "when", "then", "than", "very", "just", "also", "get", "make", "feel",
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

/**
 * Deterministic client-side picks used when the coach API cannot be reached,
 * so the recommendation flow never dead-ends.
 */
export const localRecommendations = (
  templates: TemplateCatalogDto[],
  input: {
    goal: string;
    focusAreas: AiFocusArea[];
    minutesPerDay: number;
    experience: "new" | "some" | "consistent";
  }
): AiRecommendResponseDto => {
  const tokens = tokenize(`${input.goal} ${input.focusAreas.join(" ")}`);
  const focused = input.focusAreas
    .map((id) => AI_FOCUS.find((entry) => entry.id === id))
    .filter((entry): entry is (typeof AI_FOCUS)[number] => Boolean(entry));

  const scoreFor = (template: TemplateCatalogDto) => {
    const name = template.name.toLowerCase();
    const description = template.description.toLowerCase();
    const habits = template.habits.map((habit) => habit.name.toLowerCase()).join(" ");
    const haystack = `${name} ${description} ${habits}`;
    const count = template.habits.length;
    let score = 0;

    for (const token of tokens) {
      if (name.includes(token)) score += 4;
      if (description.includes(token)) score += 2;
      if (habits.includes(token)) score += 1;
    }
    for (const focus of focused) {
      if (focus.pattern.test(haystack)) score += 6;
      if (templateCategory(template) === focus.category) score += 4;
    }
    if (input.minutesPerDay <= 15) score += count <= 5 ? 7 : -3;
    else if (input.minutesPerDay >= 45) score += count >= 7 ? 3 : 0;
    if (input.experience === "new") score += count <= 5 ? 6 : -2;
    if (input.experience === "consistent") score += count >= 7 ? 4 : 0;
    return score;
  };

  const picks = [...templates].sort((left, right) => scoreFor(right) - scoreFor(left)).slice(0, 3);
  const focusText = focused.slice(0, 3).map((focus) => focus.label.toLowerCase()).join(", ");

  return {
    source: "rules",
    summary: `Matched to ${focusText || "the goal you described"} with about ${input.minutesPerDay} minutes a day.`,
    recommendations: picks.map((template) => ({
      templateId: template.templateId,
      name: template.name,
      description: template.description,
      icon: template.icon,
      habits: template.habits,
      reason: `Built around ${focusText || "your goal"} — ${template.habits.length} habits that fit ${input.minutesPerDay} minutes a day.`,
    })),
  };
};
