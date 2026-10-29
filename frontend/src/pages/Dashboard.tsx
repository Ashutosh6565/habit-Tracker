import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { Flame, Zap, Target, TrendingUp, Calendar, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import HabitCard from "@/components/HabitCard";
import StatCard from "@/components/StatCard";
import ProgressBar from "@/components/ProgressBar";
import { api, getApiErrorMessage, type ApiHabit } from "@/lib/api";
import { levelName } from "@/lib/gamification";
import { useToast } from "@/hooks/use-toast";

const Dashboard = () => {
  const [habits, setHabits] = useState<ApiHabit[]>([]);
  const [weeklyTrend, setWeeklyTrend] = useState<{ date: string; completed: number; total: number }[]>([]);
  const [stats, setStats] = useState({
    totalXP: 0,
    todayXP: 0,
    level: 1,
    xpIntoLevel: 0,
    xpForNextLevel: 100,
    bestStreak: 0,
  });
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  const completedCount = habits.filter((h) => h.completed).length;
  const totalXP = stats.totalXP;
  const level = stats.level;
  const bestStreak = stats.bestStreak || Math.max(0, ...habits.map((h) => h.streak));
  const hour = new Date().getHours();
  const greeting = hour < 12 ? "Good Morning" : hour < 18 ? "Good Afternoon" : "Good Evening";

  useEffect(() => {
    const load = async () => {
      try {
        const [data, overview] = await Promise.all([
          api.habits.summary(),
          api.analytics.overview(),
        ]);
        setHabits(data.habits);
        setStats({
          totalXP: Number(data.stats.totalXP) || 0,
          todayXP: Number(data.stats.todayXP) || 0,
          level: Number(data.stats.level) || 1,
          xpIntoLevel: Number(data.stats.xpIntoLevel) || 0,
          xpForNextLevel: Number(data.stats.xpForNextLevel) || 100,
          bestStreak: Number(data.stats.bestStreak) || 0,
        });
        setWeeklyTrend(overview.dailyTrend.slice(-7));
      } catch (error) {
        toast({ title: "Error loading dashboard", description: getApiErrorMessage(error), variant: "destructive" });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [toast]);

  const toggleHabit = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: !h.completed } : h)));
    try {
      const updated = await api.habits.setProgress(id, !habit.completed);
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
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
          <div className="mb-8">
            <h1 className="text-3xl font-display font-bold text-foreground">{greeting}! 👋</h1>
            <p className="text-muted-foreground mt-1">You have {habits.length - completedCount} habits left today.</p>
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
