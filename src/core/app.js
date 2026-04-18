import { createGlobalState } from './state';
import { PortfolioScene } from '../three/scene';
import { setupHeroAnimations } from '../gsap/heroAnimations';
import { createFarmSystem } from '../modules/farmSystem';
import { setupInteractions } from '../modules/interactions';

function renderLayout(root) {
  root.innerHTML = `
    <main class="site-shell">
      <section class="hero">
        <div class="hero__content">
          <p class="hero__eyebrow">Interactive Portfolio Scaffold</p>
          <h1 class="hero__headline">Build immersive stories for the web.</h1>
          <p class="hero__subhead">
            Vite + Vanilla JS starter with modular animation, 3D, and interaction layers.
          </p>
          <button class="hero__cta" type="button" data-action="jump-about">Explore structure</button>
        </div>
        <div class="hero__canvas-shell" aria-label="3D canvas placeholder">
          <div id="three-canvas" class="hero__canvas"></div>
        </div>
      </section>

      <section id="about" class="content-block">
        <h2>Scalable module-first architecture</h2>
        <p>
          Core app lifecycle, isolated animation systems, and dedicated scene controllers are split
          for maintainable growth.
        </p>
      </section>
    </main>
  `;
}

export function createApp() {
  const root = document.querySelector('#app');
  if (!root) {
    return;
  }

  renderLayout(root);

  const state = createGlobalState();

  state.modules.set('farm', createFarmSystem());

  const scene = new PortfolioScene();
  const canvasHost = document.querySelector('#three-canvas');
  if (canvasHost) {
    state.three = scene.init(canvasHost);
  }

  setupHeroAnimations();
  setupInteractions();

  return state;
}
