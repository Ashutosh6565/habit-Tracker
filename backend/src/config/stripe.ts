import Stripe from "stripe";
import { env } from "./env";

export const stripe = env.stripe.secretKey
  ? new Stripe(env.stripe.secretKey, { apiVersion: "2025-02-24.acacia" })
  : null;
