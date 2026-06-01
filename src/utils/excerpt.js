// Excerpt stored as HTML comment at the top of issue body
// Format: <!-- excerpt: This is the summary text -->
const EXCERPT_RE = /^<!--\s*excerpt:\s*(.*?)\s*-->\s*\n?/;

export function extractExcerpt(body) {
  const match = body?.match(EXCERPT_RE);
  return match ? match[1].trim() : '';
}

export function stripExcerpt(body) {
  return body?.replace(EXCERPT_RE, '') || body || '';
}

export function injectExcerpt(body, excerpt) {
  const clean = stripExcerpt(body);
  if (!excerpt) return clean;
  return `<!-- excerpt: ${excerpt} -->\n${clean}`;
}
