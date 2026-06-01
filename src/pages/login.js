import { get, set, remove } from '../utils/storage.js';
import { OAUTH_CLIENT_ID, REPO_OWNER } from '../api/config.js';
import { checkAdminAccess } from '../api/github.js';
import { setCachedUser, renderHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';

export function renderLogin(app) {
  const user = get('gh_user');
  const pat = get('gh_pat');

  if (user && pat) {
    app.innerHTML = `
      <div class="page">
        <div class="login-page">
          <div class="login-card">
            <img class="login-card__avatar" src="${user.avatar_url}" alt="${user.login}" />
            <h2 class="login-card__name">${user.login}</h2>
            <p class="login-card__hint">You are already logged in.</p>
            <div class="login-card__actions">
              <a href="#/user" class="btn btn--primary" style="width:100%;text-decoration:none">View Profile</a>
              <a href="#/" class="btn" style="width:100%;text-decoration:none;margin-top:var(--space-2)">Back to Home</a>
            </div>
          </div>
        </div>
      </div>
    `;
    return;
  }

  const oauthUrl = OAUTH_CLIENT_ID
    ? `https://github.com/login/oauth/authorize?client_id=${OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(location.origin + '/#/auth/callback')}&scope=public_repo`
    : '';

  app.innerHTML = `
    <div class="page">
      <div class="login-page">
        <h1 class="login-page__title">Login</h1>

        <div class="login-card">
          <h2 class="login-card__heading">User</h2>
          <p class="login-card__desc">Login with GitHub to interact with the site and post comments.</p>
          ${oauthUrl
            ? `<a href="${oauthUrl}" class="btn btn--primary login-card__btn">Login with GitHub</a>`
            : `<p class="login-card__hint">OAuth not configured.</p>`}
        </div>

        <div class="login-card">
          <h2 class="login-card__heading">Admin</h2>
          <p class="login-card__desc">For repository owner and collaborators only. Requires a PAT with <code>repo</code> scope.</p>
          <form class="login-card__form" id="admin-login-form">
            <input type="password" class="input" placeholder="GitHub Personal Access Token" id="admin-pat-input" autocomplete="off" />
            <button type="submit" class="btn login-card__btn">Login as Admin</button>
          </form>
        </div>
      </div>
    </div>
  `;

  app.querySelector('#admin-login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const input = app.querySelector('#admin-pat-input');
    const token = input.value.trim();
    if (!token) return;

    const btn = app.querySelector('#admin-login-form .btn');
    btn.textContent = 'Verifying...';
    btn.disabled = true;

    set('gh_pat', token);

    const adminUser = await checkAdminAccess(token);
    if (!adminUser) {
      remove('gh_pat');
      showToast('Not authorized. Only repo owner/collaborators.', 'error');
      btn.textContent = 'Login as Admin';
      btn.disabled = false;
      return;
    }

    setCachedUser({ login: adminUser.login, avatar_url: adminUser.avatar_url });
    renderHeader(document.getElementById('header-mount'));
    showToast(`Welcome, admin ${adminUser.login}!`);
    window.location.hash = '#/admin';
  });
}
