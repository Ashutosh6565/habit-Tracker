# Habbiters on Google Play — the simple playbook

This folder has everything you need to publish the Habbiters Android app.
Nothing here is code — it is the paperwork Play asks for, already written.

| File | What it is |
| --- | --- |
| `README.md` | This file — the step-by-step path from "folder" to "live on Play" |
| `listing.md` | App name, short description, long description, category, contact details |
| `data-safety.md` | Answers for Play's Data safety form and the permissions explanation |

---

## 1. What is already done

- The Android app exists in `mobile/` and shares its screens with the website in `frontend/`.
- App ID: `com.habbiters.app` (permanent — it can never change after the first upload).
- Version: `1.0.0` (code `1`).
- Target Android API 36, minimum Android 7.0 (API 24).
- Signed upload key: `mobile/android/habbiters-upload.jks`.
- Icons and splash screen are generated from the Habbiters flame logo.
- In-app account deletion is live on the Profile page, and there is a public web page at `/delete-account`.
- Built files sit in `artifacts/`:
  - `habbiters-1.0.0-debug.apk` — install this on a phone to test.
  - `habbiters-1.0.0-release.aab` — this is the file you upload to Play.

## 2. Test the app on your own phone (10 minutes)

1. Copy `artifacts/habbiters-1.0.0-debug.apk` to your Android phone (USB, Google Drive, WhatsApp to yourself).
2. Tap the file and allow "Install unknown apps" when Android asks.
3. Open **Habbiters**. You should see the splash screen, then the home page.

The debug build currently points at `https://habbiters-api.onrender.com/api/v1`.
That server does not exist until you do step 3, so sign-up and data will fail until then.

## 3. Put the API online on Render (free)

1. Push this repository to GitHub.
2. In Render: **New → Blueprint**, choose the repo. Render reads `render.yaml` and creates two services:
   - `habbiters-api` — the backend (Node).
   - `habbiters-web` — the website (static).
3. Open `habbiters-api` → **Environment** and fill the secrets marked "sync: false".
   Copy the values from your current `backend/.env` — never paste them into Git or chat.
4. Wait for the first deploy, then open:
   `https://habbiters-api.onrender.com/health`
   You should see a JSON reply. If you do, the API is alive.
5. Open `https://habbiters-web.onrender.com` and check that the website loads. The
   free plan sleeps after 15 minutes of inactivity; the first visit can take ~50 seconds.

If Render gives your service a different name, update these two places and rebuild:
- `render.yaml` → `CORS_ORIGIN`, `FRONTEND_URL`
- `frontend/.env.mobile` → `VITE_API_URL`

## 4. Rebuild the app after the API is live

Only needed if the API URL changed from `https://habbiters-api.onrender.com/api/v1`.

```bash
# from the repository root
set JAVA_HOME=C:/coding/habbittracker/.tooling/jdk/jdk-21.0.12.1+1
set ANDROID_HOME=C:/coding/habbittracker/.tooling/android-sdk
npm --prefix mobile run sync
cd mobile\android
gradlew.bat bundleRelease
```

The new file appears at `mobile/android/app/build/outputs/bundle/release/app-release.aab`.
Copy it into `artifacts/` and upload that.

While working from Git Bash use:

```bash
export JAVA_HOME="C:/coding/habbittracker/.tooling/jdk/jdk-21.0.12.1+1"
export ANDROID_HOME="C:/coding/habbittracker/.tooling/android-sdk"
npm --prefix mobile run sync
cd mobile/android && ./gradlew.bat bundleRelease
```

## 5. Create the Play Console listing

1. Go to <https://play.google.com/console> and pay the one-time $25 developer fee.
2. **Create app** → name `Habbiters: Habit Tracker`, language English, type **App**, free.
3. Fill in the listing using `listing.md` word-for-word.
4. Upload graphics:
   - App icon: use `mobile/assets/icon-only.png` (512×512 version is generated automatically by Play — upload the 1024×1024 source).
   - Feature graphic: 1024×500 (make a simple green banner with the flame + "Habbiters").
   - Phone screenshots: at least 2, taken from the app on a phone (Home, Tracker, Gamification, Pricing).
5. **Privacy policy URL:** `https://habbiters.app/privacy`
   (or `https://habbiters-web.onrender.com/privacy` until the domain is connected).
6. **Account deletion URL:** `https://habbiters.app/delete-account`
   (or the `onrender.com` equivalent). Play now requires this for every app that allows accounts.
7. **App access (reviewers need this):** create a demo account before submitting, for example
   `reviewer@habbiters.app` with a strong password, and add some habits so the dashboard is
   not empty. In Play Console → **App content → App access**, choose "All functionality is
   restricted" and enter the demo email + password, with the note:
   "Sign in with the provided email and password. Tap a habit to check it in; open Profile to
   see account deletion."
8. **Data safety:** copy the answers from `data-safety.md`.
9. **Content rating:** answer the questionnaire — no violence, no gambling, no user-to-user chat. Expected rating: Everyone.
10. **Ads:** "No ads".
11. **Target audience:** 13+ (the privacy policy says the app is not for children under 13).

## 6. Upload the build

1. **Testing → Internal testing → Create new release.**
2. Upload `artifacts/habbiters-1.0.0-release.aab`.
3. Accept **Play App Signing** (recommended — Google keeps a copy of the signing key).
4. Add yourself as a tester, roll out, install from the opt-in link, and click through
   sign-up, habits, templates, profile, and **Profile → Delete account**.
5. When everything works, promote the same release to **Production**.

## 7. Things you must not lose

- `mobile/android/habbiters-upload.jks` — the upload key.
- `mobile/android/KEYSTORE-CREDENTIALS.txt` — the password for that key.
- Both are git-ignored on purpose. Keep a copy in a password manager or an encrypted drive.
  If you lose them and you are not enrolled in Play App Signing, you cannot update the app
  under the same listing ever again.

## 8. Shipping updates later

1. Change the code.
2. Bump `versionCode` (must increase by at least 1) and `versionName` in
   `mobile/android/app/build.gradle`.
3. Rebuild with `./gradlew.bat bundleRelease`.
4. Upload the new `.aab` to **Production → Create new release**.

## 9. Known limits of the free setup

- **Sleeping API:** Render's free web service sleeps after 15 idle minutes. First request
  afterwards is slow. A free uptime pinger (UptimeRobot) keeps it awake.
- **Avatars on disk:** uploaded profile pictures are stored on the server's local disk.
  On Render's free plan that disk is wiped on every deploy/restart, so avatars must be
  re-uploaded. Moving avatars to MongoDB GridFS or an object store fixes this.
- **Payments:** Razorpay checkout is intentionally disabled inside the Android app.
  Google requires Play Billing for digital subscriptions, so the app shows plans but does
  not sell them. Buying on the website still upgrades the same account.
- **Push notifications:** the app uses email reminders, not push notifications. Adding
  Firebase Cloud Messaging is a separate step.

## 10. Pre-upload checklist

- [ ] Render API is live and `/health` returns JSON
- [ ] Sign-up, login, and habit creation work in the debug APK
- [ ] Profile → Delete account removes the account and returns to the home screen
- [ ] `https://<site>/delete-account` loads in a normal browser
- [ ] Privacy policy URL is public
- [ ] Feature graphic and 2+ phone screenshots uploaded
- [ ] Data safety form submitted
- [ ] Content rating questionnaire completed
- [ ] AAB uploaded and internal test passed on a real phone
