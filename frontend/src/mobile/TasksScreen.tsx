import { useMemo, useState } from "react";
import { CalendarDays, CheckSquare, ChevronLeft, ChevronRight, MoreHorizontal, Plus, Trash2 } from "lucide-react";
import { useMobileData } from "./useMobileData";
import { longDate, shiftISO, shortISO, timeLabel, todayISO, weekOf } from "./date";
import { CheckMark, Sheet, WeekStrip } from "./shared";

const DOT_COLORS: Record<string, string> = {
  Personal: "#5dea6b",
  Work: "#8b6cf6",
  Health: "#f97c5d",
  Study: "#4f8bf8",
  Fitness: "#f7c869",
  Finance: "#5fd6c8",
};

export const TasksScreen = ({
  onAddTask,
  onOpenCalendar,
}: {
  onAddTask: (date?: string) => void;
  onOpenCalendar: () => void;
}) => {
  const { tasks, toggleTask, deleteTask } = useMobileData();
  const [selected, setSelected] = useState(todayISO());
  const [tab, setTab] = useState<"timeline" | "all">("timeline");
  const [expanded, setExpanded] = useState<string | null>(null);

  const week = useMemo(() => weekOf(selected), [selected]);
  const dayTasks = tasks
    .filter((task) => task.date === selected)
    .sort((a, b) => a.time.localeCompare(b.time));
  const doneCount = dayTasks.filter((task) => task.completed).length;
  const today = todayISO();

  const groupedByDate = useMemo(() => {
    const map = new Map<string, typeof tasks>();
    [...tasks]
      .sort((a, b) => (a.date === b.date ? a.time.localeCompare(b.time) : a.date.localeCompare(b.date)))
      .forEach((task) => map.set(task.date, [...(map.get(task.date) || []), task]));
    return Array.from(map.entries());
  }, [tasks]);

  const renderTask = (task: (typeof tasks)[number]) => (
    <div key={task.id} className={`hb-timeline-row`}>
      <span className="hb-timeline-time">{timeLabel(task.time)}</span>
      <span className="hb-timeline-dot" style={{ background: DOT_COLORS[task.category] || "#5dea6b" }} />
      <button type="button" className={`hb-task ${task.completed ? "is-done" : ""}`} onClick={() => toggleTask(task)}>
        <CheckMark checked={task.completed} />
        <span className="hb-task-title">{task.title}</span>
        <span className={`hb-cat ${task.category.toLowerCase()}`}>{task.category}</span>
      </button>
      <button type="button" className="hb-note-del" onClick={() => setExpanded(task.id)} aria-label="Task options">
        <MoreHorizontal size={15} />
      </button>
    </div>
  );

  return (
    <div className="hb-screen">
      <div className="hb-page-head">
        <div className="hb-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CheckSquare size={18} color="#6ef27a" /> Tasks
        </div>
        <button type="button" className="hb-icon-btn" onClick={onOpenCalendar} aria-label="Open calendar">
          <CalendarDays size={17} />
        </button>
      </div>

      <div className="hb-tabs">
        <button type="button" className={`hb-tab ${tab === "timeline" ? "is-active" : ""}`} onClick={() => setTab("timeline")}>
          Timeline
        </button>
        <button type="button" className={`hb-tab ${tab === "all" ? "is-active" : ""}`} onClick={() => setTab("all")}>
          All Tasks
        </button>
      </div>

      {tab === "timeline" ? (
        <>
          <WeekStrip days={week} selected={selected} onSelect={setSelected} marks={new Set(tasks.filter((t) => t.date && t.completed).map((t) => t.date))} />

          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", margin: "0 2px 12px" }}>
            <strong style={{ fontSize: 13.5 }}>
              {selected === today ? "Today, " : ""}
              {longDate(new Date(`${selected}T12:00:00`))}
            </strong>
            <div style={{ display: "flex", gap: 6 }}>
              <button
                type="button"
                className="hb-icon-btn"
                style={{ width: 28, height: 28 }}
                onClick={() => setSelected(shiftISO(selected, -7))}
                aria-label="Previous week"
              >
                <ChevronLeft size={15} />
              </button>
              <button
                type="button"
                className="hb-icon-btn"
                style={{ width: 28, height: 28 }}
                onClick={() => setSelected(shiftISO(selected, 7))}
                aria-label="Next week"
              >
                <ChevronRight size={15} />
              </button>
            </div>
          </div>

          <div className="hb-timeline">
            {dayTasks.length === 0 ? (
              <div className="hb-empty" style={{ marginLeft: -62 }}>
                <strong>Nothing planned</strong>
                Your day is clear. Add a task to give it shape.
              </div>
            ) : (
              dayTasks.map((task) => <div key={task.id}>{renderTask(task)}</div>)
            )}
            <button type="button" className="hb-inline-add" onClick={() => onAddTask(selected)}>
              <Plus size={14} /> Add task
            </button>
          </div>

          <div className="hb-muted" style={{ fontSize: 11.5, marginTop: 14, textAlign: "center" }}>
            {doneCount}/{dayTasks.length} tasks complete
          </div>
        </>
      ) : (
        <>
          {groupedByDate.length === 0 && (
            <div className="hb-empty">
              <strong>No tasks yet</strong>
              Use the + button to plan your first task.
            </div>
          )}
          {groupedByDate.map(([date, rows]) => (
            <div key={date}>
              <div className="hb-task-day">
                {date === today ? "Today" : longDate(new Date(`${date}T12:00:00`))}
                <span>{shortISO(date)}</span>
                <button
                  type="button"
                  style={{ marginLeft: "auto", color: "#6ef27a", display: "grid", placeItems: "center" }}
                  onClick={() => onAddTask(date)}
                  aria-label={`Add task on ${date}`}
                >
                  <Plus size={16} />
                </button>
              </div>
              <div className="hb-timeline">{rows.map((task) => renderTask(task))}</div>
            </div>
          ))}
        </>
      )}

      {expanded && (
        <Sheet title="Task options" onClose={() => setExpanded(null)}>
          <div className="hb-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            {tasks.find((task) => task.id === expanded)?.title}
          </div>
          <button
            type="button"
            className="hb-btn-primary"
            onClick={() => {
              const task = tasks.find((row) => row.id === expanded);
              if (task) toggleTask(task);
              setExpanded(null);
            }}
          >
            Toggle complete
          </button>
          <button
            type="button"
            className="hb-btn-ghost"
            style={{ color: "#fa9179" }}
            onClick={() => {
              const id = expanded;
              setExpanded(null);
              void deleteTask(id);
            }}
          >
            Delete task
          </button>
        </Sheet>
      )}
    </div>
  );
};
