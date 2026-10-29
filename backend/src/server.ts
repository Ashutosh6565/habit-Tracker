import { createApp } from "./app";
import { connectDatabase } from "./config/database";
import { env } from "./config/env";
import { reminderService } from "./services/reminder.service";
import { seedTemplateCatalog } from "./services/templateSeed.service";
import { logger } from "./utils/logger";

const start = async () => {
  await connectDatabase();
  await seedTemplateCatalog();
  const app = createApp();
  const server = app.listen(env.port, () => {
    logger.info(`API listening on port ${env.port}`);
  });
  reminderService.start();

  const shutdown = (signal: string) => {
    logger.info(`Received ${signal}. Shutting down.`);
    reminderService.stop();
    server.close(() => process.exit(0));
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
};

start().catch((error) => {
  logger.error("Failed to start API", { error: error instanceof Error ? error.stack : error });
  process.exit(1);
});
