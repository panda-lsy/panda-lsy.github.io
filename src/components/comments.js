import { fetchComments, postComment } from '../api/github.js';
import { get } from '../utils/storage.js';
import { showToast } from './toast.js';
import { renderMarkdown } from '../utils/markdown.js';

export async function renderComments(container, issueNumber) {
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
      listEl.innerHTML = comments.map(renderCommentItem).join('');
    }
  } catch (err) {
    listEl.innerHTML = '<p class="comments__empty">Failed to load comments.</p>';
    console.error('Comments error:', err);
  }

  // Show comment form if logged in
  const user = get('gh_user');
  const pat = get('gh_pat');

  if (user && pat) {
    formWrap.innerHTML = `
      <div class="comments__form">
        <div class="comments__form-header">
          <img class="comments__form-avatar" src="${user.avatar_url}" alt="${user.login}" />
          <span class="comments__form-user">${user.login}</span>
        </div>
        <textarea class="comments__textarea" id="comment-input" placeholder="Write a comment... (Markdown supported)"></textarea>
        <div class="comments__form-actions">
          <button class="btn btn--primary btn--sm" id="comment-submit">Comment</button>
        </div>
      </div>
    `;

    const textarea = formWrap.querySelector('#comment-input');
    const submitBtn = formWrap.querySelector('#comment-submit');

    submitBtn.addEventListener('click', async () => {
      const body = textarea.value.trim();
      if (!body) return;

      submitBtn.textContent = 'Posting...';
      submitBtn.disabled = true;

      try {
        const newComment = await postComment(issueNumber, body);
        textarea.value = '';

        // Remove "no comments" message
        const empty = listEl.querySelector('.comments__empty');
        if (empty) empty.remove();

        // Append new comment
        listEl.insertAdjacentHTML('beforeend', renderCommentItem(newComment));

        showToast('Comment posted');
      } catch (err) {
        showToast('Failed to post: ' + err.message, 'error');
      } finally {
        submitBtn.textContent = 'Comment';
        submitBtn.disabled = false;
      }
    });
  } else {
    formWrap.innerHTML = `
      <div class="comments__login-hint">
        <a href="#/login">Login</a> to post a comment.
      </div>
    `;
  }
}

function renderCommentItem(comment) {
  const date = new Date(comment.date).toLocaleDateString('zh-CN', {
    year: 'numeric', month: 'long', day: 'numeric', hour: '2-digit', minute: '2-digit',
  });
  const bodyHtml = renderMarkdown(comment.body);

  return `
    <div class="comments__item">
      <div class="comments__item-header">
        <img class="comments__item-avatar" src="${comment.user.avatar_url}" alt="${comment.user.login}" />
        <a class="comments__item-user" href="https://github.com/${comment.user.login}" target="_blank" rel="noopener noreferrer">${comment.user.login}</a>
        <span class="comments__item-date">${date}</span>
      </div>
      <div class="comments__item-body post-detail__body">${bodyHtml}</div>
    </div>
  `;
}
