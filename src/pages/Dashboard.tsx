import { TrendingUp, TrendingDown, DollarSign, BarChart3, Send, Activity, Loader2 } from "lucide-react";
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
import { useAuth } from "@/contexts/AuthContext";
import { useReports } from "@/hooks/useReports";
import { useClients } from "@/hooks/useClients";
import { useAlerts } from "@/hooks/useAlerts";

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
  const { profile, isLoading: authLoading } = useAuth();
  const { reports, isLoading: reportsLoading } = useReports();
  const { clients, isLoading: clientsLoading } = useClients();
  const { alerts, isLoading: alertsLoading } = useAlerts();

  const isLoading = authLoading || reportsLoading || clientsLoading || alertsLoading;

  const activeReports = reports.filter(r => r.is_active);
  const activeAlerts = alerts.filter(a => a.is_active);

  // Generate chart data based on reports (placeholder for real metrics)
  const chartData = [
    { name: "Seg", meta: 0, google: 0 },
    { name: "Ter", meta: 0, google: 0 },
    { name: "Qua", meta: 0, google: 0 },
    { name: "Qui", meta: 0, google: 0 },
    { name: "Sex", meta: 0, google: 0 },
    { name: "Sáb", meta: 0, google: 0 },
    { name: "Dom", meta: 0, google: 0 },
  ];

  const firstName = profile?.full_name?.split(' ')[0] || 'Usuário';

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Seja bem-vindo(a), <span className="text-gradient">{firstName}</span>!
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
          title="Total de Clientes"
          value={clients.length.toString()}
          icon={<DollarSign className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Relatórios Ativos"
          value={activeReports.length.toString()}
          icon={<BarChart3 className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Total de Relatórios"
          value={reports.length.toString()}
          progress={reports.length > 0 ? Math.round((activeReports.length / reports.length) * 100) : 0}
          progressLabel="Ativos"
          icon={<Send className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="Alertas Ativos"
          value={activeAlerts.length.toString()}
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
