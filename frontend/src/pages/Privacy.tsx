import { FileText } from "lucide-react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

const sections: LegalSection[] = [
  {
    id: "information-we-collect",
    heading: "Information We Collect",
    paragraphs: [
      "We collect only what we need to run your habit tracker. There are two kinds of data:",
      "Guest mode (no account): your habits, learning plans, and template data are stored in your browser's local storage. Nothing leaves your device, and we never see it.",
    ],
    bullets: [
      "Account data — your name, email address, and a securely hashed password when you sign up.",
      "Habit data — the habits you create, completions, streaks, XP, and learning plans you build while signed in.",
      "Usage data — basic analytics like pages visited and features used, collected anonymously to improve the product.",
      "Payment data — handled entirely by Razorpay. We receive a confirmation that you paid, never your card or bank details.",
    ],
  },
  {
    id: "how-we-use",
    heading: "How We Use Your Information",
    paragraphs: ["We use your data for exactly one purpose: making the product work for you."],
    bullets: [
      "Sync your habits and progress across devices and browsers.",
      "Track your subscription status (Free or Premium).",
      "Send account-related emails such as password resets and payment confirmations.",
      "Improve the product using anonymized, aggregate usage statistics.",
    ],
  },
  {
    id: "data-storage",
    heading: "Data Storage & Security",
    paragraphs: [
      "Your account data is stored in a MongoDB database hosted on cloud infrastructure, with encryption in transit (HTTPS/TLS) and access limited to authenticated application servers only. Passwords are hashed — we can never read them.",
    ],
  },
  {
    id: "cookies",
    heading: "Cookies & Local Storage",
    paragraphs: [
      "We use a small number of strictly necessary cookies and local storage entries to keep you signed in and remember your theme preference. We do not use third-party advertising or tracking cookies.",
    ],
  },
  {
    id: "your-rights",
    heading: "Your Rights",
    paragraphs: ["You are in control of your data at all times."],
    bullets: [
      "Access — view everything we store about you from your Profile page.",
      "Export — request a copy of your data by emailing us.",
      "Deletion — delete your account and all associated data from your Profile page, or ask us to do it.",
      "Correction — update your name, avatar, and email from your Profile page.",
    ],
  },
  {
    id: "data-retention",
    heading: "Data Retention",
    paragraphs: [
      "We keep your data for as long as your account is active. When you delete your account, your personal data and habit records are permanently removed from our database within 30 days. Anonymized aggregate statistics may be retained.",
    ],
  },
  {
    id: "children",
    heading: "Children's Privacy",
    paragraphs: [
      "Habbiters is not intended for children under 13, and we do not knowingly collect personal information from them. If you believe a child has created an account, contact us and we will delete it.",
    ],
  },
  {
    id: "changes",
    heading: "Changes to This Policy",
    paragraphs: [
      "If we make material changes, we will notify you by email or a notice in the app before the change takes effect. The date at the top of this page always reflects the latest version.",
    ],
  },
  {
    id: "contact",
    heading: "Contact Us",
    paragraphs: [
      "Questions about your privacy? Email us at privacy@habbiters.app and we will respond within 7 days.",
    ],
  },
];

const Privacy = () => (
  <LegalPage
    title="Privacy Policy"
    subtitle="How we collect, use, and protect your data — in plain language."
    icon={FileText}
    lastUpdated="September 27, 2026"
    sections={sections}
  />
);

export default Privacy;
