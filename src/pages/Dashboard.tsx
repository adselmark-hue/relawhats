import { useState } from "react";
import { DollarSign, Users, ShoppingCart, TrendingUp, Loader2 } from "lucide-react";
import { DateRangePicker } from "@/components/ui/date-range-picker";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { useAdAccounts } from "@/hooks/useAdAccounts";
import { useDashboardMetrics } from "@/hooks/useDashboardMetrics";
import { AccountSelector } from "@/components/dashboard/AccountSelector";
import { MetricCard } from "@/components/dashboard/MetricCard";
import { formatCurrency, formatNumber, formatRoas } from "@/lib/formatters";
import type { DateRange } from "react-day-picker";

export default function Dashboard() {
  const { profile, isLoading: authLoading } = useAuth();
  const { adAccounts, isLoading: accountsLoading } = useAdAccounts();
  
  const [selectedAccountId, setSelectedAccountId] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange | undefined>(undefined);

  // Auto-selecionar primeira conta quando carregar
  const effectiveAccountId = selectedAccountId ?? adAccounts[0]?.id ?? null;
  
  const { metrics, chartData, isLoading: metricsLoading } = useDashboardMetrics(
    effectiveAccountId,
    dateRange?.from && dateRange?.to ? { from: dateRange.from, to: dateRange.to } : undefined
  );

  const isLoading = authLoading || accountsLoading;
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
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          <AccountSelector
            accounts={adAccounts}
            selectedAccountId={effectiveAccountId}
            onSelect={setSelectedAccountId}
            isLoading={accountsLoading}
          />
          <DateRangePicker 
            date={dateRange} 
            onDateChange={setDateRange}
          />
        </div>
      </div>

      {/* Loading overlay para métricas */}
      {metricsLoading && (
        <div className="flex items-center gap-2 text-muted-foreground">
          <Loader2 className="h-4 w-4 animate-spin" />
          <span className="text-sm">Carregando métricas...</span>
        </div>
      )}

      {/* Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <MetricCard
          title="Investimento"
          value={formatCurrency(metrics.totalSpend)}
          icon={<DollarSign className="h-5 w-5" />}
          color="blue"
        />
        <MetricCard
          title="Leads"
          value={formatNumber(metrics.totalLeads)}
          icon={<Users className="h-5 w-5" />}
          color="green"
        />
        <MetricCard
          title="Vendas"
          value={formatNumber(metrics.totalPurchases)}
          icon={<ShoppingCart className="h-5 w-5" />}
          color="purple"
        />
        <MetricCard
          title="ROAS"
          value={formatRoas(metrics.roas)}
          icon={<TrendingUp className="h-5 w-5" />}
          color="orange"
        />
      </div>

      {/* Chart */}
      <Card className="border-border bg-card">
        <CardHeader>
          <CardTitle className="text-lg font-semibold text-foreground">
            Investimento por Dia
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-[350px]">
            {chartData.length === 0 ? (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                {effectiveAccountId ? 
                  "Nenhum dado disponível para o período selecionado" : 
                  "Selecione uma conta para visualizar os dados"
                }
              </div>
            ) : (
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
                    tickFormatter={(value) => `R$${(value / 1000).toFixed(0)}K`}
                  />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--popover))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                      color: "hsl(var(--foreground))",
                    }}
                    formatter={(value: number, name: string) => {
                      if (name === "spend") return [formatCurrency(value), "Investimento"];
                      if (name === "revenue") return [formatCurrency(value), "Receita"];
                      if (name === "leads") return [formatNumber(value), "Leads"];
                      return [value, name];
                    }}
                  />
                  <Legend 
                    formatter={(value) => {
                      if (value === "spend") return "Investimento";
                      if (value === "revenue") return "Receita";
                      return value;
                    }}
                  />
                  <Line
                    type="monotone"
                    dataKey="spend"
                    name="spend"
                    stroke="hsl(var(--primary))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--primary))", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "hsl(var(--primary))" }}
                  />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    name="revenue"
                    stroke="hsl(var(--success))"
                    strokeWidth={2}
                    dot={{ fill: "hsl(var(--success))", strokeWidth: 0, r: 4 }}
                    activeDot={{ r: 6, fill: "hsl(var(--success))" }}
                  />
                </LineChart>
              </ResponsiveContainer>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
