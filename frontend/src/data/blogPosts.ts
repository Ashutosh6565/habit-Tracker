export type BlogBlock =
  | { type: "p"; text: string }
  | { type: "h2"; text: string }
  | { type: "quote"; text: string }
  | { type: "list"; items: string[] };

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  readTime: string;
  author: string;
  blocks: BlogBlock[];
}

export const blogPosts: BlogPost[] = [
  {
    slug: "science-of-streaks",
    title: "The Science of Streaks: Why Not Breaking the Chain Works",
    excerpt: "Jerry Seinfeld's 'don't break the chain' method has real behavioral science behind it. Here's how to use it without burning out.",
    category: "Behavioral Science",
    date: "2026-09-14",
    readTime: "5 min read",
    author: "Habbiters Team",
    blocks: [
      { type: "p", text: "In 2007, a young comedian asked Jerry Seinfeld for advice. Seinfeld told him to get a calendar, mark an X for every day he wrote jokes, and after a few days the chain of X's would become the only motivation he needed. 'Your only job,' Seinfeld said, 'is don't break the chain.'" },
      { type: "p", text: "It sounds like a trick. But the streak effect is one of the most replicated findings in behavioral psychology — and it's the engine behind Habbiters' streak tracking." },
      { type: "h2", text: "Why streaks work: three mechanisms" },
      { type: "list", items: [
        "Loss aversion: Once you have a 12-day streak, losing it feels twice as painful as gaining a 13th day feels good. Your brain works harder to protect what it has.",
        "Identity formation: Every completed day is a vote for 'I am the kind of person who does this.' Streaks make that identity visible.",
        "Reduced decision fatigue: A streak turns 'should I work out today?' into a solved problem. The default is yes.",
      ]},
      { type: "h2", text: "The dark side: all-or-nothing thinking" },
      { type: "p", text: "The same psychology that powers streaks can burn you out. Miss day 13 and some people abandon the habit entirely — the 'what-the-hell effect.' Research calls this the abstinence violation: one slip becomes an excuse to quit." },
      { type: "quote", text: "Never miss twice. Missing once is an accident. Missing twice is the start of a new (bad) habit." },
      { type: "p", text: "That's the rule we built into Habbiters: your streak is important, but a missed day is a blip, not a failure. We show you the chain — we never shame you for a gap." },
      { type: "h2", text: "How to build a streak that survives real life" },
      { type: "list", items: [
        "Start stupidly small: 'Read 1 page' beats 'Read 30 minutes' for the first month.",
        "Anchor to an existing routine: attach the new habit to something you already do daily.",
        "Plan for the dip: decide in advance what the minimum version is on your worst day.",
        "Protect the streak early: the first 2 weeks are when habits are most fragile.",
      ]},
      { type: "p", text: "Start a streak today — and let the chain do the hard work for you." },
    ],
  },
  {
    slug: "habit-stacking-guide",
    title: "Habit Stacking: The 2-Minute Trick to Make Any Habit Automatic",
    excerpt: "The best way to build a new habit is to attach it to one you already have. Here's the exact formula, with 12 ready-to-use stacks.",
    category: "How-To",
    date: "2026-08-27",
    readTime: "4 min read",
    author: "Habbiters Team",
    blocks: [
      { type: "p", text: "Every habit you have — brushing your teeth, checking your phone, making coffee — runs on a cue in your environment. Habit stacking, popularized by James Clear, hijacks those existing cues to install new behaviors." },
      { type: "quote", text: "After [CURRENT HABIT], I will [NEW HABIT]." },
      { type: "p", text: "That's the entire formula. The reason it works is that your current habit already fires reliably, so the new one inherits its trigger. No willpower required — just a well-placed 'after.'" },
      { type: "h2", text: "12 habit stacks you can steal today" },
      { type: "list", items: [
        "After I pour my morning coffee, I will write down my top 3 priorities.",
        "After I brush my teeth, I will do 10 push-ups.",
        "After I sit down on the train, I will open my book (not my phone).",
        "After I close my laptop for lunch, I will take a 5-minute walk.",
        "After I finish dinner, I will prepare tomorrow's gym bag.",
        "After I get into bed, I will read one page.",
        "After I open my email, I will drink a glass of water first.",
        "After my meeting ends, I will stand up and stretch for 30 seconds.",
        "After I start the kettle, I will tidy one thing on my desk.",
        "After I lock the front door, I will take three deep breaths.",
        "After I put my phone on charge, I will write one line in my journal.",
        "After I open Habbiters, I will check off yesterday's habits.",
      ]},
      { type: "h2", text: "The 2-minute rule" },
      { type: "p", text: "Scale every new habit down to a version that takes under two minutes: 'Read before bed' becomes 'read one page.' 'Meditate' becomes 'take three breaths.' It feels almost too easy — that's the point. You're mastering the act of showing up first; expansion comes later." },
      { type: "p", text: "In Habbiters, mark these micro-habits as Easy. Ten easy wins in a row will take you further than one heroic effort and six days of guilt." },
    ],
  },
  {
    slug: "why-gamification-works",
    title: "XP, Levels, and Why Games Are Better at Changing Behavior Than To-Do Lists",
    excerpt: "To-do lists are where motivation goes to die. Games keep people engaged for thousands of hours. We borrowed the psychology — here's what we took.",
    category: "Product",
    date: "2026-08-05",
    readTime: "6 min read",
    author: "Habbiters Team",
    blocks: [
      { type: "p", text: "The average to-do list app is abandoned within two weeks. The average video game holds attention for hundreds of hours. The difference isn't graphics — it's four psychological systems that games get right and productivity apps usually get wrong." },
      { type: "h2", text: "1. Immediate feedback" },
      { type: "p", text: "In a game, every action produces an instant response: points, sound, animation. In life, the reward for going to the gym shows up in three months. That delay kills motivation. Habbiters closes the gap with XP earned for every completed habit — the feedback is instant, even when the results aren't." },
      { type: "h2", text: "2. Visible progress" },
      { type: "p", text: "A progress bar that's 80% full creates a compulsion to finish it — the goal-gradient effect. Games exploit this constantly; most habit apps show you a blank calendar. We show streaks, levels, and completion percentages so progress is always in view." },
      { type: "h2", text: "3. The right difficulty" },
      { type: "p", text: "Games stay in the 'flow channel': hard enough to be interesting, easy enough to keep winning. That's why Habbiters habits have difficulty levels — hard habits earn more XP — and why our templates scale from 'drink water' to 'run a 5K.'" },
      { type: "h2", text: "4. Loss framed as comeback, not failure" },
      { type: "p", text: "Games never end because you missed a jump once. They say 'try again' instantly. Traditional habit trackers make a missed day feel like a permanent stain. We deliberately designed Habbiter's missed-day experience to be neutral — your history stays visible, but the emphasis is always on the next win." },
      { type: "quote", text: "You're not lazy. Your goals are just badly designed games." },
      { type: "p", text: "Design your habits like a game designer would: instant rewards, visible progress, achievable challenge, and no shame. Or just let Habbiters do it for you." },
    ],
  },
  {
    slug: "30-day-reset",
    title: "The 30-Day Reset: A Template for Rebuilding Your Routine from Scratch",
    excerpt: "Fell off every habit at once? Don't try to fix everything. Use this phased 30-day plan to rebuild one layer at a time.",
    category: "Playbook",
    date: "2026-07-18",
    readTime: "7 min read",
    author: "Habbiters Team",
    blocks: [
      { type: "p", text: "There comes a moment for everyone: vacation, illness, a hard month at work — and suddenly every habit is gone. The instinct is to restart everything at once. That instinct is why the second collapse happens." },
      { type: "p", text: "The 30-day reset works differently. Instead of fixing everything, you rebuild in four weekly layers, each one tiny." },
      { type: "h2", text: "Week 1: One keystone habit" },
      { type: "p", text: "Pick a single keystone habit — the one that makes other habits easier. For most people it's sleep, exercise, or morning planning. Set it to Easy difficulty. Your only goal this week is seven checkmarks." },
      { type: "h2", text: "Week 2: Add a health anchor" },
      { type: "p", text: "Add one physical habit tied to the first: water after your morning routine, a walk after lunch. Two habits is now your system. Resist adding a third." },
      { type: "h2", text: "Week 3: Add a growth habit" },
      { type: "p", text: "Now add one learning or growth habit — 10 minutes of reading, one lesson, one journal line. Attach it to an existing anchor using habit stacking." },
      { type: "h2", text: "Week 4: Review and lock in" },
      { type: "p", text: "Don't add anything. Review your three habits: which felt sustainable? Which did you dread? Adjust difficulty down on anything you resisted — an Easy habit you actually do beats a Hard habit you avoid." },
      { type: "h2", text: "Rules of the reset" },
      { type: "list", items: [
        "Never miss twice — one missed day is noise, two is a pattern.",
        "Keep every habit under 10 minutes until day 30.",
        "Track everything in one place (ahem — Habbiters' 30-day templates work great).",
        "End each week by writing one sentence: what made this easier or harder?",
      ]},
      { type: "p", text: "Thirty days from now you won't have a perfect routine — you'll have a living one. That's the goal." },
    ],
  },
  {
    slug: "why-habbiters-is-free",
    title: "Why Habbiters Is Free: No Paywalls on Self-Improvement",
    excerpt: "We removed every subscription. Every habit, all 105 templates, the planner and analytics are free — here's why.",
    category: "Company",
    date: "2026-10-29",
    readTime: "3 min read",
    author: "Habbiters Team",
    blocks: [
      { type: "p", text: "When we launched, we followed the usual playbook: a free tier, a monthly upgrade, a trial that quietly expired. Then we looked at the data. People hit the paywall in week two — exactly when a new habit is most fragile." },
      { type: "p", text: "So we removed it. There is no premium plan anymore. Every account gets unlimited habits, all 105 templates, the planner, time tracking, analytics and exports at no cost." },
      { type: "h2", text: "What you get for free" },
      { type: "list", items: [
        "Unlimited habits with streaks, XP and difficulty levels.",
        "All 105 ready-made templates — fitness, study, focus and life.",
        "Planner with tasks, notes and a weekly time tracker.",
        "Analytics, the full calendar heatmap, and CSV exports.",
        "The Android app and the website, with the same account.",
      ]},
      { type: "h2", text: "How this stays sustainable" },
      { type: "list", items: [
        "Habbiters is built by a small, focused team with low infrastructure costs.",
        "No ad networks, no data selling, no dark patterns.",
        "If we ever add optional extras, the core tracker stays free.",
      ]},
      { type: "quote", text: "Self-improvement shouldn't be a luxury good." },
      { type: "p", text: "If you were waiting for a sign to start, this is it. Pick three tiny habits, open the app, and let the streak do the rest." },
    ],
  },
];

export const getBlogPost = (slug: string) => blogPosts.find((p) => p.slug === slug);
