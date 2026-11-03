import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { Quote, RefreshCw } from "lucide-react";
import { todayISO } from "@/mobile/date";
import { readLocal, writeLocal } from "@/mobile/localStore";
import { quoteForDay } from "@/mobile/quotes";

type QuotePrefs = { date: string; offset: number };

export const DisciplineQuote = ({
  userId = "guest",
  className = "",
  compact = false,
}: {
  userId?: string;
  className?: string;
  compact?: boolean;
}) => {
  const [today, setToday] = useState(todayISO());
  const [offset, setOffset] = useState(() => {
    const saved = readLocal<QuotePrefs>(userId, "quote");
    return saved?.date === todayISO() ? saved.offset : 0;
  });
  const reduced = useReducedMotion();

  useEffect(() => {
    const timer = window.setInterval(() => {
      const next = todayISO();
      setToday((current) => (current === next ? current : next));
    }, 60_000);
    return () => window.clearInterval(timer);
  }, []);

  const dayRef = useRef(today);

  useEffect(() => {
    if (dayRef.current === today) return;
    dayRef.current = today;
    setOffset(0);
    writeLocal(userId, "quote", { date: today, offset: 0 } satisfies QuotePrefs);
  }, [today, userId]);

  const quote = quoteForDay(today, offset);

  const next = () => {
    const value = offset + 1;
    setOffset(value);
    writeLocal(userId, "quote", { date: today, offset: value } satisfies QuotePrefs);
  };

  return (
    <figure
      className={`web-quote relative overflow-hidden rounded-2xl border border-border/70 bg-card/80 p-6 backdrop-blur-sm ${className}`}
    >
      <div aria-hidden className="web-quote-glow" />
      <div className="relative flex items-center justify-between gap-3">
        <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.14em] text-primary">
          <span className="web-live-dot" />
          Discipline · quote of the day
        </span>
        <button
          type="button"
          onClick={next}
          className="flex h-8 w-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:text-primary"
          aria-label="Show another quote"
          title="Another quote"
        >
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      <AnimatePresence mode="wait" initial={false}>
        <motion.div
          key={quote.text}
          initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
          exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
          transition={{ duration: reduced ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
        >
          <Quote className="mt-5 h-5 w-5 text-primary/60" aria-hidden />
          <blockquote
            className={`mt-3 font-display font-semibold leading-[1.25] text-foreground ${
              compact ? "text-xl" : "text-2xl sm:text-[1.7rem]"
            }`}
          >
            {quote.text}
          </blockquote>
          <figcaption className="mt-4 text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">— {quote.author}</span>
            <span className="mt-1 block leading-relaxed">{quote.why}</span>
          </figcaption>
        </motion.div>
      </AnimatePresence>
    </figure>
  );
};

export default DisciplineQuote;
