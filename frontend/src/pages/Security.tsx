import { ShieldCheck } from "lucide-react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

const sections: LegalSection[] = [
  {
    id: "encryption",
    heading: "Encryption Everywhere",
    paragraphs: [
      "All traffic between your browser and our servers is encrypted with HTTPS/TLS. Passwords are stored as salted hashes, never in plain text, and sensitive configuration such as API keys lives only on the server — never in the frontend code you can inspect.",
    ],
  },
  {
    id: "authentication",
    heading: "Authentication & Sessions",
    bullets: [
      "Sign-up and sign-in are verified with a one-time code sent to your email.",
      "Sessions use short-lived access tokens plus refresh tokens, so a stolen token expires quickly.",
      "Signing out invalidates your session on the server side.",
      "Administrative routes are permission-gated separately from normal user routes.",
    ],
  },
  {
    id: "payments-security",
    heading: "Payments Security",
    paragraphs: [
      "Payments are processed by Razorpay, a PCI-DSS compliant payment processor. Your card, UPI, and bank details go directly to Razorpay — they never touch our servers, and we never store them. We only receive a signed confirmation of payment, which we verify cryptographically before activating Premium.",
    ],
  },
  {
    id: "data-protection",
    heading: "Data Protection Practices",
    bullets: [
      "Server errors never leak stack traces or internals to the browser in production.",
      "User permissions are checked on both the frontend routes and the backend API.",
      "Guest-mode data stays in your browser's local storage and is only synced after you create an account.",
      "Database access is restricted to the application layer — there are no publicly exposed database ports.",
    ],
  },
  {
    id: "responsible-disclosure",
    heading: "Responsible Disclosure",
    paragraphs: [
      "Found a vulnerability? Please report it privately to security@habbiters.app instead of disclosing it publicly. Include steps to reproduce and, if possible, a suggested fix. We commit to:",
    ],
    bullets: [
      "Acknowledging your report within 48 hours.",
      "Investigating and fixing verified issues promptly.",
      "Crediting you (unless you prefer to stay anonymous).",
      "Never taking legal action against good-faith security research.",
    ],
  },
];

const Security = () => (
  <LegalPage
    title="Security"
    subtitle="How we protect your account, your data, and your payments."
    icon={ShieldCheck}
    lastUpdated="September 27, 2026"
    sections={sections}
  />
);

export default Security;
