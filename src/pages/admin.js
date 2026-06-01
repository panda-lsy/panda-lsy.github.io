import { get, set, remove } from '../utils/storage.js';
import { verifyPat, fetchAllPosts, createPost, updatePost, closePost, reopenPost, fetchConfig, saveConfig } from '../api/github.js';
import { showToast } from '../components/toast.js';
import { createPostEditor } from '../components/post-editor.js';
import { refreshMusicPlayer } from '../components/music-player.js';
import { clearUser, renderHeader, setCachedUser } from '../components/header.js';
import { OAUTH_CLIENT_ID } from '../api/config.js';

export async function renderAdmin(app) {
  const pat = get('gh_pat');

  if (pat) {
    const user = await verifyPat(pat);
    if (user) {
      renderDashboard(app, user);
      return;
    }
    remove('gh_pat');
  }

  renderLogin(app);
}

function renderLogin(app) {
  const oauthUrl = OAUTH_CLIENT_ID
    ? `https://github.com/login/oauth/authorize?client_id=${OAUTH_CLIENT_ID}&redirect_uri=${encodeURIComponent(location.origin + '/#/auth/callback')}&scope=repo,user:read`
    : '';

  app.innerHTML = `
    <div class="page">
      <div class="admin-login">
        <h1 class="admin-login__title">Admin Login</h1>
        ${oauthUrl ? `<a href="${oauthUrl}" class="btn btn--primary" style="width:100%;text-decoration:none;margin-bottom:var(--space-4)">Login with GitHub</a>
        <div style="text-align:center;color:var(--color-text-muted);font-size:var(--font-size-xs);margin-bottom:var(--space-4)">or use a Personal Access Token</div>` : ''}
        <form class="admin-login__form">
          <input type="password" class="input" placeholder="GitHub Personal Access Token" id="pat-input" autocomplete="off" />
          <button type="submit" class="btn${oauthUrl ? ' btn--sm' : ' btn--primary'}">login with PAT</button>
        </form>
      </div>
    </div>
  `;

  const form = app.querySelector('.admin-login__form');
  form.addEventListener('submit', async e => {
    e.preventDefault();
    const input = app.querySelector('#pat-input');
    const token = input.value.trim();
    if (!token) return;

    const btn = form.querySelector('.btn');
    btn.textContent = 'Verifying...';
    btn.disabled = true;

    try {
      const user = await verifyPat(token);
      if (!user) {
        showToast('Invalid token', 'error');
        btn.textContent = 'Login';
        btn.disabled = false;
        return;
      }

      set('gh_pat', token);
      setCachedUser({ login: user.login, avatar_url: user.avatar_url });
      renderHeader(document.getElementById('header-mount'));
      showToast(`Logged in as ${user.login}`);
      renderDashboard(app, user);
    } catch (err) {
      showToast('Verification failed: ' + err.message, 'error');
      btn.textContent = 'Login';
      btn.disabled = false;
    }
  });
}

async function renderDashboard(app, user) {
  app.innerHTML = `
    <div class="page">
      <div class="container container--wide">
        <div class="admin-topbar">
          <h1 class="admin-topbar__title">Dashboard</h1>
          <div style="display:flex;gap:var(--space-3);align-items:center">
            <span style="font-size:var(--font-size-sm);color:var(--color-text-muted)">${user.login}</span>
            <button class="btn btn--sm" id="logout-btn">Logout</button>
          </div>
        </div>

        <section class="admin-section">
          <div class="admin-section__header">
            <h2 class="admin-section__title">Posts</h2>
            <button class="btn btn--primary btn--sm" id="new-post-btn">New Post</button>
          </div>
          <div class="admin-post-list" id="admin-post-list">
            <div class="loading">Loading...</div>
          </div>
        </section>

        <section class="admin-section">
          <h2 class="admin-section__title">Settings</h2>
          <div class="admin-settings">
            <div class="admin-settings__row">
              <div style="flex:1">
                <label class="admin-editor__label">NetEase Cloud Music Playlist ID</label>
                <input type="text" class="input" id="playlist-input" placeholder="e.g. 123456789" />
              </div>
              <button class="btn btn--sm" id="save-config-btn">Save</button>
            </div>
          </div>
        </section>
      </div>
    </div>
  `;

  const postListEl = app.querySelector('#admin-post-list');

  app.querySelector('#logout-btn').addEventListener('click', () => {
    clearUser();
    showToast('Logged out');
    renderHeader(document.getElementById('header-mount'));
    renderLogin(app);
  });

  app.querySelector('#new-post-btn').addEventListener('click', () => {
    openEditor(null, () => loadPosts(postListEl));
  });

  app.querySelector('#save-config-btn').addEventListener('click', async () => {
    const playlistId = app.querySelector('#playlist-input').value.trim();
    try {
      await saveConfig({ musicPlaylistId: playlistId });
      showToast('Settings saved');
      await refreshMusicPlayer();
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    }
  });

  loadPosts(postListEl);

  try {
    const config = await fetchConfig();
    if (config.musicPlaylistId) {
      app.querySelector('#playlist-input').value = config.musicPlaylistId;
    }
  } catch (err) {
    console.warn('Failed to load config:', err);
  }

  async function loadPosts(listEl) {
    listEl.innerHTML = '<div class="loading">Loading...</div>';
    try {
      const posts = await fetchAllPosts();
      if (posts.length === 0) {
        listEl.innerHTML = '<p style="color:var(--color-text-muted)">No posts yet.</p>';
        return;
      }

      listEl.innerHTML = posts.map(post => {
        const date = new Date(post.date).toLocaleDateString('zh-CN');
        const isClosed = post.state === 'closed';
        const labels = post.labels.filter(l => l !== 'post' && l !== 'site-config');
        return `
          <div class="admin-post-item" data-number="${post.number}">
            <span class="admin-post-item__title" style="${isClosed ? 'opacity:0.5' : ''}">
              ${escapeHtml(post.title)}
              ${labels.map(l => `<span class="tag" style="margin-left:4px">${l}</span>`).join('')}
              ${isClosed ? '<span class="tag" style="margin-left:4px;color:#999">closed</span>' : ''}
            </span>
            <span class="admin-post-item__date">${date}</span>
            <div class="admin-post-item__actions">
              <button class="btn btn--sm" data-edit="${post.number}">Edit</button>
              ${isClosed
                ? `<button class="btn btn--sm" data-reopen="${post.number}">Reopen</button>`
                : `<button class="btn btn--sm btn--danger" data-close="${post.number}">Close</button>`
              }
            </div>
          </div>
        `;
      }).join('');

      listEl.querySelectorAll('[data-edit]').forEach(btn => {
        btn.addEventListener('click', () => {
          const num = parseInt(btn.dataset.edit);
          const post = posts.find(p => p.number === num);
          openEditor(post, () => loadPosts(listEl));
        });
      });

      listEl.querySelectorAll('[data-close]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const num = parseInt(btn.dataset.close);
          try {
            await closePost(num);
            showToast('Post closed');
            loadPosts(listEl);
          } catch (err) {
            showToast('Failed: ' + err.message, 'error');
          }
        });
      });

      listEl.querySelectorAll('[data-reopen]').forEach(btn => {
        btn.addEventListener('click', async () => {
          const num = parseInt(btn.dataset.reopen);
          try {
            await reopenPost(num);
            showToast('Post reopened');
            loadPosts(listEl);
          } catch (err) {
            showToast('Failed: ' + err.message, 'error');
          }
        });
      });
    } catch (err) {
      listEl.innerHTML = `<div class="error-state"><p>Failed to load posts.</p></div>`;
      console.error('Admin posts error:', err);
    }
  }

  function openEditor(post, onSave) {
    const editorEl = createPostEditor({
      post,
      onSave: async (data) => {
        try {
          if (post) {
            await updatePost(post.number, data);
            showToast('Post updated');
          } else {
            await createPost(data);
            showToast('Post created');
          }
          editorEl.remove();
          onSave();
        } catch (err) {
          showToast('Failed: ' + err.message, 'error');
        }
      },
      onCancel: () => {
        editorEl.remove();
      },
    });
    document.body.appendChild(editorEl);
  }
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}
