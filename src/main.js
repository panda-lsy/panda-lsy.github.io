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

import { addRoute, initRouter } from './router.js';
import { renderHeader } from './components/header.js';
import { renderFooter } from './components/footer.js';
import { renderHome } from './pages/home.js';
import { renderPosts } from './pages/posts.js';
import { renderPostDetail } from './pages/post-detail.js';
import { renderAdmin } from './pages/admin.js';
import { renderAuthCallback } from './pages/auth-callback.js';
import { initMusicPlayer } from './components/music-player.js';

addRoute(/^\/$/, renderHome);
addRoute(/^\/posts$/, renderPosts);
addRoute(/^\/posts\/(?<id>\d+)$/, renderPostDetail);
addRoute(/^\/admin$/, renderAdmin);
addRoute(/^\/auth\/callback$/, renderAuthCallback);

function bootstrap() {
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
