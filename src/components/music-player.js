import { fetchConfig } from '../api/github.js';
import { get, set } from '../utils/storage.js';

let playerEl = null;
let expanded = false;
let iframeLoaded = false;

export async function initMusicPlayer(mount) {
  playerEl = document.createElement('div');
  playerEl.className = 'music-player is-hidden';
  playerEl.innerHTML = `
    <div class="music-player__container">
      <button class="music-player__close">&times;</button>
      <div class="music-player__iframe-wrap"></div>
    </div>
    <button class="music-player__toggle" title="Music">&#9835;</button>
  `;

  mount.appendChild(playerEl);

  const toggleBtn = playerEl.querySelector('.music-player__toggle');
  const closeBtn = playerEl.querySelector('.music-player__close');

  toggleBtn.addEventListener('click', () => toggle());
  closeBtn.addEventListener('click', () => toggle(false));

  let playlistId = null;

  try {
    const config = await fetchConfig();
    playlistId = config.musicPlaylistId;
    if (playlistId) {
      get('site_config_cache');
    }
  } catch {
    const cached = get('site_config_cache');
    playlistId = cached?.musicPlaylistId;
  }

  if (playlistId) {
    playerEl.classList.remove('is-hidden');
    playerEl.dataset.playlistId = playlistId;
  }

  const savedState = get('music_player_expanded');
  if (savedState && playlistId) {
    toggle(true);
  }
}

function toggle(forceState) {
  if (!playerEl) return;

  expanded = forceState !== undefined ? forceState : !expanded;
  playerEl.classList.toggle('is-expanded', expanded);

  set('music_player_expanded', expanded);

  if (expanded && !iframeLoaded) {
    const playlistId = playerEl.dataset.playlistId;
    if (!playlistId) return;

    const wrap = playerEl.querySelector('.music-player__iframe-wrap');
    const iframe = document.createElement('iframe');
    iframe.className = 'music-player__iframe';
    iframe.src = `https://music.163.com/outchain/player?type=0&id=${playlistId}&auto=0&height=430`;
    iframe.allow = 'autoplay';
    wrap.appendChild(iframe);
    iframeLoaded = true;
  }
}
