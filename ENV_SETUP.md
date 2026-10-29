# Environment Setup

## Backend `.env`

```env
NODE_ENV=development
PORT=5000
MONGODB_URI=mongodb://127.0.0.1:27017/habbiters
FRONTEND_URL=http://localhost:8080
CORS_ORIGIN=http://localhost:8080
JWT_ACCESS_SECRET=replace-with-a-long-random-access-secret
JWT_REFRESH_SECRET=replace-with-a-long-random-refresh-secret
COOKIE_SECRET=replace-with-a-long-random-cookie-secret
```

## MongoDB Atlas (free M0)

The `MongooseServerSelectionError` / "Could not connect to any servers in your MongoDB Atlas cluster" error almost always means the connecting IP is not allowed.

1. In Atlas, open **Network Access → Add IP Address** and add the IP of the machine or server that runs the backend. For a quick local test you can add your current IP; `0.0.0.0/0` works but opens the database to the internet, so never use it for production.
2. Copy the connection string from **Database → Connect → Drivers** and set `MONGODB_URI`. Keep the database name in the path, for example `.../habbiters?retryWrites=true&w=majority`.
3. Hosting platforms (Render, Railway, Vercel) use dynamic egress IPs. If you cannot whitelist a fixed IP, allow `0.0.0.0/0` with a strong database user password, or move to a provider with static IPs.

## Email OTP (Brevo free SMTP)

Signup and passwordless login use 6-digit email codes. Without SMTP the API still works in development (it returns a `devOtp` shown in the UI), but **in production `devOtp` is hidden, so users cannot register or log in until SMTP is configured.**

1. Create a free Brevo account and verify your sender domain or email under **Senders, Domains & Dedicated IPs**.
2. Generate an SMTP key under **Settings → SMTP & API → SMTP**.
3. Set in `backend/.env`:

```env
SMTP_HOST=smtp-relay.brevo.com
SMTP_PORT=587
SMTP_USER=your-brevo-login-email
SMTP_PASS=your-smtp-key
SMTP_FROM="Habbiters <no-reply@your-verified-domain>"
SUPPORT_EMAIL=support@your-domain
CONTACT_INBOX=support@your-domain
```

Port 587 uses STARTTLS; use 465 if your host blocks 587. Restart the API and request a login code — the response should report `delivered: true` and no `devOtp`.

## Frontend `.env`

```env
VITE_API_URL=http://localhost:5000/api/v1
VITE_GOOGLE_CLIENT_ID=
VITE_SITE_URL=https://habbiters.app
```

## Stripe

Create monthly, yearly, and lifetime prices in Stripe and add a webhook endpoint:

```text
https://your-backend.example.com/api/v1/payments/webhooks/stripe
```

Subscribe to `checkout.session.completed`, `customer.subscription.created`, `customer.subscription.updated`, and `invoice.payment_failed`.

## Razorpay (INR payments)

The pricing page uses a **payment link + admin approval** flow: the user pays on `RAZORPAY_PAYMENT_LINK` (for example `https://razorpay.me/@your-handle`), submits the Razorpay payment ID or UTR, and an admin approves it under **Admin → Payment Approvals**. Approval activates the plan and emails the customer. Set `RAZORPAY_PAYMENT_LINK` in `backend/.env` and keep at least one admin account (`ADMIN_EMAIL`) able to open the admin panel.

Because the external payment page does not fix an amount, verify the amount in the Razorpay dashboard before approving a claim. For a fully automatic flow, use Razorpay Orders/Subscriptions with fixed amounts and the `/payments/checkout` + `/payments/razorpay/verify` endpoints instead.

Razorpay is the primary gateway for the rupee-denominated plans. Requirements:

1. A Razorpay account at https://dashboard.razorpay.com — sign up as an individual or business and complete KYC (PAN + bank account). Test mode works immediately; live payments need an activated account.
2. API keys from **Settings → API Keys**: set `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET` in `backend/.env`. Use test keys for development, live keys for production.
3. A webhook from **Settings → Webhooks** pointing at:

```text
https://your-backend.example.com/api/v1/payments/webhooks/razorpay
```

Subscribe to `payment.captured` and `order.paid`, and set the webhook secret as `RAZORPAY_WEBHOOK_SECRET`. The webhook is the fallback reconciliation path — the subscription is activated immediately by the checkout verify call, so local development works without it.

INR plan prices default to ₹99 Starter / ₹349 Premium All per month (yearly ₹1,999, lifetime ₹4,999) and can be overridden with `PRICE_STARTER_INR`, `PRICE_PREMIUM_ALL_INR`, `PRICE_PREMIUM_MONTHLY_INR`, `PRICE_PREMIUM_YEARLY_INR`, and `PRICE_PREMIUM_LIFETIME_INR` (values in paise).

## Google Login

Create a Google OAuth web client and set the same client id in `GOOGLE_CLIENT_ID` and `VITE_GOOGLE_CLIENT_ID`.
