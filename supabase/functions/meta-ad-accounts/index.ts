import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { connectionId } = await req.json();

    const SUPABASE_URL = Deno.env.get('SUPABASE_URL');
    const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    const supabase = createClient(SUPABASE_URL!, SUPABASE_SERVICE_ROLE_KEY!);

    // Fetch the connection
    const { data: connection, error: connError } = await supabase
      .from('ad_connections')
      .select('*')
      .eq('id', connectionId)
      .single();

    if (connError || !connection) {
      console.error('Connection not found:', connError);
      return new Response(JSON.stringify({ error: 'Connection not found' }), {
        status: 404,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const accessToken = connection.access_token;

    // Fetch ad accounts from Meta
    console.log('Fetching ad accounts from Meta...');
    const adAccountsUrl = `https://graph.facebook.com/v18.0/me/adaccounts?fields=id,name,account_status,currency,timezone_name&access_token=${accessToken}`;
    const response = await fetch(adAccountsUrl);
    const data = await response.json();

    if (data.error) {
      console.error('Meta API error:', data.error);
      return new Response(JSON.stringify({ error: data.error.message }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const adAccounts = data.data || [];
    console.log(`Found ${adAccounts.length} ad accounts`);

    // Save ad accounts to database
    for (const account of adAccounts) {
      const { data: existing } = await supabase
        .from('ad_accounts')
        .select('id')
        .eq('connection_id', connectionId)
        .eq('platform_account_id', account.id)
        .single();

      if (existing) {
        await supabase
          .from('ad_accounts')
          .update({
            name: account.name,
            currency: account.currency,
            timezone: account.timezone_name,
            is_active: account.account_status === 1,
            updated_at: new Date().toISOString(),
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('ad_accounts')
          .insert({
            organization_id: connection.organization_id,
            connection_id: connectionId,
            platform: 'meta',
            platform_account_id: account.id,
            name: account.name,
            currency: account.currency,
            timezone: account.timezone_name,
            is_active: account.account_status === 1,
          });
      }
    }

    // Fetch updated list from database
    const { data: savedAccounts, error: fetchError } = await supabase
      .from('ad_accounts')
      .select('*')
      .eq('connection_id', connectionId)
      .order('name');

    if (fetchError) {
      console.error('Fetch accounts error:', fetchError);
      return new Response(JSON.stringify({ error: 'Failed to fetch accounts' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    return new Response(JSON.stringify({ accounts: savedAccounts }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
