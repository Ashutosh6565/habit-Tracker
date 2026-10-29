import { useMemo, useState } from "react";
import { Activity, BarChart3, Clock, Flame, Sparkles, Trophy, TrendingUp } from "lucide-react";
import { useMobileData } from "./useMobileData";
import { hourLabel, shiftISO, shortISO, todayISO } from "./date";
import { Loading } from "./shared";

type Tab = "overview" | "habits" | "time" | "trends";
type Range = 7 | 30 | 90;

const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

const LineChart = ({ points, labels }: { points: { label: string; value: number }[]; labels: string[] }) => {
  const width = 320;
  const height = 132;
  const max = Math.max(1, ...points.map((point) => point.value));
  const step = points.length > 1 ? width / (points.length - 1) : width;
  const coords = points.map((point, index) => ({
    x: index * step,
    y: height - (point.value / max) * (height - 18) - 4,
  }));
  const line = coords.map((point) => `${point.x.toFixed(1)},${point.y.toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <>
      <div className="hb-chart">
        <svg viewBox={`0 0 ${width} ${height}`} preserveAspectRatio="none" aria-hidden="true">
          <defs>
            <linearGradient id="hb-area" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5dea6b" stopOpacity="0.34" />
              <stop offset="100%" stopColor="#5dea6b" stopOpacity="0" />
            </linearGradient>
          </defs>
          {[0.25, 0.5, 0.75].map((ratio) => (
            <line
              key={ratio}
              x1="0"
              x2={width}
              y1={height * ratio}
              y2={height * ratio}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="1"
            />
          ))}
          <polygon points={area} fill="url(#hb-area)" />
          <polyline
            points={line}
            fill="none"
            stroke="#5dea6b"
            strokeWidth="2.4"
            strokeLinecap="round"
            strokeLinejoin="round"
            style={{ filter: "drop-shadow(0 0 6px rgba(93,234,107,.45))" }}
          />
          {coords.length > 0 && (
            <circle cx={coords[coords.length - 1].x} cy={coords[coords.length - 1].y} r="4" fill="#5dea6b" />
          )}
        </svg>
      </div>
      <div className="hb-chart-labels">
        {labels.map((label) => (
          <span key={label}>{label}</span>
        ))}
      </div>
    </>
  );
};

export const AnalyticsScreen = () => {
  const { summary, history, analytics, time, isLoading } = useMobileData();
  const [tab, setTab] = useState<Tab>("overview");
  const [range, setRange] = useState<Range>(30);

  const entries = time?.entries || [];
  const today = todayISO();
  const totalHours = entries.reduce((sum, entry) => sum + entry.hours, 0);
  const currentStreak = Math.max(0, ...(summary?.habits || []).map((habit) => habit.streak));

  const hoursSeries = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((entry) => map.set(entry.date, (map.get(entry.date) || 0) + entry.hours));
    return Array.from({ length: range }, (_, index) => {
      const iso = shiftISO(today, index - (range - 1));
      return { label: iso, value: map.get(iso) || 0 };
    });
  }, [entries, range, today]);

  const thisWeekHours = entries
    .filter((entry) => entry.date >= shiftISO(today, -6))
    .reduce((sum, entry) => sum + entry.hours, 0);
  const lastWeekHours = entries
    .filter((entry) => entry.date >= shiftISO(today, -13) && entry.date <= shiftISO(today, -7))
    .reduce((sum, entry) => sum + entry.hours, 0);
  const weekDelta = lastWeekHours ? Math.round(((thisWeekHours - lastWeekHours) / lastWeekHours) * 100) : thisWeekHours ? 100 : 0;

  const productiveDay = useMemo(() => {
    const buckets = new Map<number, { done: number; total: number }>();
    history?.daily.forEach((row) => {
      const weekday = new Date(`${row.date}T12:00:00`).getDay();
      const bucket = buckets.get(weekday) || { done: 0, total: 0 };
      bucket.done += row.completed;
      bucket.total += row.total;
      buckets.set(weekday, bucket);
    });
    let best = { day: "—", rate: 0 };
    buckets.forEach((bucket, weekday) => {
      const rate = bucket.total ? bucket.done / bucket.total : 0;
      if (rate > best.rate) best = { day: WEEKDAYS[weekday], rate: Math.round(rate * 100) };
    });
    return best;
  }, [history]);

  const bestHabit = [...(summary?.habits || [])].sort((a, b) => b.streak - a.streak)[0];

  const labelTotals = useMemo(() => {
    const map = new Map<string, number>();
    entries.forEach((entry) => map.set(entry.label, (map.get(entry.label) || 0) + entry.hours));
    return Array.from(map.entries()).sort((a, b) => b[1] - a[1]);
  }, [entries]);

  const chartLabels = [hoursSeries[0], hoursSeries[Math.floor(hoursSeries.length / 3)], hoursSeries[Math.floor((hoursSeries.length * 2) / 3)], hoursSeries[hoursSeries.length - 1]]
    .filter(Boolean)
    .map((point) => shortISO(point.label));

  if (isLoading) return <Loading label="Crunching your numbers" />;

  return (
    <div className="hb-screen">
      <div className="hb-page-head">
        <div className="hb-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <BarChart3 size={18} color="#6ef27a" /> Analytics
        </div>
        <span className="hb-select">Last {range} days</span>
      </div>

      <div className="hb-tabs">
        {(
          [
            ["overview", "Overview"],
            ["habits", "Habits"],
            ["time", "Time"],
            ["trends", "Trends"],
          ] as [Tab, string][]
        ).map(([value, label]) => (
          <button key={value} type="button" className={`hb-tab ${tab === value ? "is-active" : ""}`} onClick={() => setTab(value)}>
            {label}
          </button>
        ))}
      </div>

      {tab === "overview" && (
        <>
          <div className="hb-stat-row">
            <div className="hb-stat">
              <div className="hb-stat-icon" style={{ background: "rgba(249,124,93,.14)", color: "#fa9179" }}>
                <Flame size={14} />
              </div>
              <strong>{currentStreak}</strong>
              <span>Current streak</span>
            </div>
            <div className="hb-stat">
              <div className="hb-stat-icon" style={{ background: "rgba(247,200,105,.14)", color: "#f7c869" }}>
                <Trophy size={14} />
              </div>
              <strong>{summary?.stats.bestStreak || 0}</strong>
              <span>Best streak</span>
            </div>
            <div className="hb-stat">
              <div className="hb-stat-icon" style={{ background: "rgba(93,234,107,.14)", color: "#6ef27a" }}>
                <Clock size={14} />
              </div>
              <strong>{totalHours.toFixed(1)}h</strong>
              <span>Total hours</span>
            </div>
          </div>

          <div className="hb-panel">
            <div className="hb-panel-head">
              <Clock size={14} />
              <h4>Hours per day</h4>
              <div style={{ display: "flex", gap: 4 }}>
                {([7, 30, 90] as Range[]).map((value) => (
                  <button
                    key={value}
                    type="button"
                    className={`hb-chip ${range === value ? "is-active" : ""}`}
                    style={{ padding: "4px 9px", fontSize: 10 }}
                    onClick={() => setRange(value)}
                  >
                    {value}D
                  </button>
                ))}
              </div>
            </div>
            <LineChart points={hoursSeries} labels={chartLabels} />
          </div>

          <div className="hb-panel">
            <div className="hb-panel-head">
              <Sparkles size={14} />
              <h4>Insights</h4>
            </div>
            <div className="hb-insight">
              <div className="hb-insight-icon" style={{ background: "rgba(93,234,107,.13)", color: "#6ef27a" }}>
                <TrendingUp size={15} />
              </div>
              <div>
                <strong>{weekDelta >= 0 ? "Great progress!" : "Room to grow"}</strong>
                <span>
                  You logged {thisWeekHours.toFixed(1)}h this week, {weekDelta >= 0 ? "up" : "down"} {Math.abs(weekDelta)}% vs last
                  week.
                </span>
              </div>
            </div>
            <div className="hb-insight">
              <div className="hb-insight-icon" style={{ background: "rgba(249,124,93,.14)", color: "#fa9179" }}>
                <Flame size={15} />
              </div>
              <div>
                <strong>{currentStreak > 0 ? "On fire" : "Light the flame"}</strong>
                <span>
                  {currentStreak > 0
                    ? `You are on a ${currentStreak}-day streak. Keep it going.`
                    : "Complete a habit today to start a fresh streak."}
                </span>
              </div>
            </div>
            <div className="hb-insight">
              <div className="hb-insight-icon" style={{ background: "rgba(79,139,248,.14)", color: "#6fa4fa" }}>
                <Activity size={15} />
              </div>
              <div>
                <strong>Most productive day</strong>
                <span>
                  {productiveDay.day} is your best day ({productiveDay.rate}% completion on average).
                  {bestHabit ? ` ${bestHabit.title} leads with a ${bestHabit.streak}-day streak.` : ""}
                </span>
              </div>
            </div>
          </div>
        </>
      )}

      {tab === "habits" && (
        <div className="hb-panel">
          <div className="hb-panel-head">
            <Flame size={14} />
            <h4>Habit consistency · 30 days</h4>
          </div>
          {(summary?.habits || []).map((habit) => {
            const rows = history?.habits.find((row) => row.id === habit.id)?.dates || [];
            const recent = rows.filter((date) => date >= shiftISO(today, -29)).length;
            const rate = Math.min(100, Math.round((recent / 30) * 100));
            return (
              <div key={habit.id} style={{ padding: "10px 0", borderBottom: "1px solid rgba(255,255,255,.05)" }}>
                <div style={{ display: "flex", alignItems: "center", gap: 9 }}>
                  <span style={{ fontSize: 16 }}>{habit.icon}</span>
                  <span style={{ flex: 1, fontSize: 13, fontWeight: 500 }}>{habit.title}</span>
                  <span style={{ fontSize: 11, color: "#87918a" }}>{habit.streak}d streak</span>
                  <strong style={{ fontSize: 12, color: "#6ef27a", width: 38, textAlign: "right" }}>{rate}%</strong>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.06)", marginTop: 8 }}>
                  <div
                    style={{
                      width: `${rate}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg,#2cb843,#8bf88f)",
                    }}
                  />
                </div>
              </div>
            );
          })}
          {(summary?.habits || []).length === 0 && (
            <div className="hb-muted" style={{ fontSize: 12 }}>
              Add a habit to see consistency here.
            </div>
          )}
        </div>
      )}

      {tab === "time" && (
        <>
          <div className="hb-panel">
            <div className="hb-panel-head">
              <Clock size={14} />
              <h4>Where your hours go</h4>
            </div>
            {labelTotals.length === 0 && (
              <div className="hb-muted" style={{ fontSize: 12 }}>
                Log time in the tracker to see a breakdown.
              </div>
            )}
            {labelTotals.map(([label, hours]) => (
              <div key={label} style={{ padding: "9px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>{label}</span>
                  <span style={{ color: "#a68bfa" }}>{hours.toFixed(1)}h</span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.06)", marginTop: 7 }}>
                  <div
                    style={{
                      width: `${Math.min(100, (hours / Math.max(1, labelTotals[0][1])) * 100)}%`,
                      height: "100%",
                      borderRadius: 999,
                      background: "linear-gradient(90deg,#6244d6,#a58af8)",
                    }}
                  />
                </div>
              </div>
            ))}
          </div>

          <div className="hb-panel">
            <div className="hb-panel-head">
              <Activity size={14} />
              <h4>Recent blocks</h4>
            </div>
            {[...entries]
              .sort((a, b) => (a.date < b.date ? 1 : a.date > b.date ? -1 : b.slot - a.slot))
              .slice(0, 8)
              .map((entry) => (
                <div key={entry.id} className="hb-insight">
                  <div className="hb-insight-icon" style={{ background: "rgba(139,108,246,.15)", color: "#a68bfa", fontSize: 10, fontWeight: 700 }}>
                    {entry.hours}h
                  </div>
                  <div>
                    <strong>
                      {entry.label} · {hourLabel(entry.slot)}
                    </strong>
                    <span>{shortISO(entry.date)}</span>
                  </div>
                </div>
              ))}
            {entries.length === 0 && (
              <div className="hb-muted" style={{ fontSize: 12 }}>
                No time blocks yet.
              </div>
            )}
          </div>
        </>
      )}

      {tab === "trends" && (
        <>
          <div className="hb-panel">
            <div className="hb-panel-head">
              <BarChart3 size={14} />
              <h4>Completion by category</h4>
            </div>
            {(analytics?.categoryBreakdown || []).map((row) => (
              <div key={row.name} style={{ padding: "9px 0" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                  <span>{row.name}</span>
                  <span style={{ color: "#6ef27a" }}>
                    {row.rate}% · {row.completed}/{row.total}
                  </span>
                </div>
                <div style={{ height: 5, borderRadius: 999, background: "rgba(255,255,255,.06)", marginTop: 7 }}>
                  <div
                    style={{ width: `${Math.min(100, row.rate)}%`, height: "100%", borderRadius: 999, background: "linear-gradient(90deg,#2cb843,#8bf88f)" }}
                  />
                </div>
              </div>
            ))}
            {(analytics?.categoryBreakdown || []).length === 0 && (
              <div className="hb-muted" style={{ fontSize: 12 }}>
                Your categories will appear here once you log check-ins.
              </div>
            )}
          </div>

          <div className="hb-panel">
            <div className="hb-panel-head">
              <TrendingUp size={14} />
              <h4>Daily check-ins · 14 days</h4>
            </div>
            <div className="hb-bars" style={{ height: 64, gap: 6 }}>
              {(analytics?.dailyTrend || []).slice(-14).map((row) => (
                <span
                  key={row.date}
                  style={{ flex: 1, width: "auto", height: `${Math.max(8, (row.completed / Math.max(1, row.total)) * 100)}%` }}
                />
              ))}
            </div>
          </div>
        </>
      )}
    </div>
  );
};
