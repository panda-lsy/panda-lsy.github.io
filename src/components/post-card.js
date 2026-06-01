export function createPostCard(post) {
  const card = document.createElement('article');
  card.className = 'post-card';

  // Use explicit excerpt if set, otherwise auto-generate from body
  let excerpt = post.excerpt || '';
  if (!excerpt) {
    excerpt = post.body
      .replace(/<!--[\s\S]*?-->/g, '') // strip HTML comments
      .replace(/[#*`\[\]()!>~_-]/g, '')
      .replace(/\n+/g, ' ')
      .trim()
      .slice(0, 120);
  }

  const date = new Date(post.date).toLocaleDateString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });

  const labelHtml = post.labels
    .filter(l => l !== 'post' && l !== 'site-config')
    .map(l => `<span class="tag">${l}</span>`)
    .join('');

  card.innerHTML = `
    <a href="#/posts/${post.number}">
      <h3 class="post-card__title">${escapeHtml(post.title)}</h3>
      <div class="post-card__meta">
        <span>${date}</span>
        ${labelHtml}
      </div>
      <p class="post-card__excerpt">${escapeHtml(excerpt)}${excerpt.length >= 120 ? '...' : ''}</p>
    </a>
  `;

  return card;
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
