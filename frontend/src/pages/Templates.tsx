import { useState, useRef, useMemo, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useNavigate } from "react-router-dom";
import { ChevronLeft, ChevronRight, Check, X, ArrowLeft, Dumbbell, BookOpen, Briefcase, Heart, Moon, Droplets, Brain, Palette, Code, Leaf, Pencil, Trash2, Plus, Save, Music, Camera, Utensils, GraduationCap, Languages, Mic, Headphones, PenTool, Laptop, Smartphone, Users, Baby, Dog, Mountain, Bike, Trophy, Clock, Shield, Eye, Zap, Flame, Target, Star, Coffee, Lightbulb, Globe, Building, Wallet, HandMetal, Sparkles, Search, Crown, Lock, Loader2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from "recharts";
import { useHabitContext } from "@/context/HabitContext";
import { useAuth } from "@/context/AuthContext";
import { api, type TemplateCatalogDto, type TemplateUnlockTier } from "@/lib/api";

const DAYS_OF_WEEK = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];
const MONTH_NAMES = ["January","February","March","April","May","June","July","August","September","October","November","December"];
const MOODS = ["😫", "😢", "😐", "🙂", "😊", "😄", "🤩", "😎", "🔥", "💯"];

const TEMPLATE_ICONS: Record<string, typeof Dumbbell> = {
  Baby, Bike, BookOpen, Brain, Briefcase, Building, Camera, Clock, Code, Coffee,
  Dog, Droplets, Dumbbell, Eye, Flame, Globe, GraduationCap, HandMetal, Headphones,
  Heart, Languages, Laptop, Leaf, Lightbulb, Mic, Moon, Mountain, Music, Palette,
  PenTool, Pencil, Shield, Smartphone, Sparkles, Star, Target, Trophy, Users,
  Utensils, Wallet, Zap,
};

const getTemplateIcon = (name: string) => TEMPLATE_ICONS[name] || Sparkles;

const TIER_LABEL: Record<TemplateUnlockTier, string> = {
  free: "Free",
  starter: "Starter",
  premium: "Premium",
};

type TemplateOption = TemplateCatalogDto & { iconComponent: typeof Dumbbell };

type TemplateHabitItem = { habitId: string; name: string; icon: string };
type TemplateCompletions = Record<string, Record<number, boolean>>;
type TemplateCompletionById = Record<string, TemplateCompletions>;
type TemplateHabitsById = Record<string, TemplateHabitItem[]>;
type TemplateMoodsById = Record<string, Record<number, number>>;
type TemplateNotesById = Record<string, string>;


function getWeeks(totalDays: number) {
  const weeks: { week: number; days: number[] }[] = [];
  for (let i = 0; i < totalDays; i += 7) {
    const days = Array.from({ length: Math.min(7, totalDays - i) }, (_, j) => i + j + 1);
    weeks.push({ week: weeks.length + 1, days });
  }
  return weeks;
}

const Templates = () => {
  const { user, guestSyncTick } = useAuth();
  const navigate = useNavigate();
  const { setTemplateData } = useHabitContext();
  // Templates carry a descriptive month in the catalog, but tracking always
  // happens in the month the user is actually living in.
  const now = new Date();
  const trackerMonthIndex = now.getMonth();
  const trackerMonth = MONTH_NAMES[trackerMonthIndex];
  const trackerYear = now.getFullYear();
  const trackerDays = new Date(trackerYear, trackerMonthIndex + 1, 0).getDate();
  const [catalog, setCatalog] = useState<TemplateOption[]>([]);
  const [catalogError, setCatalogError] = useState<string | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [completions, setCompletions] = useState<TemplateCompletionById>({});
  const [moodRatings, setMoodRatings] = useState<Record<number, number>>({});
  const [moodsByTemplate, setMoodsByTemplate] = useState<TemplateMoodsById>({});
  const [notes, setNotes] = useState("");
  const [notesByTemplate, setNotesByTemplate] = useState<TemplateNotesById>({});
  const [customHabits, setCustomHabits] = useState<TemplateHabitsById>({});
  const [editingHabitId, setEditingHabitId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editIcon, setEditIcon] = useState("");
  const [addingHabit, setAddingHabit] = useState(false);
  const [newHabitName, setNewHabitName] = useState("");
  const [newHabitIcon, setNewHabitIcon] = useState("✅");
  const editInputRef = useRef<HTMLInputElement>(null);
  const [templateSearch, setTemplateSearch] = useState("");
  const [showCount, setShowCount] = useState(12);
  const [loadingData, setLoadingData] = useState(true);
  const [savingRef] = useState<{ timeout: NodeJS.Timeout | null }>({ timeout: null });

  const selected = catalog.find((t) => t.templateId === selectedId);

  // Load the server catalog (tier locks included) plus this user's progress.
  useEffect(() => {
    let cancelled = false;
    const load = async () => {
      setLoadingData(true);
      try {
        const [catalogData, progress] = await Promise.all([
          api.templates.catalog(),
          user ? api.templates.list() : Promise.resolve({ templates: [] }),
        ]);
        if (cancelled) return;
        setCatalog(
          catalogData.templates.map((row) => ({
            ...row,
            id: row.templateId,
            iconComponent: getTemplateIcon(row.icon),
          }))
        );
        setCatalogError(null);

        const loadedCompletions: TemplateCompletionById = {};
        const loadedHabits: TemplateHabitsById = {};
        const loadedMoods: TemplateMoodsById = {};
        const loadedNotes: TemplateNotesById = {};
        progress.templates.forEach((row) => {
          loadedCompletions[row.templateId] = row.completions;
          loadedHabits[row.templateId] = row.habits;
          loadedMoods[row.templateId] = row.moodRatings || {};
          loadedNotes[row.templateId] = row.notes || "";
        });
        setCompletions(loadedCompletions);
        setCustomHabits(loadedHabits);
        setMoodsByTemplate(loadedMoods);
        setNotesByTemplate(loadedNotes);
      } catch (error) {
        if (!cancelled) {
          console.error("Failed to load templates", error);
          setCatalogError("Could not load templates. Check your connection and try again.");
        }
      } finally {
        if (!cancelled) setLoadingData(false);
      }
    };
    load();
    return () => {
      cancelled = true;
    };
  }, [user, guestSyncTick]);

  // Debounced save to API
  const saveToDb = useCallback((templateId: string, habits: TemplateHabitItem[], comps: TemplateCompletions, totalDays: number, moods: Record<number, number>, notesValue: string) => {
    if (!user) return;
    if (savingRef.timeout) clearTimeout(savingRef.timeout);
    savingRef.timeout = setTimeout(async () => {
      const template = catalog.find((t) => t.templateId === templateId);
      if (!template) return;
      try {
        await api.templates.upsert({
          templateId,
          templateName: template.name,
          habits,
          completions: comps,
          totalDays,
          moodRatings: moods,
          notes: notesValue,
        });
      } catch (error) {
        console.error("Failed to save template progress", error);
      }
    }, 500);
  }, [user, catalog, savingRef]);

  // Sync template data to shared context whenever completions or customHabits change
  useEffect(() => {
    Object.keys(completions).forEach((templateId) => {
      const template = catalog.find((t) => t.templateId === templateId);
      if (!template) return;
      const habits = customHabits[templateId] || template.habits;
      setTemplateData(templateId, {
        templateId,
        templateName: template.name,
        habits,
        completions: completions[templateId] || {},
        totalDays: template.totalDays,
      });
    });
  }, [completions, customHabits, catalog, setTemplateData]);

  const getHabitsForTemplate = (t: TemplateOption) => {
    return customHabits[t.templateId] || t.habits;
  };

  const openTemplate = (t: TemplateOption) => {
    if (t.locked) {
      navigate("/pricing");
      return;
    }
    setSelectedId(t.templateId);
    if (!customHabits[t.templateId]) {
      setCustomHabits((prev) => ({ ...prev, [t.templateId]: [...t.habits] }));
    }
    if (!completions[t.templateId]) {
      const init: Record<string, Record<number, boolean>> = {};
      t.habits.forEach((h) => { init[h.habitId] = {}; });
      setCompletions((prev) => ({ ...prev, [t.templateId]: init }));
    }
    setMoodRatings(moodsByTemplate[t.templateId] || {});
    setNotes(notesByTemplate[t.templateId] || "");
    setEditingHabitId(null);
    setAddingHabit(false);
  };

  const getCompletionsForTemplate = () => {
    if (!selected) return {};
    return completions[selected.templateId] || {};
  };

  const updateMoodRating = (day: number, value: number) => {
    if (!selected) return;
    const updatedMoods = { ...moodRatings, [day]: value };
    setMoodRatings(updatedMoods);
    setMoodsByTemplate((prev) => ({ ...prev, [selected.templateId]: updatedMoods }));
    saveToDb(
      selected.templateId,
      customHabits[selected.templateId] || selected.habits,
      completions[selected.templateId] || {},
      trackerDays,
      updatedMoods,
      notes
    );
  };

  const updateNotes = (value: string) => {
    if (!selected) return;
    setNotes(value);
    setNotesByTemplate((prev) => ({ ...prev, [selected.templateId]: value }));
    saveToDb(
      selected.templateId,
      customHabits[selected.templateId] || selected.habits,
      completions[selected.templateId] || {},
      trackerDays,
      moodRatings,
      value
    );
  };

  const toggleCell = (habitId: string, day: number) => {
    if (!selected) return;
    setCompletions((prev) => {
      const tData = prev[selected.templateId] || {};
      const updated = {
        ...prev,
        [selected.templateId]: {
          ...tData,
          [habitId]: { ...tData[habitId], [day]: !tData[habitId]?.[day] },
        },
      };
      const habits = customHabits[selected.templateId] || selected.habits;
      saveToDb(selected.templateId, habits, updated[selected.templateId], trackerDays, moodRatings, notes);
      return updated;
    });
  };

  const startEditing = (habit: { habitId: string; name: string; icon: string }) => {
    setEditingHabitId(habit.habitId);
    setEditName(habit.name);
    setEditIcon(habit.icon);
    setTimeout(() => editInputRef.current?.focus(), 50);
  };

  const saveEdit = () => {
    if (!selected || !editingHabitId || !editName.trim()) return;
    setCustomHabits((prev) => {
      const updated = {
        ...prev,
        [selected.templateId]: (prev[selected.templateId] || []).map((h) =>
          h.habitId === editingHabitId ? { ...h, name: editName.trim(), icon: editIcon || h.icon } : h
        ),
      };
      saveToDb(selected.templateId, updated[selected.templateId], completions[selected.templateId] || {}, trackerDays, moodRatings, notes);
      return updated;
    });
    setEditingHabitId(null);
  };

  const deleteHabit = (habitId: string) => {
    if (!selected) return;
    setCustomHabits((prev) => {
      const updated = {
        ...prev,
        [selected.templateId]: (prev[selected.templateId] || []).filter((h) => h.habitId !== habitId),
      };
      saveToDb(selected.templateId, updated[selected.templateId], completions[selected.templateId] || {}, trackerDays, moodRatings, notes);
      return updated;
    });
  };

  const addHabit = () => {
    if (!selected || !newHabitName.trim()) return;
    const newId = `custom_${Date.now()}`;
    setCustomHabits((prev) => {
      const updated = {
        ...prev,
        [selected.templateId]: [...(prev[selected.templateId] || []), { habitId: newId, name: newHabitName.trim(), icon: newHabitIcon || "✅" }],
      };
      saveToDb(selected.templateId, updated[selected.templateId], completions[selected.templateId] || {}, trackerDays, moodRatings, notes);
      return updated;
    });
    setNewHabitName("");
    setNewHabitIcon("✅");
    setAddingHabit(false);
  };

  // Template selection grid
  const filteredTemplates = useMemo(() => {
    if (!templateSearch) return catalog;
    const q = templateSearch.toLowerCase();
    return catalog.filter((t) =>
      t.name.toLowerCase().includes(q) || t.description.toLowerCase().includes(q) ||
      t.habits.some((h) => h.name.toLowerCase().includes(q))
    );
  }, [catalog, templateSearch]);

  const visibleTemplates = filteredTemplates.slice(0, showCount);

  if (loadingData) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="flex items-center justify-center pt-40">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  if (!selected) {
    return (
      <div className="min-h-screen">
        <Navbar />
        <div className="pt-24 pb-12 px-4">
          <div className="container mx-auto max-w-6xl">
            <div className="text-center mb-8">
              <h1 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">Habit Templates</h1>
              <p className="text-muted-foreground">Choose from {catalog.length} professional templates to start tracking instantly.</p>
            </div>

            {catalogError && (
              <div className="max-w-md mx-auto mb-8 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive text-center">
                {catalogError}
              </div>
            )}

            {!catalogError && catalog.length === 0 && (
              <div className="max-w-md mx-auto mb-8 rounded-xl border border-border bg-card px-4 py-6 text-sm text-muted-foreground text-center">
                No templates are available right now. Please check back soon.
              </div>
            )}

            {/* Search */}
            <div className="max-w-md mx-auto mb-8">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <input
                  type="text"
                  value={templateSearch}
                  onChange={(e) => { setTemplateSearch(e.target.value); setShowCount(12); }}
                  placeholder="Search templates..."
                  className="w-full pl-10 pr-4 py-3 rounded-xl border border-input bg-card text-foreground text-sm focus:outline-none focus:ring-2 focus:ring-ring"
                />
              </div>
              {templateSearch && (
                <p className="text-xs text-muted-foreground mt-2 text-center">{filteredTemplates.length} templates found</p>
              )}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {visibleTemplates.map((t, i) => {
                const accessible = !t.locked;
                return (
                <motion.div
                  key={t.templateId}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: Math.min(i, 6) * 0.04 }}
                  onClick={() => openTemplate(t)}
                  className={`rounded-2xl border border-border bg-card overflow-hidden transition-all group relative ${
                    accessible ? "cursor-pointer hover:border-primary/40 hover:shadow-lg hover:shadow-primary/5" : "opacity-70 cursor-not-allowed"
                  }`}
                >
                  {!accessible && (
                    <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] z-10 flex flex-col items-center justify-center rounded-2xl">
                      <Lock className="w-6 h-6 text-muted-foreground mb-2" />
                      <span className="text-xs font-medium text-muted-foreground">
                        {t.unlockTier === "starter" ? "Starter plan required" : "Premium plan required"}
                      </span>
                    </div>
                  )}
                  <div className={`h-2 ${t.color}`} />
                  <div className="p-5">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-10 h-10 rounded-xl ${t.color} flex items-center justify-center`}>
                        <t.iconComponent className="w-5 h-5 text-primary-foreground" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-display font-bold text-foreground">{t.name}</h3>
                          <span className={`text-[10px] uppercase tracking-wide px-1.5 py-0.5 rounded-full font-semibold ${
                            t.unlockTier === "free"
                              ? "bg-secondary text-muted-foreground"
                              : t.unlockTier === "starter"
                              ? "bg-primary/10 text-primary"
                              : "bg-accent text-accent-foreground"
                          }`}>
                            {TIER_LABEL[t.unlockTier]}
                          </span>
                        </div>
                        <span className="text-xs text-muted-foreground">{t.habits.length} habits</span>
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground mb-3">{t.description}</p>
                    <div className="flex flex-wrap gap-1.5">
                      {t.habits.slice(0, 3).map((h) => (
                        <span key={h.habitId} className="text-xs px-2 py-1 rounded-full bg-secondary text-secondary-foreground">
                          {h.icon} {h.name}
                        </span>
                      ))}
                      {t.habits.length > 3 && (
                        <span className="text-xs px-2 py-1 rounded-full bg-secondary text-muted-foreground">
                          +{t.habits.length - 3} more
                        </span>
                      )}
                    </div>
                  </div>
                </motion.div>
                );
              })}
            </div>

            {showCount < filteredTemplates.length && (
              <div className="text-center mt-8">
                <button
                  onClick={() => setShowCount((c) => c + 12)}
                  className="px-6 py-3 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm hover:opacity-90 transition-opacity"
                >
                  Load More ({filteredTemplates.length - showCount} remaining)
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    );
  }

  // Active template view
  const weeks = getWeeks(trackerDays);
  const allDays = weeks.flatMap((w) => w.days);
  const tCompletions = getCompletionsForTemplate();

  const activeHabits = selected ? getHabitsForTemplate(selected) : [];

  const dailyChartData = allDays.slice(0, Math.min(allDays.length, 14)).map((day) => {
    const total = activeHabits.length;
    const completed = activeHabits.filter((h) => tCompletions[h.habitId]?.[day]).length;
    return { day: `${day}`, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  const weeklyChartData = weeks.map((w) => {
    const total = activeHabits.length * w.days.length;
    const completed = w.days.reduce((acc, day) =>
      acc + activeHabits.filter((h) => tCompletions[h.habitId]?.[day]).length, 0);
    return { week: `W${w.week}`, rate: total > 0 ? Math.round((completed / total) * 100) : 0 };
  });

  return (
    <div className="min-h-screen">
      <Navbar />
      <div className="pt-24 pb-12 px-4">
        <div className="container mx-auto max-w-7xl">
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
            {/* Back + Header */}
            <button
              onClick={() => setSelectedId(null)}
              className="flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
            >
              <ArrowLeft className="w-4 h-4" /> Back to Templates
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className={`w-12 h-12 rounded-xl ${selected.color} flex items-center justify-center`}>
                <selected.iconComponent className="w-6 h-6 text-primary-foreground" />
              </div>
              <div>
                <h1 className="text-2xl font-display font-bold text-foreground">{selected.name}</h1>
                <p className="text-sm text-muted-foreground">{trackerMonth} {trackerYear} · {trackerDays} days</p>
              </div>
            </div>

            {/* Charts */}
            <div className="grid md:grid-cols-2 gap-4 mb-8">
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-display font-semibold text-sm text-foreground mb-3">Daily Progress</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={dailyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="day" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="hsl(var(--primary))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="bg-card border border-border rounded-xl p-4">
                <h3 className="font-display font-semibold text-sm text-foreground mb-3">Weekly Progress</h3>
                <ResponsiveContainer width="100%" height={140}>
                  <BarChart data={weeklyChartData}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis dataKey="week" tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} />
                    <YAxis tick={{ fontSize: 10, fill: "hsl(var(--muted-foreground))" }} domain={[0, 100]} />
                    <Tooltip />
                    <Bar dataKey="rate" fill="hsl(var(--muted-foreground))" radius={[2, 2, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Habit Grid */}
            <div className="bg-card border border-border rounded-xl overflow-x-auto mb-6">
              <table className="w-full text-xs">
                <thead>
                  <tr className="border-b border-border">
                    <th className="sticky left-0 bg-card z-10 text-left p-3 font-display font-semibold text-foreground min-w-[160px]">
                      My Habits
                    </th>
                    {weeks.map((week) => (
                      <th key={week.week} colSpan={week.days.length} className="p-2 text-center font-display font-semibold text-foreground border-l border-border">
                        Week {week.week}
                      </th>
                    ))}
                  </tr>
                  <tr className="border-b border-border bg-secondary/30">
                    <th className="sticky left-0 bg-secondary/30 z-10" />
                    {allDays.map((day) => {
                      const date = new Date(trackerYear, trackerMonthIndex, day);
                      const dayName = DAYS_OF_WEEK[date.getDay()];
                      return (
                        <th key={day} className="p-1.5 text-center min-w-[32px]">
                          <div className="text-muted-foreground font-normal">{dayName}</div>
                          <div className="text-foreground font-semibold">{day}</div>
                        </th>
                      );
                    })}
                  </tr>
                </thead>
                <tbody>
                  {activeHabits.map((habit) => (
                    <tr key={habit.habitId} className="border-b border-border/50 hover:bg-secondary/20 transition-colors group/row">
                      <td className="sticky left-0 bg-card z-10 p-2 font-medium text-foreground whitespace-nowrap">
                        {editingHabitId === habit.habitId ? (
                          <div className="flex items-center gap-1.5">
                            <input
                              value={editIcon}
                              onChange={(e) => setEditIcon(e.target.value)}
                              className="w-8 h-8 text-center rounded border border-border bg-secondary text-sm"
                              maxLength={2}
                            />
                            <input
                              ref={editInputRef}
                              value={editName}
                              onChange={(e) => setEditName(e.target.value)}
                              onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                              className="h-8 px-2 rounded border border-border bg-secondary text-sm text-foreground w-28"
                            />
                            <button onClick={saveEdit} className="p-1 rounded hover:bg-primary/10 text-primary"><Save className="w-3.5 h-3.5" /></button>
                            <button onClick={() => setEditingHabitId(null)} className="p-1 rounded hover:bg-destructive/10 text-destructive"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-1">
                            <span className="mr-1">{habit.icon}</span>
                            <span className="flex-1">{habit.name}</span>
                            <button
                              onClick={(e) => { e.stopPropagation(); startEditing(habit); }}
                              className="p-1 rounded hover:bg-secondary opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-foreground"
                            >
                              <Pencil className="w-3 h-3" />
                            </button>
                            <button
                              onClick={(e) => { e.stopPropagation(); deleteHabit(habit.habitId); }}
                              className="p-1 rounded hover:bg-destructive/10 opacity-0 group-hover/row:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          </div>
                        )}
                      </td>
                      {allDays.map((day) => {
                        const done = tCompletions[habit.habitId]?.[day];
                        return (
                          <td key={day} className="p-1 text-center">
                            <button
                              onClick={() => toggleCell(habit.habitId, day)}
                              className={`w-6 h-6 rounded-md border transition-all flex items-center justify-center mx-auto ${
                                done
                                  ? "bg-primary/15 border-primary/40 text-primary"
                                  : done === false
                                  ? "bg-destructive/10 border-destructive/30 text-destructive"
                                  : "border-border hover:border-primary/30 text-transparent hover:text-muted-foreground/30"
                              }`}
                            >
                              {done ? <Check className="w-3.5 h-3.5" /> : done === false ? <X className="w-3.5 h-3.5" /> : <Check className="w-3.5 h-3.5" />}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                  {/* Add Habit Row */}
                  <tr className="border-b border-border/50">
                    <td className="sticky left-0 bg-card z-10 p-2" colSpan={allDays.length + 1}>
                      {addingHabit ? (
                        <div className="flex items-center gap-2">
                          <input
                            value={newHabitIcon}
                            onChange={(e) => setNewHabitIcon(e.target.value)}
                            className="w-8 h-8 text-center rounded border border-border bg-secondary text-sm"
                            maxLength={2}
                            placeholder="🎯"
                          />
                          <input
                            value={newHabitName}
                            onChange={(e) => setNewHabitName(e.target.value)}
                            onKeyDown={(e) => e.key === "Enter" && addHabit()}
                            placeholder="New habit name..."
                            className="h-8 px-2 rounded border border-border bg-secondary text-sm text-foreground flex-1 max-w-[200px]"
                            autoFocus
                          />
                          <button onClick={addHabit} className="h-8 px-3 rounded-lg gradient-primary text-primary-foreground text-xs font-medium">Add</button>
                          <button onClick={() => setAddingHabit(false)} className="h-8 px-2 rounded-lg border border-border text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => setAddingHabit(true)}
                          className="flex items-center gap-2 text-xs text-muted-foreground hover:text-primary transition-colors py-1"
                        >
                          <Plus className="w-3.5 h-3.5" /> Add new habit
                        </button>
                      )}
                    </td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Mood Tracker */}
            <div className="bg-card border border-border rounded-xl p-5 mb-6">
              <h3 className="font-display font-semibold text-foreground mb-4">Mood Tracker</h3>
              <div className="flex gap-3 overflow-x-auto pb-2">
                {Array.from({ length: 10 }, (_, i) => i + 1).map((day) => (
                  <div key={day} className="flex flex-col items-center gap-2 min-w-[48px]">
                    <span className="text-xs text-muted-foreground font-medium">Day {day}</span>
                    <select
                      value={moodRatings[day] ?? ""}
                      onChange={(e) => updateMoodRating(day, Number(e.target.value))}
                      className="w-10 h-10 rounded-lg border border-border bg-secondary text-center text-lg appearance-none cursor-pointer hover:border-primary/30 transition-colors"
                    >
                      <option value="">-</option>
                      {MOODS.map((m, idx) => (<option key={idx} value={idx + 1}>{m}</option>))}
                    </select>
                    <span className="text-lg">{moodRatings[day] ? MOODS[moodRatings[day] - 1] : ""}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Mental State Notes */}
            <div className="bg-card border border-border rounded-xl p-5">
              <h3 className="font-display font-semibold text-foreground mb-3">Mental State Notes</h3>
              <textarea
                value={notes}
                onChange={(e) => updateNotes(e.target.value)}
                placeholder="How are you feeling this month? Write your thoughts..."
                className="w-full h-24 bg-secondary/50 border border-border rounded-lg p-3 text-sm text-foreground placeholder:text-muted-foreground resize-none focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Templates;
