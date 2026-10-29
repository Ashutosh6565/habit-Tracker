import jwt, { SignOptions } from "jsonwebtoken";
import crypto from "crypto";
import { env } from "../config/env";
import type { IUser } from "../models/User";

export interface AccessPayload {
  sub: string;
  role: string;
  type: "access";
}

export interface RefreshPayload {
  sub: string;
  type: "refresh";
}

export const signAccessToken = (user: IUser) =>
  jwt.sign(
    { sub: user.id, role: user.role, type: "access" } satisfies AccessPayload,
    env.jwtAccessSecret,
    { expiresIn: env.accessTokenExpiresIn } as SignOptions
  );

export const signRefreshToken = (user: IUser, rememberMe = false) =>
  jwt.sign(
    { sub: user.id, type: "refresh" } satisfies RefreshPayload,
    env.jwtRefreshSecret,
    { expiresIn: rememberMe ? env.refreshTokenExpiresIn : "7d" } as SignOptions
  );

export const verifyAccessToken = (token: string) =>
  jwt.verify(token, env.jwtAccessSecret) as AccessPayload;

export const verifyRefreshToken = (token: string) =>
  jwt.verify(token, env.jwtRefreshSecret) as RefreshPayload;

export const getRefreshExpiry = (rememberMe = false) => {
  const days = rememberMe ? 30 : 7;
  return new Date(Date.now() + days * 24 * 60 * 60 * 1000);
};

export const createOpaqueToken = () => crypto.randomBytes(32).toString("hex");
