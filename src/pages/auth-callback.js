import { OAUTH_PROXY_URL } from '../api/config.js';
import { verifyPat } from '../api/github.js';
import { set } from '../utils/storage.js';
import { showToast } from '../components/toast.js';
import { setCachedUser, renderHeader } from '../components/header.js';
import { navigate } from '../router.js';

export async function renderAuthCallback(app, _, params) {
  const code = params.get('code');

  if (!code) {
    showToast('No auth code received', 'error');
    navigate('/');
    return;
  }

  app.innerHTML = `
    <div class="page">
      <div class="loading">Authenticating...</div>
    </div>
  `;

  try {
    const res = await fetch(OAUTH_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();
    console.log('[OAuth] Proxy response:', { status: res.status, data: { ...data, access_token: data.access_token ? data.access_token.slice(0, 8) + '...' : undefined } });

    if (!res.ok || data.error) {
      throw new Error(data.error || `Proxy returned ${res.status}`);
    }

    const token = data.access_token;
    if (!token) throw new Error('No access_token in proxy response');

    // Validate token
    set('gh_pat', token);
    const user = await verifyPat(token);
    console.log('[OAuth] verifyPat result:', user ? { login: user.login, avatar_url: user.avatar_url?.slice(0, 30) + '...' } : null);

    if (!user || !user.login) {
      throw new Error('Token validation failed - the token may lack user permissions');
    }

    setCachedUser({ login: user.login, avatar_url: user.avatar_url });
    renderHeader(document.getElementById('header-mount'));
    showToast(`Welcome, ${user.login}!`);
    navigate('/user');
  } catch (err) {
    console.error('[OAuth] Full error:', err);
    showToast('Authentication failed: ' + err.message, 'error');
    navigate('/');
  }
}
