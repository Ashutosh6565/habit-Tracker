import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  LineChart, Line, PieChart, Pie, Cell, AreaChart, Area, RadarChart, Radar,
  PolarGrid, PolarAngleAxis, PolarRadiusAxis, RadialBarChart, RadialBar, Legend
} from "recharts";
import {
  Flame, Trophy, Zap, Target, TrendingUp, Activity, Award, BarChart3, Clock, Star,
  Download, Loader2, Lock
} from "lucide-react";
import Navbar from "@/components/Navbar";
import { useHabitContext } from "@/context/HabitContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage } from "@/lib/api";

const COLORS = [
  "hsl(152, 60%, 42%)", "hsl(270, 60%, 58%)", "hsl(38, 92%, 50%)",
  "hsl(200, 70%, 50%)", "hsl(340, 65%, 55%)", "hsl(20, 80%, 50%)",
  "hsl(180, 55%, 45%)", "hsl(60, 70%, 45%)"
];

const cardVariants = {
  hidden: { opacity: 0, y: 24 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.06, duration: 0.5, ease: "easeOut" as const }
  }),
};

const Analytics = () => {
  const { trackerHabits, templateData, setTrackerHabits, setTemplateData } = useHabitContext();
  const { user, subscription, isAdmin } = useAuth();
  const { toast } = useToast();
  const [exporting, setExporting] = useState<"habits" | "templates" | "daily" | null>(null);
  const canExport = Boolean(isAdmin || subscription?.isPremium);
  const canUseAdvanced = canExport;

  const downloadReport = async (type: "habits" | "templates" | "daily") => {
    if (!canExport) return;
    setExporting(type);
    try {
      const blob = await api.analytics.exportCsv(type);
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `habbiters-${type}-${new Date().toISOString().slice(0, 10)}.csv`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(url);
      toast({ title: "Report downloaded", description: `Your ${type} CSV export is ready.` });
    } catch (error) {
      toast({
        title: "Export failed",
        description: getApiErrorMessage(error),
        variant: "destructive",
      });
    } finally {
      setExporting(null);
    }
  };

  // The context starts from localStorage, so a direct visit or refresh would
  // otherwise show "No data yet" until the Tracker page hydrates it.
  useEffect(() => {
    if (!user) return;
    let cancelled = false;
    (async () => {
      try {
        const [habits, progress] = await Promise.all([api.habits.list(), api.templates.list()]);
        if (cancelled) return;
        setTrackerHabits(habits.map((habit, index) => ({ ...habit, id: index + 1 })));
        progress.templates.forEach((template) => setTemplateData(template.templateId, template));
      } catch {
        // Keep whatever is already cached; the page renders an empty state.
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user, setTrackerHabits, setTemplateData]);

  const trackerCompleted = trackerHabits.filter((h) => h.completed);
  const trackerTotal = trackerHabits.length;
  const totalXP = trackerCompleted.reduce((sum, h) => sum + h.xp, 0);
  const bestStreak = Math.max(0, ...trackerHabits.map((h) => h.streak));
  const level = Math.floor(totalXP / 50) + 1;
  const progressPercent = trackerTotal > 0 ? Math.round((trackerCompleted.length / trackerTotal) * 100) : 0;

  // Tracker habit status bar chart
  const trackerBreakdown = useMemo(() =>
    trackerHabits.map((h) => ({
      name: h.title, value: h.completed ? 100 : 0, icon: h.icon, category: h.category,
    })), [trackerHabits]);

  // Category pie
  const categoryBreakdown = useMemo(() => {
    const cats: Record<string, { total: number; completed: number }> = {};
    trackerHabits.forEach((h) => {
      if (!cats[h.category]) cats[h.category] = { total: 0, completed: 0 };
      cats[h.category].total++;
      if (h.completed) cats[h.category].completed++;
    });
    return Object.entries(cats).map(([name, data]) => ({
      name: name.replace(/^.+\s/, ""),
      fullName: name,
      value: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
      total: data.total,
      completed: data.completed,
    }));
  }, [trackerHabits]);

  // Difficulty distribution radar
  const difficultyRadar = useMemo(() => {
    const diffs: Record<string, { total: number; completed: number }> = { easy: { total: 0, completed: 0 }, medium: { total: 0, completed: 0 }, hard: { total: 0, completed: 0 } };
    trackerHabits.forEach((h) => {
      diffs[h.difficulty].total++;
      if (h.completed) diffs[h.difficulty].completed++;
    });
    return Object.entries(diffs).map(([d, data]) => ({
      difficulty: d.charAt(0).toUpperCase() + d.slice(1),
      total: data.total,
      completed: data.completed,
      rate: data.total > 0 ? Math.round((data.completed / data.total) * 100) : 0,
    }));
  }, [trackerHabits]);

  // XP by difficulty donut
  const xpByDifficulty = useMemo(() => {
    const map: Record<string, number> = {};
    trackerCompleted.forEach((h) => {
      const key = h.difficulty.charAt(0).toUpperCase() + h.difficulty.slice(1);
      map[key] = (map[key] || 0) + h.xp;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [trackerCompleted]);

  // Streak leaderboard
  const streakLeaderboard = useMemo(() =>
    [...trackerHabits].sort((a, b) => b.streak - a.streak).slice(0, 10),
    [trackerHabits]);

  // --- Template analytics ---
  const templateEntries = Object.values(templateData);

  const templateCompletionRates = useMemo(() =>
    templateEntries.map((td) => {
      let totalChecks = 0, completedChecks = 0;
      td.habits.forEach((habit) => {
        const hc = td.completions[habit.habitId] || {};
        for (let d = 1; d <= td.totalDays; d++) { totalChecks++; if (hc[d]) completedChecks++; }
      });
      return { name: td.templateName, rate: totalChecks > 0 ? Math.round((completedChecks / totalChecks) * 100) : 0, completed: completedChecks, total: totalChecks };
    }), [templateEntries]);

  const dailyProgressData = useMemo(() => {
    if (templateEntries.length === 0) return [];
    const maxDays = Math.min(14, Math.max(...templateEntries.map((t) => t.totalDays), 0));
    const data: { day: string; completed: number; total: number; rate: number }[] = [];
    for (let d = 1; d <= maxDays; d++) {
      let completed = 0, total = 0;
      templateEntries.forEach((td) => {
        td.habits.forEach((habit) => {
          if (d <= td.totalDays) { total++; if (td.completions[habit.habitId]?.[d]) completed++; }
        });
      });
      data.push({ day: `${d}`, completed, total, rate: total > 0 ? Math.round((completed / total) * 100) : 0 });
    }
    return data;
  }, [templateEntries]);

  const templateHabitBreakdown = useMemo(() => {
    const results: { name: string; value: number; template: string }[] = [];
    templateEntries.forEach((td) => {
      td.habits.forEach((habit) => {
        const hc = td.completions[habit.habitId] || {};
        let done = 0;
        for (let d = 1; d <= td.totalDays; d++) { if (hc[d]) done++; }
        results.push({ name: habit.name, value: td.totalDays > 0 ? Math.round((done / td.totalDays) * 100) : 0, template: td.templateName });
      });
    });
    return results.sort((a, b) => b.value - a.value);
  }, [templateEntries]);

  // Radial bar for template completion
  const templateRadialData = useMemo(() =>
    templateCompletionRates.map((t, i) => ({ ...t, fill: COLORS[i % COLORS.length] })),
    [templateCompletionRates]);

  const hasTrackerData = trackerHabits.length > 0;
  const hasTemplateData = templateEntries.length > 0;
  const hasAnyData = hasTrackerData || hasTemplateData;

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-16 px-4">
        <div className="container mx-auto max-w-6xl">

          {/* Header */}
          <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} className="mb-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-10 h-10 rounded-xl gradient-primary flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-primary-foreground" />
              </div>
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground tracking-tight">
                Analytics
              </h1>
            </div>
            <p className="text-muted-foreground ml-[52px]">Real-time insights from your habits and templates.</p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mb-8 flex flex-wrap items-center gap-2"
          >
            <span className="mr-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              <Download className="h-3.5 w-3.5" />
              Export
            </span>
            {([
              { type: "habits", label: "Habits" },
              { type: "templates", label: "Templates" },
              { type: "daily", label: "30-day trend" },
            ] as const).map((option) => (
              <button
                key={option.type}
                onClick={() => downloadReport(option.type)}
                disabled={!canExport || exporting !== null}
                className="flex h-9 items-center gap-1.5 rounded-lg border border-border bg-card px-3 text-xs font-semibold text-foreground transition-colors hover:bg-secondary disabled:cursor-not-allowed disabled:opacity-60"
              >
                {exporting === option.type ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Download className="h-3.5 w-3.5" />
                )}
                {option.label} CSV
              </button>
            ))}
            {!canExport && (
              <Link
                to="/pricing"
                className="flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
              >
                <Lock className="h-3 w-3" />
                Premium feature — upgrade to export
              </Link>
            )}
          </motion.div>

          {!hasAnyData && (
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center py-24">
              <div className="w-20 h-20 rounded-2xl bg-secondary flex items-center justify-center mx-auto mb-6">
                <Activity className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="font-display font-bold text-foreground text-xl mb-2">No data yet</h3>
              <p className="text-muted-foreground text-sm max-w-md mx-auto">
                Head to the <strong>Tracker</strong> to check off habits or open a <strong>Template</strong> to start tracking — your analytics will appear here automatically.
              </p>
            </motion.div>
          )}

          {hasAnyData && (
            <div className="space-y-6">

              {/* ───── STAT CARDS ───── */}
              <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
                {[
                  { label: "Completed", value: `${trackerCompleted.length}/${trackerTotal}`, sub: `${progressPercent}% done`, icon: Target, gradient: "gradient-primary" },
                  { label: "XP Earned", value: `${totalXP}`, sub: `Level ${level}`, icon: Zap, gradient: "gradient-xp" },
                  { label: "Best Streak", value: `${bestStreak}d`, sub: "longest run", icon: Flame, gradient: "gradient-streak" },
                  { label: "Templates", value: `${templateEntries.length}`, sub: "in progress", icon: Award, gradient: "gradient-primary" },
                  { label: "Consistency", value: `${progressPercent}%`, sub: "completion rate", icon: TrendingUp, gradient: "gradient-xp" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    custom={i}
                    variants={cardVariants}
                    initial="hidden"
                    animate="visible"
                    whileHover={{ y: -4, transition: { duration: 0.2 } }}
                    className="relative overflow-hidden rounded-2xl border border-border bg-card p-5 group"
                  >
                    <div className="absolute top-0 right-0 w-20 h-20 rounded-full opacity-[0.06] -translate-y-6 translate-x-6 bg-foreground" />
                    <div className={`w-9 h-9 rounded-xl ${stat.gradient} flex items-center justify-center mb-3`}>
                      <stat.icon className="w-4 h-4 text-primary-foreground" />
                    </div>
                    <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{stat.label}</p>
                    <p className="text-[10px] text-muted-foreground/60 mt-0.5">{stat.sub}</p>
                  </motion.div>
                ))}
              </div>

              {/* ───── TRACKER CHARTS ───── */}
              {hasTrackerData && (
                <>
                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Habit Completion Bar */}
                    <motion.div custom={5} variants={cardVariants} initial="hidden" animate="visible"
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="font-display font-semibold text-foreground text-sm">Habit Completion</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={trackerBreakdown} barSize={24}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-25} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12, boxShadow: "0 8px 30px -12px rgba(0,0,0,0.1)" }} />
                          <Bar dataKey="value" name="Completion %" radius={[8, 8, 0, 0]}>
                            {trackerBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Category Donut */}
                    <motion.div custom={6} variants={cardVariants} initial="hidden" animate="visible"
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-xp" />
                        <h3 className="font-display font-semibold text-foreground text-sm">Category Breakdown</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <PieChart>
                          <Pie data={categoryBreakdown} cx="50%" cy="50%" innerRadius={55} outerRadius={85} dataKey="value" paddingAngle={3} strokeWidth={0}
                            label={({ name, value }) => `${name} ${value}%`}>
                            {categoryBreakdown.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                          </Pie>
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12, boxShadow: "0 8px 30px -12px rgba(0,0,0,0.1)" }} />
                        </PieChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Difficulty Radar */}
                    <motion.div custom={7} variants={cardVariants} initial="hidden" animate="visible"
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-streak" />
                        <h3 className="font-display font-semibold text-foreground text-sm">Difficulty Distribution</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <RadarChart data={difficultyRadar} cx="50%" cy="50%" outerRadius={80}>
                          <PolarGrid stroke="hsl(var(--border))" />
                          <PolarAngleAxis dataKey="difficulty" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} />
                          <PolarRadiusAxis tick={{ fontSize: 9, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                          <Radar name="Completion Rate" dataKey="rate" stroke="hsl(var(--primary))" fill="hsl(var(--primary))" fillOpacity={0.2} strokeWidth={2} />
                          <Radar name="Total" dataKey="total" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.1} strokeWidth={1} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                        </RadarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* XP by Difficulty Donut */}
                    {xpByDifficulty.length > 0 && (
                      <motion.div custom={8} variants={cardVariants} initial="hidden" animate="visible"
                        className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-2 h-2 rounded-full bg-primary" />
                          <h3 className="font-display font-semibold text-foreground text-sm">XP by Difficulty</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <PieChart>
                            <Pie data={xpByDifficulty} cx="50%" cy="50%" innerRadius={45} outerRadius={80} dataKey="value" paddingAngle={4} strokeWidth={0}
                              label={({ name, value }) => `${name}: ${value} XP`}>
                              <Cell fill="hsl(152, 60%, 42%)" />
                              <Cell fill="hsl(38, 92%, 50%)" />
                              <Cell fill="hsl(0, 72%, 51%)" />
                            </Pie>
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                          </PieChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                  </div>

                  {/* ───── STREAK LEADERBOARD ───── */}
                  <motion.div custom={9} variants={cardVariants} initial="hidden" animate="visible"
                    className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                    <div className="flex items-center gap-2 mb-6">
                      <div className="w-2 h-2 rounded-full bg-streak" />
                      <h3 className="font-display font-semibold text-foreground text-sm">Streak Leaderboard</h3>
                    </div>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {streakLeaderboard.map((habit, i) => {
                        const isTop3 = i < 3;
                        const medals = ["🥇", "🥈", "🥉"];
                        return (
                          <motion.div
                            key={habit.id}
                            initial={{ opacity: 0, x: -12 }}
                            animate={{ opacity: 1, x: 0 }}
                            transition={{ delay: i * 0.05 }}
                            className={`flex items-center gap-3 p-4 rounded-xl border transition-all ${
                              isTop3
                                ? "bg-streak/5 border-streak/20 shadow-sm"
                                : "border-border hover:border-primary/20"
                            }`}
                          >
                            <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                              isTop3 ? "gradient-streak" : "bg-secondary"
                            }`}>
                              {isTop3 ? (
                                <span className="text-lg">{medals[i]}</span>
                              ) : (
                                <span className="text-xs font-bold text-muted-foreground">#{i + 1}</span>
                              )}
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className={`text-sm font-semibold truncate ${isTop3 ? "text-foreground" : "text-foreground/80"}`}>
                                {habit.icon} {habit.title}
                              </p>
                              <div className="flex items-center gap-2 mt-0.5">
                                <Flame className={`w-3 h-3 ${isTop3 ? "text-streak" : "text-muted-foreground"}`} />
                                <span className={`text-xs font-bold ${isTop3 ? "text-streak" : "text-muted-foreground"}`}>{habit.streak} {habit.streak === 1 ? "day" : "days"}</span>
                                <span className="text-[10px] text-muted-foreground/60">· {habit.difficulty} · +{habit.xp}xp</span>
                              </div>
                            </div>
                            {habit.completed && (
                              <div className="w-6 h-6 rounded-full gradient-primary flex items-center justify-center shrink-0">
                                <span className="text-[10px] text-primary-foreground">✓</span>
                              </div>
                            )}
                          </motion.div>
                        );
                      })}
                    </div>
                    {streakLeaderboard.length === 0 && (
                      <p className="text-center text-muted-foreground text-sm py-8">Complete habits to build streaks</p>
                    )}
                  </motion.div>
                </>
              )}

              {/* ───── TEMPLATE CHARTS ───── */}
              {hasTemplateData && !canUseAdvanced && (
                <motion.div
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="rounded-2xl border border-dashed border-primary/30 bg-primary/5 p-8 text-center"
                >
                  <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                    <Lock className="h-5 w-5 text-primary" />
                  </div>
                  <h3 className="font-display text-lg font-bold text-foreground">
                    Advanced template analytics is Premium
                  </h3>
                  <p className="mx-auto mt-2 max-w-md text-sm text-muted-foreground">
                    Upgrade to unlock template completion trends, consistency rankings, and CSV exports of all your data.
                  </p>
                  <Link
                    to="/pricing"
                    className="mt-5 inline-flex h-10 items-center gap-2 rounded-lg gradient-primary px-4 text-sm font-semibold text-primary-foreground"
                  >
                    Upgrade to Premium
                  </Link>
                </motion.div>
              )}

              {hasTemplateData && canUseAdvanced && (
                <>
                  {/* Section Divider */}
                  <div className="flex items-center gap-3 pt-4">
                    <div className="h-px flex-1 bg-border" />
                    <span className="text-xs font-display font-semibold text-muted-foreground uppercase tracking-widest">Template Analytics</span>
                    <div className="h-px flex-1 bg-border" />
                  </div>

                  <div className="grid md:grid-cols-2 gap-6">
                    {/* Template Completion Bars */}
                    <motion.div custom={10} variants={cardVariants} initial="hidden" animate="visible"
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="font-display font-semibold text-foreground text-sm">Template Completion</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={240}>
                        <BarChart data={templateCompletionRates} barSize={28}>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="name" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} angle={-20} textAnchor="end" height={60} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                          <Bar dataKey="rate" name="Completion %" fill="hsl(var(--primary))" radius={[8, 8, 0, 0]} />
                        </BarChart>
                      </ResponsiveContainer>
                    </motion.div>

                    {/* Template Radial */}
                    {templateRadialData.length > 0 && (
                      <motion.div custom={11} variants={cardVariants} initial="hidden" animate="visible"
                        className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                        <div className="flex items-center gap-2 mb-5">
                          <div className="w-2 h-2 rounded-full bg-xp" />
                          <h3 className="font-display font-semibold text-foreground text-sm">Completion Overview</h3>
                        </div>
                        <ResponsiveContainer width="100%" height={240}>
                          <RadialBarChart cx="50%" cy="50%" innerRadius="30%" outerRadius="90%" data={templateRadialData} startAngle={180} endAngle={0}>
                            <RadialBar dataKey="rate" background={{ fill: "hsl(var(--secondary))" }} cornerRadius={8} />
                            <Legend iconSize={8} formatter={(value, entry) => <span className="text-xs text-muted-foreground">{(entry.payload as { name?: string } | undefined)?.name || value}</span>} />
                            <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12 }} />
                          </RadialBarChart>
                        </ResponsiveContainer>
                      </motion.div>
                    )}
                  </div>

                  {/* Daily Progress Area Chart */}
                  {dailyProgressData.length > 0 && (
                    <motion.div custom={12} variants={cardVariants} initial="hidden" animate="visible"
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                      <div className="flex items-center gap-2 mb-5">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="font-display font-semibold text-foreground text-sm">Daily Check-in Trend</h3>
                      </div>
                      <ResponsiveContainer width="100%" height={260}>
                        <AreaChart data={dailyProgressData}>
                          <defs>
                            <linearGradient id="completedGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.3} />
                              <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" vertical={false} />
                          <XAxis dataKey="day" tick={{ fontSize: 11, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} axisLine={false} tickLine={false} />
                          <Tooltip contentStyle={{ background: "hsl(var(--card))", border: "1px solid hsl(var(--border))", borderRadius: "12px", fontSize: 12, boxShadow: "0 8px 30px -12px rgba(0,0,0,0.1)" }} />
                          <Area type="monotone" dataKey="completed" stroke="hsl(var(--primary))" strokeWidth={2.5} fill="url(#completedGrad)" name="Completed" />
                          <Line type="monotone" dataKey="total" stroke="hsl(var(--muted-foreground))" strokeWidth={1} strokeDasharray="5 5" name="Total" dot={false} />
                        </AreaChart>
                      </ResponsiveContainer>
                    </motion.div>
                  )}

                  {/* Most Consistent Habits */}
                  {templateHabitBreakdown.length > 0 && (
                    <motion.div custom={13} variants={cardVariants} initial="hidden" animate="visible"
                      className="bg-card border border-border rounded-2xl p-6 hover:shadow-lg hover:shadow-primary/5 transition-shadow">
                      <div className="flex items-center gap-2 mb-6">
                        <div className="w-2 h-2 rounded-full bg-primary" />
                        <h3 className="font-display font-semibold text-foreground text-sm">Most Consistent Habits</h3>
                        <span className="text-[10px] text-muted-foreground/50 ml-auto">from templates</span>
                      </div>
                      <div className="space-y-4 max-h-[420px] overflow-y-auto pr-1">
                        {templateHabitBreakdown.slice(0, 20).map((h, i) => (
                          <div key={`${h.template}-${h.name}`}>
                            <div className="flex justify-between mb-1.5">
                              <div className="flex items-center gap-2">
                                <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] font-bold" style={{ backgroundColor: COLORS[i % COLORS.length] + "22", color: COLORS[i % COLORS.length] }}>
                                  {i + 1}
                                </span>
                                <span className="text-sm text-foreground font-medium">{h.name}</span>
                                <span className="text-[10px] text-muted-foreground/50">{h.template}</span>
                              </div>
                              <span className="text-sm font-display font-bold text-foreground">{h.value}%</span>
                            </div>
                            <div className="h-2 rounded-full bg-secondary overflow-hidden">
                              <motion.div
                                initial={{ width: 0 }}
                                animate={{ width: `${h.value}%` }}
                                transition={{ duration: 1, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
                                className="h-full rounded-full"
                                style={{ backgroundColor: COLORS[i % COLORS.length] }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
