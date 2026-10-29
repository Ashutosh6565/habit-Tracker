import { LucideIcon } from "lucide-react";
import { motion } from "framer-motion";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  trend?: string;
  variant?: "default" | "primary" | "xp" | "streak";
}

const variantStyles = {
  default: "bg-card border-border",
  primary: "bg-success/5 border-success/20",
  xp: "bg-xp/5 border-xp/20",
  streak: "bg-streak/5 border-streak/20",
};

const iconStyles = {
  default: "bg-secondary text-foreground",
  primary: "gradient-primary text-primary-foreground",
  xp: "gradient-xp text-xp-foreground",
  streak: "gradient-streak text-streak-foreground",
};

const StatCard = ({ title, value, icon: Icon, trend, variant = "default" }: StatCardProps) => (
  <motion.div
    whileHover={{ y: -2 }}
    className={`p-5 rounded-xl border ${variantStyles[variant]}`}
  >
    <div className="flex items-start justify-between">
      <div>
        <p className="text-sm text-muted-foreground">{title}</p>
        <p className="text-2xl font-display font-bold text-foreground mt-1">{value}</p>
        {trend && <p className="text-xs text-success font-medium mt-1">{trend}</p>}
      </div>
      <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${iconStyles[variant]}`}>
        <Icon className="w-5 h-5" />
      </div>
    </div>
  </motion.div>
);

export default StatCard;
