import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface ConnectionPayload {
  action: "create" | "update" | "sync_accounts";
  organization_id: string;
  platform: "meta" | "google";
  name: string;
  access_token?: string;
  refresh_token?: string;
  expires_at?: string;
  status?: "connected" | "disconnected" | "expired" | "error";
  accounts?: Array<{
    account_id: string;
    name: string;
    currency: string;
    timezone?: string;
  }>;
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

    const payload: ConnectionPayload = await req.json();
    console.log("Received connection payload:", JSON.stringify(payload, null, 2));

    const { action, organization_id, platform, name, access_token, refresh_token, expires_at, status, accounts } = payload;

    if (!organization_id || !platform || !name) {
      return new Response(JSON.stringify({ error: "Missing required fields: organization_id, platform, name" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    let connectionId: string;

    if (action === "create") {
      // Create new connection
      const { data: connection, error } = await supabase
        .from("ad_connections")
        .insert({
          organization_id,
          platform,
          name,
          access_token,
          refresh_token,
          expires_at,
          status: status || "connected",
        })
        .select()
        .single();

      if (error) throw error;
      connectionId = connection.id;
      console.log("Created connection:", connectionId);

    } else if (action === "update") {
      // Find and update existing connection
      const { data: existing, error: findError } = await supabase
        .from("ad_connections")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("platform", platform)
        .single();

      if (findError || !existing) {
        return new Response(JSON.stringify({ error: "Connection not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (access_token) updates.access_token = access_token;
      if (refresh_token) updates.refresh_token = refresh_token;
      if (expires_at) updates.expires_at = expires_at;
      if (status) updates.status = status;
      if (name) updates.name = name;

      const { error: updateError } = await supabase
        .from("ad_connections")
        .update(updates)
        .eq("id", existing.id);

      if (updateError) throw updateError;
      connectionId = existing.id;
      console.log("Updated connection:", connectionId);

    } else if (action === "sync_accounts") {
      // Find connection
      const { data: existing, error: findError } = await supabase
        .from("ad_connections")
        .select("id")
        .eq("organization_id", organization_id)
        .eq("platform", platform)
        .single();

      if (findError || !existing) {
        return new Response(JSON.stringify({ error: "Connection not found" }), {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      connectionId = existing.id;

      if (accounts && accounts.length > 0) {
        // Upsert ad accounts
        const accountsToUpsert = accounts.map((acc) => ({
          connection_id: connectionId,
          organization_id,
          account_id: acc.account_id,
          name: acc.name,
          currency: acc.currency,
          timezone: acc.timezone,
          is_active: true,
        }));

        const { error: accountsError } = await supabase
          .from("ad_accounts")
          .upsert(accountsToUpsert, { onConflict: "account_id" });

        if (accountsError) throw accountsError;
        console.log("Synced accounts:", accounts.length);
      }

    } else {
      return new Response(JSON.stringify({ error: "Invalid action" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ 
      success: true, 
      connection_id: connectionId,
      message: `Connection ${action} successful` 
    }), {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });

  } catch (error: unknown) {
    console.error("Error in webhook-connection:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
