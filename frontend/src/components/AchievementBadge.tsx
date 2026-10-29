import { motion } from "framer-motion";
import { LucideIcon } from "lucide-react";

interface AchievementBadgeProps {
  title: string;
  description: string;
  icon: LucideIcon;
  unlocked: boolean;
  xpReward: number;
}

const AchievementBadge = ({ title, description, icon: Icon, unlocked, xpReward }: AchievementBadgeProps) => (
  <motion.div
    whileHover={{ scale: 1.05 }}
    className={`p-4 rounded-xl border text-center transition-all ${
      unlocked
        ? "bg-card border-primary/30 shadow-lg shadow-primary/10"
        : "bg-secondary/50 border-border opacity-50 grayscale"
    }`}
  >
    <div className={`w-14 h-14 rounded-2xl mx-auto mb-3 flex items-center justify-center ${
      unlocked ? "gradient-primary" : "bg-muted"
    }`}>
      <Icon className={`w-7 h-7 ${unlocked ? "text-primary-foreground" : "text-muted-foreground"}`} />
    </div>
    <h4 className="font-display font-semibold text-sm text-foreground">{title}</h4>
    <p className="text-xs text-muted-foreground mt-1">{description}</p>
    <span className="inline-block mt-2 text-xs font-semibold text-xp">+{xpReward} XP</span>
  </motion.div>
);

export default AchievementBadge;
