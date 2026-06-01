const ALLOWED_TAGS = new Set([
  'p', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6',
  'a', 'img', 'ul', 'ol', 'li',
  'code', 'pre', 'blockquote', 'strong', 'em',
  'br', 'hr', 'span', 'div', 'table', 'thead',
  'tbody', 'tr', 'th', 'td', 'input',
]);

const ALLOWED_ATTRS = {
  a: ['href', 'title', 'target', 'rel'],
  img: ['src', 'alt', 'title', 'width', 'height'],
  input: ['type', 'checked', 'disabled'],
  '*': ['class'],
};

export function sanitize(html) {
  const template = document.createElement('template');
  template.innerHTML = html;
  sanitizeNode(template.content);
  return template.innerHTML;
}

function sanitizeNode(node) {
  const childNodes = [...node.childNodes];

  for (const child of childNodes) {
    if (child.nodeType === Node.TEXT_NODE) continue;

    if (child.nodeType === Node.COMMENT_NODE) {
      child.remove();
      continue;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) {
      child.remove();
      continue;
    }

    const tag = child.tagName.toLowerCase();

    if (!ALLOWED_TAGS.has(tag)) {
      const frag = document.createDocumentFragment();
      while (child.firstChild) frag.appendChild(child.firstChild);
      child.replaceWith(frag);
      sanitizeNode(frag.parentNode || node);
      continue;
    }

    for (const attr of [...child.attributes]) {
      const name = attr.name.toLowerCase();
      const tagAllowed = ALLOWED_ATTRS[tag] || [];
      const globalAllowed = ALLOWED_ATTRS['*'] || [];

      if (name.startsWith('on') || !([...tagAllowed, ...globalAllowed].includes(name))) {
        child.removeAttribute(attr.name);
      }

      if ((name === 'href' || name === 'src') && attr.value.trim().toLowerCase().startsWith('javascript:')) {
        child.removeAttribute(attr.name);
      }
    }

    if (tag === 'a') {
      child.setAttribute('target', '_blank');
      child.setAttribute('rel', 'noopener noreferrer');
    }

    sanitizeNode(child);
  }
}
