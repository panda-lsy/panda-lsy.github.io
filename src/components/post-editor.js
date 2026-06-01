import { showToast } from './toast.js';

export function createPostEditor({ post, onSave, onCancel }) {
  const el = document.createElement('div');
  el.className = 'admin-editor';

  const isEdit = !!post;
  const labels = (post?.labels || []).filter(l => l !== 'post' && l !== 'site-config').join(', ');

  el.innerHTML = `
    <h3 style="margin-bottom:var(--space-4)">${isEdit ? 'Edit Post' : 'New Post'}</h3>
    <div class="admin-editor__field">
      <label class="admin-editor__label">Title</label>
      <input type="text" class="input" id="editor-title" value="${escapeAttr(post?.title || '')}" />
    </div>
    <div class="admin-editor__field">
      <label class="admin-editor__label">Body (Markdown)</label>
      <textarea class="admin-editor__textarea" id="editor-body">${escapeText(post?.body || '')}</textarea>
    </div>
    <div class="admin-editor__field">
      <label class="admin-editor__label">Labels (comma-separated)</label>
      <input type="text" class="input" id="editor-labels" value="${escapeAttr(labels)}" placeholder="e.g. tech, life" />
    </div>
    <div style="display:flex;gap:var(--space-3);margin-top:var(--space-4)">
      <button class="btn btn--primary" id="editor-save">${isEdit ? 'Update' : 'Publish'}</button>
      <button class="btn" id="editor-cancel">Cancel</button>
    </div>
  `;

  el.querySelector('#editor-save').addEventListener('click', () => {
    const title = el.querySelector('#editor-title').value.trim();
    const body = el.querySelector('#editor-body').value;
    const labelsStr = el.querySelector('#editor-labels').value.trim();

    if (!title) {
      showToast('Title is required', 'error');
      return;
    }

    const labels = labelsStr
      ? labelsStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    onSave({ title, body, labels });
  });

  el.querySelector('#editor-cancel').addEventListener('click', onCancel);

  return el;
}

function escapeAttr(str) {
  return str.replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(str) {
  return str.replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
