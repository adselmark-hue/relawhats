import { TrendingUp, TrendingDown } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface MetricCardProps {
  title: string;
  value: string;
  change?: string;
  trend?: "up" | "down";
  icon: React.ReactNode;
  color: "blue" | "green" | "purple" | "orange";
  progress?: number;
  progressLabel?: string;
}

export function MetricCard({
  title,
  value,
  change,
  trend,
  icon,
  color,
  progress,
  progressLabel,
}: MetricCardProps) {
  const colorClasses = {
    blue: "from-primary/20 to-primary/5 border-primary/20",
    green: "from-success/20 to-success/5 border-success/20",
    purple: "from-purple-500/20 to-purple-500/5 border-purple-500/20",
    orange: "from-warning/20 to-warning/5 border-warning/20",
  };

  const iconColorClasses = {
    blue: "text-primary",
    green: "text-success",
    purple: "text-purple-500",
    orange: "text-warning",
  };

  return (
    <div className="metric-card">
      <div className={`absolute inset-0 bg-gradient-to-b ${colorClasses[color]} opacity-50 rounded-xl`} />
      <div className="relative">
        <div className="flex items-start justify-between mb-4">
          <div className={`p-2 rounded-lg bg-gradient-to-br ${colorClasses[color]}`}>
            <div className={iconColorClasses[color]}>{icon}</div>
          </div>
          {change && (
            <div className={`flex items-center gap-1 text-xs font-medium ${trend === "up" ? "text-success" : "text-destructive"}`}>
              {trend === "up" ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              {change}
            </div>
          )}
        </div>
        <p className="text-sm text-muted-foreground mb-1">{title}</p>
        <p className="text-2xl font-bold text-foreground">{value}</p>
        {progress !== undefined && (
          <div className="mt-4">
            <div className="flex justify-between text-xs text-muted-foreground mb-2">
              <span>{progressLabel}</span>
              <span>{progress}%</span>
            </div>
            <Progress value={progress} className="h-2" />
          </div>
        )}
      </div>
    </div>
  );
}
