const routes = [];

let currentCleanup = null;

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

  const app = document.getElementById('app');
  app.innerHTML = '';

  const cleanup = await matched.handler(app, matched.params, params);
  if (typeof cleanup === 'function') {
    currentCleanup = cleanup;
  }

  window.scrollTo(0, 0);
}

export function getCurrentPath() {
  return parseHash().path;
}

export function initRouter() {
  window.addEventListener('hashchange', resolve);
  resolve();
}
