import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Validate webhook secret
    const webhookSecret = Deno.env.get("WEBHOOK_SECRET");
    const providedSecret = req.headers.get("x-webhook-secret");
    
    if (webhookSecret && providedSecret !== webhookSecret) {
      console.error("Invalid webhook secret");
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!
    );

    const url = new URL(req.url);
    const organizationId = url.searchParams.get("organization_id");

    console.log("Fetching reports ready to send for organization:", organizationId);

    // Build query for reports that are ready to send
    let query = supabase
      .from("reports")
      .select(`
        id,
        name,
        frequency,
        schedule_time,
        schedule_days,
        period,
        recipient_phone,
        recipient_group_id,
        is_active,
        last_sent_at,
        next_send_at,
        organization_id,
        whatsapp_account_id,
        message_templates (
          id,
          content
        ),
        report_ad_accounts (
          ad_account_id,
          ad_accounts (
            id,
            name,
            account_id
          )
        )
      `)
      .eq("is_active", true)
      .lte("next_send_at", new Date().toISOString());

    if (organizationId) {
      query = query.eq("organization_id", organizationId);
    }

    const { data: reports, error: reportsError } = await query;

    if (reportsError) throw reportsError;

    // For each report, fetch the latest metrics for its ad accounts
    const reportsWithMetrics = await Promise.all(
      (reports || []).map(async (report) => {
        const adAccountIds = report.report_ad_accounts?.map((ra: { ad_account_id: string }) => ra.ad_account_id) || [];
        
        if (adAccountIds.length === 0) {
          return { ...report, metrics: {} };
        }

        // Get metrics based on period
        const today = new Date();
        let startDate: Date;
        
        switch (report.period) {
          case "today":
            startDate = today;
            break;
          case "yesterday":
            startDate = new Date(today.setDate(today.getDate() - 1));
            break;
          case "last_7_days":
            startDate = new Date(today.setDate(today.getDate() - 7));
            break;
          case "last_30_days":
            startDate = new Date(today.setDate(today.getDate() - 30));
            break;
          default:
            startDate = new Date(today.setDate(today.getDate() - 1));
        }

        const { data: metrics } = await supabase
          .from("ad_metrics_snapshots")
          .select("*")
          .in("ad_account_id", adAccountIds)
          .gte("date", startDate.toISOString().split("T")[0]);

        // Aggregate metrics
        const aggregatedMetrics = {
          spend: 0,
          impressions: 0,
          clicks: 0,
          conversions: 0,
          ctr: 0,
          cpc: 0,
          cost_per_conversion: 0,
        };

        (metrics || []).forEach((m) => {
          const data = m.metrics as Record<string, number>;
          aggregatedMetrics.spend += data.spend || 0;
          aggregatedMetrics.impressions += data.impressions || 0;
          aggregatedMetrics.clicks += data.clicks || 0;
          aggregatedMetrics.conversions += data.conversions || 0;
        });

        // Calculate derived metrics
        if (aggregatedMetrics.impressions > 0) {
          aggregatedMetrics.ctr = (aggregatedMetrics.clicks / aggregatedMetrics.impressions) * 100;
        }
        if (aggregatedMetrics.clicks > 0) {
          aggregatedMetrics.cpc = aggregatedMetrics.spend / aggregatedMetrics.clicks;
        }
        if (aggregatedMetrics.conversions > 0) {
          aggregatedMetrics.cost_per_conversion = aggregatedMetrics.spend / aggregatedMetrics.conversions;
        }

        // Get template content
        const template = report.message_templates?.[0]?.content || "";
        
        // Replace variables in template
        const formattedMessage = template
          .replace(/<DATA>/g, new Date().toLocaleDateString("pt-BR"))
          .replace(/<VALOR_INVESTIDO>/g, aggregatedMetrics.spend.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
          .replace(/<IMPRESSÕES>/g, aggregatedMetrics.impressions.toLocaleString("pt-BR"))
          .replace(/<CLIQUES>/g, aggregatedMetrics.clicks.toLocaleString("pt-BR"))
          .replace(/<CTR>/g, `${aggregatedMetrics.ctr.toFixed(2)}%`)
          .replace(/<CPC>/g, aggregatedMetrics.cpc.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }))
          .replace(/<CONVERSÕES>/g, aggregatedMetrics.conversions.toLocaleString("pt-BR"))
          .replace(/<CUSTO_POR_CONVERSÃO>/g, aggregatedMetrics.cost_per_conversion.toLocaleString("pt-BR", { style: "currency", currency: "BRL" }));

        return {
          ...report,
          metrics: aggregatedMetrics,
          formatted_message: formattedMessage,
        };
      })
    );

    console.log("Found reports ready to send:", reportsWithMetrics.length);

    return new Response(JSON.stringify({ 
      success: true, 
      reports: reportsWithMetrics,
      count: reportsWithMetrics.length
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in webhook-report-trigger:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
