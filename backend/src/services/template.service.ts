import slugify from "slugify";
import { Subscription } from "../models/Subscription";
import { TemplateCatalog, type ITemplateCatalog, type TemplateUnlockTier } from "../models/TemplateCatalog";
import { TemplateProgress } from "../models/TemplateProgress";
import { getAccessTier, type SubscriptionTier } from "./subscription.service";

const formatCatalogTemplate = (
  row: ITemplateCatalog | null,
  _accessTier: SubscriptionTier = "free",
  _isAdmin = false
) => {
  if (!row) return null;
  return {
    id: row.id,
    templateId: row.templateId,
    name: row.name,
    description: row.description,
    icon: row.icon,
    color: row.color,
    month: row.month,
    year: row.year,
    totalDays: row.totalDays,
    habits: row.habits,
    unlockTier: row.unlockTier,
    isActive: row.isActive,
    sortOrder: row.sortOrder,
    // Every template is free now; the fields stay for older clients.
    locked: false,
    canUse: true,
    createdAt: row.createdAt.toISOString(),
    updatedAt: row.updatedAt.toISOString(),
  };
};

const getAccessTierForUser = async (userId?: string): Promise<SubscriptionTier> => {
  if (!userId) return "free";
  const subscription = await Subscription.findOne({ user: userId });
  return getAccessTier(subscription);
};

const objectToMapSafe = (input: Record<string, Record<number, boolean>>) => {
  const output: Record<string, Record<string, boolean>> = {};
  for (const [habitId, days] of Object.entries(input)) {
    output[habitId] = Object.fromEntries(
      Object.entries(days).map(([day, value]) => [String(day), Boolean(value)])
    );
  }
  return output;
};

export const templateService = {
  async listCatalog(userId?: string, includeInactive = false, isAdmin = false) {
    const query = includeInactive ? {} : { isActive: true };
    const [rows, accessTier] = await Promise.all([
      TemplateCatalog.find(query).sort({ sortOrder: 1, createdAt: -1 }),
      getAccessTierForUser(userId),
    ]);
    return {
      accessTier,
      templates: rows.map((row) => formatCatalogTemplate(row, accessTier, isAdmin)),
    };
  },

  async canUseTemplate(_userId: string, _templateId: string, _isAdmin = false) {
    // Premium was removed: every catalog template is available to everyone.
    return true;
  },

  async createCatalogTemplate(
    adminId: string,
    input: {
      templateId?: string;
      name: string;
      description: string;
      icon?: string;
      color?: string;
      month?: string;
      year?: number;
      totalDays: number;
      habits: { habitId: string; name: string; icon: string }[];
      unlockTier: TemplateUnlockTier;
      isActive?: boolean;
      sortOrder?: number;
    }
  ) {
    const templateId = slugify(input.templateId || input.name, { lower: true, strict: true });
    const row = await TemplateCatalog.create({
      ...input,
      templateId,
      createdBy: adminId,
    });
    return formatCatalogTemplate(row);
  },

  async updateCatalogTemplate(
    templateId: string,
    input: Partial<{
      name: string;
      description: string;
      icon: string;
      color: string;
      month: string;
      year: number;
      totalDays: number;
      habits: { habitId: string; name: string; icon: string }[];
      unlockTier: TemplateUnlockTier;
      isActive: boolean;
      sortOrder: number;
    }>
  ) {
    const row = await TemplateCatalog.findOneAndUpdate(
      { templateId },
      { $set: input },
      { new: true, runValidators: true }
    );
    return formatCatalogTemplate(row);
  },

  async deactivateCatalogTemplate(templateId: string) {
    const row = await TemplateCatalog.findOneAndUpdate(
      { templateId },
      { $set: { isActive: false } },
      { new: true, runValidators: true }
    );
    return formatCatalogTemplate(row);
  },

  async list(userId: string) {
    const rows = await TemplateProgress.find({ user: userId }).sort({ updatedAt: -1 });
    return rows.map((row) => ({
      id: row.id,
      templateId: row.templateId,
      templateName: row.templateName,
      habits: row.habits,
      completions: Object.fromEntries(row.completions || new Map()),
      totalDays: row.totalDays,
      moodRatings: row.moodRatings || {},
      notes: row.notes || "",
      updatedAt: row.updatedAt.toISOString(),
    }));
  },

  async upsert(userId: string, input: {
    templateId: string;
    templateName: string;
    habits: { habitId: string; name: string; icon: string }[];
    completions: Record<string, Record<number, boolean>>;
    totalDays: number;
    moodRatings?: Record<number, number>;
    notes?: string;
  }) {
    const row = await TemplateProgress.findOneAndUpdate(
      { user: userId, templateId: input.templateId },
      {
        $set: {
          templateName: input.templateName,
          habits: input.habits,
          completions: objectToMapSafe(input.completions),
          totalDays: input.totalDays,
          moodRatings: input.moodRatings || {},
          notes: input.notes,
        },
      },
      { new: true, upsert: true, setDefaultsOnInsert: true }
    );
    return row;
  },

  async remove(userId: string, templateId: string) {
    await TemplateProgress.findOneAndDelete({ user: userId, templateId });
  },
};
