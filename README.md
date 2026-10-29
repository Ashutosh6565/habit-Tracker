# Habbiters Habit Tracker

Habbiters is a full-stack habit tracker with JWT authentication, MongoDB persistence, Stripe premium plans, analytics, templates, admin controls, notifications, and SEO-ready frontend assets.

## Structure

- `frontend/` - Vite, React, TypeScript, Tailwind, shadcn-style UI. Serves the website and the shared app screens.
- `mobile/` - Capacitor Android shell (`com.habbiters.app`). It packages the build from `frontend/`, so the website and the app stay in sync.
- `backend/` - Node.js, Express, TypeScript, MongoDB, Mongoose REST API.
- `backend/src/models/` - MongoDB schemas and indexes.
- `backend/src/services/` - business logic for auth, habits, analytics, payments, notifications, and subscriptions.
- `backend/src/controllers/` - HTTP controllers.
- `backend/src/routes/` - REST routes and validation.
- `docs/play-store/` - Play Store listing copy, data-safety answers, and the publishing guide.
- `render.yaml` - Render blueprint for the API and the website.

## Quick Start

```bash
cd backend
npm install
copy .env.example .env
npm run dev
```

```bash
cd frontend
npm install
copy .env.example .env
npm run dev
```

Frontend defaults to `http://localhost:8080`; backend defaults to `http://localhost:5000`.

### Android app

```bash
cd mobile
npm install
npm run sync            # builds ../frontend for mobile and copies it into the Android project
cd android
./gradlew.bat assembleDebug   # debug APK
./gradlew.bat bundleRelease   # signed AAB for Play
```

Building needs JDK 21 and the Android SDK (`ANDROID_HOME`). Full publishing steps are in
[docs/play-store/README.md](docs/play-store/README.md).

For admin setup and login steps, see [ADMIN_PANEL_ACCESS.md](ADMIN_PANEL_ACCESS.md).

## Features

- Email/password auth, refresh tokens, logout, forgot/reset/change password.
- Google login, protected routes, role-based admin access.
- Habit CRUD, daily progress, streaks, categories, search/filter/sort, free-plan limits.
- Template progress, mood ratings, analytics, and dashboard data.
- Stripe checkout, webhooks, subscription cancellation, payment history.
- Helmet, CORS, rate limiting, request sanitization, Zod validation, centralized errors.
- Swagger docs at `/api/docs`.
