// Cloudflare Worker: GitHub OAuth Token Exchange Proxy
//
// Secrets to set via `wrangler secret put`:
//   GITHUB_CLIENT_ID
//   GITHUB_CLIENT_SECRET

export default {
  async fetch(request, env) {
    // CORS preflight
    if (request.method === 'OPTIONS') {
      return new Response(null, {
        headers: {
          'Access-Control-Allow-Origin': '*',
          'Access-Control-Allow-Methods': 'POST, OPTIONS',
          'Access-Control-Allow-Headers': 'Content-Type',
        },
      });
    }

    // Debug endpoint: check if secrets are configured
    if (request.method === 'GET') {
      return jsonResponse({
        status: 'ok',
        hasClientId: !!env.GITHUB_CLIENT_ID,
        hasClientSecret: !!env.GITHUB_CLIENT_SECRET,
        clientIdPrefix: env.GITHUB_CLIENT_ID ? env.GITHUB_CLIENT_ID.slice(0, 5) : null,
      });
    }

    if (request.method !== 'POST') {
      return jsonResponse({ error: 'Method not allowed' }, 405);
    }

    // Check secrets
    if (!env.GITHUB_CLIENT_ID || !env.GITHUB_CLIENT_SECRET) {
      return jsonResponse({
        error: 'Server misconfigured: missing GITHUB_CLIENT_ID or GITHUB_CLIENT_SECRET secrets',
      }, 500);
    }

    try {
      const { code } = await request.json();
      if (!code) {
        return jsonResponse({ error: 'Missing code parameter' }, 400);
      }

      const resp = await fetch('https://github.com/login/oauth/access_token', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Accept': 'application/json',
        },
        body: JSON.stringify({
          client_id: env.GITHUB_CLIENT_ID,
          client_secret: env.GITHUB_CLIENT_SECRET,
          code,
        }),
      });

      const data = await resp.json();

      if (data.error) {
        return jsonResponse({
          error: data.error_description || data.error,
          error_uri: data.error_uri || null,
        }, 400);
      }

      return jsonResponse({ access_token: data.access_token });
    } catch (err) {
      return jsonResponse({ error: 'Internal error: ' + err.message }, 500);
    }
  },
};

function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
    },
  });
}
