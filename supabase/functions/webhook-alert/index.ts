import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface AlertPayload {
  action: "trigger" | "list_pending";
  alert_id?: string;
  organization_id?: string;
  triggered_value?: number;
  status?: "success" | "error";
  error_message?: string;
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

    const payload: AlertPayload = await req.json();
    console.log("Received alert payload:", JSON.stringify(payload, null, 2));

    const { action, alert_id, organization_id, triggered_value, status, error_message } = payload;

    if (action === "list_pending") {
      // List active alerts with their thresholds for n8n to check
      let query = supabase
        .from("alerts")
        .select(`
          id,
          name,
          type,
          threshold_value,
          recipient_phone,
          is_active,
          organization_id,
          ad_account_id,
          whatsapp_account_id,
          message_templates (
            id,
            content
          ),
          ad_accounts (
            id,
            name,
            account_id
          )
        `)
        .eq("is_active", true);

      if (organization_id) {
        query = query.eq("organization_id", organization_id);
      }

      const { data: alerts, error } = await query;

      if (error) throw error;

      console.log("Found active alerts:", alerts?.length || 0);

      return new Response(JSON.stringify({ 
        success: true, 
        alerts: alerts || [],
        count: alerts?.length || 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "trigger") {
      if (!alert_id || !status) {
        return new Response(JSON.stringify({ error: "Missing required fields: alert_id, status" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Verify alert exists
      const { data: alert, error: alertError } = await supabase
        .from("alerts")
        .select("*")
        .eq("id", alert_id)
        .single();

      if (alertError || !alert) {
        return new Response(JSON.stringify({ error: "Alert not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Create alert run record
      const { data: alertRun, error: runError } = await supabase
        .from("alert_runs")
        .insert({
          alert_id,
          status,
          error_message,
          triggered_value,
          sent_at: status === "success" ? new Date().toISOString() : null,
        })
        .select()
        .single();

      if (runError) throw runError;

      // Create notification for the organization
      if (status === "success") {
        await supabase
          .from("notifications")
          .insert({
            organization_id: alert.organization_id,
            title: `Alerta: ${alert.name}`,
            message: `O alerta "${alert.name}" foi disparado. Valor: ${triggered_value}`,
            type: "warning",
            metadata: { alert_id, triggered_value },
          });
      }

      console.log("Alert run recorded:", alertRun.id);

      return new Response(JSON.stringify({ 
        success: true, 
        alert_run_id: alertRun.id,
        message: "Alert run recorded successfully" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use 'trigger' or 'list_pending'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: unknown) {
    console.error("Error in webhook-alert:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
