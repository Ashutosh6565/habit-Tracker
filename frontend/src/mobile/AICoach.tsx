import { useRef, useState } from "react";
import { Check, Loader2, Plus, Sparkles, Wand2 } from "lucide-react";
import { api, type AiFocusArea, type AiRecommendationDto, type AiRecommendResponseDto } from "@/lib/api";
import { Sheet } from "./shared";
import { AI_FOCUS, localRecommendations } from "./templates";
import { useMobileData } from "./useMobileData";

const TIME_OPTIONS = [10, 20, 30, 60] as const;
const LEVELS = [
  { id: "new", label: "Starting out" },
  { id: "some", label: "Some rhythm" },
  { id: "consistent", label: "Consistent" },
] as const;

export const AICoachSheet = ({
  onClose,
  onBrowseTemplates,
}: {
  onClose: () => void;
  onBrowseTemplates: () => void;
}) => {
  const { templates, applyTemplate } = useMobileData();
  const [goal, setGoal] = useState("");
  const [focus, setFocus] = useState<Set<AiFocusArea>>(new Set());
  const focusRef = useRef(focus);
  const [minutes, setMinutes] = useState<(typeof TIME_OPTIONS)[number]>(20);
  const [level, setLevel] = useState<(typeof LEVELS)[number]["id"]>("some");
  const [status, setStatus] = useState<"idle" | "loading" | "done">("idle");
  const [result, setResult] = useState<AiRecommendResponseDto | null>(null);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState<string | null>(null);
  const [notice, setNotice] = useState<string | null>(null);

  const ready = goal.trim().length >= 2 || focus.size > 0;

  const toggleFocus = (id: AiFocusArea) => {
    const current = focusRef.current;
    if (!current.has(id) && current.size >= 3) {
      setNotice("Pick up to three focus areas.");
      return;
    }
    const next = new Set(current);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    focusRef.current = next;
    setFocus(next);
    setNotice(null);
  };

  const ask = async () => {
    if (!ready) {
      setNotice("Pick a focus or tell me your goal.");
      return;
    }
    setNotice(null);
    setStatus("loading");
    const input = {
      goal: goal.trim(),
      focusAreas: Array.from(focus),
      minutesPerDay: minutes,
      experience: level,
    };

    try {
      setResult(await api.ai.recommend(input));
    } catch {
      // Never dead-end: fall back to local matching on the catalog already on device.
      setResult(
        templates?.length
          ? localRecommendations(templates, input)
          : {
              source: "rules",
              summary: "Templates are still loading. Try again in a moment.",
              recommendations: [],
            }
      );
    } finally {
      setStatus("done");
    }
  };

  const add = async (recommendation: AiRecommendationDto) => {
    setApplying(recommendation.templateId);
    try {
      await applyTemplate(
        { name: recommendation.name, description: recommendation.description },
        recommendation.habits.map((habit) => ({ name: habit.name, icon: habit.icon }))
      );
      setAdded((current) => new Set(current).add(recommendation.templateId));
    } catch {
      setNotice("Could not add that routine. Try again.");
    } finally {
      setApplying(null);
    }
  };

  const reset = () => {
    setResult(null);
    setStatus("idle");
    setAdded(new Set());
    setNotice(null);
  };

  return (
    <Sheet title="Habit coach" onClose={onClose}>
      {!result ? (
        <>
          <div className="hb-coach-hero">
            <span className="hb-coach-orb">
              <Sparkles size={20} />
            </span>
            <div className="hb-coach-hero-copy">
              <strong>What are you working on?</strong>
              <span>Share your goal and I'll match a routine from 105 free templates.</span>
            </div>
          </div>

          <span className="hb-sheet-label">Your goal (optional)</span>
          <textarea
            className="hb-input hb-coach-goal"
            rows={2}
            maxLength={400}
            placeholder="e.g. I want to wake up early and study for exams"
            value={goal}
            onChange={(event) => {
              setGoal(event.target.value);
              setNotice(null);
            }}
          />

          <span className="hb-sheet-label">Focus</span>
          <div className="hb-focus-grid">
            {AI_FOCUS.map((entry) => {
              const on = focus.has(entry.id);
              return (
                <button
                  key={entry.id}
                  type="button"
                  className={`hb-focus ${on ? "is-on" : ""}`}
                  onClick={() => toggleFocus(entry.id)}
                  aria-pressed={on}
                >
                  <span>{entry.emoji}</span>
                  {entry.label}
                </button>
              );
            })}
          </div>

          <span className="hb-sheet-label">Time per day</span>
          <div className="hb-seg">
            {TIME_OPTIONS.map((value) => (
              <button
                key={value}
                type="button"
                className={minutes === value ? "is-on" : ""}
                onClick={() => setMinutes(value)}
              >
                {value} min
              </button>
            ))}
          </div>

          <span className="hb-sheet-label">Where you are</span>
          <div className="hb-seg">
            {LEVELS.map((entry) => (
              <button
                key={entry.id}
                type="button"
                className={level === entry.id ? "is-on" : ""}
                onClick={() => setLevel(entry.id)}
              >
                {entry.label}
              </button>
            ))}
          </div>

          {notice && <div className="hb-coach-notice">{notice}</div>}

          <button
            type="button"
            className="hb-btn-primary hb-coach-cta"
            disabled={status === "loading" || !ready}
            onClick={() => void ask()}
          >
            {status === "loading" ? (
              <>
                <Loader2 size={16} className="hb-spin" /> Reading 105 routines…
              </>
            ) : (
              <>
                <Wand2 size={16} /> Find my routine
              </>
            )}
          </button>

          {status === "loading" && (
            <div className="hb-rec-loading" aria-hidden="true">
              {[0, 1, 2].map((row) => (
                <div key={row} className="hb-rec-skeleton" style={{ animationDelay: `${row * 0.12}s` }} />
              ))}
            </div>
          )}

          <div className="hb-coach-privacy">Only your goal and preferences are used to pick a routine.</div>
        </>
      ) : (
        <>
          <div className="hb-coach-profile">
            <span>
              {focus.size
                ? AI_FOCUS.filter((entry) => focus.has(entry.id))
                    .map((entry) => `${entry.emoji} ${entry.label}`)
                    .join(" · ")
                : "Your goal"}
              <em> · {minutes} min a day</em>
            </span>
            <button type="button" className="hb-link" onClick={reset}>
              Change
            </button>
          </div>

          <p className="hb-coach-summary">{result.summary}</p>

          {result.recommendations.map((recommendation, index) => {
            const isAdded = added.has(recommendation.templateId);
            return (
              <div key={recommendation.templateId} className="hb-rec">
                <div className="hb-rec-top">
                  <span className="hb-rec-icon">{recommendation.habits[0]?.icon || "✨"}</span>
                  <div className="hb-rec-head">
                    <strong>{recommendation.name}</strong>
                    <span>{recommendation.habits.length} habits · free</span>
                  </div>
                  <span className="hb-rec-rank">{index + 1}</span>
                </div>
                <p className="hb-rec-reason">{recommendation.reason}</p>
                <div className="hb-rec-habits">
                  {recommendation.habits.slice(0, 4).map((habit) => (
                    <span key={habit.habitId} className="hb-rec-habit">
                      {habit.icon} {habit.name}
                    </span>
                  ))}
                  {recommendation.habits.length > 4 && (
                    <span className="hb-rec-habit">+{recommendation.habits.length - 4}</span>
                  )}
                </div>
                <button
                  type="button"
                  className={`hb-rec-add ${isAdded ? "is-added" : ""}`}
                  disabled={isAdded || applying === recommendation.templateId}
                  onClick={() => void add(recommendation)}
                >
                  {isAdded ? (
                    <>
                      <Check size={14} strokeWidth={3} /> Added to Today
                    </>
                  ) : applying === recommendation.templateId ? (
                    "Adding…"
                  ) : (
                    <>
                      <Plus size={14} strokeWidth={3} /> Add {recommendation.habits.length} habits
                    </>
                  )}
                </button>
              </div>
            );
          })}

          {result.recommendations.length === 0 && (
            <div className="hb-empty">
              <strong>The coach needs a moment</strong>
              Try again, or browse the full catalog below.
            </div>
          )}

          <div className="hb-coach-source">
            <Sparkles size={12} />
            {result.source === "gemini"
              ? "Personalised by Google Gemini"
              : "Matched to your goal and time"}
          </div>

          <button type="button" className="hb-btn-ghost" onClick={onBrowseTemplates}>
            Browse all templates
          </button>
          <button type="button" className="hb-btn-ghost" onClick={onClose}>
            Close
          </button>
        </>
      )}
    </Sheet>
  );
};
