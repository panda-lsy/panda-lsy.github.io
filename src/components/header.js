import { getCurrentPath, navigate } from '../router.js';
import { get, set, remove } from '../utils/storage.js';
import { verifyPat } from '../api/github.js';
import { OAUTH_CLIENT_ID, OAUTH_PROXY_URL } from '../api/config.js';

const NAV_ITEMS = [
  { label: 'Home', hash: '#/' },
  { label: 'Posts', hash: '#/posts' },
];

let headerEl = null;
let userCache = null;

export function renderHeader(mount) {
  mount.innerHTML = '';
  headerEl = document.createElement('header');
  headerEl.className = 'site-header';
  const theme = getTheme();

  const iconSrc = theme === 'dark' ? '/icon-white.png' : '/icon-black.png';
  const themeIcon = theme === 'dark' ? '&#9788;' : '&#9790;';

  const user = getCachedUser();
  const userHtml = user
    ? `<a href="#/admin" class="site-header__user">
         <img class="site-header__avatar" src="${user.avatar_url}" alt="${user.login}" />
         <span class="site-header__username">${user.login}</span>
       </a>`
    : (OAUTH_CLIENT_ID
      ? `<a class="site-header__login-btn" href="${getOAuthUrl()}" title="Login with GitHub">Login</a>`
      : '');

  headerEl.innerHTML = `
    <div class="site-header__inner">
      <a href="#/" class="site-header__brand">
        <img class="site-header__logo" src="${iconSrc}" alt="logo" />
        <span class="site-header__name">panda-lsy</span>
      </a>
      <nav class="site-header__nav">
        ${NAV_ITEMS.map(item =>
          `<a href="${item.hash}" class="site-header__link">${item.label}</a>`
        ).join('')}
        ${userHtml}
        <button class="site-header__theme-toggle" title="Toggle theme">${themeIcon}</button>
      </nav>
    </div>
  `;

  mount.appendChild(headerEl);
  updateActive();

  headerEl.querySelector('.site-header__theme-toggle').addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    const logo = headerEl.querySelector('.site-header__logo');
    if (logo) logo.src = next === 'dark' ? '/icon-white.png' : '/icon-black.png';
    headerEl.querySelector('.site-header__theme-toggle').innerHTML =
      next === 'dark' ? '&#9788;' : '&#9790;';
    // Sync Giscus theme
    const giscusFrame = document.querySelector('iframe.giscus-frame');
    if (giscusFrame) {
      giscusFrame.contentWindow.postMessage(
        { giscus: { setConfig: { theme: next === 'dark' ? 'dark_dimmed' : 'light' } } },
        'https://giscus.app'
      );
    }
  });

  window.addEventListener('hashchange', updateActive);
}

function getOAuthUrl() {
  const redirect = `${location.origin}/#/auth/callback`;
  return `https://github.com/login/oauth/authorize?client_id=${OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(redirect)}&scope=repo,user:read`;
}

function getCachedUser() {
  if (userCache) return userCache;
  const cached = get('gh_user');
  if (cached && get('gh_pat')) {
    userCache = cached;
    return cached;
  }
  return null;
}

export function setCachedUser(user) {
  userCache = user;
  set('gh_user', user);
}

export function clearUser() {
  userCache = null;
  remove('gh_user');
  remove('gh_pat');
}

const updateActive = () => {
  if (!headerEl) return;
  const path = getCurrentPath();
  headerEl.querySelectorAll('.site-header__link').forEach(link => {
    const href = link.getAttribute('href').slice(1);
    link.classList.toggle('is-active', path === href || (href === '/' && path === '/'));
  });
};

function getTheme() {
  const saved = get('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  set('theme', theme);
}
