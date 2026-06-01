import { getCurrentPath } from '../router.js';
import { get, set } from '../utils/storage.js';

const NAV_ITEMS = [
  { label: 'Home', hash: '#/' },
  { label: 'Posts', hash: '#/posts' },
];

export function renderHeader(mount) {
  const header = document.createElement('header');
  header.className = 'site-header';
  const theme = getTheme();

  const updateActive = () => {
    const path = getCurrentPath();
    header.querySelectorAll('.site-header__link').forEach(link => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('is-active', path === href || (href === '/' && path === '/'));
    });
  };

  const iconSrc = theme === 'dark' ? '/icon-white.png' : '/icon-black.png';
  const themeIcon = theme === 'dark' ? '&#9788;' : '&#9790;';

  header.innerHTML = `
    <div class="site-header__inner">
      <a href="#/" class="site-header__brand">
        <img class="site-header__logo" src="${iconSrc}" alt="logo" />
        <span class="site-header__name">panda-lsy</span>
      </a>
      <nav class="site-header__nav">
        ${NAV_ITEMS.map(item =>
          `<a href="${item.hash}" class="site-header__link">${item.label}</a>`
        ).join('')}
        <button class="site-header__theme-toggle" title="Toggle theme">${themeIcon}</button>
      </nav>
    </div>
  `;

  mount.appendChild(header);
  updateActive();

  header.querySelector('.site-header__theme-toggle').addEventListener('click', () => {
    const next = getTheme() === 'dark' ? 'light' : 'dark';
    applyTheme(next);
    const logo = header.querySelector('.site-header__logo');
    if (logo) logo.src = next === 'dark' ? '/icon-white.png' : '/icon-black.png';
    header.querySelector('.site-header__theme-toggle').innerHTML =
      next === 'dark' ? '&#9788;' : '&#9790;';
  });

  window.addEventListener('hashchange', updateActive);
}

function getTheme() {
  const saved = get('theme');
  if (saved) return saved;
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
}

function applyTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  set('theme', theme);
}
