import type { Request, Response } from "express";
import { env } from "../config/env";
import { razorpay } from "../config/razorpay";
import { stripe } from "../config/stripe";
import { asyncHandler } from "../middlewares/asyncHandler";
import { isRazorpayPlan, paymentService } from "../services/payment.service";
import { subscriptionService, formatSubscription } from "../services/subscription.service";
import { AppError } from "../utils/AppError";

export const paymentController = {
  checkout: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const plan = req.body.plan as string;

    if (razorpay && isRazorpayPlan(plan)) {
      const order = await paymentService.createRazorpayOrder(req.user.id, plan);
      res.json({ success: true, data: { gateway: "razorpay", order } });
      return;
    }

    if (stripe) {
      const session = await paymentService.createCheckoutSession(
        req.user.id,
        plan as "starter_monthly" | "premium_all_monthly" | "premium_monthly" | "premium_yearly" | "premium_lifetime"
      );
      res.json({ success: true, data: { gateway: "stripe", session } });
      return;
    }

    throw new AppError("Payments are not configured yet. Add Razorpay or Stripe keys.", 503, "PAYMENTS_NOT_CONFIGURED");
  }),

  verifyRazorpay: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature } = req.body as {
      razorpayOrderId?: string;
      razorpayPaymentId?: string;
      razorpaySignature?: string;
    };
    if (!razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      throw new AppError("Missing Razorpay payment details", 400, "RAZORPAY_DETAILS_MISSING");
    }
    const result = await paymentService.verifyRazorpayPayment(req.user.id, {
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });
    res.json({ success: true, data: { subscription: formatSubscription(result.subscription) } });
  }),

  plans: asyncHandler(async (_req: Request, res: Response) => {
    res.json({ success: true, data: paymentService.plans() });
  }),

  createClaim: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const claim = await paymentService.createClaim(req.user.id, req.body);
    res.status(201).json({ success: true, data: { claim } });
  }),

  myClaims: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { claims: await paymentService.listClaims(req.user.id) } });
  }),

  adminClaims: asyncHandler(async (req: Request, res: Response) => {
    const status = typeof req.query.status === "string" ? req.query.status : undefined;
    res.json({ success: true, data: { claims: await paymentService.listAdminClaims(status) } });
  }),

  reviewClaim: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const claim = await paymentService.reviewClaim(req.user.id, String(req.params.id), req.body);
    res.json({ success: true, data: { claim } });
  }),

  history: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    res.json({ success: true, data: { payments: await paymentService.listHistory(req.user.id) } });
  }),

  subscription: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const subscription = await subscriptionService.getForUser(req.user.id);
    res.json({ success: true, data: { subscription: formatSubscription(subscription) } });
  }),

  cancelSubscription: asyncHandler(async (req: Request, res: Response) => {
    if (!req.user) throw new AppError("Authentication required", 401, "UNAUTHENTICATED");
    const subscription = await subscriptionService.getForUser(req.user.id);
    if (!subscription) throw new AppError("No subscription found for this account", 404, "SUBSCRIPTION_NOT_FOUND");

    if (subscription.provider === "stripe" && subscription.stripeSubscriptionId && stripe) {
      const updated = await paymentService.cancelSubscription(req.user.id);
      res.json({ success: true, data: { subscription: formatSubscription(updated) } });
      return;
    }

    if (subscription.cancelAtPeriodEnd) {
      throw new AppError("Subscription is already set to cancel", 400, "ALREADY_CANCELLING");
    }
    subscription.cancelAtPeriodEnd = true;
    await subscription.save();
    res.json({ success: true, data: { subscription: formatSubscription(subscription) } });
  }),

  stripeWebhook: asyncHandler(async (req: Request, res: Response) => {
    if (!stripe || !env.stripe.webhookSecret) {
      throw new AppError("Stripe webhook is not configured", 503, "STRIPE_NOT_CONFIGURED");
    }
    const signature = req.headers["stripe-signature"];
    if (!signature || Array.isArray(signature)) {
      throw new AppError("Missing Stripe signature", 400, "STRIPE_SIGNATURE_MISSING");
    }
    const event = stripe.webhooks.constructEvent(req.body, signature, env.stripe.webhookSecret);
    await paymentService.handleStripeWebhook(event);
    res.json({ received: true });
  }),

  razorpayWebhook: asyncHandler(async (req: Request, res: Response) => {
    const signature = req.headers["x-razorpay-signature"];
    if (!signature || Array.isArray(signature)) {
      throw new AppError("Missing Razorpay signature", 400, "RAZORPAY_SIGNATURE_MISSING");
    }
    await paymentService.handleRazorpayWebhook(req.body as Buffer, signature);
    res.json({ received: true });
  }),
};
