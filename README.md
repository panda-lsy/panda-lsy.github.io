# panda-lsy.github.io

Modern, scalable frontend scaffold for an interactive portfolio built with **Vite + Vanilla JavaScript**.

## Tech stack

- Vite (build/dev tooling)
- Vanilla JavaScript (modular architecture)
- GSAP + ScrollTrigger (animation orchestration)
- Three.js (3D scene rendering)
- Rive-ready controller layer (`src/rive`) for future runtime wiring

## Project structure

```text
src/
  core/      # app bootstrap + shared state
  three/     # Three.js scene setup and lifecycle
  gsap/      # GSAP animation timelines and scroll triggers
  rive/      # Rive controller scaffolding
  modules/   # feature modules (farm system, interactions)
  assets/    # static assets, textures, models
```

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - production build
- `npm run preview` - preview production build

## Getting started

```bash
npm install
npm run dev
```

Open the URL printed by Vite (default: `http://localhost:5173`).

## Notes

- Landing page includes a fullscreen hero, a Three.js canvas placeholder container, and smooth scrolling (`scroll-behavior: smooth`).
- Rive integration is intentionally scaffolded behind `src/rive/riveController.js`, so runtime-specific wiring can be added without touching app initialization flow.
