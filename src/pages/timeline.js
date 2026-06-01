import { fetchPosts } from '../api/github.js';
import { initScrollAnimations } from '../modules/scroll-animations.js';

export async function renderTimeline(app) {
  app.innerHTML = `
    <div class="page">
      <div class="container">
        <div class="timeline-header">
          <h1 class="timeline-header__title">Timeline</h1>
        </div>
        <div class="timeline" id="timeline-body">
          <div class="loading">Loading...</div>
        </div>
      </div>
    </div>
  `;

  const body = app.querySelector('#timeline-body');

  try {
    const { posts } = await fetchPosts({ perPage: 100 });

    if (posts.length === 0) {
      body.innerHTML = '<p style="color:var(--color-text-muted)">No posts yet.</p>';
      return;
    }

    // Group by year-month
    const groups = {};
    posts.forEach(post => {
      const d = new Date(post.date);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${d.getFullYear()} ${d.toLocaleDateString('en', { month: 'long' })}`;
      if (!groups[key]) groups[key] = { label, posts: [] };
      groups[key].posts.push(post);
    });

    // Render timeline
    const sortedKeys = Object.keys(groups).sort().reverse();
    body.innerHTML = sortedKeys.map(key => {
      const g = groups[key];
      return `
        <div class="timeline__group">
          <div class="timeline__marker">
            <span class="timeline__date">${g.label}</span>
          </div>
          <div class="timeline__items">
            ${g.posts.map(post => {
              const day = new Date(post.date).getDate();
              const excerpt = post.excerpt || '';
              return `
                <a href="#/posts/${post.number}" class="timeline__item">
                  <span class="timeline__day">${day}</span>
                  <div class="timeline__content">
                    <h3 class="timeline__title">${escHtml(post.title)}</h3>
                    ${excerpt ? `<p class="timeline__excerpt">${escHtml(excerpt)}</p>` : ''}
                  </div>
                </a>
              `;
            }).join('')}
          </div>
        </div>
      `;
    }).join('');

    initScrollAnimations(app);
  } catch (err) {
    const msg = err.message || '';
    const hint = msg.includes('rate limit') || msg.includes('403')
      ? 'GitHub API rate limit exceeded. <a href="#/login">Login</a> to increase the limit.'
      : 'Could not load timeline.';
    body.innerHTML = `<div class="error-state"><p class="error-state__message">${hint}</p></div>`;
    console.error('Timeline error:', err);
  }
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
