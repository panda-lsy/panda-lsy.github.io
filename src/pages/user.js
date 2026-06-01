import { get } from '../utils/storage.js';
import { checkAdminAccess } from '../api/github.js';
import { clearUser, renderHeader } from '../components/header.js';
import { showToast } from '../components/toast.js';
import { REPO_OWNER } from '../api/config.js';

export async function renderUser(app) {
  const user = get('gh_user');
  const pat = get('gh_pat');

  if (!user || !pat) {
    app.innerHTML = `
      <div class="page">
        <div class="user-page">
          <p style="color:var(--color-text-secondary)">Not logged in.</p>
          <a href="#/login" class="btn" style="margin-top:var(--space-4)">Login</a>
        </div>
      </div>
    `;
    return;
  }

  // Check if admin
  const adminUser = await checkAdminAccess(pat);
  const isAdmin = !!adminUser;

  app.innerHTML = `
    <div class="page">
      <div class="user-page">
        <img class="user-page__avatar" src="${user.avatar_url}" alt="${user.login}" />
        <h1 class="user-page__name">${user.login}</h1>
        <span class="user-page__role">${isAdmin ? 'Admin' : 'User'}</span>

        <div class="user-page__links">
          <a href="https://github.com/${user.login}" target="_blank" rel="noopener noreferrer" class="user-page__link">
            github.com/${user.login}
          </a>
        </div>

        <div class="user-page__actions">
          ${isAdmin ? `<a href="#/admin" class="btn btn--primary user-page__btn">Admin Dashboard</a>` : ''}
          <button class="btn user-page__btn" id="user-logout">Logout</button>
        </div>
      </div>
    </div>
  `;

  app.querySelector('#user-logout').addEventListener('click', () => {
    clearUser();
    renderHeader(document.getElementById('header-mount'));
    showToast('Logged out');
    window.location.hash = '#/';
  });
}
