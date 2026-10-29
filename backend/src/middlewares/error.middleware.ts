import type { NextFunction, Request, Response } from "express";
import { ZodError } from "zod";
import { Error as MongooseError } from "mongoose";
import { AppError } from "../utils/AppError";
import { env } from "../config/env";
import { logger } from "../utils/logger";

export const notFound = (req: Request, _res: Response, next: NextFunction) => {
  next(new AppError(`Route not found: ${req.method} ${req.originalUrl}`, 404, "NOT_FOUND"));
};

export const errorMiddleware = (
  error: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction
) => {
  let statusCode = 500;
  let message = "Internal server error";
  let code = "INTERNAL_ERROR";
  let details: unknown;

  if (error instanceof AppError) {
    statusCode = error.statusCode;
    message = error.message;
    code = error.code || code;
    details = error.details;
  } else if (error instanceof ZodError) {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    details = error.flatten();
  } else if (error instanceof MongooseError.ValidationError) {
    statusCode = 400;
    message = "Validation failed";
    code = "VALIDATION_ERROR";
    details = error.errors;
  } else if (error && typeof error === "object" && "code" in error && error.code === 11000) {
    statusCode = 409;
    message = "Resource already exists";
    code = "DUPLICATE_RESOURCE";
  } else if (error instanceof Error) {
    message = error.message;
  }

  if (statusCode >= 500) {
    logger.error(message, {
      error: error instanceof Error ? error.stack : error,
    });
  }

  res.status(statusCode).json({
    success: false,
    error: {
      code,
      message,
      ...(details ? { details } : {}),
      ...(!env.isProduction && error instanceof Error ? { stack: error.stack } : {}),
    },
  });
};
