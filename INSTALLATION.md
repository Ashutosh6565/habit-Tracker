# Installation

## Prerequisites

- Node.js 20+
- npm 10+
- MongoDB local server or MongoDB Atlas
- Stripe account for payments
- Google OAuth client for Google login

## Backend

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

Required production variables:

- `MONGODB_URI`
- `JWT_ACCESS_SECRET`
- `JWT_REFRESH_SECRET`
- `COOKIE_SECRET`
- `FRONTEND_URL`
- `CORS_ORIGIN`

Optional integrations:

- `GOOGLE_CLIENT_ID`
- `SMTP_HOST`, `SMTP_PORT`, `SMTP_USER`, `SMTP_PASS`, `SMTP_FROM`
- `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, `STRIPE_MONTHLY_PRICE_ID`, `STRIPE_YEARLY_PRICE_ID`, `STRIPE_ONETIME_PRICE_ID`

## Frontend

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Set `VITE_API_URL` to the backend API URL.
