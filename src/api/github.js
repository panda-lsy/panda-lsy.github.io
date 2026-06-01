import { REPO_OWNER, REPO_NAME, CONFIG_LABEL, DRAFT_LABEL, CACHE_TTL } from './config.js';
import { get, set } from '../utils/storage.js';

const BASE_URL = 'https://api.github.com';
const cache = new Map();

function getPat() {
  return get('gh_pat');
}

function cacheKey(parts) {
  return parts.join(':');
}

function getCached(key) {
  const entry = cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.time > CACHE_TTL) {
    cache.delete(key);
    return null;
  }
  return entry.data;
}

function setCache(key, data) {
  cache.set(key, { data, time: Date.now() });
}

async function request(path, { method = 'GET', body, auth = false } = {}) {
  const headers = { 'Accept': 'application/vnd.github.v3+json' };
  const pat = getPat();

  if (pat) {
    headers['Authorization'] = `Bearer ${pat}`;
  }

  if (body) {
    headers['Content-Type'] = 'application/json';
  }

  const res = await fetch(`${BASE_URL}${path}`, {
    method,
    headers,
    body: body ? JSON.stringify(body) : undefined,
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => 'Unknown error');
    throw new Error(`GitHub API ${res.status}: ${msg}`);
  }

  if (res.status === 204) return null;
  return res.json();
}

export async function fetchPosts({ page = 1, perPage = 10, state = 'open' } = {}) {
  const key = cacheKey(['posts', state, page, perPage]);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await request(
    `/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=${state}&per_page=100&page=1&sort=created&direction=desc`
  );

  const posts = data
    .filter(issue => {
      const labels = issue.labels.map(l => l.name);
      return !labels.includes(CONFIG_LABEL) && !labels.includes(DRAFT_LABEL);
    })
    .map(normalizeIssue);

  const start = (page - 1) * perPage;
  const sliced = posts.slice(start, start + perPage);
  const hasMore = start + perPage < posts.length;

  const result = { posts: sliced, hasMore, total: posts.length };
  setCache(key, result);
  return result;
}

export async function fetchPost(number) {
  const key = cacheKey(['post', number]);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await request(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${number}`);
  const post = normalizeIssue(data);
  setCache(key, post);
  return post;
}

export async function createPost({ title, body, labels = [] }) {
  if (!labels.includes('post')) labels.push('post');
  const data = await request(`/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
    method: 'POST',
    body: { title, body, labels },
    auth: true,
  });
  invalidatePostCache();
  return normalizeIssue(data);
}

export async function updatePost(number, { title, body, labels }) {
  const payload = {};
  if (title !== undefined) payload.title = title;
  if (body !== undefined) payload.body = body;
  if (labels !== undefined) payload.labels = labels;

  const data = await request(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${number}`, {
    method: 'PATCH',
    body: payload,
    auth: true,
  });
  invalidatePostCache();
  return normalizeIssue(data);
}

export async function closePost(number) {
  await request(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${number}`, {
    method: 'PATCH',
    body: { state: 'closed' },
    auth: true,
  });
  invalidatePostCache();
}

export async function reopenPost(number) {
  await request(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${number}`, {
    method: 'PATCH',
    body: { state: 'open' },
    auth: true,
  });
  invalidatePostCache();
}

export async function verifyPat(pat) {
  const res = await fetch(`${BASE_URL}/user`, {
    headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github.v3+json' },
  });
  if (!res.ok) return null;
  return res.json();
}

export async function checkAdminAccess(pat) {
  const user = await verifyPat(pat);
  if (!user) return null;

  // Repo owner always has access
  if (user.login === REPO_OWNER) return user;

  // Check if user is a collaborator
  try {
    const res = await fetch(
      `${BASE_URL}/repos/${REPO_OWNER}/${REPO_NAME}/collaborators/${user.login}`,
      { headers: { 'Authorization': `Bearer ${pat}`, 'Accept': 'application/vnd.github.v3+json' } }
    );
    if (res.status === 204) return user;
  } catch {}

  return null; // Not authorized
}

export async function fetchAllPosts() {
  const key = cacheKey(['all-posts']);
  const cached = getCached(key);
  if (cached) return cached;

  const data = await request(
    `/repos/${REPO_OWNER}/${REPO_NAME}/issues?state=all&per_page=100&sort=created&direction=desc`
  );

  const posts = data
    .filter(issue => {
      const labels = issue.labels.map(l => l.name);
      return !labels.includes(CONFIG_LABEL);
    })
    .map(normalizeIssue);

  setCache(key, posts);
  return posts;
}

export async function fetchConfig() {
  const key = cacheKey(['config']);
  const cached = getCached(key);
  if (cached) return cached;

  try {
    const data = await request(
      `/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=${CONFIG_LABEL}&per_page=1`
    );
    if (data.length > 0) {
      try {
        const config = JSON.parse(data[0].body || '{}');
        config._issueNumber = data[0].number;
        setCache(key, config);
        set('site_config_cache', config);
        return config;
      } catch {
        return get('site_config_cache') || {};
      }
    }
    return {};
  } catch {
    return get('site_config_cache') || {};
  }
}

export async function saveConfig(config) {
  const existing = await request(
    `/repos/${REPO_OWNER}/${REPO_NAME}/issues?labels=${CONFIG_LABEL}&per_page=1`
  );

  const body = JSON.stringify(config, null, 2);

  if (existing.length > 0) {
    await request(`/repos/${REPO_OWNER}/${REPO_NAME}/issues/${existing[0].number}`, {
      method: 'PATCH',
      body: { body },
      auth: true,
    });
  } else {
    await request(`/repos/${REPO_OWNER}/${REPO_NAME}/issues`, {
      method: 'POST',
      body: { title: 'Site Configuration', body, labels: [CONFIG_LABEL] },
      auth: true,
    });
  }

  invalidatePostCache();
}

function normalizeIssue(issue) {
  return {
    number: issue.number,
    title: issue.title,
    body: issue.body || '',
    date: issue.created_at,
    updatedAt: issue.updated_at,
    labels: issue.labels.map(l => l.name),
    author: issue.user?.login || 'unknown',
    state: issue.state,
  };
}

function invalidatePostCache() {
  for (const key of cache.keys()) {
    if (key.startsWith('posts:') || key.startsWith('post:') || key.startsWith('all-posts:') || key === 'config') {
      cache.delete(key);
    }
  }
}
