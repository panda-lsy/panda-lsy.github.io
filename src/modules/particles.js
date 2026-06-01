let canvas, ctx, particles, animId;
let themeObserver = null;

const CONFIG = {
  maxParticles: 60,
  baseDensity: 18000,
  minRadius: 1,
  maxRadius: 2.5,
  driftSpeed: 0.15,
  linkDistance: 100,
  waveAmplitude: 0.3,
  waveFrequency: 0.001,
};

export function initParticles(container) {
  destroyParticles();

  canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
  container.prepend(canvas);

  ctx = canvas.getContext('2d');
  particles = [];

  resize();
  createParticles();
  bindEvents();
  animate();
}

export function destroyParticles() {
  if (animId) {
    cancelAnimationFrame(animId);
    animId = null;
  }
  if (canvas) {
    canvas.remove();
    canvas = null;
  }
  if (themeObserver) {
    themeObserver.disconnect();
    themeObserver = null;
  }
  unbindEvents();
}

function resize() {
  if (!canvas) return;
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
}

function createParticles() {
  const count = Math.min(CONFIG.maxParticles, Math.floor((canvas.width * canvas.height) / CONFIG.baseDensity));
  particles = [];
  for (let i = 0; i < count; i++) {
    particles.push({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      vx: (Math.random() - 0.5) * CONFIG.driftSpeed,
      vy: (Math.random() - 0.5) * CONFIG.driftSpeed,
      radius: CONFIG.minRadius + Math.random() * (CONFIG.maxRadius - CONFIG.minRadius),
      opacity: 0.15 + Math.random() * 0.35,
      phase: Math.random() * Math.PI * 2, // random phase for wave
    });
  }
}

function getColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    dot: isDark ? 255 : 100, // white dots on dark, gray on light
    line: isDark ? 255 : 100,
  };
}

function animate() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = getColors();
  const time = Date.now() * CONFIG.waveFrequency;

  // Update particles
  for (const p of particles) {
    // Gentle wave motion superimposed on drift
    const waveX = Math.sin(time + p.phase) * CONFIG.waveAmplitude;
    const waveY = Math.cos(time + p.phase * 1.3) * CONFIG.waveAmplitude;

    p.x += p.vx + waveX;
    p.y += p.vy + waveY;

    // Wrap around edges (no bounce, seamless)
    if (p.x < -10) p.x = canvas.width + 10;
    if (p.x > canvas.width + 10) p.x = -10;
    if (p.y < -10) p.y = canvas.height + 10;
    if (p.y > canvas.height + 10) p.y = -10;

    // Gentle breathing: opacity oscillates
    const breathe = 0.5 + 0.5 * Math.sin(time * 2 + p.phase);
    const finalOpacity = p.opacity * (0.6 + 0.4 * breathe);

    // Draw dot
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = `rgba(${colors.dot},${colors.dot},${colors.dot},${finalOpacity})`;
    ctx.fill();
  }

  // Draw links between nearby particles
  ctx.lineWidth = 0.4;
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.linkDistance) {
        const opacity = (1 - dist / CONFIG.linkDistance) * 0.2;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = `rgba(${colors.line},${colors.line},${colors.line},${opacity})`;
        ctx.stroke();
      }
    }
  }

  animId = requestAnimationFrame(animate);
}

function onResize() {
  resize();
  createParticles();
}

let bound = false;
function bindEvents() {
  if (bound) return;
  window.addEventListener('resize', onResize);
  bound = true;
  themeObserver = new MutationObserver(() => {});
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

function unbindEvents() {
  if (!bound) return;
  window.removeEventListener('resize', onResize);
  bound = false;
}
