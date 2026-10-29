import { useEffect } from "react";

export const SITE_URL = "https://habbiters.app";
const DEFAULT_IMAGE = `${SITE_URL}/og-image.png`;

type Meta = {
  title: string;
  description: string;
  noindex?: boolean;
};

const PUBLIC_PAGES: Record<string, Meta> = {
  "/": {
    title: "Habbiters — Free Habit Tracker with Streaks, Templates & Analytics",
    description:
      "Track daily habits, build streaks, earn XP and see honest analytics. 105 free templates, a planner, weekly time tracking and calendar notes. Free forever, no paywall.",
  },
  "/templates": {
    title: "105 Free Habit Templates — Gym, Study, Focus & Life | Habbiters",
    description:
      "Browse 105 ready-made habit templates for fitness, study, deep work, sleep and daily discipline. Pick one and start tracking in seconds — every template is free.",
  },
  "/blog": {
    title: "Habbiters Blog — Habit Science, Streaks & Consistency",
    description:
      "Practical guides on habit stacking, streak psychology, gamification and 30-day resets — written by the team building Habbiters.",
  },
  "/about": {
    title: "About Habbiters — Built for People Who Show Up",
    description:
      "Why we build a free, gamified habit tracker for real life: streaks, honest analytics and routines that survive busy weeks.",
  },
  "/careers": {
    title: "Careers at Habbiters — Build the Habit OS",
    description:
      "Remote roles in engineering, design and growth. Help build a habit tracker used every day by people who want to show up.",
  },
  "/contact": {
    title: "Contact Habbiters — Support, Bugs & Feedback",
    description:
      "Questions about your account, a bug to report or a feature idea? Reach the Habbiters team by email or the contact form.",
  },
  "/privacy": {
    title: "Privacy Policy — Habbiters",
    description:
      "What Habbiters collects, why we collect it, and how you can export or delete your data at any time.",
  },
  "/terms": {
    title: "Terms of Service — Habbiters",
    description:
      "The agreement between you and Habbiters: account responsibilities, acceptable use, data ownership and limitations.",
  },
  "/security": {
    title: "Security at Habbiters — How We Protect Your Data",
    description:
      "Encryption in transit, hashed passwords, short-lived sessions and responsible disclosure — how Habbiters keeps your habits safe.",
  },
  "/delete-account": {
    title: "Delete Your Account — Habbiters",
    description:
      "Delete your Habbiters account and all associated habits, planner data, notes and progress permanently.",
  },
  "/signup": {
    title: "Create Your Free Habbiters Account",
    description:
      "Start tracking habits in under a minute. Unlimited habits, 105 free templates, streaks, XP, planner and analytics — no card required.",
  },
};

const PRIVATE_PAGES: Record<string, Meta> = {
  "/dashboard": { title: "Your Dashboard — Habbiters", description: "Your daily habit dashboard.", noindex: true },
  "/tracker": { title: "Habit Tracker — Habbiters", description: "Log today's habits and keep your streak alive.", noindex: true },
  "/learning": { title: "Learning Plans — Habbiters", description: "Your learning plans and video routines.", noindex: true },
  "/analytics": { title: "Analytics — Habbiters", description: "Your consistency, trends and time insights.", noindex: true },
  "/gamification": { title: "XP & Achievements — Habbiters", description: "Levels, XP and achievements.", noindex: true },
  "/profile": { title: "Profile — Habbiters", description: "Manage your Habbiters account.", noindex: true },
  "/admin": { title: "Admin — Habbiters", description: "Habbiters admin console.", noindex: true },
  "/login": { title: "Log In — Habbiters", description: "Sign in to pick up your streaks and habits.", noindex: true },
  "/forgot-password": { title: "Reset Your Password — Habbiters", description: "Request a password reset link.", noindex: true },
  "/reset-password": { title: "Choose a New Password — Habbiters", description: "Set a new password for your account.", noindex: true },
};

const ensureMeta = (attr: "name" | "property", key: string) => {
  let tag = document.head.querySelector<HTMLMetaElement>(`meta[${attr}="${key}"]`);
  if (!tag) {
    tag = document.createElement("meta");
    tag.setAttribute(attr, key);
    document.head.appendChild(tag);
  }
  return tag;
};

const ensureLink = (rel: string) => {
  let tag = document.head.querySelector<HTMLLinkElement>(`link[rel="${rel}"]`);
  if (!tag) {
    tag = document.createElement("link");
    tag.rel = rel;
    document.head.appendChild(tag);
  }
  return tag;
};

export const applyMeta = (pathname: string, override?: Meta) => {
  const clean = pathname.replace(/\/+$/, "") || "/";
  const isBlogPost = /^\/blog\/[^/]+$/.test(clean);
  const meta: Meta =
    override ||
    PUBLIC_PAGES[clean] ||
    PRIVATE_PAGES[clean] ||
    (isBlogPost
      ? { title: "Habbiters Blog", description: "Habit science, streaks and consistency." }
      : { title: "Page not found — Habbiters", description: "This page does not exist.", noindex: true });

  document.title = meta.title;
  ensureMeta("name", "description").content = meta.description;
  ensureMeta("name", "robots").content = meta.noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large";

  const url = `${SITE_URL}${clean === "/" ? "/" : clean}`;
  ensureLink("canonical").href = url;

  ensureMeta("property", "og:title").content = meta.title;
  ensureMeta("property", "og:description").content = meta.description;
  ensureMeta("property", "og:url").content = url;
  ensureMeta("property", "og:type").content = isBlogPost ? "article" : "website";
  ensureMeta("property", "og:image").content = DEFAULT_IMAGE;
  ensureMeta("property", "og:site_name").content = "Habbiters";

  ensureMeta("name", "twitter:card").content = "summary_large_image";
  ensureMeta("name", "twitter:title").content = meta.title;
  ensureMeta("name", "twitter:description").content = meta.description;
  ensureMeta("name", "twitter:image").content = DEFAULT_IMAGE;
};

export const usePageMeta = (pathname: string) => {
  useEffect(() => {
    applyMeta(pathname);
  }, [pathname]);
};
