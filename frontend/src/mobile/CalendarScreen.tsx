import { Fragment, useMemo, useState } from "react";
import { CalendarDays, ChevronLeft, ChevronRight, Plus, Trash2 } from "lucide-react";
import { useMobileData } from "./useMobileData";
import {
  dayShort,
  heatmapGrid,
  longDate,
  monthCells,
  monthYear,
  shortISO,
  shiftMonth,
  timeLabel,
  toISO,
  todayISO,
} from "./date";
import { Sheet } from "./shared";

export const CalendarScreen = ({ onAddNote }: { onAddNote: (date: string) => void }) => {
  const { history, notes, deleteNote } = useMobileData();
  const [cursor, setCursor] = useState(new Date());
  const [selected, setSelected] = useState<string | null>(null);
  const [confirmNote, setConfirmNote] = useState<string | null>(null);

  const today = todayISO();
  const activity = useMemo(() => {
    const map = new Map<string, { done: number; total: number }>();
    history?.daily.forEach((row) => map.set(row.date, { done: row.completed, total: row.total }));
    return map;
  }, [history]);

  const cells = useMemo(() => monthCells(cursor), [cursor]);
  const heat = useMemo(() => heatmapGrid(20), []);

  const visibleNotes = (selected ? notes.filter((note) => note.date === selected) : notes).slice(0, 30);

  const level = (iso: string) => {
    const row = activity.get(iso);
    if (!row || row.total === 0 || row.done === 0) return "";
    const ratio = row.done / row.total;
    if (ratio >= 0.99) return "l4";
    if (ratio >= 0.66) return "l3";
    if (ratio >= 0.34) return "l2";
    return "l1";
  };

  return (
    <div className="hb-screen">
      <div className="hb-page-head">
        <div className="hb-title" style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <CalendarDays size={18} color="#6ef27a" /> Calendar & Notes
        </div>
        <button type="button" className="hb-icon-btn" onClick={() => onAddNote(selected || today)} aria-label="Add note">
          <Plus size={18} />
        </button>
      </div>

      <div className="hb-calendar-card">
        <div className="hb-cal-head">
          <button type="button" onClick={() => setCursor(shiftMonth(cursor, -1))} aria-label="Previous month">
            <ChevronLeft size={15} />
          </button>
          <strong>{monthYear(cursor)}</strong>
          <button type="button" onClick={() => setCursor(shiftMonth(cursor, 1))} aria-label="Next month">
            <ChevronRight size={15} />
          </button>
        </div>
        <div className="hb-cal-grid">
          {["M", "T", "W", "T", "F", "S", "S"].map((label, index) => (
            <span key={`${label}-${index}`} className="hb-cal-wd">
              {label}
            </span>
          ))}
          {cells.map(({ date, inMonth }) => {
            const iso = toISO(date);
            const done = activity.get(iso)?.done || 0;
            return (
              <button
                key={iso}
                type="button"
                className={`hb-cal-day ${inMonth ? "" : "is-dim"} ${iso === today ? "is-today" : ""} ${
                  selected === iso ? "is-selected" : ""
                }`}
                onClick={() => setSelected(selected === iso ? null : iso)}
              >
                {date.getDate()}
                {done > 0 && iso !== today ? <i /> : null}
              </button>
            );
          })}
        </div>
      </div>

      <div className="hb-panel">
        <div className="hb-panel-head">
          <CalendarDays size={14} />
          <h4>Activity heatmap</h4>
          <span style={{ fontSize: 10, color: "#5f6a62" }}>20 weeks</span>
        </div>
        <div className="hb-heat-grid" style={{ gridTemplateColumns: "24px repeat(20, 1fr)" }}>
          {heat[0].map((_, weekday) => (
            <Fragment key={`heat-row-${weekday}`}>
              <span style={{ fontSize: 7.5, color: "#5f6a62", textTransform: "uppercase" }}>{dayShort(heat[0][weekday])}</span>
              {heat.map((week) => {
                const date = week[weekday];
                const iso = toISO(date);
                return (
                  <span
                    key={iso}
                    className={`hb-heat-cell ${level(iso)}`}
                    title={`${shortISO(iso)} · ${activity.get(iso)?.done || 0} done`}
                  />
                );
              })}
            </Fragment>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: 4, marginTop: 10 }}>
          <span style={{ fontSize: 9, color: "#5f6a62", marginRight: 4 }}>Less</span>
          {["", "l1", "l2", "l3", "l4"].map((tone) => (
            <span key={tone || "none"} className={`hb-heat-cell ${tone}`} style={{ width: 10, height: 10, aspectRatio: "auto" }} />
          ))}
          <span style={{ fontSize: 9, color: "#5f6a62", marginLeft: 4 }}>More</span>
        </div>
      </div>

      <div className="hb-notes-head">
        <div>
          <div className="hb-kicker">Notes & timeline</div>
          <div style={{ fontSize: 12.5, marginTop: 3 }}>{selected ? longDate(new Date(`${selected}T12:00:00`)) : "Recent notes"}</div>
        </div>
        <button type="button" className="hb-chip is-active" onClick={() => onAddNote(selected || today)}>
          <Plus size={13} style={{ verticalAlign: "-2px" }} /> Add note
        </button>
      </div>

      {selected && (
        <button type="button" className="hb-chip" style={{ marginTop: 8 }} onClick={() => setSelected(null)}>
          Show all notes
        </button>
      )}

      {visibleNotes.length === 0 ? (
        <div className="hb-empty" style={{ marginTop: 12 }}>
          <strong>No notes {selected ? "on this day" : "yet"}</strong>
          Capture a thought, a win or a lesson from today.
        </div>
      ) : (
        visibleNotes.map((note) => (
          <div key={note.id} className="hb-note">
            <div className="hb-note-rail">
              <i />
              <span>{shortISO(note.date)}</span>
            </div>
            <div className="hb-note-body">
              <div className="hb-note-top">
                <strong>{note.date === today ? "Today" : dayShort(new Date(`${note.date}T12:00:00`))}</strong>
                <time>{timeLabel(note.time)}</time>
              </div>
              <div className="hb-note-text">{note.text}</div>
            </div>
            <button type="button" className="hb-note-del" onClick={() => setConfirmNote(note.id)} aria-label="Delete note">
              <Trash2 size={14} />
            </button>
          </div>
        ))
      )}

      {confirmNote && (
        <Sheet title="Delete this note?" onClose={() => setConfirmNote(null)}>
          <div className="hb-muted" style={{ fontSize: 13, lineHeight: 1.6 }}>
            This removes the note from your timeline on every device.
          </div>
          <button
            type="button"
            className="hb-btn-primary"
            style={{ background: "linear-gradient(150deg,#fb967c,#ef6849)", color: "#1a0905" }}
            onClick={() => {
              const id = confirmNote;
              setConfirmNote(null);
              void deleteNote(id);
            }}
          >
            Delete note
          </button>
          <button type="button" className="hb-btn-ghost" onClick={() => setConfirmNote(null)}>
            Keep it
          </button>
        </Sheet>
      )}
    </div>
  );
};
