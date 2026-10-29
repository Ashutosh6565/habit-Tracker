import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Plus, X, LayoutGrid, List, Calendar, Flame, Trophy, Zap, Target, TrendingUp, Filter, Search, Sparkles, Loader2, CloudOff } from "lucide-react";
import Navbar from "@/components/Navbar";
import HabitCard from "@/components/HabitCard";
import { Progress } from "@/components/ui/progress";
import { habitPresets, presetCategories, type HabitPreset } from "@/data/habitPresets";
import { useHabitContext } from "@/context/HabitContext";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { api, getApiErrorMessage, type ApiHabit } from "@/lib/api";
import { GUEST_TRACKER_HABITS_KEY, readGuestJson } from "@/lib/guestStorage";
import { tapFeedback } from "@/lib/native";

type GuestHabit = {
  id: number;
  title: string;
  streak: number;
  completed: boolean;
  xp: number;
  difficulty: Difficulty;
  category: string;
  icon: string;
};

const loadGuestHabits = (): ApiHabit[] =>
  readGuestJson<GuestHabit[]>(GUEST_TRACKER_HABITS_KEY, []).map((h) => ({
    id: `guest-${h.id}`,
    title: h.title,
    streak: h.streak,
    completed: h.completed,
    xp: h.xp,
    difficulty: h.difficulty,
    category: h.category,
    icon: h.icon,
  }));

type Difficulty = "easy" | "medium" | "hard";
type ViewMode = "grid" | "list" | "calendar";
type FilterMode = "all" | "active" | "completed";

type Habit = ApiHabit;

const categories = ["💪 Fitness", "📚 Learning", "🧘 Wellness", "💻 Productivity", "🎨 Creative"];

const weekDays = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

const Tracker = () => {
  const { setTrackerHabits } = useHabitContext();
  const { user, guestSyncTick } = useAuth();
  const { toast } = useToast();
  const isGuest = !user;
  const [habits, setHabits] = useState<Habit[]>(() => (user ? [] : loadGuestHabits()));
  const [loadingHabits, setLoadingHabits] = useState(true);
  const [showAdd, setShowAdd] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<Difficulty>("easy");
  const [newCategory, setNewCategory] = useState(categories[0]);
  const [viewMode, setViewMode] = useState<ViewMode>("grid");
  const [filterMode, setFilterMode] = useState<FilterMode>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [presetSearch, setPresetSearch] = useState("");
  const [presetCategory, setPresetCategory] = useState("All");
  const [showPresets, setShowPresets] = useState(true);

  // Load habits from API when signed in, from localStorage when guest
  useEffect(() => {
    if (!user) {
      setHabits(loadGuestHabits());
      setLoadingHabits(false);
      return;
    }
    const load = async () => {
      setLoadingHabits(true);
      try {
        setHabits(await api.habits.list());
      } catch (error) {
        toast({ title: "Error loading habits", description: getApiErrorMessage(error), variant: "destructive" });
      } finally {
        setLoadingHabits(false);
      }
    };
    load();
  }, [user, guestSyncTick, toast]);

  // Sync tracker habits to shared context
  useEffect(() => {
    setTrackerHabits(habits.map((h, index) => ({ ...h, id: index + 1 })));
  }, [habits, setTrackerHabits]);

  const toggleHabit = async (id: string) => {
    const habit = habits.find((h) => h.id === id);
    if (!habit) return;
    const newCompleted = !habit.completed;
    const newStreak = newCompleted ? habit.streak + 1 : Math.max(0, habit.streak - 1);
    tapFeedback();
    setHabits((prev) => prev.map((h) => (h.id === id ? { ...h, completed: newCompleted, streak: newStreak } : h)));
    if (isGuest) return;
    try {
      const updated = await api.habits.setProgress(id, newCompleted);
      setHabits((prev) => prev.map((h) => (h.id === id ? updated : h)));
    } catch (error) {
      setHabits((prev) => prev.map((h) => (h.id === id ? habit : h)));
      toast({ title: "Error updating habit", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const addHabit = async () => {
    if (!newTitle.trim()) return;
    const xpMap = { easy: 10, medium: 20, hard: 30 };
    if (isGuest) {
      setHabits((prev) => [
        ...prev,
        {
          id: `guest-${Date.now()}`,
          title: newTitle.trim(),
          streak: 0,
          completed: false,
          xp: xpMap[newDifficulty],
          difficulty: newDifficulty,
          category: newCategory,
          icon: "?",
        },
      ]);
      setNewTitle("");
      setShowAdd(false);
      toast({ title: "Habit saved on this device", description: "Create a free account to back it up and sync everywhere." });
      return;
    }
    try {
      const data = await api.habits.create({
        title: newTitle.trim(),
        xp: xpMap[newDifficulty],
        difficulty: newDifficulty,
        category: newCategory,
        icon: "?",
      });
      setHabits((prev) => [...prev, data]);
      setNewTitle("");
      setShowAdd(false);
      toast({ title: "Habit added" });
    } catch (error) {
      toast({ title: "Error adding habit", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const selectPreset = async (preset: HabitPreset) => {
    if (isGuest) {
      setHabits((prev) => [
        ...prev,
        {
          id: `guest-${Date.now()}`,
          title: preset.title,
          streak: 0,
          completed: false,
          xp: preset.xp,
          difficulty: preset.difficulty,
          category: preset.category,
          icon: preset.icon,
        },
      ]);
      toast({ title: "Habit saved on this device", description: "Create a free account to back it up and sync everywhere." });
      return;
    }
    try {
      const data = await api.habits.create({
        title: preset.title,
        xp: preset.xp,
        difficulty: preset.difficulty,
        category: preset.category,
        icon: preset.icon,
      });
      setHabits((prev) => [...prev, data]);
      toast({ title: "Habit added" });
    } catch (error) {
      toast({ title: "Error adding habit", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const deleteHabit = async (id: string) => {
    const previous = habits;
    setHabits((prev) => prev.filter((h) => h.id !== id));
    if (isGuest) return;
    try {
      await api.habits.remove(id);
    } catch (error) {
      setHabits(previous);
      toast({ title: "Error deleting habit", description: getApiErrorMessage(error), variant: "destructive" });
    }
  };

  const filteredPresets = useMemo(() => {
    let result = habitPresets;
    if (presetCategory !== "All") result = result.filter((p) => p.category === presetCategory);
    if (presetSearch) result = result.filter((p) => p.title.toLowerCase().includes(presetSearch.toLowerCase()));
    // Exclude already added habits
    const addedTitles = new Set(habits.map((h) => h.title));
    result = result.filter((p) => !addedTitles.has(p.title));
    return result;
  }, [presetCategory, presetSearch, habits]);

  const filteredHabits = useMemo(() => {
    let result = habits;
    if (filterMode === "active") result = result.filter((h) => !h.completed);
    if (filterMode === "completed") result = result.filter((h) => h.completed);
    if (searchQuery) result = result.filter((h) => h.title.toLowerCase().includes(searchQuery.toLowerCase()));
    return result;
  }, [habits, filterMode, searchQuery]);

  const completed = habits.filter((h) => h.completed).length;
  const totalXP = habits.filter((h) => h.completed).reduce((sum, h) => sum + h.xp, 0);
  const longestStreak = Math.max(...habits.map((h) => h.streak), 0);
  const progressPercent = habits.length > 0 ? (completed / habits.length) * 100 : 0;

  if (loadingHabits) {
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
        <div className="container mx-auto max-w-5xl">

          {/* Hero Header */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
              <div>
                <h1 className="text-4xl md:text-5xl font-display font-bold text-foreground tracking-tight">
                  Your <span className="text-gradient-primary">Habits</span>
                </h1>
                <p className="text-muted-foreground mt-2 text-lg">Build consistency, earn rewards, level up your life.</p>
              </div>
              <motion.button
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => setShowAdd(true)}
                className="px-6 py-3 rounded-2xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity flex items-center gap-2 shadow-lg self-start md:self-auto"
              >
                <Plus className="w-5 h-5" /> New Habit
              </motion.button>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Completed", value: `${completed}/${habits.length}`, icon: Target, gradient: "gradient-primary" },
                { label: "XP Earned", value: `${totalXP}`, icon: Zap, gradient: "gradient-xp" },
                { label: "Best Streak", value: `${longestStreak}d`, icon: Flame, gradient: "gradient-streak" },
                { label: "Level", value: `${Math.floor(totalXP / 50) + 1}`, icon: Trophy, gradient: "gradient-primary" },
              ].map((stat) => (
                <motion.div
                  key={stat.label}
                  whileHover={{ y: -2 }}
                  className="glass rounded-2xl p-4 flex items-center gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl ${stat.gradient} flex items-center justify-center shrink-0`}>
                    <stat.icon className="w-5 h-5 text-primary-foreground" />
                  </div>
                  <div>
                    <p className="text-xs text-muted-foreground font-medium">{stat.label}</p>
                    <p className="text-lg font-display font-bold text-foreground">{stat.value}</p>
                  </div>
                </motion.div>
              ))}
            </div>

            {/* Progress Bar */}
            <div className="mt-4 glass rounded-2xl p-4">
              <div className="flex items-center justify-between mb-2">
                <span className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" /> Daily Progress
                </span>
                <span className="text-sm font-bold text-foreground">{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-3" />
            </div>
          </motion.div>

          {/* Guest Mode Banner */}
          {isGuest && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-6 glass rounded-2xl p-4 border border-accent/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3"
            >
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl gradient-xp flex items-center justify-center shrink-0">
                  <CloudOff className="w-5 h-5 text-primary-foreground" />
                </div>
                <div>
                  <p className="font-display font-semibold text-foreground text-sm">You're in guest mode</p>
                  <p className="text-xs text-muted-foreground">Your habits are saved on this device only. Create a free account to back them up to the cloud.</p>
                </div>
              </div>
              <Link
                to="/signup"
                className="px-5 py-2.5 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity shrink-0"
              >
                Sign up free
              </Link>
            </motion.div>
          )}

          {/* Controls Bar */}
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 mb-6"
          >
            {/* Search */}
            <div className="relative flex-1 max-w-sm w-full">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search habits..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>

            <div className="flex items-center gap-2">
              {/* Filter Buttons */}
              <div className="flex items-center bg-card border border-border rounded-xl p-1">
                {(["all", "active", "completed"] as FilterMode[]).map((f) => (
                  <button
                    key={f}
                    onClick={() => setFilterMode(f)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-colors ${
                      filterMode === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>

              {/* View Toggle */}
              <div className="flex items-center bg-card border border-border rounded-xl p-1">
                {[
                  { mode: "grid" as ViewMode, icon: LayoutGrid },
                  { mode: "list" as ViewMode, icon: List },
                  { mode: "calendar" as ViewMode, icon: Calendar },
                ].map(({ mode, icon: Icon }) => (
                  <button
                    key={mode}
                    onClick={() => setViewMode(mode)}
                    className={`p-2 rounded-lg transition-colors ${
                      viewMode === mode ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground"
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                  </button>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Add Habit Panel */}
          <AnimatePresence>
            {showAdd && (
              <motion.div
                initial={{ opacity: 0, y: -10, height: 0 }}
                animate={{ opacity: 1, y: 0, height: "auto" }}
                exit={{ opacity: 0, y: -10, height: 0 }}
                className="mb-6"
              >
                <div className="glass rounded-2xl p-6 border border-primary/20">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="font-display font-bold text-foreground text-lg">Create New Habit</h3>
                    <button onClick={() => setShowAdd(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-secondary transition-colors">
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  {/* Toggle: Presets vs Custom */}
                  <div className="flex items-center bg-secondary rounded-xl p-1 mb-5">
                    <button
                      onClick={() => setShowPresets(true)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        showPresets ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Sparkles className="w-4 h-4" /> Browse 100+ Presets
                    </button>
                    <button
                      onClick={() => setShowPresets(false)}
                      className={`flex-1 px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center justify-center gap-2 ${
                        !showPresets ? "bg-primary text-primary-foreground" : "text-muted-foreground"
                      }`}
                    >
                      <Plus className="w-4 h-4" /> Custom Habit
                    </button>
                  </div>

                  {showPresets ? (
                    <div>
                      {/* Preset Search & Category Filter */}
                      <div className="flex flex-col sm:flex-row gap-3 mb-4">
                        <div className="relative flex-1">
                          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                          <input
                            type="text"
                            value={presetSearch}
                            onChange={(e) => setPresetSearch(e.target.value)}
                            placeholder="Search presets..."
                            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          />
                        </div>
                      </div>
                      <div className="flex flex-wrap gap-2 mb-4">
                        {presetCategories.map((cat) => (
                          <button
                            key={cat}
                            onClick={() => setPresetCategory(cat)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-colors ${
                              presetCategory === cat ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>

                      {/* Preset Grid */}
                      <div className="max-h-80 overflow-y-auto pr-1 scrollbar-thin">
                        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                          {filteredPresets.map((preset) => (
                            <motion.button
                              key={preset.title}
                              whileHover={{ scale: 1.03 }}
                              whileTap={{ scale: 0.97 }}
                              onClick={() => selectPreset(preset)}
                              className="flex flex-col items-start p-3 rounded-xl border border-border bg-card hover:border-primary/40 hover:shadow-md transition-all text-left group"
                            >
                              <span className="text-xl mb-1.5">{preset.icon}</span>
                              <span className="text-xs font-semibold text-foreground leading-tight mb-1">{preset.title}</span>
                              <div className="flex items-center gap-1.5 w-full">
                                <span className={`text-[10px] px-1.5 py-0.5 rounded-full font-medium ${
                                  preset.difficulty === "easy" ? "bg-success/10 text-success" :
                                  preset.difficulty === "medium" ? "bg-accent/10 text-accent" :
                                  "bg-destructive/10 text-destructive"
                                }`}>
                                  {preset.difficulty}
                                </span>
                                <span className="text-[10px] text-xp font-semibold ml-auto">+{preset.xp}</span>
                              </div>
                            </motion.button>
                          ))}
                        </div>
                        {filteredPresets.length === 0 && (
                          <p className="text-center text-muted-foreground text-sm py-8">No presets match your search.</p>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-3 text-center">Click any preset to instantly add it to your tracker</p>
                    </div>
                  ) : (
                    <div>
                      <div className="grid sm:grid-cols-2 gap-4">
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Habit Name</label>
                          <input
                            type="text"
                            value={newTitle}
                            onChange={(e) => setNewTitle(e.target.value)}
                            placeholder="e.g. Morning Run..."
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                            onKeyDown={(e) => e.key === "Enter" && addHabit()}
                          />
                        </div>
                        <div>
                          <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Category</label>
                          <select
                            value={newCategory}
                            onChange={(e) => setNewCategory(e.target.value)}
                            className="w-full px-4 py-3 rounded-xl border border-input bg-background text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                          >
                            {categories.map((c) => (
                              <option key={c} value={c}>{c}</option>
                            ))}
                          </select>
                        </div>
                      </div>
                      <div className="mt-4">
                        <label className="text-xs font-medium text-muted-foreground mb-1.5 block">Difficulty</label>
                        <div className="flex items-center gap-2">
                          {(["easy", "medium", "hard"] as Difficulty[]).map((d) => (
                            <button
                              key={d}
                              onClick={() => setNewDifficulty(d)}
                              className={`px-4 py-2 rounded-xl text-sm font-medium capitalize transition-all ${
                                newDifficulty === d
                                  ? d === "easy" ? "bg-success text-success-foreground shadow-md" : d === "medium" ? "bg-accent text-accent-foreground shadow-md" : "bg-destructive text-destructive-foreground shadow-md"
                                  : "bg-secondary text-muted-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {d === "easy" ? "🟢 Easy" : d === "medium" ? "🟡 Medium" : "🔴 Hard"}
                            </button>
                          ))}
                        </div>
                      </div>
                      <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        onClick={addHabit}
                        className="w-full mt-5 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm shadow-lg"
                      >
                        ✨ Create Habit
                      </motion.button>
                    </div>
                  )}
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          {/* Habit Views */}
          {viewMode === "grid" && (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              <AnimatePresence>
                {filteredHabits.map((habit, i) => (
                  <motion.div
                    key={habit.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ delay: i * 0.05 }}
                    className="relative group"
                  >
                    <div
                      onClick={() => toggleHabit(habit.id)}
                      className={`glass rounded-2xl p-5 cursor-pointer transition-all hover:shadow-lg ${
                        habit.completed ? "border-success/30 bg-success/5" : "hover:border-primary/30"
                      }`}
                    >
                      <div className="flex items-start justify-between mb-3">
                        <span className="text-2xl">{habit.icon}</span>
                        {habit.streak > 0 && (
                          <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-streak/10">
                            <Flame className="w-3 h-3 text-streak" />
                            <span className="text-xs font-bold text-streak">{habit.streak}</span>
                          </div>
                        )}
                      </div>
                      <h3 className={`font-display font-semibold text-sm mb-1 ${habit.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                        {habit.title}
                      </h3>
                      <p className="text-xs text-muted-foreground mb-3">{habit.category}</p>
                      <div className="flex items-center justify-between">
                        <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                          habit.difficulty === "easy" ? "bg-success/10 text-success" :
                          habit.difficulty === "medium" ? "bg-accent/10 text-accent" :
                          "bg-destructive/10 text-destructive"
                        }`}>
                          {habit.difficulty}
                        </span>
                        <span className="text-xs font-semibold text-xp">+{habit.xp} XP</span>
                      </div>
                      {habit.completed && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          className="absolute top-3 right-3 w-6 h-6 rounded-full gradient-primary flex items-center justify-center"
                        >
                          <span className="text-xs text-primary-foreground">✓</span>
                        </motion.div>
                      )}
                    </div>
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 p-1.5 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {viewMode === "list" && (
            <div className="space-y-3">
              <AnimatePresence>
                {filteredHabits.map((habit) => (
                  <motion.div key={habit.id} layout exit={{ opacity: 0, x: -100 }} className="relative group">
                    <HabitCard {...habit} onToggle={() => toggleHabit(habit.id)} />
                    <button
                      onClick={() => deleteHabit(habit.id)}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 p-1 rounded-lg bg-destructive/10 text-destructive hover:bg-destructive/20 transition-all"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}

          {viewMode === "calendar" && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass rounded-2xl p-6">
              <h3 className="font-display font-bold text-foreground text-lg mb-4">This Week</h3>
              <div className="grid grid-cols-7 gap-2 mb-6">
                {weekDays.map((day, i) => (
                  <div key={day} className="text-center">
                    <p className="text-xs text-muted-foreground mb-2 font-medium">{day}</p>
                    <div className={`aspect-square rounded-xl flex items-center justify-center text-sm font-bold ${
                      i < new Date().getDay() - 1 ? "bg-success/10 text-success" :
                      i === new Date().getDay() - 1 ? "gradient-primary text-primary-foreground" :
                      "bg-secondary text-muted-foreground"
                    }`}>
                      {i + 3}
                    </div>
                  </div>
                ))}
              </div>
              <div className="space-y-2">
                {filteredHabits.map((habit) => (
                  <div
                    key={habit.id}
                    onClick={() => toggleHabit(habit.id)}
                    className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all ${
                      habit.completed ? "bg-success/5 border border-success/20" : "bg-card border border-border hover:border-primary/30"
                    }`}
                  >
                    <span className="text-lg">{habit.icon}</span>
                    <span className={`flex-1 text-sm font-medium ${habit.completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
                      {habit.title}
                    </span>
                    <div className="flex gap-1">
                      {weekDays.map((_, j) => (
                        <div key={j} className={`w-3 h-3 rounded-full ${
                          j < 3 ? "bg-success" : j === 3 && habit.completed ? "bg-success" : "bg-secondary"
                        }`} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {/* Empty State */}
          {filteredHabits.length === 0 && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="text-center py-16"
            >
              <p className="text-5xl mb-4">🎯</p>
              <h3 className="font-display font-bold text-foreground text-xl mb-2">No habits found</h3>
              <p className="text-muted-foreground text-sm">Create your first habit to start building streaks!</p>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Tracker;
