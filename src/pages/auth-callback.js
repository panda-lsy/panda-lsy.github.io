import { OAUTH_PROXY_URL } from '../api/config.js';
import { verifyPat } from '../api/github.js';
import { set } from '../utils/storage.js';
import { showToast } from '../components/toast.js';
import { setCachedUser, renderHeader, syncGiscusToken } from '../components/header.js';
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
    // Exchange code for token via proxy
    const res = await fetch(OAUTH_PROXY_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ code }),
    });

    const data = await res.json();

    if (!res.ok || data.error) {
      throw new Error(data.error || `Proxy returned ${res.status}`);
    }

    const token = data.access_token;
    if (!token) throw new Error('No access_token in proxy response');

    // Validate token by fetching user info
    set('gh_pat', token);
    const user = await verifyPat(token);
    if (!user || !user.login) {
      throw new Error('Token is invalid or missing user scope');
    }

    setCachedUser({ login: user.login, avatar_url: user.avatar_url });
    renderHeader(document.getElementById('header-mount'));

    // Sync token to Giscus for seamless commenting
    syncGiscusToken();

    showToast(`Welcome, ${user.login}!`);
    navigate('/user');
  } catch (err) {
    console.error('OAuth callback error:', err);
    showToast('Authentication failed: ' + err.message, 'error');
    navigate('/');
  }
}
