import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { userId, organizationId } = await req.json();

    if (!userId || !organizationId) {
      return new Response(JSON.stringify({ error: 'Missing userId or organizationId' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const META_APP_ID = Deno.env.get('META_APP_ID');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');

    if (!META_APP_ID) {
      return new Response(JSON.stringify({ error: 'META_APP_ID not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;
    const state = `${userId}:${organizationId}`;
    
    // Permissions needed for ads
    const scopes = [
      'ads_read',
      'ads_management',
      'business_management',
      'pages_read_engagement',
    ].join(',');

    const oauthUrl = `https://www.facebook.com/v18.0/dialog/oauth?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&state=${encodeURIComponent(state)}&scope=${scopes}`;

    console.log('Generated OAuth URL for user:', userId);

    return new Response(JSON.stringify({ url: oauthUrl }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
