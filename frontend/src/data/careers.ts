export interface JobOpening {
  id: string;
  title: string;
  department: "Engineering" | "Design" | "Growth" | "Content";
  location: "Remote — India" | "Remote — Worldwide" | "Bengaluru (Hybrid)";
  type: "Full-time" | "Contract" | "Internship";
  description: string;
  responsibilities: string[];
  requirements: string[];
}

export const perks = [
  { title: "Remote-first", desc: "Work from anywhere. We measure output, not hours in a chair." },
  { title: "Flexible hours", desc: "Guard your deep work and your workouts. Core hours are minimal." },
  { title: "Learning budget", desc: "₹50,000/year for courses, books, and conferences." },
  { title: "Wellness stipend", desc: "Gym, yoga, therapy — anything that keeps you healthy counts." },
  { title: "Annual retreat", desc: "Once a year the whole team meets somewhere beautiful." },
  { title: "Habbiters for life", desc: "Every feature and template, free for you and your family." },
];

export const openings: JobOpening[] = [
  {
    id: "frontend-engineer",
    title: "Frontend Engineer (React)",
    department: "Engineering",
    location: "Remote — India",
    type: "Full-time",
    description: "Own the Habbiters web experience end to end — from the habit grid to the gamification animations our users love.",
    responsibilities: [
      "Build and ship React + TypeScript features across the app",
      "Own performance, accessibility, and buttery-smooth animations",
      "Collaborate with design on our component system",
    ],
    requirements: [
      "3+ years with React and TypeScript in production",
      "Strong CSS/Tailwind and animation fundamentals (framer-motion a plus)",
      "Experience with data-heavy, interaction-rich UIs",
    ],
  },
  {
    id: "backend-engineer",
    title: "Backend Engineer (Node.js)",
    department: "Engineering",
    location: "Remote — India",
    type: "Full-time",
    description: "Scale the APIs behind millions of habit check-ins and build the systems that keep streaks, plans and notes safe.",
    responsibilities: [
      "Design and evolve REST APIs on Node.js + Express + MongoDB",
      "Own reliability: rate limiting, idempotency, observability",
      "Ship planner, analytics and sync features used every day by real people",
    ],
    requirements: [
      "3+ years building production APIs in Node.js/TypeScript",
      "Solid grasp of MongoDB modeling, indexing, and aggregation",
      "Security-first mindset: auth, validation, and safe defaults",
    ],
  },
  {
    id: "product-designer",
    title: "Product Designer",
    department: "Design",
    location: "Remote — Worldwide",
    type: "Full-time",
    description: "Design experiences that make self-improvement feel like a game — and look gorgeous doing it.",
    responsibilities: [
      "Own product design from concept to polished UI",
      "Run user interviews and usability tests",
      "Evolve our design system with our component library",
    ],
    requirements: [
      "A portfolio of shipped consumer product work",
      "Fluency in Figma and modern design systems",
      "Deep empathy for habit-building and behavioral design",
    ],
  },
  {
    id: "content-writer",
    title: "Content Writer (Habits & Productivity)",
    department: "Content",
    location: "Remote — India",
    type: "Contract",
    description: "Write the blog posts, guides, and templates that help our users build better habits — and rank on Google while doing it.",
    responsibilities: [
      "Write evidence-based articles on habits and behavior change",
      "Research keywords and structure posts for SEO",
      "Turn user questions into helpful content",
    ],
    requirements: [
      "Published writing samples on habits, health, or productivity",
      "Understanding of on-page SEO fundamentals",
      "Ability to cite and simplify behavioral science research",
    ],
  },
  {
    id: "growth-intern",
    title: "Growth Marketing Intern",
    department: "Growth",
    location: "Remote — India",
    type: "Internship",
    description: "Learn growth by doing: experiment with content, community, and lifecycle campaigns for a live product with real users.",
    responsibilities: [
      "Assist with social content and community engagement",
      "Analyze funnel metrics and report weekly insights",
      "Run small experiments end to end",
    ],
    requirements: [
      "Strong written English and analytical curiosity",
      "Familiarity with social platforms and basic analytics",
      "Self-starter — you don't wait to be told what to do",
    ],
  },
];
