import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authenticate } from "../middlewares/auth.middleware";
import { authLimiter } from "../middlewares/rateLimit.middleware";
import { validate } from "../middlewares/validate";
import {
  changePasswordSchema,
  forgotPasswordSchema,
  googleLoginSchema,
  loginSchema,
  refreshSchema,
  requestLoginOtpSchema,
  requestSignupOtpSchema,
  resetPasswordSchema,
  signupSchema,
  verifyLoginOtpSchema,
  verifySignupOtpSchema,
} from "../validators/auth.validator";

export const authRouter = Router();

/**
 * @openapi
 * /auth/signup:
 *   post:
 *     summary: Create a user account
 */
authRouter.post("/signup", authLimiter, validate({ body: signupSchema }), authController.signup);
authRouter.post("/signup/request-otp", authLimiter, validate({ body: requestSignupOtpSchema }), authController.requestSignupOtp);
authRouter.post("/signup/verify-otp", authLimiter, validate({ body: verifySignupOtpSchema }), authController.verifySignupOtp);
authRouter.post("/login", authLimiter, validate({ body: loginSchema }), authController.login);
authRouter.post("/login/request-otp", authLimiter, validate({ body: requestLoginOtpSchema }), authController.requestLoginOtp);
authRouter.post("/login/verify-otp", authLimiter, validate({ body: verifyLoginOtpSchema }), authController.verifyLoginOtp);
authRouter.post("/google", authLimiter, validate({ body: googleLoginSchema }), authController.googleLogin);
authRouter.post("/refresh", validate({ body: refreshSchema }), authController.refresh);
authRouter.post("/logout", authenticate, authController.logout);
authRouter.get("/me", authenticate, authController.me);
authRouter.post("/forgot-password", authLimiter, validate({ body: forgotPasswordSchema }), authController.forgotPassword);
authRouter.post("/reset-password", authLimiter, validate({ body: resetPasswordSchema }), authController.resetPassword);
authRouter.post("/change-password", authenticate, validate({ body: changePasswordSchema }), authController.changePassword);
