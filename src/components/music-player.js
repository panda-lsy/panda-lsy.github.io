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

  playerEl.querySelector('.music-player__toggle').addEventListener('click', () => toggle());
  playerEl.querySelector('.music-player__close').addEventListener('click', () => toggle(false));

  await loadPlaylist();
}

export async function refreshMusicPlayer() {
  if (!playerEl) return;
  await loadPlaylist();
}

async function loadPlaylist() {
  let playlistId = null;

  try {
    const config = await fetchConfig();
    playlistId = config.musicPlaylistId || null;
    if (playlistId) set('music_playlist_id', playlistId);
  } catch {
    playlistId = get('music_playlist_id');
  }

  if (playlistId) {
    playerEl.classList.remove('is-hidden');
    playerEl.dataset.playlistId = playlistId;
  } else {
    playerEl.classList.add('is-hidden');
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
