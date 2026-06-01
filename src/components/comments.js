import { fetchComments, postComment, editComment, deleteComment, fetchCommentRaw } from '../api/github.js';
import { get } from '../utils/storage.js';
import { showToast } from './toast.js';
import { renderMarkdown } from '../utils/markdown.js';

export async function renderComments(container, issueNumber) {
  const currentUser = get('gh_user');
  const currentLogin = currentUser?.login || null;

  container.innerHTML = `
    <div class="comments">
      <h3 class="comments__title">Comments</h3>
      <div class="comments__list" id="comments-list">
        <div class="loading">Loading comments...</div>
      </div>
      <div class="comments__form-wrap" id="comments-form-wrap"></div>
    </div>
  `;

  const listEl = container.querySelector('#comments-list');
  const formWrap = container.querySelector('#comments-form-wrap');

  // Load comments
  try {
    const comments = await fetchComments(issueNumber);
    if (comments.length === 0) {
      listEl.innerHTML = '<p class="comments__empty">No comments yet. Be the first to comment!</p>';
    } else {
      listEl.innerHTML = comments.map(c => renderCommentItem(c, currentLogin)).join('');
      bindCommentActions(listEl, currentLogin, issueNumber);
    }
  } catch (err) {
    listEl.innerHTML = '<p class="comments__empty">Failed to load comments.</p>';
    console.error('Comments error:', err);
  }

  // Comment form
  if (currentLogin) {
    renderWriteForm(formWrap, async (body) => {
      const newComment = await postComment(issueNumber, body);
      const empty = listEl.querySelector('.comments__empty');
      if (empty) empty.remove();
      listEl.insertAdjacentHTML('beforeend', renderCommentItem(newComment, currentLogin));
      bindCommentActions(listEl, currentLogin, issueNumber);
    });
  } else {
    formWrap.innerHTML = `
      <div class="comments__login-hint">
        <a href="#/login">Login</a> to post a comment.
      </div>
    `;
  }
}

// --- Write / Preview form (reusable) ---
function renderWriteForm(container, onSubmit, initialBody = '', submitLabel = 'Comment') {
  container.innerHTML = `
    <div class="comments__form">
      <div class="comments__tabs">
        <button class="comments__tab is-active" data-tab="write">Write</button>
        <button class="comments__tab" data-tab="preview">Preview</button>
      </div>
      <div class="comments__tab-panel" data-panel="write">
        <textarea class="comments__textarea" placeholder="Write a comment... (Markdown supported)">${escHtml(initialBody)}</textarea>
      </div>
      <div class="comments__tab-panel is-hidden" data-panel="preview">
        <div class="comments__preview post-detail__body"></div>
      </div>
      <div class="comments__form-actions">
        <button class="btn btn--primary btn--sm comments__submit-btn">${submitLabel}</button>
      </div>
    </div>
  `;

  const textarea = container.querySelector('.comments__textarea');
  const previewEl = container.querySelector('.comments__preview');
  const tabs = container.querySelectorAll('.comments__tab');
  const panels = container.querySelectorAll('.comments__tab-panel');
  const submitBtn = container.querySelector('.comments__submit-btn');

  // Tab switching
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const target = tab.dataset.tab;
      tabs.forEach(t => t.classList.toggle('is-active', t === tab));
      panels.forEach(p => p.classList.toggle('is-hidden', p.dataset.panel !== target));
      if (target === 'preview') {
        previewEl.innerHTML = textarea.value.trim()
          ? renderMarkdown(textarea.value)
          : '<p style="color:var(--color-text-muted)">Nothing to preview</p>';
      }
    });
  });

  // Submit
  submitBtn.addEventListener('click', async () => {
    const body = textarea.value.trim();
    if (!body) return;
    submitBtn.textContent = 'Posting...';
    submitBtn.disabled = true;
    try {
      await onSubmit(body);
      textarea.value = '';
      // Switch back to write tab
      tabs[0].click();
    } catch (err) {
      showToast('Failed: ' + err.message, 'error');
    } finally {
      submitBtn.textContent = submitLabel;
      submitBtn.disabled = false;
    }
  });
}

// --- Single comment item ---
function renderCommentItem(comment, currentLogin) {
  const date = new Date(comment.date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const bodyHtml = renderMarkdown(comment.body);
  const isOwner = currentLogin && comment.user.login === currentLogin;

  const actionsHtml = isOwner ? `
    <div class="comments__item-actions">
      <button class="comments__action-btn" data-action="edit" data-id="${comment.id}" title="Edit">&#9998;</button>
      <button class="comments__action-btn comments__action-btn--danger" data-action="delete" data-id="${comment.id}" title="Delete">&#10005;</button>
    </div>
  ` : '';

  return `
    <div class="comments__item" data-comment-id="${comment.id}">
      <div class="comments__item-header">
        <img class="comments__item-avatar" src="${comment.user.avatar_url}" alt="${comment.user.login}" />
        <a class="comments__item-user" href="https://github.com/${comment.user.login}" target="_blank" rel="noopener noreferrer">${comment.user.login}</a>
        <span class="comments__item-date">${date}</span>
        ${actionsHtml}
      </div>
      <div class="comments__item-body post-detail__body">${bodyHtml}</div>
    </div>
  `;
}

// --- Bind edit/delete actions ---
function bindCommentActions(listEl, currentLogin, issueNumber) {
  if (!currentLogin) return;

  listEl.querySelectorAll('[data-action="delete"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      if (!confirm('Delete this comment?')) return;
      try {
        await deleteComment(id);
        const item = listEl.querySelector(`[data-comment-id="${id}"]`);
        if (item) item.remove();
        showToast('Comment deleted');
        // Show empty message if no comments left
        if (!listEl.querySelector('.comments__item')) {
          listEl.innerHTML = '<p class="comments__empty">No comments yet. Be the first to comment!</p>';
        }
      } catch (err) {
        showToast('Failed: ' + err.message, 'error');
      }
    });
  });

  listEl.querySelectorAll('[data-action="edit"]').forEach(btn => {
    btn.addEventListener('click', async () => {
      const id = parseInt(btn.dataset.id);
      const item = listEl.querySelector(`[data-comment-id="${id}"]`);
      if (!item) return;

      const bodyEl = item.querySelector('.comments__item-body');
      const originalHtml = bodyEl.innerHTML;

      item.innerHTML = `<div class="comments__edit-form" data-comment-id="${id}"></div>`;
      const editFormEl = item.querySelector('.comments__edit-form');

      try {
        const raw = await fetchCommentRaw(id);
        renderWriteForm(editFormEl, async (newBody) => {
          await editComment(id, newBody);
          const updated = { id, body: newBody, date: new Date().toISOString(), user: { login: currentLogin, avatar_url: get('gh_user').avatar_url } };
          item.outerHTML = renderCommentItem(updated, currentLogin);
          bindCommentActions(listEl, currentLogin, issueNumber);
          showToast('Comment updated');
        }, raw, 'Update');
      } catch (err) {
        showToast('Failed to load comment: ' + err.message, 'error');
        item.innerHTML = `<div class="comments__item-header">${btn.closest('.comments__item-header')?.innerHTML || ''}</div><div class="comments__item-body post-detail__body">${originalHtml}</div>`;
      }
    });
  });
}

function escHtml(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
