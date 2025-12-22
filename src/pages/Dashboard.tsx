import { TrendingUp, TrendingDown, DollarSign, BarChart3, Send, Activity } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const chartData = [
  { name: "Seg", meta: 12, google: 8 },
  { name: "Ter", meta: 18, google: 12 },
  { name: "Qua", meta: 15, google: 10 },
  { name: "Qui", meta: 22, google: 16 },
  { name: "Sex", meta: 28, google: 20 },
  { name: "Sáb", meta: 14, google: 8 },
  { name: "Dom", meta: 10, google: 6 },
];

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

function MetricCard({
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

export default function Dashboard() {
  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Seja bem-vindo(a), <span className="text-gradient">Eliezer</span>!
          </h1>
          <p className="text-muted-foreground mt-1">
            Acompanhe suas métricas e relatórios em tempo real.
          </p>
        </div>
        <DateRangePicker />
      </div>

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Investimento Reportado"
          value="R$ 45.230,00"
          change="+12.5%"
          trend="up"
          icon={<DollarSign className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Investimento Médio/Relatório"
          value="R$ 1.890,00"
          change="+5.2%"
          trend="up"
          icon={<BarChart3 className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Relatórios Enviados"
          value="24"
          progress={80}
          progressLabel="80% da meta mensal"
          icon={<Send className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="Relatórios Ativos"
          value="8"
          icon={<Activity className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Envios por Canal
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                <XAxis
                  dataKey="name"
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <YAxis
                  stroke="hsl(var(--muted-foreground))"
                  fontSize={12}
                  tickLine={false}
                  axisLine={false}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(var(--popover))",
                    border: "1px solid hsl(var(--border))",
                    borderRadius: "8px",
                    color: "hsl(var(--foreground))",
                  }}
                />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="meta"
                  name="Meta Ads"
                  stroke="hsl(216, 100%, 50%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(216, 100%, 50%)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "hsl(216, 100%, 50%)" }}
                />
                <Line
                  type="monotone"
                  dataKey="google"
                  name="Google Ads"
                  stroke="hsl(160, 84%, 39%)"
                  strokeWidth={2}
                  dot={{ fill: "hsl(160, 84%, 39%)", strokeWidth: 0, r: 4 }}
                  activeDot={{ r: 6, fill: "hsl(160, 84%, 39%)" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
