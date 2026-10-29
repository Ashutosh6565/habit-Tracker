import type { TemplateCatalogDto } from "@/lib/api";

const CATEGORY_RULES: { category: string; pattern: RegExp }[] = [
  { category: "Finance", pattern: /money|financ|saving|invest|budget|wealth|debt|expense/i },
  { category: "Fitness", pattern: /fitness|gym|workout|running|\brun\b|yoga|strength|muscle|sport|swim|cycl|walk|weight loss|mobility|sprint|marathon|cardio|stretch/i },
  { category: "Health", pattern: /health|sleep|hydrat|nutrition|diet|water|wellness|self-care|self care|medit|mindful|skin|dental|posture|energy|stress|screens|sugar|meal|food/i },
  { category: "Study", pattern: /study|learn|exam|read|book|language|school|college|revision|notes|course|skill|vocab|math|science|journal|academic/i },
  { category: "Work", pattern: /work|productiv|focus|career|business|deep|office|project|cod(e|ing)|entrepreneur|network|meeting|email/i },
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
