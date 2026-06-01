let currentCleanup = null;
import { killAllAnimations } from './modules/scroll-animations.js';

const routes = [];

export function addRoute(pattern, handler) {
  routes.push({ pattern, handler });
}

export function navigate(hash) {
  if (!hash.startsWith('#')) hash = '#' + hash;
  location.hash = hash;
}

function parseHash() {
  const hash = location.hash.slice(1) || '/';
  const [path, queryString] = hash.split('?');
  const params = new URLSearchParams(queryString || '');
  return { path, params };
}

function matchRoute(path) {
  for (const route of routes) {
    const match = route.pattern.exec(path);
    if (match) {
      return { handler: route.handler, params: match.groups || {} };
    }
  }
  return null;
}

async function resolve() {
  const { path, params } = parseHash();
  const matched = matchRoute(path);

  if (!matched) {
    navigate('/');
    return;
  }

  if (currentCleanup) {
    currentCleanup();
    currentCleanup = null;
  }

  // Kill all GSAP animations before clearing DOM
  killAllAnimations();

  const app = document.getElementById('app');

  // Page transition: fade out current content
  const currentContent = app.firstElementChild;
  if (currentContent) {
    currentContent.classList.add('page-enter');
    await new Promise(r => setTimeout(r, 150));
  }

  app.innerHTML = '';

  const cleanup = await matched.handler(app, matched.params, params);
  if (typeof cleanup === 'function') {
    currentCleanup = cleanup;
  }

  // Page transition: fade in new content
  const newContent = app.firstElementChild;
  if (newContent) {
    newContent.classList.add('page-enter');
    requestAnimationFrame(() => {
      newContent.classList.add('page-enter-active');
      newContent.classList.remove('page-enter');
    });
  }

  // Header scroll shadow
  updateHeaderShadow();
  window.scrollTo(0, 0);
}

export function getCurrentPath() {
  return parseHash().path;
}

let scrollBound = false;
function updateHeaderShadow() {
  if (scrollBound) return;
  scrollBound = true;
  const header = document.querySelector('.site-header');
  if (!header) return;

  const onScroll = () => {
    header.classList.toggle('has-shadow', window.scrollY > 10);
  };
  window.addEventListener('scroll', onScroll, { passive: true });
  onScroll();
}

export function initRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
