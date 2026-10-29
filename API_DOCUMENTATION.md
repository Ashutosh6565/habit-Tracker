# API Documentation

Base URL: `/api/v1`

Swagger UI is available at `/api/docs`; OpenAPI JSON is available at `/api/docs.json`.

## Authentication

- `POST /auth/signup`
- `POST /auth/login`
- `POST /auth/google`
- `POST /auth/refresh`
- `GET /auth/me`
- `POST /auth/logout`
- `POST /auth/forgot-password`
- `POST /auth/reset-password`
- `POST /auth/change-password`

## Habits

- `GET /habits`
- `POST /habits`
- `PATCH /habits/:id`
- `DELETE /habits/:id`
- `POST /habits/:id/progress`
- `GET /habits/summary`

## Templates

- `GET /templates`
- `PUT /templates`
- `DELETE /templates/:templateId`

## Analytics

- `GET /analytics/overview`

## Payments

- `GET /payments/subscription`
- `POST /payments/checkout`
- `GET /payments/history`
- `POST /payments/subscription/cancel`
- `POST /payments/webhooks/stripe`

## Admin

- `GET /users`
- `PATCH /users/:id`
- `PATCH /users/:id/subscription`

## Notifications And Settings

- `GET /notifications`
- `POST /notifications`
- `PATCH /notifications/:id/read`
- `GET /settings`
- `PATCH /settings`
