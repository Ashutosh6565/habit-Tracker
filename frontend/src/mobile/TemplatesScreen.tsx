import { useEffect, useMemo, useRef, useState } from "react";
import { ArrowLeft, Check, ChevronRight, Search, Sparkles } from "lucide-react";
import type { TemplateCatalogDto } from "@/lib/api";
import { useMobileData } from "./useMobileData";
import { Loading, Sheet } from "./shared";
import { matchesTemplate, templateCategory, templateEmoji } from "./templates";

const PAGE_SIZE = 24;

export const TemplatesScreen = ({
  onBack,
  initialTemplateId,
}: {
  onBack: () => void;
  initialTemplateId?: string | null;
}) => {
  const { templates, applyTemplate } = useMobileData();
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("All");
  const [visible, setVisible] = useState(PAGE_SIZE);
  const [selected, setSelected] = useState<TemplateCatalogDto | null>(null);
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [added, setAdded] = useState<Set<string>>(new Set());
  const openedInitial = useRef(false);

  const categories = useMemo(() => {
    const values = new Set((templates || []).map((template) => templateCategory(template)));
    return ["All", ...Array.from(values).sort()];
  }, [templates]);

  const filtered = useMemo(
    () =>
      (templates || []).filter(
        (template) =>
          (category === "All" || templateCategory(template) === category) && matchesTemplate(template, search)
      ),
    [templates, category, search]
  );

  const openTemplate = (template: TemplateCatalogDto) => {
    setSelected(template);
    setPicked(new Set(template.habits.map((habit) => habit.name)));
  };

  useEffect(() => {
    if (openedInitial.current || !initialTemplateId || !templates?.length) return;
    const match = templates.find((template) => template.templateId === initialTemplateId);
    if (match) {
      openedInitial.current = true;
      openTemplate(match);
    }
  }, [initialTemplateId, templates]);

  const toggleHabit = (name: string) => {
    setPicked((current) => {
      const next = new Set(current);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  };

  const addPicked = async () => {
    if (!selected || picked.size === 0) return;
    setBusy(true);
    try {
      const habits = selected.habits.filter((habit) => picked.has(habit.name));
      await applyTemplate(selected, habits);
      setAdded((current) => new Set(current).add(selected.templateId));
      setSelected(null);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="hb-screen">
      <div className="hb-page-head">
        <button type="button" className="hb-icon-btn" onClick={onBack} aria-label="Back to today">
          <ArrowLeft size={18} />
        </button>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div className="hb-title">Templates</div>
          <div className="hb-subgreeting">Proven routines, ready in one tap</div>
        </div>
        <span className="hb-tpl-count">{templates?.length || 105} free</span>
      </div>

      <div className="hb-search">
        <Search size={16} />
        <input
          className="hb-search-input"
          placeholder="Search 105 templates…"
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setVisible(PAGE_SIZE);
          }}
        />
      </div>

      <div className="hb-chips" style={{ paddingBottom: 12 }}>
        {categories.map((item) => (
          <button
            key={item}
            type="button"
            className={`hb-chip ${category === item ? "is-active" : ""}`}
            onClick={() => {
              setCategory(item);
              setVisible(PAGE_SIZE);
            }}
          >
            {item}
          </button>
        ))}
      </div>

      {!templates ? (
        <Loading label="Loading templates" />
      ) : filtered.length === 0 ? (
        <div className="hb-empty">
          <strong>No templates match</strong>
          Try another word, or clear the category filter.
        </div>
      ) : (
        <>
          {filtered.slice(0, visible).map((template) => (
            <button key={template.templateId} type="button" className="hb-tpl" onClick={() => openTemplate(template)}>
              <span className="hb-tpl-icon">{templateEmoji(template)}</span>
              <span className="hb-tpl-body">
                <span className="hb-tpl-top">
                  <strong>{template.name}</strong>
                  <span className="hb-tpl-tag">{templateCategory(template)}</span>
                </span>
                <span className="hb-tpl-desc">{template.description}</span>
                <span className="hb-tpl-habits">
                  {template.habits.slice(0, 3).map((habit) => (
                    <span key={habit.habitId} className="hb-tpl-habit">
                      {habit.icon} {habit.name}
                    </span>
                  ))}
                  {template.habits.length > 3 && (
                    <span className="hb-tpl-habit">+{template.habits.length - 3}</span>
                  )}
                </span>
                <span className={`hb-tpl-cta ${added.has(template.templateId) ? "is-added" : ""}`}>
                  {added.has(template.templateId) ? (
                    <>
                      <Check size={13} /> Added to your tracker
                    </>
                  ) : (
                    <>
                      Add {template.habits.length} habits <ChevronRight size={13} />
                    </>
                  )}
                </span>
              </span>
            </button>
          ))}

          {visible < filtered.length && (
            <button type="button" className="hb-btn-ghost" onClick={() => setVisible((count) => count + PAGE_SIZE)}>
              Show {Math.min(PAGE_SIZE, filtered.length - visible)} more
            </button>
          )}

          <div className="hb-tpl-foot">
            <Sparkles size={13} /> Every template is free — mix habits from several routines.
          </div>
        </>
      )}

      {selected && (
        <Sheet title={selected.name} onClose={() => setSelected(null)}>
          <div className="hb-tpl-sheet-head">
            <span className="hb-tpl-icon">{templateEmoji(selected)}</span>
            <div style={{ flex: 1, minWidth: 0 }}>
              <div className="hb-tpl-desc" style={{ WebkitLineClamp: 3 }}>
                {selected.description}
              </div>
              <div className="hb-tpl-sheet-meta">
                {selected.habits.length} habits · {templateCategory(selected)} · Free
              </div>
            </div>
          </div>

          <div className="hb-pick-head">
            <span className="hb-sheet-label" style={{ margin: 0 }}>
              Habits to add
            </span>
            <button
              type="button"
              className="hb-link"
              onClick={() =>
                setPicked(
                  picked.size === selected.habits.length
                    ? new Set()
                    : new Set(selected.habits.map((habit) => habit.name))
                )
              }
            >
              {picked.size === selected.habits.length ? "Clear all" : "Select all"}
            </button>
          </div>

          {selected.habits.map((habit) => {
            const on = picked.has(habit.name);
            return (
              <button
                key={habit.habitId}
                type="button"
                className={`hb-pick ${on ? "is-on" : ""}`}
                onClick={() => toggleHabit(habit.name)}
              >
                <span className="hb-pick-icon">{habit.icon}</span>
                <span className="hb-pick-name">{habit.name}</span>
                <span className="hb-pick-box">
                  <Check size={13} strokeWidth={3} />
                </span>
              </button>
            );
          })}

          <button
            type="button"
            className="hb-btn-primary"
            disabled={busy || picked.size === 0}
            onClick={() => void addPicked()}
          >
            {busy ? "Adding…" : `Add ${picked.size} ${picked.size === 1 ? "habit" : "habits"} to Today`}
          </button>
          <button type="button" className="hb-btn-ghost" onClick={() => setSelected(null)}>
            Cancel
          </button>
        </Sheet>
      )}
    </div>
  );
};
