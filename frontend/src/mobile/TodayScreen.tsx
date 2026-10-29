import { useMemo, useState } from "react";
import { Bell, Check, ChevronRight, Flame } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { initials, lastNDays, todayISO, weekOf } from "./date";
import { DotRow, Loading, Ring, Sheet, WeekStrip } from "./shared";
import { MomentumCard } from "./MomentumCard";
import { buildMomentumSeries, computeMomentum, nextMoveFor } from "./momentum";
import { templateEmoji } from "./templates";
import { useMobileData } from "./useMobileData";

export const TodayScreen = ({
  onOpenTime,
  onOpenAccount,
  onAddHabit,
  onOpenTemplates,
  onOpenTemplate,
  onOpenTasks,
}: {
  onOpenTime: () => void;
  onOpenAccount: () => void;
  onAddHabit: () => void;
  onOpenTemplates: () => void;
  onOpenTemplate: (templateId: string) => void;
  onOpenTasks: () => void;
}) => {
  const { user } = useAuth();
  const { summary, history, tasks, time, templates, isLoading, toggleHabit, notify } = useMobileData();
  const [category, setCategory] = useState("All");
  const [showGlance, setShowGlance] = useState(false);

  const today = todayISO();
  const todayTasks = tasks.filter((task) => task.date === today);
  const focusHours = (time?.entries || [])
    .filter((entry) => entry.date === today)
    .reduce((sum, entry) => sum + entry.hours, 0);

  const week = useMemo(() => weekOf(today), [today]);
  const lastSeven = useMemo(() => lastNDays(7), []);
  const markDays = useMemo(() => {
    const set = new Set<string>();
    history?.daily.forEach((row) => {
      if (row.completed > 0) set.add(row.date);
    });
    return set;
  }, [history]);

  const categories = useMemo(() => {
    const values = new Set((summary?.habits || []).map((habit) => habit.category));
    return ["All", ...Array.from(values)];
  }, [summary]);

  const habits = (summary?.habits || []).filter((habit) => category === "All" || habit.category === category);
  const total = summary?.stats.totalHabits || 0;
  const done = summary?.stats.completedToday || 0;
  const completion = summary?.stats.completionPercentage || 0;
  const firstName = (user?.fullName || "friend").split(" ")[0];
  const completedTasks = todayTasks.filter((task) => task.completed).length;
  const bestStreak = summary?.stats.bestStreak || 0;

  const momentumInput = {
    habitsDone: done,
    habitsTotal: total,
    tasksDone: completedTasks,
    tasksTotal: todayTasks.length,
    focusHours,
    bestStreak,
  };
  const momentum = computeMomentum(momentumInput);
  const move = nextMoveFor(momentumInput, momentum);
  const momentumDays = useMemo(
    () => buildMomentumSeries({ history, tasks, time, bestStreak }),
    [history, tasks, time, bestStreak]
  );

  const historyFor = (habitId: string) => new Set(history?.habits.find((row) => row.id === habitId)?.dates || []);

  return (
    <div className="hb-screen">
      <div className="hb-topbar">
        <button type="button" className="hb-avatar" onClick={onOpenAccount} aria-label="Account">
          {user?.avatarUrl ? <img src={user.avatarUrl} alt="" /> : initials(user?.fullName)}
        </button>
        <div className="hb-topbar-text">
          <div className="hb-greeting">Hello, {firstName} 👋</div>
          <div className="hb-subgreeting">Make today count.</div>
        </div>
        <button type="button" className="hb-icon-btn" onClick={() => setShowGlance(true)} aria-label="At a glance">
          <Bell size={18} />
        </button>
      </div>

      <WeekStrip days={week} marks={markDays} selected={today} />

      <div className="hb-rings">
        <Ring value={total ? done / total : 0} display={`${done}/${total}`} label="Habits" tone="green" />
        <Ring
          value={todayTasks.length ? completedTasks / todayTasks.length : 0}
          display={`${completedTasks}/${todayTasks.length}`}
          label="Tasks"
          tone="purple"
        />
        <Ring
          value={Math.min(1, focusHours / 4)}
          display={focusHours ? `${focusHours}h` : "0h"}
          label="Focus"
          tone="coral"
          onClick={onOpenTime}
          ariaLabel={`Focus: ${focusHours} hours logged. Open time tracker`}
        />
        <Ring value={completion / 100} display={`${completion}%`} label="Today" tone="blue" />
      </div>

      <MomentumCard
        breakdown={momentum}
        series={momentumDays}
        move={move}
        onOpenTime={onOpenTime}
        onOpenTasks={onOpenTasks}
        onOpenTemplates={onOpenTemplates}
      />

      {!!templates?.length && (
        <div className="hb-rail-block">
          <div className="hb-rail-head">
            <div>
              <span className="hb-kicker">Start in one tap</span>
              <strong>{templates.length} free templates</strong>
            </div>
            <button type="button" className="hb-rail-all" onClick={onOpenTemplates}>
              See all →
            </button>
          </div>
          <div className="hb-rail">
            {templates.slice(0, 5).map((template) => (
              <button
                key={template.templateId}
                type="button"
                className="hb-rail-card"
                onClick={() => onOpenTemplate(template.templateId)}
              >
                <span className="hb-rail-icon">{templateEmoji(template)}</span>
                <span className="hb-rail-name">{template.name}</span>
                <span className="hb-rail-meta">{template.habits.length} habits · free</span>
              </button>
            ))}
          </div>
        </div>
      )}

      <div className="hb-chips">
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`hb-chip ${category === item ? "is-active" : ""}`}
            onClick={() => setCategory(item)}
          >
            {item}
          </button>
        ))}
      </div>

      {isLoading ? (
        <Loading />
      ) : habits.length === 0 ? (
        <div className="hb-empty">
          <strong>No habits here yet</strong>
          Start from a proven template, or write your own habit.
          <div style={{ marginTop: 14, display: "flex", gap: 8, justifyContent: "center", flexWrap: "wrap" }}>
            <button
              type="button"
              className="hb-btn-primary"
              style={{ width: "auto", margin: 0, padding: "12px 18px" }}
              onClick={onOpenTemplates}
            >
              Browse 105 templates
            </button>
            <button
              type="button"
              className="hb-btn-ghost"
              style={{ width: "auto", margin: 0, padding: "12px 18px" }}
              onClick={onAddHabit}
            >
              Create your own
            </button>
          </div>
        </div>
      ) : (
        habits.map((habit) => {
          const dates = historyFor(habit.id);
          return (
            <article key={habit.id} className="hb-card">
              <div className="hb-habit-icon">{habit.icon || "🎯"}</div>
              <div className="hb-habit-body">
                <div className="hb-habit-title">{habit.title}</div>
                <div className="hb-habit-meta">
                  <Flame size={12} />
                  {habit.streak > 0 ? `${habit.streak} day streak` : "Start your streak"}
                  <span style={{ color: "#4c564e" }}>·</span>
                  {habit.category}
                </div>
                <DotRow days={lastSeven} completed={dates} todayIso={today} />
              </div>
              <button
                type="button"
                className={`hb-check ${habit.completed ? "is-on" : ""}`}
                aria-label={habit.completed ? `Mark ${habit.title} as not done` : `Mark ${habit.title} as done`}
                onClick={() => toggleHabit(habit)}
              >
                <Check size={20} strokeWidth={3} />
              </button>
            </article>
          );
        })
      )}

      <div style={{ height: 8 }} />
      <div className="hb-insight" onClick={() => notify("Keep going — consistency compounds.")}>
        <div className="hb-insight-icon" style={{ background: "rgba(93,234,107,.13)", color: "#6ef27a" }}>
          <Flame size={15} />
        </div>
        <div style={{ flex: 1 }}>
          <strong>Best streak: {summary?.stats.bestStreak || 0} days</strong>
          <span>
            {summary?.stats.weeklyCompleted || 0} check-ins this week, {summary?.stats.monthlyCompleted || 0} this month.
          </span>
        </div>
        <ChevronRight size={16} color="#4c564e" />
      </div>

      {showGlance && (
        <Sheet title="Today at a glance" onClose={() => setShowGlance(false)}>
          <div className="hb-stat-row" style={{ marginBottom: 4 }}>
            <div className="hb-stat">
              <strong>{done}</strong>
              <span>Habits done</span>
            </div>
            <div className="hb-stat">
              <strong>{summary?.stats.todayXP || 0}</strong>
              <span>XP today</span>
            </div>
            <div className="hb-stat">
              <strong>{focusHours || 0}h</strong>
              <span>Focus logged</span>
            </div>
          </div>
          <div className="hb-muted" style={{ fontSize: 12, lineHeight: 1.6, marginTop: 8 }}>
            Level {summary?.stats.level || 1} · {summary?.stats.totalXP || 0} XP lifetime. Check in before midnight to keep your
            streaks alive.
          </div>
          <button type="button" className="hb-btn-ghost" onClick={() => setShowGlance(false)}>
            Got it
          </button>
        </Sheet>
      )}
    </div>
  );
};

export const AccountSheet = ({ onClose }: { onClose: () => void }) => {
  const { user, signOut } = useAuth();
  const { summary } = useMobileData();

  return (
    <Sheet title="Your account" onClose={onClose}>
      <div className="hb-project" style={{ marginBottom: 6 }}>
        <div className="hb-habit-icon">{initials(user?.fullName)}</div>
        <div style={{ flex: 1 }}>
          <div className="hb-project-title">{user?.fullName || "Habbiters member"}</div>
          <div className="hb-project-meta">{user?.email}</div>
        </div>
      </div>
      <div className="hb-stat-row" style={{ marginTop: 12 }}>
        <div className="hb-stat">
          <strong>{summary?.stats.totalHabits || 0}</strong>
          <span>Habits</span>
        </div>
        <div className="hb-stat">
          <strong>{summary?.stats.bestStreak || 0}</strong>
          <span>Best streak</span>
        </div>
        <div className="hb-stat">
          <strong>{summary?.stats.level || 1}</strong>
          <span>Level</span>
        </div>
      </div>
      <div className="hb-muted" style={{ fontSize: 12, lineHeight: 1.6, marginTop: 6 }}>
        Signed in on this device. Everything you track syncs across the web app and the Android app.
      </div>
      <button type="button" className="hb-btn-primary" onClick={() => void signOut()}>
        Sign out
      </button>
      <button type="button" className="hb-btn-ghost" onClick={onClose}>
        Close
      </button>
    </Sheet>
  );
};
