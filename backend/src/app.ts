import compression from "compression";
import cookieParser from "cookie-parser";
import cors from "cors";
import express from "express";
import mongoSanitize from "express-mongo-sanitize";
import helmet from "helmet";
import morgan from "morgan";
import path from "path";
import swaggerUi from "swagger-ui-express";
import { env } from "./config/env";
import { swaggerSpec } from "./config/swagger";
import { apiLimiter } from "./middlewares/rateLimit.middleware";
import { errorMiddleware, notFound } from "./middlewares/error.middleware";
import { apiRouter } from "./routes";

export const createApp = () => {
  const app = express();

  // The Android app renders the web build from a local origin inside the device.
  const nativeOrigins = new Set(["https://localhost", "capacitor://localhost"]);

  app.set("trust proxy", 1);
  app.use(helmet());
  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || env.corsOrigin.includes(origin)) return callback(null, true);
        if (nativeOrigins.has(origin)) return callback(null, true);
        // Vite picks a different port whenever 5173 is taken; in dev any localhost
        // port is the same machine, so allow it instead of breaking the API.
        if (!env.isProduction && /^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) {
          return callback(null, true);
        }
        callback(new Error("Not allowed by CORS"));
      },
      credentials: true,
    })
  );
  app.use(compression());
  app.use(cookieParser(env.cookieSecret));
  app.use(morgan(env.isProduction ? "combined" : "dev"));
  // Uploaded avatars are embedded via <img> from the frontend origin, which is
  // different from the API origin (e.g. :8080 vs :5000). Helmet's default
  // Cross-Origin-Resource-Policy: same-origin would make the browser block those
  // cross-origin image loads, so relax CORP to "cross-origin" for static uploads only.
  app.use(
    "/uploads",
    express.static(path.resolve(process.cwd(), "uploads"), {
      setHeaders: (res) => {
        res.setHeader("Cross-Origin-Resource-Policy", "cross-origin");
      },
    })
  );

  app.use("/api/v1/payments/webhooks/stripe", express.raw({ type: "application/json" }));
  app.use("/api/v1/payments/webhooks/razorpay", express.raw({ type: "application/json" }));
  app.use(express.json({ limit: "1mb" }));
  app.use(express.urlencoded({ extended: true, limit: "1mb" }));
  app.use(mongoSanitize());
  app.use(apiLimiter);

  app.get("/health", (_req, res) => {
    res.json({ status: "ok", uptime: process.uptime(), timestamp: new Date().toISOString() });
  });

  app.use("/api/docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
  app.get("/api/docs.json", (_req, res) => res.json(swaggerSpec));
  app.use("/api/v1", apiRouter);
  app.use(notFound);
  app.use(errorMiddleware);

  return app;
};
