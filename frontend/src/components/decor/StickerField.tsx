import {
  BookOpen,
  Coffee,
  Dumbbell,
  Footprints,
  GlassWater,
  HeartPulse,
  NotebookPen,
  Target,
  Timer,
  Trophy,
  Zap,
  type LucideIcon,
} from "lucide-react";

type IconSticker = {
  kind: "icon";
  icon: LucideIcon;
  className: string;
  rotate: string;
  delay?: string;
  size?: "sm" | "md" | "lg";
  opacity?: string;
};

type TextSticker = {
  kind: "text";
  text: string;
  sub?: string;
  className: string;
  rotate: string;
  delay?: string;
  opacity?: string;
};

type TimetableSticker = {
  kind: "timetable";
  className: string;
  rotate: string;
  delay?: string;
  opacity?: string;
};

type Sticker = IconSticker | TextSticker | TimetableSticker;

const heroStickers: Sticker[] = [
  { kind: "icon", icon: Dumbbell, className: "left-[2%] top-[22%] hidden md:block", rotate: "-12deg", delay: "0s", size: "lg" },
  { kind: "icon", icon: Timer, className: "right-[3%] top-[16%] hidden lg:block", rotate: "9deg", delay: "0.8s", size: "md" },
  { kind: "icon", icon: Trophy, className: "right-[7%] bottom-[16%] hidden md:block", rotate: "-8deg", delay: "1.4s", size: "md" },
  { kind: "icon", icon: GlassWater, className: "left-[7%] bottom-[13%] hidden lg:block", rotate: "7deg", delay: "0.4s", size: "sm" },
  { kind: "icon", icon: BookOpen, className: "left-[27%] top-[13%] hidden 2xl:block", rotate: "-6deg", delay: "1.1s", size: "sm" },
  { kind: "icon", icon: Footprints, className: "right-[26%] bottom-[7%] hidden xl:block", rotate: "12deg", delay: "0.6s", size: "sm" },
  { kind: "text", text: "6:00 AM · Leg day", sub: "Gym · 45 min", className: "right-[1%] top-[38%] hidden xl:block", rotate: "5deg", delay: "0.2s" },
  { kind: "text", text: "Day 47 ✓", sub: "No zero days", className: "left-[1%] bottom-[34%] hidden lg:block", rotate: "-6deg", delay: "1s" },
  { kind: "text", text: "One more rep", sub: "Discipline > motivation", className: "right-[5%] bottom-[4%] hidden xl:block", rotate: "3deg", delay: "1.6s" },
  { kind: "timetable", className: "left-[1%] top-[52%] hidden 2xl:block", rotate: "-5deg", delay: "0.5s", opacity: "opacity-80" },
  { kind: "icon", icon: Dumbbell, className: "right-[4%] top-[9%] block md:hidden", rotate: "-10deg", delay: "0.4s", size: "sm", opacity: "opacity-25" },
];

const ambientStickers: Sticker[] = [
  { kind: "icon", icon: Dumbbell, className: "left-[3%] top-[18%] hidden xl:block", rotate: "-14deg", size: "sm", opacity: "opacity-40", delay: "0.2s" },
  { kind: "icon", icon: Target, className: "right-[4%] top-[24%] hidden xl:block", rotate: "10deg", size: "sm", opacity: "opacity-35", delay: "1s" },
  { kind: "icon", icon: Coffee, className: "left-[5%] bottom-[16%] hidden lg:block", rotate: "8deg", size: "sm", opacity: "opacity-30", delay: "0.6s" },
  { kind: "icon", icon: HeartPulse, className: "right-[6%] bottom-[12%] hidden lg:block", rotate: "-7deg", size: "sm", opacity: "opacity-30", delay: "1.4s" },
  { kind: "icon", icon: NotebookPen, className: "left-[46%] top-[6%] hidden 2xl:block", rotate: "-4deg", size: "sm", opacity: "opacity-25", delay: "0.9s" },
  { kind: "icon", icon: Zap, className: "right-[40%] bottom-[5%] hidden 2xl:block", rotate: "12deg", size: "sm", opacity: "opacity-25", delay: "0.3s" },
  { kind: "icon", icon: Timer, className: "right-[3%] top-[42%] block md:hidden", rotate: "8deg", size: "sm", opacity: "opacity-20", delay: "1.2s" },
];

const sizeMap = {
  sm: { box: "h-10 w-10 rounded-xl", icon: "h-5 w-5" },
  md: { box: "h-12 w-12 rounded-2xl", icon: "h-6 w-6" },
  lg: { box: "h-16 w-16 rounded-3xl", icon: "h-8 w-8" },
};

function StickerNode({ sticker }: { sticker: Sticker }) {
  if (sticker.kind === "icon") {
    const { box, icon } = sizeMap[sticker.size ?? "md"];
    return (
      <div
        className={`sticker-card flex items-center justify-center ${box} ${sticker.opacity ?? "opacity-80"}`}
        style={{ animationDelay: sticker.delay }}
      >
        <sticker.icon className={`${icon} text-primary`} strokeWidth={1.6} />
      </div>
    );
  }

  if (sticker.kind === "timetable") {
    return (
      <div className={`sticker-card w-40 p-3.5 ${sticker.opacity ?? "opacity-90"}`}>
        <p className="text-[10px] font-bold uppercase tracking-[0.18em] text-muted-foreground">Today</p>
        <div className="mt-2 space-y-1.5">
          {[
            ["06:00", "Gym"],
            ["07:30", "Deep work"],
            ["13:00", "Walk"],
            ["22:00", "Read"],
          ].map(([time, label]) => (
            <div key={time} className="flex items-center justify-between text-[11px]">
              <span className="font-mono text-muted-foreground">{time}</span>
              <span className="font-semibold text-foreground">{label}</span>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`sticker-card px-3.5 py-2.5 ${sticker.opacity ?? "opacity-90"}`}>
      <p className="text-xs font-bold text-foreground">{sticker.text}</p>
      {sticker.sub && <p className="text-[10px] text-muted-foreground">{sticker.sub}</p>}
    </div>
  );
}

type StickerFieldProps = {
  variant?: "hero" | "ambient";
  position?: "absolute" | "fixed";
  className?: string;
};

export default function StickerField({ variant = "hero", position = "absolute", className = "" }: StickerFieldProps) {
  const stickers = variant === "hero" ? heroStickers : ambientStickers;
  const base = variant === "hero" ? "" : "opacity-70";

  return (
    <div aria-hidden className={`pointer-events-none ${position} inset-0 overflow-hidden ${className}`}>
      {stickers.map((sticker, index) => (
        <div
          key={`${sticker.kind}-${index}`}
          className={`absolute ${sticker.className} ${base}`}
          style={{ transform: `rotate(${sticker.rotate})` }}
        >
          <div className="animate-float-slow" style={{ animationDelay: sticker.delay }}>
            <StickerNode sticker={sticker} />
          </div>
        </div>
      ))}
    </div>
  );
}
