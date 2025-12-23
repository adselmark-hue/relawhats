import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const code = url.searchParams.get('code');
    const state = url.searchParams.get('state'); // Contains user_id and organization_id
    const error = url.searchParams.get('error');
    const errorDescription = url.searchParams.get('error_description');

    console.log('Meta OAuth callback received:', { code: !!code, state, error });

    if (error) {
      console.error('Meta OAuth error:', error, errorDescription);
      return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=${encodeURIComponent(errorDescription || error)}`);
    }

    if (!code || !state) {
      console.error('Missing code or state');
      return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=missing_params`);
    }

    // Parse state (format: userId:organizationId)
    const [userId, organizationId] = state.split(':');
    if (!userId || !organizationId) {
      console.error('Invalid state format');
      return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=invalid_state`);
    }

    const META_APP_ID = Deno.env.get('META_APP_ID');
    const META_APP_SECRET = Deno.env.get('META_APP_SECRET');
    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!META_APP_ID || !META_APP_SECRET) {
      console.error('Missing Meta credentials');
      return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=config_error`);
    }

    // Exchange code for access token
    const redirectUri = `${SUPABASE_URL}/functions/v1/meta-oauth-callback`;
    const tokenUrl = `https://graph.facebook.com/v18.0/oauth/access_token?client_id=${META_APP_ID}&redirect_uri=${encodeURIComponent(redirectUri)}&client_secret=${META_APP_SECRET}&code=${code}`;

    console.log('Exchanging code for token...');
    const tokenResponse = await fetch(tokenUrl);
    const tokenData = await tokenResponse.json();

    if (tokenData.error) {
      console.error('Token exchange error:', tokenData.error);
      return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=${encodeURIComponent(tokenData.error.message)}`);
    }

    const { access_token, expires_in } = tokenData;
    console.log('Got short-lived token, exchanging for long-lived...');

    // Exchange for long-lived token
    const longLivedUrl = `https://graph.facebook.com/v18.0/oauth/access_token?grant_type=fb_exchange_token&client_id=${META_APP_ID}&client_secret=${META_APP_SECRET}&fb_exchange_token=${access_token}`;
    const longLivedResponse = await fetch(longLivedUrl);
    const longLivedData = await longLivedResponse.json();

    if (longLivedData.error) {
      console.error('Long-lived token error:', longLivedData.error);
      return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=${encodeURIComponent(longLivedData.error.message)}`);
    }

    const longLivedToken = longLivedData.access_token;
    const longLivedExpiresIn = longLivedData.expires_in || 5184000; // Default 60 days

    console.log('Got long-lived token, fetching user info...');

    // Get user info from Meta
    const meResponse = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name&access_token=${longLivedToken}`);
    const meData = await meResponse.json();

    if (meData.error) {
      console.error('User info error:', meData.error);
      return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=${encodeURIComponent(meData.error.message)}`);
    }

    console.log('User info:', meData.name);

    // Initialize Supabase client with service role
    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Calculate token expiry
    const expiresAt = new Date(Date.now() + longLivedExpiresIn * 1000).toISOString();

    // Check if connection already exists
    const { data: existingConnection } = await supabase
      .from('ad_connections')
      .select('id')
      .eq('organization_id', organizationId)
      .eq('platform', 'meta')
      .single();

    if (existingConnection) {
      // Update existing connection
      const { error: updateError } = await supabase
        .from('ad_connections')
        .update({
          access_token: longLivedToken,
          token_expires_at: expiresAt,
          account_name: meData.name,
          account_id: meData.id,
          is_active: true,
          updated_at: new Date().toISOString(),
        })
        .eq('id', existingConnection.id);

      if (updateError) {
        console.error('Update connection error:', updateError);
        return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=db_error`);
      }
    } else {
      // Create new connection
      const { error: insertError } = await supabase
        .from('ad_connections')
        .insert({
          organization_id: organizationId,
          platform: 'meta',
          access_token: longLivedToken,
          token_expires_at: expiresAt,
          account_name: meData.name,
          account_id: meData.id,
          is_active: true,
        });

      if (insertError) {
        console.error('Insert connection error:', insertError);
        return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=db_error`);
      }
    }

    console.log('Connection saved successfully!');
    return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?success=meta`);

  } catch (error) {
    console.error('Unexpected error:', error);
    return Response.redirect(`${Deno.env.get('APP_URL') || 'https://lovable.dev'}/connections?error=unexpected`);
  }
});
