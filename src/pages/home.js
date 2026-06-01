import { fetchPosts } from '../api/github.js';
import { createPostCard } from '../components/post-card.js';
import { initParticles, destroyParticles } from '../modules/particles.js';
import { initScrollAnimations } from '../modules/scroll-animations.js';
import { loadSiteConfig, getSiteValue } from '../api/site-config.js';

export async function renderHome(app) {
  await loadSiteConfig();

  // Parse friends links from config JSON string
  let friends = [];
  try { friends = JSON.parse(getSiteValue('friendsLinks')); } catch {}
  const friendsHtml = friends.length ? friends.map(f =>
    `<a class="home-friends__link" href="${escAttr(f.url)}" target="_blank" rel="noopener noreferrer">${escHtml(f.name)}</a>`
  ).join('') : '';

  app.innerHTML = `
    <div class="page">
      <div class="container">
        <section class="home-hero">
          <h1 class="home-hero__title">${escHtml(getSiteValue('heroTitle'))}</h1>
          <p class="home-hero__tagline">${escHtml(getSiteValue('heroTagline'))}</p>
        </section>
        <section class="home-recent">
          <div class="home-recent__header">
            <h2 class="home-recent__title">${escHtml(getSiteValue('recentTitle'))}</h2>
            <a href="#/posts" class="home-recent__link">${escHtml(getSiteValue('recentLink'))} &rarr;</a>
          </div>
          <div class="home-recent__list">
            <div class="loading">Loading...</div>
          </div>
        </section>
        ${friendsHtml ? `
        <section class="home-friends">
          <h2 class="home-friends__title">${escHtml(getSiteValue('friendsTitle'))}</h2>
          <div class="home-friends__list">${friendsHtml}</div>
        </section>
        ` : ''}
      </div>
    </div>
  `;

  document.title = getSiteValue('siteName');
  initParticles(app);
  initScrollAnimations(app);

  const listEl = app.querySelector('.home-recent__list');

  try {
    const { posts } = await fetchPosts({ perPage: 5 });

    if (posts.length === 0) {
      listEl.innerHTML = '<p style="color:var(--color-text-muted)">No posts yet.</p>';
      return;
    }

    listEl.innerHTML = '';
    posts.forEach(post => listEl.appendChild(createPostCard(post)));
    initScrollAnimations(app);
  } catch (err) {
    const msg = err.message || '';
    const hint = msg.includes('rate limit') || msg.includes('403')
      ? 'GitHub API rate limit exceeded. <a href="#/login">Login</a> to increase the limit.'
      : 'Could not load posts. Please try again later.';
    listEl.innerHTML = `<div class="error-state"><p class="error-state__message">${hint}</p></div>`;
    console.error('Home page error:', err);
  }

  return () => destroyParticles();
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}

function escAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;');
}
