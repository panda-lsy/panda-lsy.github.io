import { fetchConfig } from '../api/github.js';
import { get, set } from '../utils/storage.js';

const API_BASE = 'https://meting.mikus.ink/api';
const STATE_KEY = 'music_player_state';
const audio = new Audio();
let state = {
  songs: [],
  currentIdx: -1,
  playing: false,
  panelOpen: false,
  visible: false,
  loading: false,
  muted: false,
};
let els = {};

function saveState() {
  set(STATE_KEY, {
    idx: state.currentIdx,
    time: audio.currentTime || 0,
    playing: state.playing,
    muted: state.muted,
    visible: state.visible,
  });
}

function loadSavedState() {
  const s = get(STATE_KEY);
  if (!s) return null;
  return s;
}

export async function initMusicPlayer(mount) {
  mount.innerHTML = `
    <button class="music-player__toggle is-hidden" title="Music Player">&#9835;</button>
    <div class="music-player">
      <div class="music-player__panel"></div>
      <div class="music-player__bar">
        <div class="music-player__cover"></div>
        <div class="music-player__info">
          <div class="music-player__title">No track</div>
          <div class="music-player__artist">&mdash;</div>
        </div>
        <div class="music-player__controls">
          <button class="music-player__btn" data-action="prev" title="Previous">&#9664;</button>
          <button class="music-player__btn music-player__btn--play" data-action="play" title="Play">&#9654;</button>
          <button class="music-player__btn" data-action="next" title="Next">&#9654;</button>
        </div>
        <div class="music-player__progress-wrap">
          <span class="music-player__time music-player__time--current">0:00</span>
          <div class="music-player__progress">
            <div class="music-player__progress-fill"></div>
          </div>
          <span class="music-player__time music-player__time--total">0:00</span>
        </div>
        <button class="music-player__btn" data-action="mute" title="Mute/Unmute">&#9834;</button>
        <button class="music-player__btn music-player__btn--list" data-action="list" title="Playlist">&#9776;</button>
        <button class="music-player__btn" data-action="minimize" title="Minimize">&#8722;</button>
      </div>
    </div>
  `;

  els = {
    toggle: mount.querySelector('.music-player__toggle'),
    player: mount.querySelector('.music-player'),
    panel: mount.querySelector('.music-player__panel'),
    cover: mount.querySelector('.music-player__cover'),
    title: mount.querySelector('.music-player__title'),
    artist: mount.querySelector('.music-player__artist'),
    playBtn: mount.querySelector('[data-action="play"]'),
    muteBtn: mount.querySelector('[data-action="mute"]'),
    progressFill: mount.querySelector('.music-player__progress-fill'),
    progress: mount.querySelector('.music-player__progress'),
    timeCurrent: mount.querySelector('.music-player__time--current'),
    timeTotal: mount.querySelector('.music-player__time--total'),
  };

  els.toggle.addEventListener('click', () => togglePlayer(true));
  mount.querySelector('[data-action="prev"]').addEventListener('click', prev);
  mount.querySelector('[data-action="play"]').addEventListener('click', togglePlay);
  mount.querySelector('[data-action="next"]').addEventListener('click', next);
  mount.querySelector('[data-action="list"]').addEventListener('click', togglePanel);
  mount.querySelector('[data-action="mute"]').addEventListener('click', toggleMute);
  mount.querySelector('[data-action="minimize"]').addEventListener('click', () => togglePlayer(false));
  els.progress.addEventListener('click', seek);

  audio.addEventListener('timeupdate', () => {
    updateProgress();
    // Save state periodically (every 5 seconds)
    if (Math.floor(audio.currentTime) % 5 === 0) saveState();
  });
  audio.addEventListener('ended', () => {
    next();
    saveState();
  });
  audio.addEventListener('loadedmetadata', () => {
    els.timeTotal.textContent = formatTime(audio.duration);
  });

  // Restore muted state
  const saved = loadSavedState();
  if (saved?.muted) {
    state.muted = true;
    audio.muted = true;
    els.muteBtn.innerHTML = '&#9834;<s>';
    els.muteBtn.style.opacity = '0.5';
  }

  await loadPlaylist();
}

export async function refreshMusicPlayer() {
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

  if (!playlistId) return;

  state.loading = true;
  els.toggle.classList.remove('is-hidden');

  try {
    const res = await fetch(`${API_BASE}?server=netease&type=playlist&id=${playlistId}`);
    if (!res.ok) throw new Error('Failed to fetch playlist');
    const songs = await res.json();

    if (!songs.length) return;

    state.songs = songs.map((s) => ({
      id: extractId(s.url),
      title: s.title,
      author: s.author,
      pic: s.pic,
      lrcUrl: s.lrc,
    }));

    renderPlaylist();

    // Restore saved state
    const saved = loadSavedState();
    const restoreIdx = saved?.idx >= 0 && saved.idx < state.songs.length ? saved.idx : 0;
    const restoreTime = saved?.time || 0;
    const shouldPlay = saved?.playing || false;
    const shouldShow = saved?.visible || false;

    state.currentIdx = restoreIdx;
    loadTrack(restoreIdx);

    // Restore playback position after audio loads
    if (restoreTime > 0) {
      const onLoaded = () => {
        audio.currentTime = restoreTime;
        audio.removeEventListener('loadedmetadata', onLoaded);
      };
      audio.addEventListener('loadedmetadata', onLoaded);
    }

    // Restore visibility
    if (shouldShow) {
      togglePlayer(true);
    }

    // Auto-play if was playing
    if (shouldPlay) {
      state.playing = true;
      els.playBtn.innerHTML = '&#9646;&#9646;';
      audio.play().catch(() => {
        // Browser may block autoplay; user needs to click play
        state.playing = false;
        els.playBtn.innerHTML = '&#9654;';
      });
    }
  } catch (err) {
    console.error('Music player: failed to load playlist', err);
  } finally {
    state.loading = false;
  }
}

function extractId(url) {
  try {
    return new URL(url).searchParams.get('id');
  } catch {
    return '';
  }
}

function loadTrack(idx) {
  if (idx < 0 || idx >= state.songs.length) return;
  state.currentIdx = idx;
  const song = state.songs[idx];

  els.title.textContent = song.title;
  els.artist.textContent = song.author;
  els.cover.innerHTML = song.pic
    ? `<img src="${song.pic}" alt="${song.title}" />`
    : '';

  audio.src = `${API_BASE}?server=netease&type=url&id=${song.id}`;
  els.progressFill.style.width = '0%';
  els.timeCurrent.textContent = '0:00';
  els.timeTotal.textContent = '0:00';

  updateActivePlaylistItem();
  saveState();
}

function togglePlayer(show) {
  state.visible = show !== undefined ? show : !state.visible;
  els.player.classList.toggle('is-visible', state.visible);
  els.toggle.classList.toggle('is-hidden', state.visible);
  document.body.classList.toggle('has-player', state.visible);
  saveState();
}

function togglePlay() {
  if (!state.songs.length) return;
  if (state.playing) {
    audio.pause();
    state.playing = false;
  } else {
    audio.play().catch(() => {});
    state.playing = true;
  }
  els.playBtn.innerHTML = state.playing ? '&#9646;&#9646;' : '&#9654;';
  saveState();
}

function toggleMute() {
  state.muted = !state.muted;
  audio.muted = state.muted;
  els.muteBtn.innerHTML = state.muted ? '&#9834;<s>' : '&#9834;';
  els.muteBtn.style.opacity = state.muted ? '0.5' : '';
  saveState();
}

function next() {
  if (!state.songs.length) return;
  const nextIdx = (state.currentIdx + 1) % state.songs.length;
  loadTrack(nextIdx);
  if (state.playing) audio.play().catch(() => {});
}

function prev() {
  if (!state.songs.length) return;
  const prevIdx = (state.currentIdx - 1 + state.songs.length) % state.songs.length;
  loadTrack(prevIdx);
  if (state.playing) audio.play().catch(() => {});
}

function seek(e) {
  if (!audio.duration) return;
  const rect = els.progress.getBoundingClientRect();
  const ratio = (e.clientX - rect.left) / rect.width;
  audio.currentTime = ratio * audio.duration;
}

function updateProgress() {
  if (!audio.duration) return;
  const pct = (audio.currentTime / audio.duration) * 100;
  els.progressFill.style.width = `${pct}%`;
  els.timeCurrent.textContent = formatTime(audio.currentTime);
}

function togglePanel() {
  state.panelOpen = !state.panelOpen;
  els.panel.classList.toggle('is-open', state.panelOpen);
}

function renderPlaylist() {
  els.panel.innerHTML = state.songs.map((song, i) => `
    <div class="music-player__playlist-item${i === state.currentIdx ? ' is-active' : ''}" data-idx="${i}">
      <span class="music-player__playlist-item__idx">${i + 1}</span>
      <div class="music-player__playlist-item__info">
        <div class="music-player__playlist-item__title">${escHtml(song.title)}</div>
        <div class="music-player__playlist-item__artist">${escHtml(song.author)}</div>
      </div>
    </div>
  `).join('');

  els.panel.querySelectorAll('.music-player__playlist-item').forEach(item => {
    item.addEventListener('click', () => {
      const idx = parseInt(item.dataset.idx);
      loadTrack(idx);
      state.playing = true;
      els.playBtn.innerHTML = '&#9646;&#9646;';
      audio.play().catch(() => {});
    });
  });
}

function updateActivePlaylistItem() {
  els.panel.querySelectorAll('.music-player__playlist-item').forEach((item, i) => {
    item.classList.toggle('is-active', i === state.currentIdx);
  });
}

function formatTime(sec) {
  if (!sec || isNaN(sec)) return '0:00';
  const m = Math.floor(sec / 60);
  const s = Math.floor(sec % 60);
  return `${m}:${s.toString().padStart(2, '0')}`;
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
