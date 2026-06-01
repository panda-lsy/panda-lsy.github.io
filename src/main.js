import './styles/reset.css';
import './styles/variables.css';
import './styles/base.css';
import './styles/layout.css';
import './styles/header.css';
import './styles/footer.css';
import './styles/components.css';
import './styles/home.css';
import './styles/posts.css';
import './styles/admin.css';
import './styles/music-player.css';
import './styles/login.css';
import './styles/user.css';
import './styles/comments.css';
import './styles/animations.css';
import './styles/timeline.css';

import { addRoute, initRouter } from './router.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderHome } from './pages/home.js';
import { renderPosts } from './pages/posts.js';
import { renderPostDetail } from './pages/post-detail.js';
import { renderAdmin } from './pages/admin.js';
import { renderAuthCallback } from './pages/auth-callback.js';
import { renderLogin } from './pages/login.js';
import { renderUser } from './pages/user.js';
import { renderTimeline } from './pages/timeline.js';
import { initMusicPlayer } from './components/music-player.js';

addRoute(/^\/$/, renderHome);
addRoute(/^\/posts$/, renderPosts);
addRoute(/^\/posts\/(?<id>\d+)$/, renderPostDetail);
addRoute(/^\/timeline$/, renderTimeline);
addRoute(/^\/admin$/, renderAdmin);
addRoute(/^\/auth\/callback$/, renderAuthCallback);
addRoute(/^\/login$/, renderLogin);
addRoute(/^\/user$/, renderUser);

function bootstrap() {
  // GitHub OAuth redirects with ?code=xxx at the domain root
  // Move the code into the hash so our router can handle it
  const searchParams = new URLSearchParams(location.search);
  const code = searchParams.get('code');
  if (code) {
    window.history.replaceState(null, '', location.pathname);
    location.hash = `#/auth/callback?code=${code}`;
  }

  renderHeader(document.getElementById('header-mount'));
  renderFooter(document.getElementById('footer-mount'));
  initRouter();
  initMusicPlayer(document.getElementById('music-player-mount'));
}

if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', bootstrap);
} else {
  bootstrap();
}
