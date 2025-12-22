import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface MetricsPayload {
  organization_id: string;
  ad_account_id: string;
  date: string; // YYYY-MM-DD
  metrics: {
    spend?: number;
    impressions?: number;
    clicks?: number;
    ctr?: number;
    cpc?: number;
    conversions?: number;
    cost_per_conversion?: number;
    reach?: number;
    frequency?: number;
    [key: string]: number | undefined;
  };
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

    const payload: MetricsPayload = await req.json();
    console.log("Received metrics payload:", JSON.stringify(payload, null, 2));

    const { organization_id, ad_account_id, date, metrics } = payload;

    if (!organization_id || !ad_account_id || !date || !metrics) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(date)) {
      return new Response(JSON.stringify({ error: "Invalid date format. Use YYYY-MM-DD" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Verify ad account exists
    const { data: account, error: accountError } = await supabase
      .from("ad_accounts")
      .select("id")
      .eq("id", ad_account_id)
      .single();

    if (accountError || !account) {
      return new Response(JSON.stringify({ error: "Ad account not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Upsert metrics snapshot
    const { data: snapshot, error } = await supabase
      .from("ad_metrics_snapshots")
      .upsert({
        organization_id,
        ad_account_id,
        date,
        metrics,
      }, {
        onConflict: "ad_account_id,date"
      })
      .select()
      .single();

    if (error) throw error;

    console.log("Saved metrics snapshot:", snapshot.id);

    return new Response(JSON.stringify({ 
      success: true, 
      snapshot_id: snapshot.id,
      message: "Metrics saved successfully" 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in webhook-metrics:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
