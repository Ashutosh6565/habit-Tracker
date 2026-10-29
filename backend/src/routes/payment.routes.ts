import { Router } from "express";
import { paymentController } from "../controllers/payment.controller";
import { authenticate, authorize, requirePermission } from "../middlewares/auth.middleware";
import { validate } from "../middlewares/validate";
import {
  checkoutSchema,
  createPaymentClaimSchema,
  paymentClaimIdParamSchema,
  reviewPaymentClaimSchema,
} from "../validators/payment.validator";

export const paymentRouter = Router();

paymentRouter.post("/webhooks/stripe", paymentController.stripeWebhook);
paymentRouter.post("/webhooks/razorpay", paymentController.razorpayWebhook);
paymentRouter.get("/plans", paymentController.plans);
paymentRouter.use(authenticate);
paymentRouter.get("/subscription", paymentController.subscription);
paymentRouter.get("/history", paymentController.history);
paymentRouter.get("/claims/me", paymentController.myClaims);
paymentRouter.post(
  "/claims",
  requirePermission("payments.checkout"),
  validate({ body: createPaymentClaimSchema }),
  paymentController.createClaim
);
paymentRouter.get("/admin/claims", authorize("admin"), paymentController.adminClaims);
paymentRouter.patch(
  "/admin/claims/:id",
  authorize("admin"),
  validate({ params: paymentClaimIdParamSchema, body: reviewPaymentClaimSchema }),
  paymentController.reviewClaim
);
paymentRouter.post("/checkout", requirePermission("payments.checkout"), validate({ body: checkoutSchema }), paymentController.checkout);
paymentRouter.post("/razorpay/verify", paymentController.verifyRazorpay);
paymentRouter.post("/subscription/cancel", paymentController.cancelSubscription);
