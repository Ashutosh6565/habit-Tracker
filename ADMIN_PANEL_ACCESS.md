# Admin Panel Access

The admin panel is available in the frontend at:

```text
http://localhost:8080/admin
```

The route is protected. You must sign in with a user whose backend role is `admin`; normal users are redirected to `/dashboard`.

## Create or Update the Admin Account

1. In `backend/.env`, set these values:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/habbiters
ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=change-this-password
```

`ADMIN_PASSWORD` must be at least 8 characters because it is stored as a normal local-login password.

2. Make sure MongoDB is running and seed the admin user:

```bash
cd backend
npm run seed:admin
```

The seed command creates the user if it does not exist, promotes it to `role: "admin"`, verifies the email, sets the password from `ADMIN_PASSWORD`, and grants an active manual subscription.

## Run the App Locally

Start the backend:

```bash
cd backend
npm run dev
```

Start the frontend:

```bash
cd frontend
npm run dev
```

Default local URLs:

- Frontend: `http://localhost:8080`
- Backend API: `http://localhost:5000/api/v1`

The frontend should have this in `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api/v1
```

## Sign In and Open Admin

1. Go to `http://localhost:8080/login`.
2. Sign in using the `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `backend/.env`.
3. Open `http://localhost:8080/admin`.

The admin panel includes controls for users, subscriptions, permissions, and template access.

## Access Rules

- Frontend route: `frontend/src/App.tsx` defines `/admin`.
- Frontend guard: `ProtectedRoute` checks the computed `admin.view` permission.
- Backend guard: admin user-management APIs require `role: "admin"`.
- Permission source: `backend/src/config/permissions.ts` gives `admin.view` only to admins.

## Troubleshooting

- Redirected to `/login`: you are not signed in, the session expired, or `VITE_API_URL` points to the wrong backend.
- Redirected to `/dashboard`: the signed-in account is not an admin. Re-run `npm run seed:admin` with the same email you use to log in.
- `Invalid email or password`: confirm `ADMIN_EMAIL`, `ADMIN_PASSWORD`, and `MONGODB_URI` in `backend/.env`, then re-run `npm run seed:admin`.
- API or CORS errors: confirm backend runs on `http://localhost:5000` and frontend runs on `http://localhost:8080`; update `FRONTEND_URL` and `CORS_ORIGIN` in `backend/.env` if you use different ports.
- Admin page loads but data is empty: the backend may be connected to a different MongoDB database than the one you seeded.
