import type { NextFunction, Request, Response } from "express";
import { User } from "../models/User";
import { Subscription } from "../models/Subscription";
import { AppError } from "../utils/AppError";
import { verifyAccessToken, type AccessPayload } from "../utils/tokens";
import { permissionService } from "../services/permission.service";
import type { PermissionKey } from "../config/permissions";
import { asyncHandler } from "./asyncHandler";

const getBearerToken = (req: Request) => {
  const header = req.headers.authorization;
  if (header?.startsWith("Bearer ")) return header.slice(7);
  return undefined;
};

export const authenticate = asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
  const token = getBearerToken(req) || req.cookies?.accessToken;
  if (!token) return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));

  // jwt.verify throws synchronously on expired/invalid/malformed tokens. Because
  // this middleware is async, an uncaught throw becomes an unhandled promise
  // rejection and the request hangs instead of returning 401. Catch it and map
  // to a 401 so clients (and the frontend refresh-on-401 flow) behave correctly.
  let payload: AccessPayload;
  try {
    payload = verifyAccessToken(token);
  } catch {
    return next(new AppError("Invalid or expired token", 401, "INVALID_TOKEN"));
  }

  if (payload.type !== "access") {
    return next(new AppError("Invalid token", 401, "INVALID_TOKEN"));
  }

  const user = await User.findById(payload.sub);
  if (!user) return next(new AppError("User no longer exists", 401, "UNAUTHENTICATED"));

  req.user = user;
  next();
});

/** Attaches req.user when a valid token is present, but never rejects guests. */
export const optionalAuthenticate = asyncHandler(
  async (req: Request, _res: Response, next: NextFunction) => {
    const token = getBearerToken(req) || req.cookies?.accessToken;
    if (!token) return next();
    try {
      const payload = verifyAccessToken(token);
      if (payload.type === "access") {
        const user = await User.findById(payload.sub);
        if (user) req.user = user;
      }
    } catch {
      // Invalid tokens are treated as guests for public endpoints.
    }
    next();
  }
);

export const authorize =
  (...roles: string[]) =>
  (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
    if (!roles.includes(req.user.role)) {
      return next(new AppError("Insufficient permissions", 403, "FORBIDDEN"));
    }
    next();
  };

export const requirePermission = (permission: PermissionKey) =>
  asyncHandler(async (req: Request, _res: Response, next: NextFunction) => {
    if (!req.user) return next(new AppError("Authentication required", 401, "UNAUTHENTICATED"));
    const subscription = await Subscription.findOne({ user: req.user.id });
    if (!permissionService.has(req.user, subscription, permission)) {
      return next(new AppError("This account does not have access to that feature", 403, "PERMISSION_DENIED"));
    }
    next();
  });
