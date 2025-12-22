import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface ReportSentPayload {
  report_id: string;
  status: "success" | "error";
  error_message?: string;
  metrics_snapshot?: Record<string, unknown>;
}

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

    const payload: ReportSentPayload = await req.json();
    console.log("Received report sent payload:", JSON.stringify(payload, null, 2));

    const { report_id, status, error_message, metrics_snapshot } = payload;

    if (!report_id || !status) {
      return new Response(JSON.stringify({ error: "Missing required fields: report_id, status" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get the report
    const { data: report, error: reportError } = await supabase
      .from("reports")
      .select("*")
      .eq("id", report_id)
      .single();

    if (reportError || !report) {
      return new Response(JSON.stringify({ error: "Report not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Create report run record
    const { data: reportRun, error: runError } = await supabase
      .from("report_runs")
      .insert({
        report_id,
        status,
        error_message,
        metrics_snapshot,
        sent_at: status === "success" ? new Date().toISOString() : null,
      })
      .select()
      .single();

    if (runError) throw runError;

    // Calculate next send time based on frequency
    let nextSendAt: Date | null = null;
    const now = new Date();

    switch (report.frequency) {
      case "daily":
        nextSendAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
        break;
      case "weekly":
        nextSendAt = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case "monthly":
        nextSendAt = new Date(now.setMonth(now.getMonth() + 1));
        break;
      default:
        nextSendAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }

    // Set the time to the scheduled time
    if (report.schedule_time) {
      const [hours, minutes] = report.schedule_time.split(":");
      nextSendAt.setHours(parseInt(hours), parseInt(minutes), 0, 0);
    }

    // Update report with last_sent_at and next_send_at
    const { error: updateError } = await supabase
      .from("reports")
      .update({
        last_sent_at: status === "success" ? new Date().toISOString() : report.last_sent_at,
        next_send_at: nextSendAt.toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq("id", report_id);

    if (updateError) throw updateError;

    console.log("Report run recorded:", reportRun.id, "Next send at:", nextSendAt);

    return new Response(JSON.stringify({ 
      success: true, 
      report_run_id: reportRun.id,
      next_send_at: nextSendAt.toISOString(),
      message: "Report run recorded successfully" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in webhook-report-sent:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
