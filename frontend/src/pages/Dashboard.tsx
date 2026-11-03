import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { CalendarClock, Flame, Zap, Target, TrendingUp, Calendar, Loader2, WifiOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import HabitCard from "@/components/HabitCard";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import HealthPulse from "@/components/HealthPulse";
import DisciplineQuote from "@/components/DisciplineQuote";
import { useAuth } from "@/context/AuthContext";
import { api, getApiErrorMessage, type ApiHabit } from "@/lib/api";
import { readCache, writeCache } from "@/lib/offlineCache";
import { levelName } from "@/lib/gamification";
import { useToast } from "@/hooks/use-toast";

type DashboardStats = {
  totalXP: number;
  todayXP: number;
  level: number;
  xpIntoLevel: number;
  xpForNextLevel: number;
  bestStreak: number;
};

type SummaryCache = { habits: ApiHabit[]; stats: DashboardStats };
type OverviewCache = { dailyTrend: { date: string; completed: number; total: number }[] };

const emptyStats: DashboardStats = {
  totalXP: 0,
  todayXP: 0,
  level: 1,
  xpIntoLevel: 0,
  xpForNextLevel: 100,
  bestStreak: 0,
};

const Dashboard = () => {
  const { user } = useAuth();
  const cacheId = user?.id || "guest";
  const [cachedSummary] = useState<SummaryCache | null>(() => readCache<SummaryCache>(cacheId, "habits-summary"));
  const [habits, setHabits] = useState<ApiHabit[]>(() => cachedSummary?.habits || []);
  const [weeklyTrend, setWeeklyTrend] = useState<{ date: string; completed: number; total: number }[]>(() => {
    const cached = readCache<OverviewCache>(cacheId, "analytics-overview");
    return cached?.dailyTrend.slice(-7) || [];
  });
  const [stats, setStats] = useState<DashboardStats>(() => cachedSummary?.stats || emptyStats);
  const [loading, setLoading] = useState(() => !cachedSummary);
  const [offline, setOffline] = useState(false);
  const { toast } = useToast();
  const completedCount = habits.filter((h) => h.completed).length;
  const totalXP = stats.totalXP;
  const level = stats.level;
  const bestStreak = stats.bestStreak || Math.max(0, ...habits.map((h) => h.streak));
  const movementToday = habits.filter(
    (h) => h.completed && /(fitness|health|wellness|workout)/i.test(h.category)
  ).length;
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    const load = async () => {
      try {
        const [data, overview] = await Promise.all([
          api.habits.summary(),
          api.analytics.overview(),
        ]);
        const nextStats: DashboardStats = {
          totalXP: Number(data.stats.totalXP) || 0,
          todayXP: Number(data.stats.todayXP) || 0,
          level: Number(data.stats.level) || 1,
          xpIntoLevel: Number(data.stats.xpIntoLevel) || 0,
          xpForNextLevel: Number(data.stats.xpForNextLevel) || 100,
          bestStreak: Number(data.stats.bestStreak) || 0,
        };
        setHabits(data.habits);
        setStats(nextStats);
        setWeeklyTrend(overview.dailyTrend.slice(-7));
        writeCache(cacheId, "habits-summary", { habits: data.habits, stats: nextStats });
        writeCache(cacheId, "analytics-overview", { dailyTrend: overview.dailyTrend });
        setOffline(false);
      } catch (error) {
        if (readCache<SummaryCache>(cacheId, "habits-summary")) {
          setOffline(true);
        } else {
          toast({ title: "Error loading dashboard", description: getApiErrorMessage(error), variant: "destructive" });
        }
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [cacheId, toast]);

  const toggleHabit = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
    try {
      const updated = await api.habits.setProgress(id, !habit.completed);
      setHabits((prev) => {
        const next = prev.map((h) => (h.id === id ? updated : h));
        writeCache(cacheId, "habits-summary", { habits: next, stats });
        return next;
      });
    } catch (error) {
      setHabits((prev) => prev.map((h) => (h.id === id ? habit : h)));
      toast({ title: "Error updating habit", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-6xl">
          {/* Header */}
          <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <h1 className="text-3xl font-display font-bold text-foreground">{greeting}! 👋</h1>
              <p className="text-muted-foreground mt-1">You have {habits.length - completedCount} habits left today.</p>
            </div>
            <Link
              to="/planner"
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-4 py-2.5 text-sm font-semibold text-foreground transition-colors hover:border-primary/40 hover:text-primary"
            >
              <CalendarClock className="h-4 w-4" /> Open timetable
            </Link>
          </div>

          {offline && (
            <div className="mb-6 flex items-center gap-2 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-foreground">
              <WifiOff className="h-4 w-4 text-accent" />
              You're offline — showing the last data saved on this device. Changes will sync when the API is back.
            </div>
          )}

          {/* Health Pulse + daily discipline quote */}
          <div className="mb-8 grid gap-4 xl:grid-cols-[1.5fr_1fr]">
            <HealthPulse userId={cacheId} movementToday={movementToday} />
            <DisciplineQuote userId={cacheId} compact />
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
            <StatCard title="Today's Progress" value={`${completedCount}/${habits.length}`} icon={Target} variant="primary" />
            <StatCard title="Current Streak" value={`${bestStreak} ${bestStreak === 1 ? "day" : "days"}`} icon={Flame} variant="streak" trend="best active run" />
            <StatCard title="Total XP" value={totalXP} icon={Zap} variant="xp" />
            <StatCard title="Level" value={level} icon={TrendingUp} variant="default" />
          </div>

          {/* Level Progress */}
          <div className="bg-card rounded-2xl border border-border p-6 mb-8">
            <div className="flex items-center justify-between mb-3">
              <div>
                <h3 className="font-display font-semibold text-foreground">
                  Level {level} — {levelName(level)}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {stats.xpForNextLevel - stats.xpIntoLevel} XP to level {level + 1}
                </p>
              </div>
              <div className="gradient-xp text-xp-foreground px-3 py-1 rounded-full text-sm font-semibold">
                {totalXP} XP
              </div>
            </div>
            <ProgressBar
              value={stats.xpIntoLevel}
              max={stats.xpForNextLevel}
              label={`Level ${level} progress`}
              variant="xp"
            />
          </div>

          {/* Habits */}
          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <h2 className="font-display font-semibold text-foreground mb-4 flex items-center gap-2">
                <Calendar className="w-5 h-5 text-primary" /> Today's Habits
              </h2>
              <div className="space-y-3">
                {habits.map((habit) => (
                  <HabitCard key={habit.id} {...habit} onToggle={() => toggleHabit(habit.id)} />
                ))}
              </div>
            </div>

            {/* Weekly Overview */}
            <div>
              <h2 className="font-display font-semibold text-foreground mb-4">Weekly Overview</h2>
              <div className="bg-card rounded-2xl border border-border p-6 space-y-4">
                {weeklyTrend.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No activity recorded in the last 7 days yet.</p>
                ) : (
                  weeklyTrend.map((entry) => (
                    <div key={entry.date} className="flex items-center gap-3">
                      <span className="w-8 text-xs text-muted-foreground font-medium">
                        {new Date(`${entry.date}T00:00:00`).toLocaleDateString(undefined, { weekday: "short" })}
                      </span>
                      <ProgressBar
                        value={entry.completed}
                        max={entry.total || habits.length || 1}
                        variant="primary"
                      />
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
