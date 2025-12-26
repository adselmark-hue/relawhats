import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase';
import { subDays, format } from 'date-fns';

export interface DailyMetric {
  id: string;
  campaign_id: string;
  date: string;
  spend: number;
  impressions: number;
  clicks: number;
  leads: number;
  purchases: number;
  revenue: number;
  video_plays: number;
  cpc: number;
  cpm: number;
  ctr: number;
}

export interface Campaign {
  id: string;
  account_id: string;
  campaign_id: string;
  name: string;
  status: string;
  objective: string;
}

export interface DashboardMetrics {
  totalSpend: number;
  totalLeads: number;
  totalPurchases: number;
  totalRevenue: number;
  totalImpressions: number;
  totalClicks: number;
  roas: number;
  cpl: number;
  cpa: number;
  ctr: number;
  cpc: number;
}

export interface ChartDataPoint {
  date: string;
  name: string;
  spend: number;
  leads: number;
  purchases: number;
  revenue: number;
}

export function useDashboardMetrics(accountId: string | null, dateRange?: { from: Date; to: Date }) {
  const defaultFrom = subDays(new Date(), 7);
  const defaultTo = new Date();
  
  const from = dateRange?.from ?? defaultFrom;
  const to = dateRange?.to ?? defaultTo;
  
  const fromStr = format(from, 'yyyy-MM-dd');
  const toStr = format(to, 'yyyy-MM-dd');

  const { data, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard_metrics', accountId, fromStr, toStr],
    queryFn: async () => {
      if (!accountId) {
        return {
          metrics: getEmptyMetrics(),
          chartData: [],
        };
      }

      // 1. Buscar campanhas da conta
      const { data: campaigns, error: campError } = await supabase
        .from('campaigns')
        .select('id')
        .eq('account_id', accountId);

      if (campError) {
        console.error('Erro ao buscar campanhas:', campError);
        throw campError;
      }

      if (!campaigns || campaigns.length === 0) {
        console.log('Nenhuma campanha encontrada para a conta:', accountId);
        return {
          metrics: getEmptyMetrics(),
          chartData: [],
        };
      }

      const campaignIds = campaigns.map(c => c.id);
      console.log('Campanhas encontradas:', campaignIds.length);

      // 2. Buscar métricas diárias
      const { data: dailyMetrics, error: metricsError } = await supabase
        .from('daily_metrics')
        .select('*')
        .in('campaign_id', campaignIds)
        .gte('date', fromStr)
        .lte('date', toStr)
        .order('date', { ascending: true });

      if (metricsError) {
        console.error('Erro ao buscar métricas:', metricsError);
        throw metricsError;
      }

      console.log('Métricas encontradas:', dailyMetrics?.length ?? 0);

      // 3. Calcular totais
      const metrics = calculateMetrics(dailyMetrics ?? []);

      // 4. Agrupar por dia para o gráfico
      const chartData = groupByDate(dailyMetrics ?? []);

      return {
        metrics,
        chartData,
      };
    },
    enabled: !!accountId,
    staleTime: 1000 * 60 * 5, // 5 minutos
  });

  return {
    metrics: data?.metrics ?? getEmptyMetrics(),
    chartData: data?.chartData ?? [],
    isLoading,
    error,
    refetch,
  };
}

function getEmptyMetrics(): DashboardMetrics {
  return {
    totalSpend: 0,
    totalLeads: 0,
    totalPurchases: 0,
    totalRevenue: 0,
    totalImpressions: 0,
    totalClicks: 0,
    roas: 0,
    cpl: 0,
    cpa: 0,
    ctr: 0,
    cpc: 0,
  };
}

function calculateMetrics(dailyMetrics: DailyMetric[]): DashboardMetrics {
  const totalSpend = dailyMetrics.reduce((sum, m) => sum + Number(m.spend || 0), 0);
  const totalLeads = dailyMetrics.reduce((sum, m) => sum + Number(m.leads || 0), 0);
  const totalPurchases = dailyMetrics.reduce((sum, m) => sum + Number(m.purchases || 0), 0);
  const totalRevenue = dailyMetrics.reduce((sum, m) => sum + Number(m.revenue || 0), 0);
  const totalImpressions = dailyMetrics.reduce((sum, m) => sum + Number(m.impressions || 0), 0);
  const totalClicks = dailyMetrics.reduce((sum, m) => sum + Number(m.clicks || 0), 0);

  const roas = totalSpend > 0 ? totalRevenue / totalSpend : 0;
  const cpl = totalLeads > 0 ? totalSpend / totalLeads : 0;
  const cpa = totalPurchases > 0 ? totalSpend / totalPurchases : 0;
  const ctr = totalImpressions > 0 ? (totalClicks / totalImpressions) * 100 : 0;
  const cpc = totalClicks > 0 ? totalSpend / totalClicks : 0;

  return {
    totalSpend,
    totalLeads,
    totalPurchases,
    totalRevenue,
    totalImpressions,
    totalClicks,
    roas,
    cpl,
    cpa,
    ctr,
    cpc,
  };
}

function groupByDate(dailyMetrics: DailyMetric[]): ChartDataPoint[] {
  const grouped: Record<string, ChartDataPoint> = {};

  for (const metric of dailyMetrics) {
    const date = metric.date;
    if (!grouped[date]) {
      grouped[date] = {
        date,
        name: formatDateLabel(date),
        spend: 0,
        leads: 0,
        purchases: 0,
        revenue: 0,
      };
    }
    grouped[date].spend += Number(metric.spend || 0);
    grouped[date].leads += Number(metric.leads || 0);
    grouped[date].purchases += Number(metric.purchases || 0);
    grouped[date].revenue += Number(metric.revenue || 0);
  }

  return Object.values(grouped).sort((a, b) => a.date.localeCompare(b.date));
}

function formatDateLabel(dateStr: string): string {
  const date = new Date(dateStr + 'T00:00:00');
  const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
  const day = date.getDate().toString().padStart(2, '0');
  const month = (date.getMonth() + 1).toString().padStart(2, '0');
  return `${days[date.getDay()]} ${day}/${month}`;
}
