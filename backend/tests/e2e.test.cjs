"use strict";
/**
 * End-to-end API tests against a real Express app and an in-memory MongoDB.
 * Covers OTP auth, tier-gated template catalog, payment-link claims + admin
 * approval, contact inbox, and the admin user list.
 */
const test = require("node:test");
const assert = require("node:assert/strict");

process.env.NODE_ENV = "test";
process.env.PORT = "0";
process.env.JWT_ACCESS_SECRET = "e2e-access-secret-e2e-access-secret";
process.env.JWT_REFRESH_SECRET = "e2e-refresh-secret-e2e-refresh-secret";
process.env.COOKIE_SECRET = "e2e-cookie-secret-e2e-cookie-secret";
process.env.FRONTEND_URL = "http://localhost:8080";
process.env.CORS_ORIGIN = "http://localhost:8080";
process.env.RAZORPAY_PAYMENT_LINK = "https://razorpay.me/@test";
// Keep the suite hermetic: the developer's .env may hold live SMTP/Brevo credentials,
// and a real send would hide the devOtp the signup helper relies on.
process.env.SMTP_HOST = "";
process.env.SMTP_USER = "";
process.env.SMTP_PASS = "";
process.env.BREVO_API_KEY = "";

const { MongoMemoryServer } = require("mongodb-memory-server");
const mongoose = require("mongoose");

let mongod;
let server;
let base;

async function api(path, { method = "GET", body, token } = {}) {
  const headers = {};
  if (body) headers["Content-Type"] = "application/json";
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });
  const payload = response.status === 204 ? null : await response.json();
  return { status: response.status, data: payload };
}

async function apiText(path, { token } = {}) {
  const headers = {};
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${base}${path}`, { headers });
  return {
    status: response.status,
    contentType: response.headers.get("content-type") || "",
    text: await response.text(),
  };
}

async function signup(fullName, email) {
  const requested = await api("/auth/signup/request-otp", { method: "POST", body: { email } });
  assert.equal(requested.status, 200, JSON.stringify(requested.data));
  const otp = requested.data.data.devOtp;
  assert.ok(otp, "expected a development OTP because SMTP is not configured");
  const verified = await api("/auth/signup/verify-otp", {
    method: "POST",
    body: { fullName, email, password: "Password123!", otp },
  });
  assert.equal(verified.status, 200, JSON.stringify(verified.data));
  return verified.data.data;
}

test("habbiters API end-to-end", async (t) => {
  mongod = await MongoMemoryServer.create();
  process.env.MONGODB_URI = mongod.getUri("habbiters_e2e");
  await mongoose.connect(process.env.MONGODB_URI);

  const { seedTemplateCatalog } = require("../dist/services/templateSeed.service.js");
  await seedTemplateCatalog();

  const { createApp } = require("../dist/app.js");
  server = createApp().listen(0);
  await new Promise((resolve) => server.once("listening", resolve));
  base = `http://127.0.0.1:${server.address().port}/api/v1`;

  const userEmail = "habit.user@example.com";
  const adminEmail = "habit.admin@example.com";
  let userToken;
  let adminToken;
  let premiumTemplateId;
  let starterTemplateId;
  let claimId;

  await t.test("public plans and health endpoints respond", async () => {
    const health = await fetch(`${base.replace("/api/v1", "")}/health`).then(async (res) => ({
      status: res.status,
      data: await res.json(),
    }));
    assert.equal(health.status, 200);
    assert.equal(health.data.status, "ok");

    const plans = await api("/payments/plans");
    assert.equal(plans.status, 200);
    assert.equal(plans.data.data.paymentLink, "https://razorpay.me/@test");
    assert.ok(plans.data.data.plans.some((plan) => plan.code === "premium_all_monthly"));
  });

  await t.test("signup via email OTP and session restore", async () => {
    const auth = await signup("Habit User", userEmail);
    userToken = auth.session.accessToken;
    assert.ok(userToken);
    assert.equal(auth.user.email, userEmail);

    const me = await api("/auth/me", { token: userToken });
    assert.equal(me.status, 200);
    assert.equal(me.data.data.user.email, userEmail);
  });

  await t.test("passwordless login via email OTP", async () => {
    const requested = await api("/auth/login/request-otp", { method: "POST", body: { email: userEmail } });
    assert.equal(requested.status, 200, JSON.stringify(requested.data));
    const otp = requested.data.data.devOtp;
    assert.ok(otp);
    const verified = await api("/auth/login/verify-otp", {
      method: "POST",
      body: { email: userEmail, otp, rememberMe: true },
    });
    assert.equal(verified.status, 200, JSON.stringify(verified.data));
    assert.ok(verified.data.data.session.accessToken);
  });

  await t.test("template catalog is public and every template is free", async () => {
    const guest = await api("/templates/catalog");
    assert.equal(guest.status, 200);
    assert.equal(guest.data.data.accessTier, "free");

    const catalog = await api("/templates/catalog", { token: userToken });
    assert.equal(catalog.status, 200);
    const { templates } = catalog.data.data;
    assert.ok(templates.length >= 100);
    assert.ok(templates.every((row) => row.unlockTier === "free"));
    assert.ok(templates.every((row) => row.locked === false));
    assert.ok(templates.every((row) => row.canUse === true));

    premiumTemplateId = templates.find((row) => row.templateId.includes("gym"))?.templateId || templates[0].templateId;
    starterTemplateId = templates[templates.length - 1].templateId;
  });

  await t.test("any template progress saves for free users", async () => {
    for (const templateId of [premiumTemplateId, starterTemplateId]) {
      const saved = await api("/templates", {
        method: "PUT",
        token: userToken,
        body: {
          templateId,
          templateName: "Unlocked",
          habits: [{ habitId: "x1", name: "Unlocked habit", icon: "🔓" }],
          completions: { x1: { 1: true } },
          totalDays: 30,
        },
      });
      assert.equal(saved.status, 200, JSON.stringify(saved.data));
    }
  });

  await t.test("free template progress saves and reloads", async () => {
    const catalog = await api("/templates/catalog", { token: userToken });
    const freeTemplate = catalog.data.data.templates.find((row) => row.unlockTier === "free");
    const saved = await api("/templates", {
      method: "PUT",
      token: userToken,
      body: {
        templateId: freeTemplate.templateId,
        templateName: freeTemplate.name,
        habits: freeTemplate.habits,
        completions: { [freeTemplate.habits[0].habitId]: { 1: true, 2: true } },
        totalDays: freeTemplate.totalDays,
        moodRatings: { 1: 8 },
        notes: "Good start",
      },
    });
    assert.equal(saved.status, 200, JSON.stringify(saved.data));

    const progress = await api("/templates", { token: userToken });
    assert.equal(progress.status, 200);
    const row = progress.data.data.templates.find((item) => item.templateId === freeTemplate.templateId);
    assert.ok(row);
    assert.equal(row.notes, "Good start");
    assert.equal(row.moodRatings["1"], 8);
  });

  await t.test("learning video plans save, reload, and delete", async () => {
    const video = {
      id: "video-e2e-course",
      youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
      videoId: "dQw4w9WgXcQ",
      title: "E2E Course",
      thumbnailUrl: "https://img.youtube.com/vi/dQw4w9WgXcQ/hqdefault.jpg",
      totalDurationSeconds: 600,
      targetTotalDays: 2,
      dailyChunkSeconds: 300,
      scheduledStartTime: "10:00",
      splitIntoSessions: false,
      sessionSplit: "single",
      createdAt: new Date().toISOString(),
    };
    const buildChunk = (dayNumber, startSeconds) => ({
      id: `${video.id}-day-${dayNumber}`,
      videoId: video.id,
      dayNumber,
      date: `2026-01-0${dayNumber}`,
      videoStartSeconds: startSeconds,
      videoEndSeconds: startSeconds + 300,
      videoStartTimestamp: startSeconds === 0 ? "00:00:00" : "00:05:00",
      videoEndTimestamp: startSeconds === 0 ? "00:05:00" : "00:10:00",
      scheduledClockTime: "10:00",
      estimatedSessionLengthSeconds: 300,
      status: "pending",
    });
    const plan = {
      video,
      chunks: [buildChunk(1, 0), buildChunk(2, 300)],
      habitEntries: [1, 2].map((dayNumber) => ({
        id: `habit-${video.id}-day-${dayNumber}`,
        template: "Learning / Video Courses",
        scheduleChunkId: `${video.id}-day-${dayNumber}`,
        date: `2026-01-0${dayNumber}`,
        completed: false,
        streakCount: 0,
      })),
    };

    const saved = await api("/learning", { method: "PUT", token: userToken, body: plan });
    assert.equal(saved.status, 200, JSON.stringify(saved.data));
    assert.equal(saved.data.data.plan.video.id, video.id);

    const updatedPlan = {
      ...plan,
      chunks: [{ ...plan.chunks[0], status: "done" }, plan.chunks[1]],
    };
    const updated = await api("/learning", { method: "PUT", token: userToken, body: updatedPlan });
    assert.equal(updated.status, 200, JSON.stringify(updated.data));

    const list = await api("/learning", { token: userToken });
    assert.equal(list.status, 200, JSON.stringify(list.data));
    const stored = list.data.data.plans.find((row) => row.video.id === video.id);
    assert.ok(stored);
    assert.equal(stored.chunks[0].status, "done");
    assert.equal(stored.chunks.length, 2);

    const invalid = await api("/learning", {
      method: "PUT",
      token: userToken,
      body: { ...plan, chunks: [] },
    });
    assert.equal(invalid.status, 400, JSON.stringify(invalid.data));

    const anonymous = await api("/learning");
    assert.equal(anonymous.status, 401);

    const removed = await api(`/learning/${video.id}`, { method: "DELETE", token: userToken });
    assert.equal(removed.status, 204, JSON.stringify(removed.data));

    const afterDelete = await api("/learning", { token: userToken });
    assert.equal(afterDelete.status, 200);
    assert.equal(afterDelete.data.data.plans.some((row) => row.video.id === video.id), false);
  });

  await t.test("gamification XP, achievements, game claims, and leaderboard persist", async () => {
    const before = await api("/gamification/overview", { token: userToken });
    assert.equal(before.status, 200, JSON.stringify(before.data));
    const initial = before.data.data;
    assert.equal(initial.achievements.length, 12);
    assert.equal(initial.games.length, 10);
    assert.equal(initial.achievements.find((row) => row.id === "first_step").unlocked, false);

    const created = await api("/habits", {
      method: "POST",
      token: userToken,
      body: { title: "Morning walk", category: "Health", icon: "🚶", difficulty: "easy" },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const habitId = created.data.data.habit.id;

    const progress = await api(`/habits/${habitId}/progress`, {
      method: "POST",
      token: userToken,
      body: { completed: true, note: "Felt great" },
    });
    assert.equal(progress.status, 200, JSON.stringify(progress.data));

    const afterHabit = await api("/gamification/overview", { token: userToken });
    assert.equal(afterHabit.status, 200, JSON.stringify(afterHabit.data));
    const overview = afterHabit.data.data;
    assert.ok(overview.stats.totalXP >= 10);
    assert.ok(overview.stats.completedToday >= 1);
    assert.equal(overview.achievements.find((row) => row.id === "first_step").unlocked, true);

    const claim = await api("/gamification/games/tap_frenzy/claim", {
      method: "POST",
      token: userToken,
    });
    assert.equal(claim.status, 200, JSON.stringify(claim.data));
    assert.equal(claim.data.data.xpEarned, 15);

    const duplicate = await api("/gamification/games/tap_frenzy/claim", {
      method: "POST",
      token: userToken,
    });
    assert.equal(duplicate.status, 409, JSON.stringify(duplicate.data));
    assert.equal(duplicate.data.error.code, "GAME_ALREADY_CLAIMED");

    const unknown = await api("/gamification/games/not_a_game/claim", {
      method: "POST",
      token: userToken,
    });
    assert.equal(unknown.status, 404);

    const board = await api("/gamification/leaderboard", { token: userToken });
    assert.equal(board.status, 200, JSON.stringify(board.data));
    const me = board.data.data.entries.find((entry) => entry.isCurrentUser);
    assert.ok(me);
    assert.ok(me.xp >= 25);

    const summary = await api("/habits/summary", { token: userToken });
    assert.equal(summary.status, 200);
    assert.ok(summary.data.data.stats.totalXP >= 25);
    assert.ok(summary.data.data.stats.todayXP >= 10);
  });

  await t.test("habit history and planner APIs persist", async () => {
    const created = await api("/habits", {
      method: "POST",
      token: userToken,
      body: { title: "Planner focus", category: "Study", icon: "📚", difficulty: "medium" },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    const habitId = created.data.data.habit.id;
    await api(`/habits/${habitId}/progress`, {
      method: "POST",
      token: userToken,
      body: { completed: true },
    });

    const history = await api("/habits/history?days=7", { token: userToken });
    assert.equal(history.status, 200, JSON.stringify(history.data));
    assert.equal(history.data.data.days.length, 7);
    const tracked = history.data.data.habits.find((row) => row.id === habitId);
    assert.ok(tracked);
    assert.equal(tracked.dates.length, 1);

    const task = await api("/planner/tasks", {
      method: "POST",
      token: userToken,
      body: { title: "Read 10 pages", category: "Study", time: "07:30" },
    });
    assert.equal(task.status, 201, JSON.stringify(task.data));
    const taskId = task.data.data.task.id;
    assert.equal(task.data.data.task.completed, false);

    const patched = await api(`/planner/tasks/${taskId}`, {
      method: "PATCH",
      token: userToken,
      body: { completed: true },
    });
    assert.equal(patched.status, 200, JSON.stringify(patched.data));
    assert.equal(patched.data.data.task.completed, true);

    const taskList = await api("/planner/tasks", { token: userToken });
    assert.equal(taskList.status, 200);
    assert.ok(taskList.data.data.tasks.some((row) => row.id === taskId));

    const note = await api("/planner/notes", {
      method: "POST",
      token: userToken,
      body: { text: "Felt sharp after the morning walk", time: "08:15" },
    });
    assert.equal(note.status, 201, JSON.stringify(note.data));
    const notes = await api("/planner/notes", { token: userToken });
    assert.equal(notes.status, 200);
    assert.ok(notes.data.data.notes.some((row) => row.id === note.data.data.note.id));

    const today = new Date().toISOString().slice(0, 10);
    const cell = await api("/planner/time", {
      method: "PUT",
      token: userToken,
      body: { habitId, label: "Deep work", date: today, slot: 9, hours: 1.5 },
    });
    assert.equal(cell.status, 200, JSON.stringify(cell.data));
    assert.equal(cell.data.data.entry.hours, 1.5);

    const time = await api(`/planner/time?from=${today}&to=${today}`, { token: userToken });
    assert.equal(time.status, 200);
    assert.equal(time.data.data.totalHours, 1.5);

    const cleared = await api("/planner/time", {
      method: "PUT",
      token: userToken,
      body: { habitId, date: today, slot: 9, hours: 0 },
    });
    assert.equal(cleared.status, 200);
    assert.equal(cleared.data.data.entry, null);

    const removed = await api(`/planner/tasks/${taskId}`, { method: "DELETE", token: userToken });
    assert.equal(removed.status, 204);
  });

  await t.test("CSV export is available on the free plan", async () => {
    const allowed = await apiText("/analytics/export?type=habits", { token: userToken });
    assert.equal(allowed.status, 200, allowed.text);
    assert.match(allowed.contentType, /text\/csv/);
  });

  await t.test("payment claim can be filed and approved by an admin", async () => {
    const created = await api("/payments/claims", {
      method: "POST",
      token: userToken,
      body: {
        plan: "premium_all_monthly",
        reference: "pay_TEST123456",
        note: "Paid via Razorpay link",
      },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));
    claimId = created.data.data.claim.id;
    assert.equal(created.data.data.claim.status, "pending");
    assert.equal(created.data.data.claim.verification, "not_found");

    const duplicate = await api("/payments/claims", {
      method: "POST",
      token: userToken,
      body: { plan: "premium_all_monthly", reference: "pay_TEST123456" },
    });
    assert.equal(duplicate.status, 409, JSON.stringify(duplicate.data));
    assert.equal(duplicate.data.error.code, "CLAIM_ALREADY_PENDING");

    const mine = await api("/payments/claims/me", { token: userToken });
    assert.equal(mine.status, 200);
    assert.equal(mine.data.data.claims[0].status, "pending");

    const stillFree = await api("/templates/catalog", { token: userToken });
    assert.ok(stillFree.data.data.templates.every((row) => row.locked === false));

    const adminAuth = await signup("Habit Admin", adminEmail);
    adminToken = adminAuth.session.accessToken;
    const { User } = require("../dist/models/User.js");
    await User.updateOne({ email: adminEmail }, { $set: { role: "admin" } });

    const reusedReference = await api("/payments/claims", {
      method: "POST",
      token: adminToken,
      body: { plan: "starter_monthly", reference: "pay_TEST123456" },
    });
    assert.equal(reusedReference.status, 409, JSON.stringify(reusedReference.data));
    assert.equal(reusedReference.data.error.code, "CLAIM_REFERENCE_USED");

    const adminClaims = await api("/payments/admin/claims", { token: adminToken });
    assert.equal(adminClaims.status, 200, JSON.stringify(adminClaims.data));
    assert.ok(adminClaims.data.data.claims.some((claim) => claim.id === claimId));

    const approved = await api(`/payments/admin/claims/${claimId}`, {
      method: "PATCH",
      token: adminToken,
      body: { action: "approve", durationMonths: 1 },
    });
    assert.equal(approved.status, 200, JSON.stringify(approved.data));
    assert.equal(approved.data.data.claim.status, "paid");

    const afterApproval = await api("/templates/catalog", { token: userToken });
    assert.ok(afterApproval.data.data.templates.every((row) => row.locked === false));
  });

  await t.test("premium CSV export returns habit and trend reports", async () => {
    const habits = await apiText("/analytics/export?type=habits", { token: userToken });
    assert.equal(habits.status, 200, habits.text);
    assert.match(habits.contentType, /text\/csv/);
    assert.ok(habits.text.startsWith("Habit,Category,Difficulty,Frequency,XP,Current streak,Completed today,Created"));
    assert.match(habits.text, /Morning walk/);

    const daily = await apiText("/analytics/export?type=daily", { token: userToken });
    assert.equal(daily.status, 200, daily.text);
    assert.ok(daily.text.startsWith("Date,Completed habits,Total habits,Consistency"));

    const templates = await apiText("/analytics/export?type=templates", { token: userToken });
    assert.equal(templates.status, 200, templates.text);
    assert.ok(templates.text.startsWith("Template,Days,Habits,Completed checks,Total checks,Completion rate,Last updated"));
  });

  await t.test("scheduled reminders respect settings and dedupe per day", async () => {
    const settings = await api("/settings", {
      method: "PATCH",
      token: userToken,
      body: {
        timezone: "UTC",
        reminderHour: new Date().getUTCHours(),
        emailNotifications: true,
        dailyReminders: true,
        weeklyReports: false,
      },
    });
    assert.equal(settings.status, 200, JSON.stringify(settings.data));

    const pendingHabit = await api("/habits", {
      method: "POST",
      token: userToken,
      body: { title: "Evening reading", category: "Learning", icon: "📖", difficulty: "easy" },
    });
    assert.equal(pendingHabit.status, 201, JSON.stringify(pendingHabit.data));

    const firstRun = await api("/notifications/scheduler/run", {
      method: "POST",
      token: adminToken,
    });
    assert.equal(firstRun.status, 200, JSON.stringify(firstRun.data));
    assert.ok(firstRun.data.data.reminders >= 1);

    const inbox = await api("/notifications", { token: userToken });
    assert.equal(inbox.status, 200, JSON.stringify(inbox.data));
    const reminder = inbox.data.data.notifications.find((row) => row.type === "daily_reminder");
    assert.ok(reminder);
    assert.match(reminder.message, /Evening reading/);

    const secondRun = await api("/notifications/scheduler/run", {
      method: "POST",
      token: adminToken,
    });
    assert.equal(secondRun.status, 200, JSON.stringify(secondRun.data));
    assert.equal(secondRun.data.data.reminders, 0);

    const nonAdminRun = await api("/notifications/scheduler/run", {
      method: "POST",
      token: userToken,
    });
    assert.equal(nonAdminRun.status, 403);

    const weeklySettings = await api("/settings", {
      method: "PATCH",
      token: userToken,
      body: { dailyReminders: false, weeklyReports: true },
    });
    assert.equal(weeklySettings.status, 200, JSON.stringify(weeklySettings.data));

    const { reminderService } = require("../dist/services/reminder.service.js");
    // 2026-11-01 is a Sunday; the weekly pass runs at 18:00 in the user's timezone.
    const weeklyFirst = await reminderService.runPass(new Date("2026-11-01T18:00:00Z"));
    assert.equal(weeklyFirst.reports, 1);
    const weeklySecond = await reminderService.runPass(new Date("2026-11-01T18:00:00Z"));
    assert.equal(weeklySecond.reports, 0);

    const weeklyInbox = await api("/notifications", { token: userToken });
    assert.ok(weeklyInbox.data.data.notifications.some((row) => row.type === "weekly_report"));
  });

  await t.test("contact messages reach the admin inbox", async () => {
    const created = await api("/contact", {
      method: "POST",
      body: {
        name: "Habit User",
        email: userEmail,
        topic: "bug",
        subject: "Bug report",
        message: "The template grid scrolls sideways on mobile.",
      },
    });
    assert.equal(created.status, 201, JSON.stringify(created.data));

    const inbox = await api("/contact", { token: adminToken });
    assert.equal(inbox.status, 200, JSON.stringify(inbox.data));
    const message = inbox.data.data.messages.find((row) => row.subject === "Bug report");
    assert.ok(message);
    assert.equal(message.status, "new");

    const updated = await api(`/contact/${message.id}`, {
      method: "PATCH",
      token: adminToken,
      body: { status: "replied" },
    });
    assert.equal(updated.status, 200, JSON.stringify(updated.data));
    assert.equal(updated.data.data.message.status, "replied");
  });

  await t.test("admin user list and 404 handling", async () => {
    const users = await api("/users", { token: adminToken });
    assert.equal(users.status, 200, JSON.stringify(users.data));
    assert.ok(users.data.data.users.some((row) => row.email === userEmail));

    const forbidden = await api("/users", { token: userToken });
    assert.equal(forbidden.status, 403);

    const missing = await api("/does-not-exist");
    assert.equal(missing.status, 404);
    assert.equal(missing.data.error.code, "NOT_FOUND");
  });

  await t.test("account deletion requires confirmation and removes all data", async () => {
    const victim = await signup("Leaving User", "leaving.user@example.com");

    const habit = await api("/habits", {
      method: "POST",
      token: victim.session.accessToken,
      body: { title: "Old habit", category: "Health", icon: "🚶", difficulty: "easy" },
    });
    assert.equal(habit.status, 201, JSON.stringify(habit.data));

    const me = await api("/auth/me", { token: victim.session.accessToken });
    assert.equal(me.status, 200, JSON.stringify(me.data));
    assert.equal(me.data.data.user.hasPassword, true);

    const wrongWord = await api("/users/me", {
      method: "DELETE",
      token: victim.session.accessToken,
      body: { confirm: "delete" },
    });
    assert.equal(wrongWord.status, 400, JSON.stringify(wrongWord.data));

    const noPassword = await api("/users/me", {
      method: "DELETE",
      token: victim.session.accessToken,
      body: { confirm: "DELETE" },
    });
    assert.equal(noPassword.status, 400, JSON.stringify(noPassword.data));
    assert.equal(noPassword.data.error.code, "PASSWORD_REQUIRED");

    const wrongPassword = await api("/users/me", {
      method: "DELETE",
      token: victim.session.accessToken,
      body: { confirm: "DELETE", currentPassword: "NotMyPassword1!" },
    });
    assert.equal(wrongPassword.status, 401, JSON.stringify(wrongPassword.data));

    const deleted = await api("/users/me", {
      method: "DELETE",
      token: victim.session.accessToken,
      body: { confirm: "DELETE", currentPassword: "Password123!" },
    });
    assert.equal(deleted.status, 200, JSON.stringify(deleted.data));
    assert.equal(deleted.data.data.deleted, true);

    const login = await api("/auth/login", {
      method: "POST",
      body: { email: "leaving.user@example.com", password: "Password123!" },
    });
    assert.equal(login.status, 401, JSON.stringify(login.data));

    const { User } = require("../dist/models/User.js");
    const { Habit } = require("../dist/models/Habit.js");
    assert.equal(await User.countDocuments({ email: "leaving.user@example.com" }), 0);
    assert.equal(await Habit.countDocuments({ title: "Old habit" }), 0);
  });

  await new Promise((resolve) => server.close(resolve));
  await mongoose.disconnect();
  await mongod.stop();
});
