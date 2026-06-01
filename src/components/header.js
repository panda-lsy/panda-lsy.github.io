import { getCurrentPath } from '../router.js';

const NAV_ITEMS = [
  { label: 'Home', hash: '#/' },
  { label: 'Posts', hash: '#/posts' },
  { label: 'Admin', hash: '#/admin' },
];

export function renderHeader(mount) {
  const header = document.createElement('header');
  header.className = 'site-header';

  const updateActive = () => {
    const path = getCurrentPath();
    header.querySelectorAll('.site-header__link').forEach(link => {
      const href = link.getAttribute('href').slice(1);
      link.classList.toggle('is-active', path === href || (href === '/' && path === '/'));
    });
  };

  header.innerHTML = `
    <div class="site-header__inner">
      <a href="#/" class="site-header__brand">panda-lsy</a>
      <nav class="site-header__nav">
        ${NAV_ITEMS.map(item =>
          `<a href="${item.hash}" class="site-header__link">${item.label}</a>`
        ).join('')}
      </nav>
    </div>
  `;

  mount.appendChild(header);
  updateActive();

  window.addEventListener('hashchange', updateActive);
}
