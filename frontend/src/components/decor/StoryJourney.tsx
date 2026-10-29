import { useRef } from "react";
import { Link } from "react-router-dom";
import { motion, useScroll, useSpring, useTransform } from "framer-motion";
import { AlarmClock, ArrowUpRight, BookOpen, Dumbbell, Flame, Quote, Trophy, Users } from "lucide-react";

const chapters = [
  {
    day: "Day 1",
    title: "The alarm won at 5:45.",
    body: "Arjun, 23, starts with two habits small enough to be embarrassing: 10 push-ups and one glass of water. Habbiters logs both before coffee.",
    quote: "I didn't need motivation. I needed a checkbox.",
    icon: AlarmClock,
    accent: "text-primary bg-primary/10 border-primary/25",
    result: "2 habits · 25 XP",
  },
  {
    day: "Day 14",
    title: "The streak became a promise.",
    body: "A gym template lands in his plan. The timetable view stacks his 6 AM session against a 7:30 deep-work block, and the weekly review catches the two days he skipped.",
    quote: "Missing once is life. Missing twice is a pattern.",
    icon: Dumbbell,
    accent: "text-streak bg-streak/10 border-streak/25",
    result: "78% consistency · 9-day streak",
  },
  {
    day: "Day 45",
    title: "The gym bag lives by the door.",
    body: "Reading becomes a nightly habit and study blocks move into the tracker. Analytics shows the compound effect: the days he trains are the days he studies.",
    quote: "The calendar started telling the truth about me.",
    icon: BookOpen,
    accent: "text-xp bg-xp/10 border-xp/25",
    result: "5 habits · 31-day streak",
  },
  {
    day: "Day 90",
    title: "Same person, new defaults.",
    body: "Six habits, one missed week, 86% consistency. Nothing dramatic happened on day 90 — it was built on day 1, and the 89 ordinary days after it.",
    quote: "I stopped negotiating with my mornings.",
    icon: Trophy,
    accent: "text-primary bg-primary/10 border-primary/25",
    result: "6 habits · 42-day streak · 3,480 XP",
  },
];

const stats = [
  { label: "Habits", value: "1 → 6" },
  { label: "Consistency", value: "86%" },
  { label: "Best streak", value: "42d" },
  { label: "XP earned", value: "3,480" },
];

export default function StoryJourney() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start 70%", "end 65%"],
  });
  const progress = useSpring(scrollYProgress, { stiffness: 120, damping: 26, mass: 0.4 });
  const railScale = useTransform(progress, [0, 1], [0, 1]);

  return (
    <section id="story" className="relative py-24">
      <div className="container mx-auto max-w-6xl px-4">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.6 }}
          className="mx-auto max-w-2xl text-center"
        >
          <span className="sticker-chip border-primary/30 bg-primary/10 text-primary">
            <Flame className="h-3.5 w-3.5" /> The 90-day arc
          </span>
          <h2 className="mt-5 font-display text-3xl font-bold text-foreground text-balance md:text-5xl">
            A transformation told in <span className="text-gradient-primary">four chapters</span>
          </h2>
          <p className="mt-4 text-muted-foreground text-balance">
            No before-and-after filter. Just the ordinary days that quietly compound — illustrated with a composite persona so you know what the journey can look like.
          </p>
        </motion.div>

        <div ref={sectionRef} className="mt-16 grid gap-14 lg:grid-cols-[0.85fr_1.15fr]">
          <aside className="lg:sticky lg:top-24 lg:h-fit">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{ duration: 0.6 }}
              className="sticker-card relative overflow-hidden p-6"
            >
              <div className="absolute -right-10 -top-10 h-28 w-28 rounded-full bg-primary/15 blur-2xl" />
              <div className="flex items-center gap-3">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl gradient-primary font-display text-xl font-bold text-primary-foreground">
                  A
                </div>
                <div>
                  <p className="font-display text-lg font-bold text-foreground">Arjun Mehta</p>
                  <p className="text-xs text-muted-foreground">Product designer · Bengaluru</p>
                </div>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span className="sticker-chip text-muted-foreground">
                  <Users className="h-3 w-3" /> Illustrative persona
                </span>
                <span className="sticker-chip text-muted-foreground">Started Jan 6</span>
              </div>

              <div className="mt-5 grid grid-cols-2 gap-3">
                {stats.map((stat) => (
                  <div key={stat.label} className="rounded-xl border border-border/70 bg-background/60 p-3">
                    <p className="font-display text-lg font-bold text-foreground">{stat.value}</p>
                    <p className="text-[11px] uppercase tracking-wide text-muted-foreground">{stat.label}</p>
                  </div>
                ))}
              </div>

              <div className="mt-5 rounded-xl border border-primary/25 bg-primary/5 p-4">
                <Quote className="h-4 w-4 text-primary" />
                <p className="mt-2 text-sm italic text-foreground/90">
                  "The habit tracker didn't change my life. It just made the change impossible to ignore."
                </p>
              </div>
            </motion.div>
          </aside>

          <div className="relative">
            <div aria-hidden className="absolute left-[15px] top-2 bottom-2 w-[2px] bg-border" />
            <motion.div
              aria-hidden
              className="story-rail absolute left-[15px] top-2 bottom-2 w-[2px] origin-top"
              style={{ scaleY: railScale }}
            />

            <ol className="space-y-8">
              {chapters.map((chapter, index) => (
                <li key={chapter.day} className="relative pl-12">
                  <motion.span
                    initial={{ scale: 0.6, opacity: 0 }}
                    whileInView={{ scale: 1, opacity: 1 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                    className={`absolute left-0 top-1 flex h-8 w-8 items-center justify-center rounded-full border ${chapter.accent} bg-card`}
                  >
                    <chapter.icon className="h-4 w-4" />
                  </motion.span>

                  <motion.article
                    initial={{ opacity: 0, y: 24 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true, margin: "-60px" }}
                    transition={{ duration: 0.55, ease: [0.22, 1, 0.36, 1] }}
                    className="card-lift rounded-2xl border border-border/70 bg-card/80 p-5 backdrop-blur-sm sm:p-6"
                  >
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="rounded-full bg-secondary px-2.5 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-muted-foreground">
                        {chapter.day}
                      </span>
                      <span className="text-[11px] font-medium text-muted-foreground">{chapter.result}</span>
                    </div>
                    <h3 className="mt-3 font-display text-xl font-bold text-foreground">{chapter.title}</h3>
                    <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{chapter.body}</p>
                    <p className="mt-3 flex items-start gap-2 border-l-2 border-primary/30 pl-3 text-sm italic text-foreground/80">
                      <Quote className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary/70" />
                      {chapter.quote}
                    </p>
                  </motion.article>
                </li>
              ))}
            </ol>

            <motion.div
              initial={{ opacity: 0 }}
              whileInView={{ opacity: 1 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6 }}
              className="mt-8 flex flex-col items-start gap-3 rounded-2xl border border-dashed border-border bg-card/50 p-5 sm:flex-row sm:items-center"
            >
              <p className="text-sm text-muted-foreground">
                Arjun is a composite example. Your numbers will be your own — that's the point.
              </p>
              <Link
                to="/signup"
                className="inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-primary hover:underline"
              >
                Start your Day 1 <ArrowUpRight className="h-4 w-4" />
              </Link>
            </motion.div>
          </div>
        </div>
      </div>
    </section>
  );
}
