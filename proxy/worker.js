// Cloudflare Worker: GitHub OAuth Token Exchange Proxy
//
// Setup:
// 1. Create a Cloudflare Worker
// 2. Set the following secrets via `wrangler secret put`:
//    - GITHUB_CLIENT_ID: your GitHub OAuth App client ID
//    - GITHUB_CLIENT_SECRET: your GitHub OAuth App client secret
// 3. Deploy: `wrangler deploy`
// 4. Update OAUTH_PROXY_URL in src/api/config.js to your worker URL

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

    if (request.method !== 'POST') {
      return new Response('Method not allowed', { status: 405 });
    }

    try {
      const { code } = await request.json();
      if (!code) {
        return jsonResponse({ error: 'Missing code' }, 400);
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
        return jsonResponse({ error: data.error_description || data.error }, 400);
      }

      return jsonResponse({ access_token: data.access_token });
    } catch (err) {
      return jsonResponse({ error: err.message }, 500);
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
