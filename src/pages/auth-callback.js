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

    if (!res.ok) throw new Error('Token exchange failed');

    const data = await res.json();
    const token = data.access_token;
    if (!token) throw new Error('No access token returned');

    set('gh_pat', token);

    const user = await verifyPat(token);
    if (!user) throw new Error('Invalid token');

    setCachedUser({ login: user.login, avatar_url: user.avatar_url });

    // Re-render header with user info
    const headerMount = document.getElementById('header-mount');
    renderHeader(headerMount);

    showToast(`Welcome, ${user.login}!`);
    navigate('/admin');
  } catch (err) {
    console.error('OAuth callback error:', err);
    showToast('Authentication failed: ' + err.message, 'error');
    navigate('/');
  }
}
