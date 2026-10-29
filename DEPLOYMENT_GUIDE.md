# Deployment Guide

## MongoDB Atlas

Create a cluster, database user, and network allowlist entry, then set `MONGODB_URI`.

## Backend On Render Or Railway

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm start
```

Set backend environment variables from `backend/.env.example`.

## Frontend On Vercel Or Netlify

Build command:

```bash
npm run build
```

Publish directory:

```text
dist
```

Set:

```env
VITE_API_URL=https://your-backend.example.com/api/v1
VITE_GOOGLE_CLIENT_ID=your-google-client-id
```

## Production Checklist

- Use HTTPS for frontend and backend.
- Set `NODE_ENV=production`.
- Set `CORS_ORIGIN` to the exact frontend domain.
- Configure Stripe webhook secret.
- Configure SMTP for password reset and reminders.
- Seed an admin with `npm run seed:admin`.
- Run frontend and backend builds before deployment.
