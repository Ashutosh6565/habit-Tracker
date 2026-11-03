import { useEffect, useRef, useState } from "react";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { todayISO } from "./date";
import { readLocal, writeLocal } from "./localStore";
import { quoteForDay } from "./quotes";

type QuotePrefs = { date: string; offset: number };

export const QuoteCard = ({ userId }: { userId: string }) => {
  const [today, setToday] = useState(todayISO());
  const [offset, setOffset] = useState(() => {
    const saved = readLocal<QuotePrefs>(userId, "quote");
    return saved?.date === todayISO() ? saved.offset : 0;
  });

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
  const reduced = useReducedMotion();

  const next = () => {
    const value = offset + 1;
    setOffset(value);
    writeLocal(userId, "quote", { date: today, offset: value } satisfies QuotePrefs);
  };

  return (
    <figure className={`hb-quote ${reduced ? "is-still" : ""}`}>
      <div className="hb-quote-rule" aria-hidden="true" />
      <div className="hb-quote-body">
        <div className="hb-quote-head">
          <span className="hb-kicker">Discipline · quote of the day</span>
          <motion.button
            type="button"
            className="hb-quote-next"
            onClick={next}
            aria-label="Show another quote"
            whileTap={reduced ? undefined : { rotate: -120, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 420, damping: 18 }}
          >
            <RefreshCw size={13} />
          </motion.button>
        </div>
        <AnimatePresence mode="wait" initial={false}>
          <motion.div
            key={quote.text}
            initial={reduced ? false : { opacity: 0, y: 10, filter: "blur(4px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            exit={reduced ? { opacity: 0 } : { opacity: 0, y: -8, filter: "blur(4px)" }}
            transition={{ duration: reduced ? 0 : 0.34, ease: [0.22, 1, 0.36, 1] }}
          >
            <blockquote>{quote.text}</blockquote>
            <figcaption>
              — {quote.author}
              <span>{quote.why}</span>
            </figcaption>
          </motion.div>
        </AnimatePresence>
      </div>
    </figure>
  );
};
