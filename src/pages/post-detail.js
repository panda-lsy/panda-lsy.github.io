import { fetchPost } from '../api/github.js';
import { renderMarkdown } from '../utils/markdown.js';

export async function renderPostDetail(app, { id }) {
  app.innerHTML = `
    <div class="page">
      <div class="container">
        <div class="loading">Loading...</div>
      </div>
    </div>
  `;

  try {
    const post = await fetchPost(id);

    const date = new Date(post.date).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });

    const labelHtml = post.labels
      .filter(l => l !== 'post' && l !== 'site-config')
      .map(l => `<span class="tag">${l}</span>`)
      .join(' ');

    const bodyHtml = renderMarkdown(post.body);

    app.innerHTML = `
      <div class="page">
        <div class="container">
          <a href="#/posts" class="post-detail__back">&larr; Back to Posts</a>
          <article>
            <header class="post-detail__header">
              <h1 class="post-detail__title">${escapeHtml(post.title)}</h1>
              <div class="post-detail__meta">
                <span>${date}</span>
                <span>${post.author}</span>
                ${labelHtml}
              </div>
            </header>
            <div class="post-detail__body">${bodyHtml}</div>
          </article>
        </div>
      </div>
    `;
  } catch (err) {
    app.innerHTML = `
      <div class="page">
        <div class="container">
          <a href="#/posts" class="post-detail__back">&larr; Back to Posts</a>
          <div class="error-state">
            <p class="error-state__message">Failed to load post #${id}.</p>
          </div>
        </div>
      </div>
    `;
    console.error('Post detail error:', err);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
