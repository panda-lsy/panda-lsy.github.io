import { fetchPosts } from '../api/github.js';
import { createPostCard } from '../components/post-card.js';
import { createPagination } from '../components/pagination.js';
import { navigate } from '../router.js';

export async function renderPosts(app, _, queryParams) {
  const page = parseInt(queryParams.get('page')) || 1;

  app.innerHTML = `
    <div class="page">
      <div class="container">
        <div class="posts-header">
          <h1 class="posts-header__title">Posts</h1>
        </div>
        <div class="posts-list">
          <div class="loading">Loading...</div>
        </div>
      </div>
    </div>
  `;

  const listEl = app.querySelector('.posts-list');

  try {
    const { posts, hasMore } = await fetchPosts({ page, perPage: 10 });

    if (posts.length === 0) {
      listEl.innerHTML = '<p style="color:var(--color-text-muted)">No posts found.</p>';
      return;
    }

    listEl.innerHTML = '';
    posts.forEach(post => {
      listEl.appendChild(createPostCard(post));
    });

    listEl.appendChild(createPagination({
      page,
      hasMore,
      onChange: (newPage) => {
        navigate(`/posts?page=${newPage}`);
      },
    }));
  } catch (err) {
    listEl.innerHTML = `
      <div class="error-state">
        <p class="error-state__message">Failed to load posts.</p>
      </div>
    `;
    console.error('Posts page error:', err);
  }
}
