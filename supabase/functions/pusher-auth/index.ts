import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.49.1';
import { createHmac } from 'node:crypto';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

interface PusherAuthRequest {
  socket_id: string;
  channel_name: string;
}

interface PusherAuthResponse {
  auth: string;
  channel_data?: string;
}

/**
 * Generate Pusher authentication signature for private channels
 * Implements the Pusher auth signature algorithm
 */
function generatePusherAuth(
  socketId: string,
  channelName: string,
  appKey: string,
  appSecret: string,
  userData?: { user_id: string; user_info?: Record<string, unknown> }
): PusherAuthResponse {
  let stringToSign = `${socketId}:${channelName}`;
  let channelData: string | undefined;

  // For presence channels, include user data
  if (channelName.startsWith('presence-') && userData) {
    channelData = JSON.stringify(userData);
    stringToSign = `${stringToSign}:${channelData}`;
  }

  const signature = createHmac('sha256', appSecret)
    .update(stringToSign)
    .digest('hex');

  const response: PusherAuthResponse = {
    auth: `${appKey}:${signature}`,
  };

  if (channelData) {
    response.channel_data = channelData;
  }

  return response;
}

/**
 * Extract user ID from private channel name
 * Channel pattern: private-user-{userId}
 */
function extractUserIdFromChannel(channelName: string): string | null {
  const match = channelName.match(/^private-user-(.+)$/);
  return match ? match[1] : null;
}

Deno.serve(async (req) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return new Response(
      JSON.stringify({ error: 'Method not allowed' }),
      { status: 405, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get environment variables
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY');
    const pusherAppId = Deno.env.get('PUSHER_APP_ID');
    const pusherKey = Deno.env.get('PUSHER_KEY');
    const pusherSecret = Deno.env.get('PUSHER_SECRET');

    if (!supabaseUrl || !supabaseAnonKey) {
      throw new Error('Supabase configuration missing');
    }

    if (!pusherAppId || !pusherKey || !pusherSecret) {
      throw new Error('Pusher configuration missing');
    }

    // Get authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const token = authHeader.replace('Bearer ', '');

    // Verify user with Supabase
    const supabase = createClient(supabaseUrl, supabaseAnonKey, {
      global: {
        headers: { Authorization: `Bearer ${token}` },
      },
    });

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Parse request body
    const body: PusherAuthRequest = await req.json();
    const { socket_id, channel_name } = body;

    if (!socket_id || !channel_name) {
      return new Response(
        JSON.stringify({ error: 'Missing socket_id or channel_name' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Validate channel access
    // For private-user-{userId} channels, ensure user can only subscribe to their own channel
    if (channel_name.startsWith('private-user-')) {
      const channelUserId = extractUserIdFromChannel(channel_name);

      if (channelUserId !== user.id) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized: Cannot subscribe to another user\'s channel' }),
          { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
    }

    // Generate Pusher authentication
    const authResponse = generatePusherAuth(
      socket_id,
      channel_name,
      pusherKey,
      pusherSecret
    );

    return new Response(
      JSON.stringify(authResponse),
      { status: 200, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Pusher auth error:', error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
