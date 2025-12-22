import { serve } from "https://deno.land/std@0.190.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.49.4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-webhook-secret",
};

interface WhatsAppPayload {
  action: "create" | "update" | "status" | "list";
  organization_id: string;
  id?: string;
  name?: string;
  phone_number?: string;
  status?: "connected" | "disconnected" | "expired" | "error";
  api_key?: string;
  is_default?: boolean;
  metadata?: Record<string, unknown>;
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

    const payload: WhatsAppPayload = await req.json();
    console.log("Received whatsapp payload:", JSON.stringify(payload, null, 2));

    const { action, organization_id, id, name, phone_number, status, api_key, is_default, metadata } = payload;

    if (!organization_id) {
      return new Response(JSON.stringify({ error: "Missing required field: organization_id" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    if (action === "list") {
      const { data: accounts, error } = await supabase
        .from("whatsapp_accounts")
        .select("*")
        .eq("organization_id", organization_id)
        .order("created_at", { ascending: false });

      if (error) throw error;

      return new Response(JSON.stringify({ 
        success: true, 
        accounts: accounts || [],
        count: accounts?.length || 0
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "create") {
      if (!name || !phone_number) {
        return new Response(JSON.stringify({ error: "Missing required fields: name, phone_number" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // If is_default is true, unset other defaults
      if (is_default) {
        await supabase
          .from("whatsapp_accounts")
          .update({ is_default: false })
          .eq("organization_id", organization_id);
      }

      const { data: account, error } = await supabase
        .from("whatsapp_accounts")
        .insert({
          organization_id,
          name,
          phone_number,
          status: status || "connected",
          api_key,
          is_default: is_default || false,
          metadata,
        })
        .select()
        .single();

      if (error) throw error;

      console.log("Created WhatsApp account:", account.id);

      return new Response(JSON.stringify({ 
        success: true, 
        account_id: account.id,
        message: "WhatsApp account created successfully" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "update") {
      if (!id) {
        return new Response(JSON.stringify({ error: "Missing required field: id" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const updates: Record<string, unknown> = { updated_at: new Date().toISOString() };
      if (name) updates.name = name;
      if (phone_number) updates.phone_number = phone_number;
      if (status) updates.status = status;
      if (api_key) updates.api_key = api_key;
      if (is_default !== undefined) updates.is_default = is_default;
      if (metadata) updates.metadata = metadata;

      // If is_default is true, unset other defaults
      if (is_default) {
        await supabase
          .from("whatsapp_accounts")
          .update({ is_default: false })
          .eq("organization_id", organization_id)
          .neq("id", id);
      }

      const { error } = await supabase
        .from("whatsapp_accounts")
        .update(updates)
        .eq("id", id)
        .eq("organization_id", organization_id);

      if (error) throw error;

      console.log("Updated WhatsApp account:", id);

      return new Response(JSON.stringify({ 
        success: true, 
        account_id: id,
        message: "WhatsApp account updated successfully" 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else if (action === "status") {
      if (!id || !status) {
        return new Response(JSON.stringify({ error: "Missing required fields: id, status" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      const { error } = await supabase
        .from("whatsapp_accounts")
        .update({ 
          status,
          updated_at: new Date().toISOString() 
        })
        .eq("id", id)
        .eq("organization_id", organization_id);

      if (error) throw error;

      console.log("Updated WhatsApp account status:", id, status);

      return new Response(JSON.stringify({ 
        success: true, 
        account_id: id,
        message: `Status updated to ${status}` 
      }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });

    } else {
      return new Response(JSON.stringify({ error: "Invalid action. Use 'create', 'update', 'status', or 'list'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

  } catch (error: unknown) {
    console.error("Error in webhook-whatsapp:", error);
    const message = error instanceof Error ? error.message : "Unknown error";
    return new Response(JSON.stringify({ error: message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
