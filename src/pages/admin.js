import { get, remove } from '../utils/storage.js';
import { checkAdminAccess, fetchAllPosts, createPost, updatePost, closePost, reopenPost, fetchConfig } from '../api/github.js';
import { showToast } from '../components/toast.js';
import { createPostEditor } from '../components/post-editor.js';
import { refreshMusicPlayer } from '../components/music-player.js';
import { clearUser, renderHeader } from '../components/header.js';
import { renderFooter } from '../components/footer.js';
import { navigate } from '../router.js';
import { loadSiteConfig, getSiteValue, saveSiteConfig } from '../api/site-config.js';

export async function renderAdmin(app) {
  const pat = get('gh_pat');

  if (!pat) {
    navigate('/login');
    return;
  }

  const user = await checkAdminAccess(pat);
  if (user) {
    renderDashboard(app, user);
    return;
  }

  // Logged in but not admin
  renderUnauthorized(app);
}

function renderUnauthorized(app) {
  const user = get('gh_user');
  app.innerHTML = `
    <div class="page">
      <div class="admin-login">
        <h1 class="admin-login__title">Access Denied</h1>
        <p style="color:var(--color-text-secondary);margin-bottom:var(--space-6)">
          ${user ? `Logged in as <strong>${user.login}</strong>. ` : ''}
          Only the repository owner or collaborators can access the admin dashboard.
        </p>
        <div style="display:flex;gap:var(--space-3);justify-content:center">
          <a href="#/user" class="btn">View Profile</a>
          <button class="btn" id="unauthorized-logout">Logout</button>
        </div>
      </div>
    </div>
  `;
  app.querySelector('#unauthorized-logout').addEventListener('click', () => {
    clearUser();
    renderHeader(document.getElementById('header-mount'));
    showToast('Logged out');
    navigate('/login');
  });
}

async function renderDashboard(app, user) {
  app.innerHTML = `
    <div class="page">
      <div class="container container--wide">
        <div class="admin-topbar">
          <h1 class="admin-topbar__title">Dashboard</h1>
          <div style="display:flex;gap:var(--space-3);align-items:center">
            <a href="#/user" style="display:flex;align-items:center;gap:var(--space-2);text-decoration:none;color:var(--color-text-secondary)">
              <img src="${user.avatar_url}" style="width:24px;height:24px;border-radius:50%" alt="${user.login}" />
              <span style="font-size:var(--font-size-sm)">${user.login}</span>
            </a>
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
          <h2 class="admin-section__title">Site Settings</h2>
          <div class="admin-settings">
            <div class="admin-settings__row">
              <div style="flex:1">
                <label class="admin-editor__label">Site Name</label>
                <input type="text" class="input" id="cfg-siteName" placeholder="panda-lsy" />
              </div>
            </div>
            <div class="admin-settings__row">
              <div style="flex:1">
                <label class="admin-editor__label">Hero Title</label>
                <input type="text" class="input" id="cfg-heroTitle" placeholder="panda-lsy" />
              </div>
            </div>
            <div class="admin-settings__row">
              <div style="flex:1">
                <label class="admin-editor__label">Hero Tagline</label>
                <input type="text" class="input" id="cfg-heroTagline" placeholder="Thoughts, code, and everything in between." />
              </div>
            </div>
            <div class="admin-settings__row">
              <div style="flex:1">
                <label class="admin-editor__label">Recent Posts Title</label>
                <input type="text" class="input" id="cfg-recentTitle" placeholder="Recent Posts" />
              </div>
            </div>
            <div class="admin-settings__row">
              <div style="flex:1">
                <label class="admin-editor__label">Footer Text</label>
                <input type="text" class="input" id="cfg-footerText" placeholder="Built with simplicity." />
              </div>
            </div>
            <div class="admin-settings__row">
              <div style="flex:1">
                <label class="admin-editor__label">NetEase Cloud Music Playlist ID</label>
                <input type="text" class="input" id="cfg-musicPlaylistId" placeholder="e.g. 123456789" />
              </div>
            </div>
            <div class="admin-settings__row">
              <button class="btn btn--primary btn--sm" id="save-config-btn">Save Settings</button>
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
    navigate('/login');
  });

  app.querySelector('#new-post-btn').addEventListener('click', () => {
    openEditor(null, () => loadPosts(postListEl));
  });

  app.querySelector('#save-config-btn').addEventListener('click', async () => {
    const updates = {};
    ['siteName', 'heroTitle', 'heroTagline', 'recentTitle', 'footerText', 'musicPlaylistId'].forEach(key => {
      const input = app.querySelector(`#cfg-${key}`);
      if (input) updates[key] = input.value.trim();
    });

    try {
      await saveSiteConfig(updates);
      showToast('Settings saved');
      // Refresh components that depend on config
      renderHeader(document.getElementById('header-mount'));
      renderFooter(document.getElementById('footer-mount'));
      if (updates.musicPlaylistId !== undefined) await refreshMusicPlayer();
    } catch (err) {
      showToast('Failed to save: ' + err.message, 'error');
    }
  });

  loadPosts(postListEl);

  // Load current config values into form
  await loadSiteConfig();
  ['siteName', 'heroTitle', 'heroTagline', 'recentTitle', 'footerText', 'musicPlaylistId'].forEach(key => {
    const input = app.querySelector(`#cfg-${key}`);
    if (input) input.value = getSiteValue(key);
  });

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
