import type { Response } from "express";
import { env } from "../config/env";

const baseCookie = {
  httpOnly: true,
  secure: env.isProduction,
  sameSite: env.isProduction ? ("none" as const) : ("lax" as const),
  path: "/",
};

export const setAuthCookies = (
  res: Response,
  tokens: { accessToken: string; refreshToken: string },
  rememberMe = false
) => {
  res.cookie("accessToken", tokens.accessToken, {
    ...baseCookie,
    maxAge: 15 * 60 * 1000,
  });
  res.cookie("refreshToken", tokens.refreshToken, {
    ...baseCookie,
    maxAge: (rememberMe ? 30 : 7) * 24 * 60 * 60 * 1000,
  });
};

export const clearAuthCookies = (res: Response) => {
  res.clearCookie("accessToken", { path: "/" });
  res.clearCookie("refreshToken", { path: "/" });
};
