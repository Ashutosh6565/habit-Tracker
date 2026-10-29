import mongoose from "mongoose";
import { env } from "./env";
import { logger } from "../utils/logger";

const getMongoHost = () => {
  try {
    const url = new URL(env.mongoUri);
    return url.hostname;
  } catch {
    return "the configured MongoDB host";
  }
};

export const connectDatabase = async () => {
  mongoose.set("strictQuery", true);
  try {
    await mongoose.connect(env.mongoUri, {
      autoIndex: !env.isProduction,
      serverSelectionTimeoutMS: 10000,
    });
  } catch (error) {
    if (error instanceof mongoose.Error.MongooseServerSelectionError) {
      logger.error(
        [
          `MongoDB connection failed for ${getMongoHost()}.`,
          "If this is MongoDB Atlas, open Atlas > Network Access and add your current public IP.",
          "For local development you can temporarily allow 0.0.0.0/0 (never do this for production).",
          "Check that the database user password in MONGODB_URI is correct and the cluster is not paused.",
        ].join(" ")
      );
    }
    throw error;
  }
  logger.info("MongoDB connected");
};

export const closeDatabase = async () => {
  await mongoose.connection.close();
};
