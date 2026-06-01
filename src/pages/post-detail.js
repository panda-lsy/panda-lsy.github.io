import { fetchPost } from '../api/github.js';
import { renderMarkdown } from '../utils/markdown.js';
import { GISCUS_REPO, GISCUS_REPO_ID, GISCUS_CATEGORY, GISCUS_CATEGORY_ID } from '../api/config.js';
import { syncGiscusToken } from '../components/header.js';

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

    // Set page title for Giscus title mapping
    document.title = `${post.title} - panda-lsy`;

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
          <div class="giscus-wrap" id="giscus-container"></div>
        </div>
      </div>
    `;

    // Load Giscus if configured
    if (GISCUS_REPO_ID && GISCUS_CATEGORY_ID) {
      const container = app.querySelector('#giscus-container');
      const theme = document.documentElement.getAttribute('data-theme');
      const script = document.createElement('script');
      script.src = 'https://giscus.app/client.js';
      script.setAttribute('data-repo', GISCUS_REPO);
      script.setAttribute('data-repo-id', GISCUS_REPO_ID);
      script.setAttribute('data-category', GISCUS_CATEGORY);
      script.setAttribute('data-category-id', GISCUS_CATEGORY_ID);
      script.setAttribute('data-mapping', 'title');
      script.setAttribute('data-strict', '0');
      script.setAttribute('data-theme', theme === 'dark' ? 'dark_dimmed' : 'light');
      script.setAttribute('data-lang', 'zh-CN');
      script.setAttribute('crossorigin', 'anonymous');
      script.async = true;
      container.appendChild(script);

      // Sync GitHub token so logged-in user can comment without re-auth
      syncGiscusToken();
    }
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
