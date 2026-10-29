import { ScrollText } from "lucide-react";
import LegalPage, { type LegalSection } from "@/components/LegalPage";

const sections: LegalSection[] = [
  {
    id: "acceptance",
    heading: "Acceptance of Terms",
    paragraphs: [
      "By creating an account or using Habbiters, you agree to these Terms of Service. If you do not agree, please do not use the service.",
    ],
  },
  {
    id: "account-responsibilities",
    heading: "Account Responsibilities",
    paragraphs: ["You are responsible for what happens under your account."],
    bullets: [
      "Keep your password confidential and use a strong, unique one.",
      "Provide accurate information when signing up.",
      "Notify us immediately at support@habbiters.app if you suspect unauthorized access.",
      "One person per account — do not share or sell access.",
    ],
  },
  {
    id: "pricing",
    heading: "Pricing",
    paragraphs: [
      "Habbiters is free to use. Every habit, planner tool, analytics view and all 105 templates are included at no cost — there are no subscriptions, in-app purchases, trials or hidden paywalls.",
    ],
  },
  {
    id: "acceptable-use",
    heading: "Acceptable Use",
    paragraphs: ["You agree not to:"],
    bullets: [
      "Use the service for anything illegal or to harm others.",
      "Attempt to break, probe, or overload our systems.",
      "Scrape, copy, or resell the service or its content.",
      "Impersonate another person or misrepresent your identity.",
    ],
  },
  {
    id: "intellectual-property",
    heading: "Intellectual Property",
    paragraphs: [
      "Your habit data belongs to you. The Habbiters name, logo, design, and code belong to us. You may not reuse them without written permission.",
    ],
  },
  {
    id: "termination",
    heading: "Termination",
    paragraphs: [
      "You can delete your account at any time from your Profile page. We may suspend accounts that violate these terms. Upon termination, your data is deleted as described in our Privacy Policy.",
    ],
  },
  {
    id: "disclaimers",
    heading: "Disclaimers",
    paragraphs: [
      'The service is provided "as is" and "as available". Habbiters is a self-improvement tool, not medical or psychological advice. We do not guarantee specific outcomes from using the product.',
    ],
  },
  {
    id: "limitation-of-liability",
    heading: "Limitation of Liability",
    paragraphs: [
      "To the maximum extent permitted by law, Habbiters is not liable for indirect, incidental, or consequential damages, or for lost data caused by events beyond our reasonable control. Our total liability is limited to ₹500.",
    ],
  },
  {
    id: "changes",
    heading: "Changes to These Terms",
    paragraphs: [
      "We may update these terms as the product evolves. For material changes we will notify you by email or in-app notice at least 14 days before they take effect.",
    ],
  },
  {
    id: "governing-law",
    heading: "Governing Law",
    paragraphs: [
      "These terms are governed by the laws of India. Any disputes will be resolved in the courts of jurisdiction where the service operator is registered.",
    ],
  },
  {
    id: "contact",
    heading: "Contact Us",
    paragraphs: [
      "Questions about these terms? Email legal@habbiters.app.",
    ],
  },
];

const Terms = () => (
  <LegalPage
    title="Terms of Service"
    subtitle="The agreement between you and Habbiters when you use the product."
    icon={ScrollText}
    lastUpdated="September 27, 2026"
    sections={sections}
  />
);

export default Terms;
