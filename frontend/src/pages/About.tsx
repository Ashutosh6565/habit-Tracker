import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Heart, Target, Zap, Shield, Users, Globe, ArrowRight, Sparkles } from "lucide-react";
import StaticPage from "@/components/StaticPage";

const values = [
  { icon: Target, title: "Consistency over intensity", desc: "Small daily actions beat occasional heroic efforts. Every feature we build nudges you toward showing up daily." },
  { icon: Zap, title: "Progress you can feel", desc: "XP, streaks, and levels turn boring checkboxes into a game you actually want to play." },
  { icon: Shield, title: "Privacy by default", desc: "Your data belongs to you. Encrypted, never sold, and deletable any time. No dark patterns, ever." },
  { icon: Users, title: "Built with users", desc: "Our roadmap is driven by community feedback. Found a bug or have an idea? We genuinely read every message." },
  { icon: Globe, title: "Accessible to everyone", desc: "A generous free plan and pricing in rupees, because self-improvement shouldn't be a luxury." },
  { icon: Heart, title: "Sustainable habits", desc: "We discourage all-or-nothing thinking. Miss a day? No guilt trips — just a gentle nudge to continue." },
];

const stats = [
  { value: "10K+", label: "Active users" },
  { value: "2M+", label: "Habits tracked" },
  { value: "140+", label: "Countries reached" },
  { value: "98%", label: "Report better consistency" },
];

const milestones = [
  { year: "2024", title: "The first checkbox", desc: "Habbiters started as a weekend project — a simple tracker built to fix one person's inconsistent mornings." },
  { year: "2025", title: "Gamification era", desc: "XP, levels, and achievements launched. Engagement tripled overnight, and we knew we were onto something." },
  { year: "2026", title: "Going global", desc: "Launched templates, learning plans, and rupee pricing to serve users everywhere. 10,000 habit-builders joined." },
];

const About = () => (
  <StaticPage
    title="About Habbiters"
    subtitle="We turn discipline into a game — so building better habits feels less like a chore and more like leveling up."
    icon={Sparkles}
    eyebrow="Company"
  >
    <div className="container mx-auto max-w-6xl space-y-20">
      {/* Stats */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {stats.map((s) => (
          <div key={s.label} className="glass rounded-2xl p-6 text-center">
            <p className="text-3xl font-display font-bold text-gradient-primary">{s.value}</p>
            <p className="text-xs text-muted-foreground mt-1 font-medium">{s.label}</p>
          </div>
        ))}
      </motion.section>

      {/* Mission */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="glass rounded-2xl p-8 md:p-12 text-center">
        <p className="text-sm font-semibold text-primary uppercase tracking-widest mb-3">Our Mission</p>
        <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground max-w-3xl mx-auto leading-snug">
          Help 1 million people build habits that actually stick — with science, not willpower.
        </h2>
        <p className="text-muted-foreground max-w-2xl mx-auto mt-4 leading-relaxed">
          Willpower is a losing strategy. Environment, feedback loops, and tiny wins are what change behavior.
          Habbiters wraps proven behavioral science in an experience so engaging that consistency becomes the default.
        </p>
      </motion.section>

      {/* Values */}
      <section>
        <h2 className="text-2xl font-display font-bold text-foreground mb-2">What we believe</h2>
        <p className="text-muted-foreground mb-8 max-w-2xl">Six principles that shape every feature, price, and pixel.</p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {values.map((v, i) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: Math.min(i * 0.06, 0.3) }}
              className="glass rounded-2xl p-6 hover:border-primary/30 transition-colors"
            >
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center mb-4">
                <v.icon className="w-5 h-5 text-primary-foreground" />
              </div>
              <h3 className="font-display font-semibold text-foreground mb-2">{v.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{v.desc}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* Story timeline */}
      <section>
        <h2 className="text-2xl font-display font-bold text-foreground mb-8">Our story</h2>
        <div className="space-y-4">
          {milestones.map((m, i) => (
            <motion.div
              key={m.year}
              initial={{ opacity: 0, x: -20 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass rounded-2xl p-6 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              <span className="text-sm font-mono font-bold text-primary shrink-0 w-16">{m.year}</span>
              <div>
                <h3 className="font-display font-semibold text-foreground">{m.title}</h3>
                <p className="text-sm text-muted-foreground mt-1 leading-relaxed">{m.desc}</p>
              </div>
            </motion.div>
          ))}
        </div>
      </section>

      {/* CTA */}
      <motion.section initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="rounded-2xl gradient-primary p-8 md:p-12 text-center">
        <h2 className="text-2xl md:text-3xl font-display font-bold text-primary-foreground mb-3">Ready to build your streak?</h2>
        <p className="text-primary-foreground/85 mb-6 max-w-xl mx-auto">Join thousands of people who turned "I should" into "I did" — starting today.</p>
        <Link to="/signup" className="inline-flex items-center gap-2 px-8 py-3.5 rounded-xl bg-background text-foreground font-semibold hover:opacity-90 transition-opacity">
          Start Free <ArrowRight className="w-4 h-4" />
        </Link>
      </motion.section>
    </div>
  </StaticPage>
);

export default About;
