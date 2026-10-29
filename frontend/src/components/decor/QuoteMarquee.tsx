import { Quote, Sparkles } from "lucide-react";

const quotes = [
  "Discipline beats motivation.",
  "No zero days.",
  "Small reps, unfair momentum.",
  "Show up before you feel ready.",
  "The calendar doesn't lie.",
  "One more rep. One more page.",
  "Consistency is a flex.",
  "Sleep is part of the program.",
];

export default function QuoteMarquee() {
  const loop = [...quotes, ...quotes];

  return (
    <section aria-label="Motivation" className="relative border-y border-border/60 bg-card/40 py-4 backdrop-blur-sm">
      <div className="marquee-mask overflow-hidden">
        <div className="marquee-track gap-3 pr-3">
          {loop.map((quote, index) => (
            <span
              key={`${quote}-${index}`}
              className="sticker-chip shrink-0 text-muted-foreground"
              aria-hidden={index >= quotes.length}
            >
              {index % 3 === 0 ? (
                <Sparkles className="h-3.5 w-3.5 text-streak" />
              ) : (
                <Quote className="h-3.5 w-3.5 text-primary" />
              )}
              {quote}
            </span>
          ))}
        </div>
      </div>
    </section>
  );
}
