import { useEffect } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  Calendar,
  Check,
  Flame,
  Sparkles,
  Star,
  Target,
  Trophy,
  Zap,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import StickerField from "@/components/decor/StickerField";
import QuoteMarquee from "@/components/decor/QuoteMarquee";
import StoryJourney from "@/components/decor/StoryJourney";
import TryHabitDemo from "@/components/decor/TryHabitDemo";
import CountUp from "@/components/decor/CountUp";

const features = [
  { icon: Target, title: "Smart habit tracking", desc: "Daily check-ins with streaks, difficulty levels, and momentum you can feel." },
  { icon: Trophy, title: "Gamified progress", desc: "Earn XP for real reps, level up, and unlock achievements worth showing off." },
  { icon: BarChart3, title: "Honest analytics", desc: "See consistency, weekly trends, and where the compound effect is working." },
  { icon: Calendar, title: "Timetable view", desc: "Plan the day like an athlete: training, deep work, recovery, and sleep." },
  { icon: Zap, title: "Template library", desc: "105 gym, study, and life templates — 12 free to start, no blank page." },
  { icon: Star, title: "Guided coaching", desc: "A habit coach that nudges you before a missed day becomes a missed week." },
];

const templates = [
  { name: "Gym & strength", habits: ["Push day", "Progressive overload", "10k steps"], color: "gradient-primary" },
  { name: "Study & focus", habits: ["Deep work 90m", "Revise notes", "Practice sets"], color: "gradient-xp" },
  { name: "Daily discipline", habits: ["6 AM wake-up", "Read 10 pages", "Plan tomorrow"], color: "gradient-streak" },
];

const plans: {
  name: string;
  price: string;
  period?: string;
  description: string;
  features: string[];
  cta: string;
  ctaTo: string;
  highlighted: boolean;
}[] = [
  {
    name: "Free",
    price: "₹0",
    description: "Start building momentum today.",
    features: ["Track up to 5 habits", "12 free templates", "Basic analytics", "7-day Premium trial"],
    cta: "Start Free",
    ctaTo: "/signup",
    highlighted: false,
  },
  {
    name: "Starter",
    price: "₹99",
    period: "/month",
    description: "More structure for your routine.",
    features: ["Everything in Free", "25 starter templates", "Save template progress", "Email support"],
    cta: "Choose Starter",
    ctaTo: "/pricing",
    highlighted: false,
  },
  {
    name: "Premium All",
    price: "₹349",
    period: "/month",
    description: "All the tools for lasting change.",
    features: ["Everything in Starter", "Unlimited habits", "Every current and future template", "Advanced analytics and reports"],
    cta: "Go Premium",
    ctaTo: "/pricing",
    highlighted: true,
  },
];

const easeOutExpo: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true, margin: "-80px" },
  transition: { duration: 0.6, ease: easeOutExpo },
};

const Home = () => {
  useEffect(() => {
    document.title = "Habbiters — Small reps. Unfair momentum.";
  }, []);

  return (
    <div className="relative min-h-screen overflow-x-clip">
      <Navbar />

      {/* Hero */}
      <section className="relative isolate overflow-hidden pb-16 pt-28 sm:pt-32">
        <div aria-hidden className="absolute inset-0 -z-10">
          <div className="absolute left-1/2 top-10 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-primary/15 blur-3xl" />
          <div className="absolute -right-24 top-40 h-80 w-80 rounded-full bg-streak/10 blur-3xl" />
          <div className="mesh-grid absolute inset-0 opacity-60" />
        </div>
        <StickerField variant="hero" />

        <div className="container mx-auto grid max-w-6xl items-center gap-12 px-4 lg:grid-cols-[1.05fr_0.95fr] lg:gap-10">
          <motion.div initial={{ opacity: 0, y: 26 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.7, ease: easeOutExpo }}>
            <div className="inline-flex items-center gap-2 rounded-full border border-primary/25 bg-primary/10 px-4 py-1.5 text-xs font-semibold text-primary">
              <Flame className="h-3.5 w-3.5" />
              The habit OS for real life
            </div>

            <h1 className="mt-6 font-display text-[2.75rem] font-bold leading-[1.02] tracking-tight text-foreground sm:text-6xl xl:text-7xl">
              Small reps.
              <br />
              <span className="text-gradient-primary">Unfair momentum.</span>
            </h1>

            <p className="mt-6 max-w-xl text-base leading-relaxed text-muted-foreground sm:text-lg">
              Turn your day into a visible streak — workouts, deep work, reading, recovery. Track the reps, then watch the compound effect show up in your analytics.
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/signup"
                className="group inline-flex items-center justify-center gap-2 rounded-xl gradient-primary px-7 py-3.5 font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:-translate-y-0.5 hover:shadow-primary/30"
              >
                Start free
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
              <a
                href="#story"
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card/60 px-7 py-3.5 font-semibold text-foreground backdrop-blur-sm transition-colors hover:bg-secondary"
              >
                See the 90-day arc
              </a>
            </div>

            <p className="mt-4 text-xs text-muted-foreground">No card required · 7-day Premium trial · Cancel anytime</p>

            <div className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-border/70 pt-6">
              {[
                { value: 105, suffix: "", label: "ready templates" },
                { value: 12, suffix: "", label: "free to start" },
                { value: 7, suffix: "d", label: "premium trial" },
              ].map((stat) => (
                <div key={stat.label}>
                  <CountUp to={stat.value} suffix={stat.suffix} className="font-display text-2xl font-bold text-foreground sm:text-3xl" />
                  <p className="mt-1 text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                </div>
              ))}
            </div>
          </motion.div>

          <div className="relative">
            <TryHabitDemo />
          </div>
        </div>
      </section>

      <QuoteMarquee />

      {/* Features */}
      <section id="features" className="relative py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="sticker-chip border-streak/30 bg-streak/10 text-streak">
              <Sparkles className="h-3.5 w-3.5" /> Built for consistency
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-foreground text-balance sm:text-4xl">
              Everything you need to keep the streak alive
            </h2>
            <p className="mt-4 text-muted-foreground text-balance">
              Not another to-do list. A system that makes showing up easier than skipping.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {features.map((feature, index) => (
              <motion.div
                key={feature.title}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.06 }}
                className="card-lift group relative overflow-hidden rounded-2xl border border-border/70 bg-card/75 p-6 backdrop-blur-sm"
              >
                <div className="pointer-events-none absolute -right-8 -top-8 h-24 w-24 rounded-full bg-primary/10 opacity-0 blur-2xl transition-opacity group-hover:opacity-100" />
                <div className="flex h-12 w-12 items-center justify-center rounded-xl border border-primary/20 bg-primary/10 transition-transform duration-500 group-hover:-rotate-6 group-hover:scale-105">
                  <feature.icon className="h-5 w-5 text-primary" strokeWidth={1.8} />
                </div>
                <h3 className="mt-4 font-display text-lg font-semibold text-foreground">{feature.title}</h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      <StoryJourney />

      {/* Templates */}
      <section className="relative py-20 sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp} className="flex flex-col items-start justify-between gap-4 sm:flex-row sm:items-end">
            <div>
              <span className="sticker-chip border-xp/30 bg-xp/10 text-xp">
                <Zap className="h-3.5 w-3.5" /> Start with momentum
              </span>
              <h2 className="mt-5 font-display text-3xl font-bold text-foreground sm:text-4xl">Steal a routine that works</h2>
              <p className="mt-3 max-w-xl text-muted-foreground">
                Pick a template and start tracking in seconds. 12 free, 25 starter, the rest premium.
              </p>
            </div>
            <Link to="/templates" className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
              Browse all 105 templates <ArrowRight className="h-4 w-4" />
            </Link>
          </motion.div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">
            {templates.map((template, index) => (
              <motion.div
                key={template.name}
                {...fadeUp}
                transition={{ duration: 0.5, delay: index * 0.08 }}
                className="card-lift group overflow-hidden rounded-2xl border border-border/70 bg-card/75 backdrop-blur-sm"
              >
                <div className={`h-1.5 ${template.color}`} />
                <div className="p-6">
                  <h3 className="font-display text-lg font-bold text-foreground">{template.name}</h3>
                  <ul className="mt-4 space-y-2.5">
                    {template.habits.map((habit) => (
                      <li key={habit} className="flex items-center gap-2 text-sm text-muted-foreground">
                        <span className="flex h-5 w-5 items-center justify-center rounded-md bg-primary/10">
                          <Check className="h-3 w-3 text-primary" strokeWidth={3} />
                        </span>
                        {habit}
                      </li>
                    ))}
                  </ul>
                  <Link to="/templates" className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:underline">
                    Use template <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-0.5" />
                  </Link>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing */}
      <section id="pricing" className="relative border-y border-border/60 bg-card/40 py-20 backdrop-blur-sm sm:py-24">
        <div className="container mx-auto max-w-6xl px-4">
          <motion.div {...fadeUp} className="mx-auto max-w-2xl text-center">
            <span className="sticker-chip border-primary/30 bg-primary/10 text-primary">
              <Target className="h-3.5 w-3.5" /> Simple pricing
            </span>
            <h2 className="mt-5 font-display text-3xl font-bold text-foreground text-balance sm:text-4xl">
              Plans that grow with your streaks
            </h2>
            <p className="mt-4 text-muted-foreground text-balance">
              Start free with a 7-day Premium trial, then choose the level of support that fits your goals.
            </p>
          </motion.div>

          <div className="mt-12 grid gap-6 md:grid-cols-3">
            {plans.map((plan) => (
              <motion.div
                key={plan.name}
                {...fadeUp}
                className={`card-lift relative rounded-2xl border p-7 ${
                  plan.highlighted
                    ? "border-primary/40 bg-card shadow-xl shadow-primary/10"
                    : "border-border/70 bg-card/70 backdrop-blur-sm"
                }`}
              >
                {plan.highlighted && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full gradient-primary px-4 py-1 text-[11px] font-semibold text-primary-foreground">
                    Most popular
                  </div>
                )}
                <h3 className="font-display text-xl font-bold text-foreground">{plan.name}</h3>
                <p className="mt-1.5 text-sm text-muted-foreground">{plan.description}</p>
                <div className="mt-5">
                  <span className="font-display text-4xl font-bold text-foreground">{plan.price}</span>
                  {plan.period && <span className="text-muted-foreground">{plan.period}</span>}
                </div>
                <ul className="mt-6 space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-2 text-sm text-muted-foreground">
                      <Check className="mt-0.5 h-4 w-4 shrink-0 text-primary" strokeWidth={3} />
                      {feature}
                    </li>
                  ))}
                </ul>
                <Link
                  to={plan.ctaTo}
                  className={`mt-7 block rounded-xl px-6 py-3 text-center font-semibold transition-all ${
                    plan.highlighted
                      ? "gradient-primary text-primary-foreground hover:opacity-90"
                      : "border border-border text-foreground hover:bg-secondary"
                  }`}
                >
                  {plan.cta}
                </Link>
              </motion.div>
            ))}
          </div>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Secure payments in INR through Razorpay. Manage or cancel from the pricing page.
          </p>
        </div>
      </section>

      {/* CTA */}
      <section className="relative py-20 sm:py-24">
        <div className="container mx-auto max-w-4xl px-4">
          <motion.div
            {...fadeUp}
            className="relative overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(135deg,hsl(220_30%_8%),hsl(222_25%_14%))] p-10 text-center sm:p-14"
          >
            <div aria-hidden className="pointer-events-none absolute inset-0">
              <div className="absolute -left-16 top-0 h-56 w-56 rounded-full bg-primary/25 blur-3xl" />
              <div className="absolute -right-10 bottom-0 h-56 w-56 rounded-full bg-streak/20 blur-3xl" />
            </div>
            <div className="relative">
              <div className="flex justify-center gap-2">
                {["6:00 AM", "One more rep", "Day 1"].map((chip) => (
                  <span key={chip} className="sticker-chip border-white/20 bg-white/10 text-white/85">
                    {chip}
                  </span>
                ))}
              </div>
              <h2 className="mt-6 font-display text-3xl font-bold text-balance text-white sm:text-4xl">
                Your future self is built at 6 AM.
              </h2>
              <p className="mx-auto mt-4 max-w-lg text-white/65">
                Start with three tiny habits today. Let the streak do the rest.
              </p>
              <Link
                to="/signup"
                className="group mt-8 inline-flex items-center gap-2 rounded-xl bg-primary px-8 py-3.5 font-semibold text-primary-foreground transition-all hover:-translate-y-0.5 hover:opacity-90"
              >
                Start your Day 1
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default Home;
