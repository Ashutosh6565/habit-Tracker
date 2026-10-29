import { motion } from "framer-motion";
import { Check, Flame } from "lucide-react";

interface HabitCardProps {
  title: string;
  streak: number;
  completed: boolean;
  xp: number;
  difficulty: "easy" | "medium" | "hard";
  onToggle: () => void;
}

const difficultyColors = {
  easy: "bg-success/10 text-success",
  medium: "bg-accent/10 text-accent",
  hard: "bg-destructive/10 text-destructive",
};

const HabitCard = ({ title, streak, completed, xp, difficulty, onToggle }: HabitCardProps) => (
  <motion.div
    layout
    whileHover={{ scale: 1.02 }}
    whileTap={{ scale: 0.98 }}
    className={`p-4 rounded-xl border transition-all cursor-pointer ${
      completed
        ? "bg-success/5 border-success/30"
        : "bg-card border-border hover:border-primary/30"
    }`}
    onClick={onToggle}
  >
    <div className="flex items-center gap-3">
      <div
        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all ${
          completed ? "gradient-primary" : "bg-secondary"
        }`}
      >
        {completed ? (
          <Check className="w-5 h-5 text-primary-foreground" />
        ) : (
          <div className="w-3 h-3 rounded-full bg-muted-foreground/30" />
        )}
      </div>
      <div className="flex-1">
        <h3 className={`font-medium text-sm ${completed ? "line-through text-muted-foreground" : "text-foreground"}`}>
          {title}
        </h3>
        <div className="flex items-center gap-2 mt-1">
          <span className={`text-xs px-2 py-0.5 rounded-full ${difficultyColors[difficulty]}`}>
            {difficulty}
          </span>
          <span className="text-xs text-muted-foreground">+{xp} XP</span>
        </div>
      </div>
      {streak > 0 && (
        <div className="flex items-center gap-1 px-2 py-1 rounded-lg bg-streak/10">
          <Flame className="w-3 h-3 text-streak" />
          <span className="text-xs font-semibold text-streak">{streak}</span>
        </div>
      )}
    </div>
  </motion.div>
);

export default HabitCard;
