import { marked } from 'marked';
import { sanitize } from './sanitize.js';

marked.setOptions({
  breaks: true,
  gfm: true,
});

export function renderMarkdown(text) {
  const raw = marked.parse(text || '');
  return sanitize(raw);
}
