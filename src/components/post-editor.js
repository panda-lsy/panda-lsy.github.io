import { showToast } from './toast.js';
import { renderMarkdown } from '../utils/markdown.js';
import { get, set, remove } from '../utils/storage.js';
import { uploadImage } from '../api/github.js';
import { extractExcerpt, stripExcerpt, injectExcerpt } from '../utils/excerpt.js';

const AUTOSAVE_KEY = 'post_editor_draft';

const TOOLBAR_ITEMS = [
  { label: '&#x21A9;', title: 'Undo (Ctrl+Z)', action: 'undo' },
  { label: '&#x21AA;', title: 'Redo (Ctrl+Y)', action: 'redo' },
  { label: 'B', title: 'Bold (Ctrl+B)', action: 'bold' },
  { label: 'I', title: 'Italic (Ctrl+I)', action: 'italic', style: 'font-style:italic' },
  { label: 'H', title: 'Heading', action: 'heading' },
  { label: '&mdash;', title: 'Divider', action: 'hr' },
  { label: '&ldquo;', title: 'Quote', action: 'quote' },
  { label: '&bull;', title: 'Unordered List', action: 'ul' },
  { label: '1.', title: 'Ordered List', action: 'ol' },
  { label: '&lt;/&gt;', title: 'Code', action: 'code' },
  { label: '[ ]', title: 'Link', action: 'link' },
  { label: '[ ! ]', title: 'Image', action: 'image' },
  { label: '↑', title: 'Upload Image', action: 'upload-image' },
];

export function createPostEditor({ post, onSave, onCancel }) {
  const el = document.createElement('div');
  el.className = 'editor-full';

  const isEdit = !!post;
  const labels = (post?.labels || []).filter(l => l !== 'post' && l !== 'site-config').join(', ');

  // Restore draft if creating new post
  const draft = !isEdit ? get(AUTOSAVE_KEY) : null;
  const initTitle = draft?.title || post?.title || '';
  const initBody = draft?.body || stripExcerpt(post?.body || '');
  const initLabels = draft?.labels || labels;
  const initExcerpt = draft?.excerpt || extractExcerpt(post?.body || '');

  el.innerHTML = `
    <div class="editor-full__header">
      <div class="editor-full__header-left">
        <button class="btn btn--sm" id="editor-back">&larr; Back</button>
        <span class="editor-full__status" id="editor-status"></span>
      </div>
      <div class="editor-full__header-right">
        <button class="btn btn--sm" id="editor-discard">Discard</button>
        <button class="btn btn--primary btn--sm" id="editor-publish">${isEdit ? 'Update' : 'Publish'}</button>
      </div>
    </div>

    <div class="editor-full__title-row">
      <input type="text" class="editor-full__title-input" id="editor-title"
        value="${escapeAttr(initTitle)}" placeholder="Post title..." />
    </div>

    <div class="editor-full__labels-row">
      <input type="text" class="input editor-full__labels-input" id="editor-labels"
        value="${escapeAttr(initLabels)}" placeholder="Labels (comma-separated)" />
    </div>

    <div class="editor-full__excerpt-row">
      <input type="text" class="input editor-full__excerpt-input" id="editor-excerpt"
        value="${escapeAttr(initExcerpt)}" placeholder="Brief description (shown on card, optional)" />
    </div>

    <div class="editor-full__toolbar">
      ${TOOLBAR_ITEMS.map(item =>
        `<button class="editor-full__toolbar-btn" data-action="${item.action}" title="${item.title}"${item.style ? ` style="${item.style}"` : ''}>${item.label}</button>`
      ).join('')}
    </div>

    <div class="editor-full__body">
    <input type="file" id="editor-image-input" accept="image/*" style="display:none" />

      <div class="editor-full__pane editor-full__pane--edit">
        <textarea class="editor-full__textarea" id="editor-body" placeholder="Write your post in Markdown...">${escapeText(initBody)}</textarea>
      </div>
      <div class="editor-full__pane editor-full__pane--preview">
        <div class="editor-full__preview post-detail__body" id="editor-preview"></div>
      </div>
    </div>
  `;

  const titleInput = el.querySelector('#editor-title');
  const bodyInput = el.querySelector('#editor-body');
  const labelsInput = el.querySelector('#editor-labels');
  const excerptInput = el.querySelector('#editor-excerpt');
  const previewEl = el.querySelector('#editor-preview');
  const statusEl = el.querySelector('#editor-status');
  // Image upload
  const imageInput = el.querySelector('#editor-image-input');

  async function handleImageUpload(file) {
    if (!file || !file.type.startsWith('image/')) return;
    showToast('Uploading image...', 'info');
    try {
      const url = await uploadImage(file);
      const name = file.name.replace(/\.[^.]+$/, '');
      const md = `![${name}](${url})`;
      const start = bodyInput.selectionStart;
      bodyInput.setRangeText(md, start, bodyInput.selectionEnd, 'end');
      bodyInput.focus();
      updatePreview();
      scheduleAutosave();
      showToast('Image uploaded!');
    } catch (err) {
      showToast('Upload failed: ' + err.message, 'error');
    }
  }

  imageInput.addEventListener('change', () => {
    const file = imageInput.files[0];
    if (file) handleImageUpload(file);
    imageInput.value = '';
  });

  bodyInput.addEventListener('paste', (e) => {
    const items = e.clipboardData?.items;
    if (!items) return;
    for (const item of items) {
      if (item.type.startsWith('image/')) {
        e.preventDefault();
        handleImageUpload(item.getAsFile());
        return;
      }
    }
  });

  bodyInput.addEventListener('dragover', (e) => {
    e.preventDefault();
    e.stopPropagation();
  });

  bodyInput.addEventListener('drop', (e) => {
    e.preventDefault();
    e.stopPropagation();
    const file = e.dataTransfer?.files?.[0];
    if (file) handleImageUpload(file);
  });

  // Live preview
  const updatePreview = () => {
    previewEl.innerHTML = renderMarkdown(bodyInput.value);
  };
  updatePreview();

  // Auto-save on input (new posts only)
  let autosaveTimer = null;
  const scheduleAutosave = () => {
    if (isEdit) return;
    clearTimeout(autosaveTimer);
    autosaveTimer = setTimeout(() => {
      set(AUTOSAVE_KEY, {
        title: titleInput.value,
        body: bodyInput.value,
        labels: labelsInput.value,
        excerpt: excerptInput.value,
      });
      statusEl.textContent = 'Draft saved';
      setTimeout(() => { statusEl.textContent = ''; }, 2000);
    }, 1000);
  };

  bodyInput.addEventListener('input', () => {
    updatePreview();
    scheduleAutosave();
  });
  titleInput.addEventListener('input', scheduleAutosave);
  labelsInput.addEventListener('input', scheduleAutosave);
  excerptInput.addEventListener('input', scheduleAutosave);

  // Undo/Redo stacks
  const undoStack = [];
  const redoStack = [];
  const MAX_HISTORY = 100;

  function snapshot() {
    undoStack.push({
      value: bodyInput.value,
      start: bodyInput.selectionStart,
      end: bodyInput.selectionEnd,
    });
    if (undoStack.length > MAX_HISTORY) undoStack.shift();
    redoStack.length = 0;
  }

  function undo() {
    if (!undoStack.length) return;
    redoStack.push({
      value: bodyInput.value,
      start: bodyInput.selectionStart,
      end: bodyInput.selectionEnd,
    });
    const s = undoStack.pop();
    bodyInput.value = s.value;
    bodyInput.selectionStart = s.start;
    bodyInput.selectionEnd = s.end;
    updatePreview();
    scheduleAutosave();
  }

  function redo() {
    if (!redoStack.length) return;
    undoStack.push({
      value: bodyInput.value,
      start: bodyInput.selectionStart,
      end: bodyInput.selectionEnd,
    });
    const s = redoStack.pop();
    bodyInput.value = s.value;
    bodyInput.selectionStart = s.start;
    bodyInput.selectionEnd = s.end;
    updatePreview();
    scheduleAutosave();
  }

  function applyWithHistory(textarea, action) {
    if (action === 'undo') { undo(); return; }
    if (action === 'redo') { redo(); return; }
    snapshot();
    applyAction(textarea, action);
    updatePreview();
    scheduleAutosave();
  }

  // Toolbar actions
  el.querySelector('.editor-full__toolbar').addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn) return;
    if (btn.dataset.action === 'upload-image') {
      imageInput.click();
      return;
    }
    applyWithHistory(bodyInput, btn.dataset.action);
  });

  // Keyboard shortcuts
  bodyInput.addEventListener('keydown', e => {
    // Undo: only intercept when custom stack has entries
    if ((e.ctrlKey || e.metaKey) && e.key === 'z' && !e.shiftKey && undoStack.length) {
      e.preventDefault();
      undo();
      return;
    }
    // Redo
    if ((e.ctrlKey || e.metaKey) && (e.key === 'y' || (e.key === 'z' && e.shiftKey)) && redoStack.length) {
      e.preventDefault();
      redo();
      return;
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'b') {
      e.preventDefault();
      applyWithHistory(bodyInput, 'bold');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
      e.preventDefault();
      applyWithHistory(bodyInput, 'italic');
    }
    if ((e.ctrlKey || e.metaKey) && e.key === 's') {
      e.preventDefault();
      el.querySelector('#editor-publish').click();
    }
    if (e.key === 'Tab') {
      e.preventDefault();
      snapshot();
      insertText(bodyInput, '  ');
      updatePreview();
      scheduleAutosave();
    }
  });

  // Buttons
  el.querySelector('#editor-back').addEventListener('click', () => {
    if (!isEdit) saveDraft();
    onCancel();
  });

  el.querySelector('#editor-discard').addEventListener('click', () => {
    if (!isEdit) remove(AUTOSAVE_KEY);
    onCancel();
  });

  el.querySelector('#editor-publish').addEventListener('click', () => {
    const title = titleInput.value.trim();
    const excerpt = excerptInput.value.trim();
    const body = injectExcerpt(bodyInput.value, excerpt);
    const labelsStr = labelsInput.value.trim();

    if (!title) {
      showToast('Title is required', 'error');
      titleInput.focus();
      return;
    }

    const labels = labelsStr
      ? labelsStr.split(',').map(s => s.trim()).filter(Boolean)
      : [];

    if (!isEdit) remove(AUTOSAVE_KEY);
    onSave({ title, body, labels });
  });

  function saveDraft() {
    if (titleInput.value.trim() || bodyInput.value.trim()) {
      set(AUTOSAVE_KEY, {
        title: titleInput.value,
        body: bodyInput.value,
        labels: labelsInput.value,
        excerpt: excerptInput.value,
      });
    }
  }

  return el;
}

function applyAction(textarea, action) {
  const start = textarea.selectionStart;
  const end = textarea.selectionEnd;
  const selected = textarea.value.substring(start, end);

  const actions = {
    bold:       { before: '**',  after: '**',  placeholder: 'bold text' },
    italic:     { before: '*',   after: '*',   placeholder: 'italic text' },
    heading:    { before: '\n## ', after: '',  placeholder: 'heading' },
    hr:         { before: '\n\n---\n\n', after: '', placeholder: '' },
    quote:      { before: '\n> ', after: '',   placeholder: 'quote' },
    ul:         { before: '\n- ', after: '',   placeholder: 'list item' },
    ol:         { before: '\n1. ', after: '',  placeholder: 'list item' },
    code:       { before: selected.includes('\n') ? '```\n' : '`',
                  after: selected.includes('\n') ? '\n```' : '`',
                  placeholder: 'code' },
    link:       { before: '[', after: '](url)', placeholder: 'link text' },
    image:      { before: '![', after: '](url)', placeholder: 'alt text' },
  };

  const a = actions[action];
  if (!a) return;

  const text = selected || a.placeholder;
  const insert = `${a.before}${text}${a.after}`;
  textarea.setRangeText(insert, start, end, 'end');
  textarea.focus();

  // Select the placeholder text if nothing was selected
  if (!selected && a.placeholder) {
    textarea.selectionStart = start + a.before.length;
    textarea.selectionEnd = start + a.before.length + a.placeholder.length;
  }
}

function insertText(textarea, text) {
  const start = textarea.selectionStart;
  textarea.setRangeText(text, start, start, 'end');
}

function escapeAttr(str) {
  return str.replace(/&/g, '&amp;').replace(/"/g, '&quot;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}

function escapeText(str) {
  return str.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
