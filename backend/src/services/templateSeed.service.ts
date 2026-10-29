import { SEED_TEMPLATES } from "../data/templateCatalog";
import { TemplateCatalog } from "../models/TemplateCatalog";
import { logger } from "../utils/logger";

/**
 * Inserts any catalog templates that do not exist yet. $setOnInsert is used so
 * admin edits (tier, copy, deactivation) survive future restarts.
 */
export const seedTemplateCatalog = async () => {
  if (SEED_TEMPLATES.length === 0) return;

  const result = await TemplateCatalog.bulkWrite(
    SEED_TEMPLATES.map((template) => ({
      updateOne: {
        filter: { templateId: template.templateId },
        update: {
          $setOnInsert: {
            templateId: template.templateId,
            name: template.name,
            description: template.description,
            icon: template.icon,
            color: template.color,
            month: template.month,
            year: template.year,
            totalDays: template.totalDays,
            habits: template.habits,
            unlockTier: template.unlockTier,
            isActive: true,
            sortOrder: template.sortOrder,
          },
        },
        upsert: true,
      },
    })),
    { ordered: false }
  );

  if (result.upsertedCount > 0) {
    logger.info(`Seeded ${result.upsertedCount} template catalog entries`);
  }

  // Premium was removed: unlock any catalog rows that were created earlier.
  const unlocked = await TemplateCatalog.updateMany(
    { unlockTier: { $ne: "free" } },
    { $set: { unlockTier: "free" } }
  );
  if (unlocked.modifiedCount > 0) {
    logger.info(`Unlocked ${unlocked.modifiedCount} previously premium templates`);
  }
};
