import { useEffect, useState } from "react";
import { BarChart3, CalendarDays, CheckSquare, Home, Leaf, Plus } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { setAndroidBackHandler } from "@/lib/backButton";
import { tapFeedback } from "@/lib/native";
import { todayISO } from "./date";
import { MB_CATEGORIES, MB_ICONS, Sheet } from "./shared";
import { MobileAuth } from "./MobileAuth";
import { MobileDataProvider, useMobileData } from "./useMobileData";
import { AccountSheet, TodayScreen } from "./TodayScreen";
import { TimeScreen } from "./TimeScreen";
import { AnalyticsScreen } from "./AnalyticsScreen";
import { TasksScreen } from "./TasksScreen";
import { CalendarScreen } from "./CalendarScreen";
import { TemplatesScreen } from "./TemplatesScreen";
import "./mobile.css";

type Screen = "today" | "time" | "analytics" | "tasks" | "calendar" | "templates";
type AddSheet = { type: "habit" } | { type: "task"; date: string } | { type: "note"; date: string };

const Splash = ({ label }: { label: string }) => (
  <div className="hb-app" style={{ alignItems: "center", justifyContent: "center" }}>
    <div className="hb-auth-logo" style={{ width: 58, height: 58, borderRadius: 18, marginBottom: 18 }}>
      <Leaf size={28} />
    </div>
    <div className="hb-display" style={{ fontSize: 22, marginBottom: 14 }}>
      Habbiters
    </div>
    <span className="hb-spinner" />
    <div className="hb-muted" style={{ fontSize: 12, marginTop: 12 }}>
      {label}
    </div>
  </div>
);

const HabitSheet = ({ onClose, onBrowseTemplates }: { onClose: () => void; onBrowseTemplates: () => void }) => {
  const { createHabit } = useMobileData();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Health");
  const [icon, setIcon] = useState("🎯");
  const [difficulty, setDifficulty] = useState<"easy" | "medium" | "hard">("easy");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await createHabit({ title: title.trim(), category, icon, difficulty });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="New habit" onClose={onClose}>
      <button type="button" className="hb-template-link" onClick={onBrowseTemplates}>
        <span className="hb-template-link-icon">✨</span>
        <span className="hb-template-link-copy">
          <strong>Not sure what to track?</strong>
          Start from one of 105 proven templates
        </span>
        <span className="hb-template-link-arrow">Browse →</span>
      </button>
      <span className="hb-sheet-label">What do you want to build?</span>
      <input
        className="hb-input"
        placeholder="e.g. Morning stretch"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoFocus
      />
      <span className="hb-sheet-label">Icon</span>
      <div className="hb-options">
        {MB_ICONS.map((value) => (
          <button
            key={value}
            type="button"
            className={`hb-option ${icon === value ? "is-active" : ""}`}
            style={{ fontSize: 17, padding: "7px 10px" }}
            onClick={() => setIcon(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <span className="hb-sheet-label">Category</span>
      <div className="hb-options">
        {MB_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            className={`hb-option ${category === value ? "is-active" : ""}`}
            onClick={() => setCategory(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <span className="hb-sheet-label">Difficulty</span>
      <div className="hb-options">
        {(["easy", "medium", "hard"] as const).map((value) => (
          <button
            key={value}
            type="button"
            className={`hb-option ${difficulty === value ? "is-active" : ""}`}
            onClick={() => setDifficulty(value)}
          >
            {value[0].toUpperCase() + value.slice(1)}
          </button>
        ))}
      </div>
      <button type="button" className="hb-btn-primary" disabled={busy || !title.trim()} onClick={() => void save()}>
        {busy ? "Adding…" : "Add habit"}
      </button>
    </Sheet>
  );
};

const TaskSheet = ({ date, onClose }: { date: string; onClose: () => void }) => {
  const { addTask } = useMobileData();
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>("Personal");
  const [day, setDay] = useState(date);
  const [time, setTime] = useState("09:00");
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!title.trim()) return;
    setBusy(true);
    try {
      await addTask({ title: title.trim(), category, date: day, time });
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="New task" onClose={onClose}>
      <span className="hb-sheet-label">Task</span>
      <input
        className="hb-input"
        placeholder="e.g. Review PR feedback"
        value={title}
        onChange={(event) => setTitle(event.target.value)}
        autoFocus
      />
      <span className="hb-sheet-label">Category</span>
      <div className="hb-options">
        {MB_CATEGORIES.map((value) => (
          <button
            key={value}
            type="button"
            className={`hb-option ${category === value ? "is-active" : ""}`}
            onClick={() => setCategory(value)}
          >
            {value}
          </button>
        ))}
      </div>
      <div style={{ display: "flex", gap: 10 }}>
        <div style={{ flex: 1 }}>
          <span className="hb-sheet-label">Date</span>
          <input className="hb-input" type="date" value={day} onChange={(event) => setDay(event.target.value)} />
        </div>
        <div style={{ flex: 1 }}>
          <span className="hb-sheet-label">Time</span>
          <input className="hb-input" type="time" value={time} onChange={(event) => setTime(event.target.value)} />
        </div>
      </div>
      <button type="button" className="hb-btn-primary" disabled={busy || !title.trim()} onClick={() => void save()}>
        {busy ? "Adding…" : "Add task"}
      </button>
    </Sheet>
  );
};

const NoteSheet = ({ date, onClose }: { date: string; onClose: () => void }) => {
  const { addNote } = useMobileData();
  const [text, setText] = useState("");
  const [day, setDay] = useState(date);
  const [busy, setBusy] = useState(false);

  const save = async () => {
    if (!text.trim()) return;
    setBusy(true);
    try {
      await addNote(text.trim(), day);
      onClose();
    } finally {
      setBusy(false);
    }
  };

  return (
    <Sheet title="New note" onClose={onClose}>
      <span className="hb-sheet-label">Note</span>
      <textarea
        className="hb-input"
        rows={4}
        placeholder="What happened today? What did you learn?"
        value={text}
        onChange={(event) => setText(event.target.value)}
        autoFocus
        maxLength={2000}
        style={{ resize: "none" }}
      />
      <span className="hb-sheet-label">Date</span>
      <input className="hb-input" type="date" value={day} onChange={(event) => setDay(event.target.value)} />
      <button type="button" className="hb-btn-primary" disabled={busy || !text.trim()} onClick={() => void save()}>
        {busy ? "Saving…" : "Save note"}
      </button>
    </Sheet>
  );
};

const MobileShell = () => {
  const { toast } = useMobileData();
  const [screen, setScreen] = useState<Screen>("today");
  const [accountOpen, setAccountOpen] = useState(false);
  const [addSheet, setAddSheet] = useState<AddSheet | null>(null);
  const [timeSignal, setTimeSignal] = useState(0);
  const [templatesFocus, setTemplatesFocus] = useState<string | null>(null);

  useEffect(() => {
    setAndroidBackHandler(() => {
      if (addSheet) {
        setAddSheet(null);
        return true;
      }
      if (accountOpen) {
        setAccountOpen(false);
        return true;
      }
      if (screen !== "today") {
        setScreen("today");
        return true;
      }
      return false;
    });
    return () => setAndroidBackHandler(null);
  }, [accountOpen, addSheet, screen]);

  const go = (next: Screen) => {
    tapFeedback();
    setScreen(next);
  };

  const openTemplates = (templateId?: string) => {
    tapFeedback();
    setTemplatesFocus(templateId || null);
    setScreen("templates");
  };

  const openAdd = () => {
    tapFeedback();
    if (screen === "tasks") setAddSheet({ type: "task", date: todayISO() });
    else if (screen === "calendar") setAddSheet({ type: "note", date: todayISO() });
    else if (screen === "time") setTimeSignal((value) => value + 1);
    else setAddSheet({ type: "habit" });
  };

  const navItems: { id: Screen; label: string; icon: typeof Home }[] = [
    { id: "today", label: "Home", icon: Home },
    { id: "analytics", label: "Analytics", icon: BarChart3 },
  ];
  const rightNav: { id: Screen; label: string; icon: typeof Home }[] = [
    { id: "tasks", label: "Tasks", icon: CheckSquare },
    { id: "calendar", label: "Calendar", icon: CalendarDays },
  ];

  return (
    <div className="hb-app">
      <main className="hb-main">
        <div className="hb-scroll" key={screen}>
          {screen === "today" && (
            <TodayScreen
              onOpenTime={() => go("time")}
              onOpenAccount={() => setAccountOpen(true)}
              onAddHabit={() => setAddSheet({ type: "habit" })}
              onOpenTemplates={() => openTemplates()}
              onOpenTemplate={(templateId) => openTemplates(templateId)}
              onOpenTasks={() => go("tasks")}
            />
          )}
          {screen === "time" && <TimeScreen onBack={() => go("today")} onOpenCalendar={() => go("calendar")} addSignal={timeSignal} />}
          {screen === "analytics" && <AnalyticsScreen />}
          {screen === "tasks" && (
            <TasksScreen
              onAddTask={(date) => setAddSheet({ type: "task", date: date || todayISO() })}
              onOpenCalendar={() => go("calendar")}
            />
          )}
          {screen === "calendar" && <CalendarScreen onAddNote={(date) => setAddSheet({ type: "note", date })} />}
          {screen === "templates" && (
            <TemplatesScreen
              initialTemplateId={templatesFocus}
              onBack={() => {
                setTemplatesFocus(null);
                go("today");
              }}
            />
          )}
        </div>
      </main>

      <nav className="hb-nav" aria-label="Primary">
        {navItems.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`hb-nav-item ${screen === id ? "is-active" : ""}`}
            onClick={() => go(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
        <div className="hb-fab-slot">
          <button type="button" className="hb-fab" onClick={openAdd} aria-label="Quick add">
            <Plus size={26} strokeWidth={2.5} />
          </button>
        </div>
        {rightNav.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            type="button"
            className={`hb-nav-item ${screen === id ? "is-active" : ""}`}
            onClick={() => go(id)}
          >
            <Icon />
            {label}
          </button>
        ))}
      </nav>

      {toast && <div className="hb-toast">{toast}</div>}

      {accountOpen && <AccountSheet onClose={() => setAccountOpen(false)} />}
      {addSheet?.type === "habit" && (
        <HabitSheet
          onClose={() => setAddSheet(null)}
          onBrowseTemplates={() => {
            setAddSheet(null);
            openTemplates();
          }}
        />
      )}
      {addSheet?.type === "task" && <TaskSheet date={addSheet.date} onClose={() => setAddSheet(null)} />}
      {addSheet?.type === "note" && <NoteSheet date={addSheet.date} onClose={() => setAddSheet(null)} />}
    </div>
  );
};

export const MobileApp = () => {
  const { user, loading } = useAuth();

  useEffect(() => {
    document.documentElement.classList.add("dark");
    return () => document.documentElement.classList.remove("dark");
  }, []);

  if (loading) return <Splash label="Restoring your streaks" />;
  if (!user)
    return (
      <div className="hb-app">
        <MobileAuth />
      </div>
    );

  return (
    <MobileDataProvider>
      <MobileShell />
    </MobileDataProvider>
  );
};
