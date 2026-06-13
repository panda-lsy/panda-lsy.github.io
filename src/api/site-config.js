// Site config service — single source of truth for configurable text
import { fetchConfig, saveConfig as saveConfigApi } from './github.js';
import { get, set } from '../utils/storage.js';

const DEFAULTS = {
  siteName: 'panda-lsy',
  heroTitle: 'panda-lsy',
  heroTagline: 'Thoughts, code, and everything in between.',
  recentTitle: 'Recent Posts',
  recentLink: 'View all',
  friendsTitle: 'Friends',
  friendsLinks: JSON.stringify([
    { name: '阈启科技', url: 'http://limnov.com/' }
  ]),
  footerText: 'Built with simplicity.',
  aboutContent: '',
  musicPlaylistId: '',
};

let cached = null;

export async function loadSiteConfig() {
  try {
    const remote = await fetchConfig();
    cached = { ...DEFAULTS, ...remote };
  } catch {
    cached = { ...DEFAULTS, ...(get('site_config_cache') || {}) };
  }
  return cached;
}

export function getSiteConfig() {
  if (cached) return cached;
  const saved = get('site_config_cache');
  cached = { ...DEFAULTS, ...saved };
  return cached;
}

export function getSiteValue(key) {
  return getSiteConfig()[key] ?? DEFAULTS[key] ?? '';
}

export async function saveSiteConfig(updates) {
  const current = getSiteConfig();
  const merged = { ...current, ...updates };
  delete merged._issueNumber; // don't save internal field
  await saveConfigApi(merged);
  cached = merged;
}
