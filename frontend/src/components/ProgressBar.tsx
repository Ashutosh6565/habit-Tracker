import { motion } from "framer-motion";

interface ProgressBarProps {
  value: number;
  max: number;
  label?: string;
  variant?: "primary" | "xp" | "streak";
}

const variantClasses = {
  primary: "gradient-primary",
  xp: "gradient-xp",
  streak: "gradient-streak",
};

const ProgressBar = ({ value, max, label, variant = "primary" }: ProgressBarProps) => {
  const percentage = Math.min((value / max) * 100, 100);
  return (
    <div className="w-full">
      {label && (
        <div className="flex justify-between mb-1">
          <span className="text-xs font-medium text-muted-foreground">{label}</span>
          <span className="text-xs font-semibold text-foreground">{value}/{max}</span>
        </div>
      )}
      <div className="h-2 rounded-full bg-secondary overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${percentage}%` }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className={`h-full rounded-full ${variantClasses[variant]}`}
        />
      </div>
    </div>
  );
};

export default ProgressBar;
