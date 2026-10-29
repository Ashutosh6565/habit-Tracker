import type { Request, Response } from "express";
import { authService } from "../services/auth.service";
import { userService } from "../services/user.service";
import { asyncHandler } from "../middlewares/asyncHandler";
import { clearAuthCookies, setAuthCookies } from "../utils/cookies";
import { AppError } from "../utils/AppError";

const sendAuth = async (
  res: Response,
  payload: Awaited<ReturnType<typeof authService.login>>,
  rememberMe = false
) => {
  setAuthCookies(res, { accessToken: payload.accessToken, refreshToken: payload.refreshToken }, rememberMe);
  const user = await userService.serializeUser(payload.user.id);
  res.json({
    success: true,
    data: {
      user,
      session: {
        accessToken: payload.accessToken,
        refreshToken: payload.refreshToken,
      },
    },
  });
};

export const authController = {
  requestSignupOtp: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestSignupOtp(req.body);
    res.json({
      success: true,
      data: {
        message: result.delivered ? "Verification code sent" : "Verification code generated",
        delivered: result.delivered,
        expiresInMinutes: result.expiresInMinutes,
        devOtp: result.devOtp,
      },
    });
  }),

  verifySignupOtp: asyncHandler(async (req: Request, res: Response) => {
    await authService.verifySignupOtp(req.body);
    const payload = await authService.login({
      email: req.body.email,
      password: req.body.password,
      rememberMe: true,
    });
    await sendAuth(res, payload, true);
  }),

  requestLoginOtp: asyncHandler(async (req: Request, res: Response) => {
    const result = await authService.requestLoginOtp(req.body);
    res.json({
      success: true,
      data: {
        message: "If the account exists, a login code has been sent.",
        delivered: result.delivered,
        expiresInMinutes: result.expiresInMinutes,
        devOtp: result.devOtp,
      },
    });
  }),

  verifyLoginOtp: asyncHandler(async (req: Request, res: Response) => {
    const payload = await authService.verifyLoginOtp(req.body);
    await sendAuth(res, payload, req.body.rememberMe);
  }),

  signup: asyncHandler(async (req: Request, res: Response) => {
    await authService.signup(req.body);
    const payload = await authService.login({
      email: req.body.email,
      password: req.body.password,
      rememberMe: true,
    });
    await sendAuth(res, payload, true);
  }),

  login: asyncHandler(async (req: Request, res: Response) => {
    const payload = await authService.login(req.body);
    await sendAuth(res, payload, req.body.rememberMe);
  }),

  googleLogin: asyncHandler(async (req: Request, res: Response) => {
    const payload = await authService.googleLogin(req.body);
    await sendAuth(res, payload, req.body.rememberMe);
  }),

  me: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { user: await userService.serializeUser(req.user.id) } });
  }),

  refresh: asyncHandler(async (req: Request, res: Response) => {
    const refreshToken = req.body.refreshToken || req.cookies?.refreshToken;
    if (!refreshToken) throw new AppError("Refresh token required", 401, "REFRESH_REQUIRED");
    const payload = await authService.refresh(refreshToken);
    res.cookie("accessToken", payload.accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: process.env.NODE_ENV === "production" ? "none" : "lax",
      maxAge: 15 * 60 * 1000,
      path: "/",
    });
    res.json({
      success: true,
      data: {
        user: await userService.serializeUser(payload.user.id),
        session: { accessToken: payload.accessToken, refreshToken },
      },
    });
  }),

  logout: asyncHandler(async (req: Request, res: Response) => {
    await authService.logout(req.user?.id);
    clearAuthCookies(res);
    res.json({ success: true, data: { message: "Logged out" } });
  }),

  forgotPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.forgotPassword(req.body.email);
    res.json({ success: true, data: { message: "If the email exists, a reset link has been sent." } });
  }),

  resetPassword: asyncHandler(async (req: Request, res: Response) => {
    await authService.resetPassword(req.body.token, req.body.password);
    res.json({ success: true, data: { message: "Password updated" } });
  }),

  changePassword: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    await authService.changePassword(req.user.id, req.body.currentPassword, req.body.newPassword);
    res.json({ success: true, data: { message: "Password changed" } });
  }),
};
