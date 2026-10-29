import dotenv from "dotenv";

dotenv.config();

const requiredInProduction = [
  "MONGODB_URI",
  "JWT_ACCESS_SECRET",
  "JWT_REFRESH_SECRET",
  "COOKIE_SECRET",
] as const;

for (const key of requiredInProduction) {
  if (process.env.NODE_ENV === "production" && !process.env[key]) {
    throw new Error(`Missing required environment variable: ${key}`);
  }
}

const fallbackSecret = "development-only-change-me";

export const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/habbiters",
  frontendUrl: process.env.FRONTEND_URL || "http://localhost:8080",
  corsOrigin: (process.env.CORS_ORIGIN || process.env.FRONTEND_URL || "http://localhost:8080")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean),
  jwtAccessSecret: process.env.JWT_ACCESS_SECRET || fallbackSecret,
  jwtRefreshSecret: process.env.JWT_REFRESH_SECRET || `${fallbackSecret}-refresh`,
  accessTokenExpiresIn: process.env.ACCESS_TOKEN_EXPIRES_IN || "15m",
  refreshTokenExpiresIn: process.env.REFRESH_TOKEN_EXPIRES_IN || "30d",
  cookieSecret: process.env.COOKIE_SECRET || `${fallbackSecret}-cookie`,
  googleClientId: process.env.GOOGLE_CLIENT_ID || "",
  brevo: {
    apiKey: process.env.BREVO_API_KEY || "",
  },
  smtp: {
    host: process.env.SMTP_HOST || "",
    port: Number(process.env.SMTP_PORT || 587),
    user: process.env.SMTP_USER || "",
    pass: process.env.SMTP_PASS || "",
    from: process.env.SMTP_FROM || "Habbiters <no-reply@habbiters.app>",
  },
  stripe: {
    secretKey: process.env.STRIPE_SECRET_KEY || "",
    webhookSecret: process.env.STRIPE_WEBHOOK_SECRET || "",
    starterPriceId: process.env.STRIPE_STARTER_PRICE_ID || "",
    premiumAllPriceId: process.env.STRIPE_PREMIUM_ALL_PRICE_ID || "",
    monthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID || "",
    yearlyPriceId: process.env.STRIPE_YEARLY_PRICE_ID || "",
    oneTimePriceId: process.env.STRIPE_ONETIME_PRICE_ID || "",
  },
  razorpay: {
    keyId: process.env.RAZORPAY_KEY_ID || "",
    keySecret: process.env.RAZORPAY_KEY_SECRET || "",
    webhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || "",
    paymentLink: process.env.RAZORPAY_PAYMENT_LINK || "https://razorpay.me/@ashutoshkumar5863",
  },
  supportEmail: process.env.SUPPORT_EMAIL || process.env.SMTP_USER || "support@habbiters.app",
  contactInbox: process.env.CONTACT_INBOX || process.env.ADMIN_EMAIL || process.env.SMTP_USER || "",
  // INR plan prices in paise (₹1 = 100 paise). Premium All ≈ $4/month → ₹349.
  planPricingInr: {
    starter_monthly: Number(process.env.PRICE_STARTER_INR || 9900),
    premium_all_monthly: Number(process.env.PRICE_PREMIUM_ALL_INR || 34900),
    premium_monthly: Number(process.env.PRICE_PREMIUM_MONTHLY_INR || 34900),
    premium_yearly: Number(process.env.PRICE_PREMIUM_YEARLY_INR || 199900),
    premium_lifetime: Number(process.env.PRICE_PREMIUM_LIFETIME_INR || 499900),
  },
  admin: {
    email: process.env.ADMIN_EMAIL || "",
    password: process.env.ADMIN_PASSWORD || "",
  },
  isProduction: process.env.NODE_ENV === "production",
};
