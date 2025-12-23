import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  const APP_URL = Deno.env.get("APP_URL") || "https://relawhats.lovable.app";

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get("code");
    const state = url.searchParams.get("state");
    const error = url.searchParams.get("error");
    const errorDescription = url.searchParams.get("error_description");

    console.log("[meta-oauth-callback] Received:", { code: !!code, state, error });

    if (error) {
      console.error("[meta-oauth-callback] OAuth error:", error, errorDescription);
      return Response.redirect(`${APP_URL}/connections?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      console.error("[meta-oauth-callback] Missing code or state");
      return Response.redirect(`${APP_URL}/connections?error=missing_params`);
    }

    // Parse state (format: userId:organizationId)
    const [userId, organizationId] = state.split(":");
    if (!userId || !organizationId) {
      console.error("[meta-oauth-callback] Invalid state format");
      return Response.redirect(`${APP_URL}/connections?error=invalid_state`);
    }

    const META_APP_ID = Deno.env.get("META_APP_ID");
    const META_APP_SECRET = Deno.env.get("META_APP_SECRET");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error("[meta-oauth-callback] Missing Meta credentials. META_APP_ID:", !!META_APP_ID, "META_APP_SECRET:", !!META_APP_SECRET);
      return Response.redirect(`${APP_URL}/connections?error=config_error`);
    }

    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      console.error("[meta-oauth-callback] Missing Supabase credentials");
      return Response.redirect(`${APP_URL}/connections?error=config_error`);
    }

    // Exchange code for access token
    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`;

    console.log("[meta-oauth-callback] Exchanging code for token...");
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error("[meta-oauth-callback] Token exchange error:", tokenData.error);
      return Response.redirect(`${APP_URL}/connections?error=${encodeURIComponent(tokenData.error.message || "token_error")}`);
    }

    const { access_token } = tokenData;
    console.log("[meta-oauth-callback] Got short-lived token, exchanging for long-lived...");

    // Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${access_token}`;
    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error("[meta-oauth-callback] Long-lived token error:", longLivedData.error);
      return Response.redirect(`${APP_URL}/connections?error=${encodeURIComponent(longLivedData.error.message || "token_error")}`);
    }

    const longLivedToken = longLivedData.access_token;
    const longLivedExpiresIn = longLivedData.expires_in || 5184000; // Default 60 days

    console.log("[meta-oauth-callback] Got long-lived token, fetching user info...");

    // Get user info from Meta
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${longLivedToken}`);
    const meData = await meResponse.json();

    if (meData.error) {
      console.error("[meta-oauth-callback] User info error:", meData.error);
      return Response.redirect(`${APP_URL}/connections?error=${encodeURIComponent(meData.error.message || "user_error")}`);
    }

    console.log("[meta-oauth-callback] User info:", meData.name);

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + longLivedExpiresIn * 1000).toISOString();

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from("ad_connections")
      .select("id")
      .eq("organization_id", organizationId)
      .eq("platform", "meta")
      .single();

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from("ad_connections")
        .update({
          access_token: longLivedToken,
          token_expires_at: expiresAt,
          name: meData.name,
          platform_user_id: meData.id,
          status: "connected",
          updated_at: new Date().toISOString(),
        })
        .eq("id", existingConnection.id);

      if (updateError) {
        console.error("[meta-oauth-callback] Update connection error:", updateError);
        return Response.redirect(`${APP_URL}/connections?error=db_error`);
      }
      console.log("[meta-oauth-callback] Updated existing connection");
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from("ad_connections")
        .insert({
          organization_id: organizationId,
          platform: "meta",
          access_token: longLivedToken,
          token_expires_at: expiresAt,
          name: meData.name,
          platform_user_id: meData.id,
          status: "connected",
        });

      if (insertError) {
        console.error("[meta-oauth-callback] Insert connection error:", insertError);
        return Response.redirect(`${APP_URL}/connections?error=db_error`);
      }
      console.log("[meta-oauth-callback] Created new connection");
    }

    console.log("[meta-oauth-callback] Connection saved successfully!");
    return Response.redirect(`${APP_URL}/connections?success=meta`);
  } catch (err) {
    console.error("[meta-oauth-callback] Unexpected error:", err);
    return Response.redirect(`${APP_URL}/connections?error=unexpected`);
  }
});
