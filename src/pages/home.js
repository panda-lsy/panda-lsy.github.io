import { fetchPosts } from '../api/github.js';
import { createPostCard } from '../components/post-card.js';
import { navigate } from '../router.js';

export async function renderHome(app) {
  app.innerHTML = `
    <div class="page">
      <div class="container">
        <section class="home-hero">
          <h1 class="home-hero__title">panda-lsy</h1>
          <p class="home-hero__tagline">Thoughts, code, and everything in between.</p>
        </section>
        <section class="home-recent">
          <div class="home-recent__header">
            <h2 class="home-recent__title">Recent Posts</h2>
            <a href="#/posts" class="home-recent__link">View all &rarr;</a>
          </div>
          <div class="home-recent__list">
            <div class="loading">Loading...</div>
          </div>
        </section>
      </div>
    </div>
  `;

  const listEl = app.querySelector('.home-recent__list');

  try {
    const { posts } = await fetchPosts({ perPage: 5 });

    if (posts.length === 0) {
      listEl.innerHTML = '<p style="color:var(--color-text-muted)">No posts yet.</p>';
      return;
    }

    listEl.innerHTML = '';
    posts.forEach(post => {
      listEl.appendChild(createPostCard(post));
    });
  } catch (err) {
    const msg = err.message || '';
    const hint = msg.includes('rate limit') || msg.includes('403')
      ? 'GitHub API rate limit exceeded. <a href="#/login">Login</a> to increase the limit.'
      : 'Could not load posts. Please try again later.';
    listEl.innerHTML = `
      <div class="error-state">
        <p class="error-state__message">${hint}</p>
      </div>
    `;
    console.error('Home page error:', err);
  }
}
