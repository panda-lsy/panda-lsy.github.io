let canvas, ctx, particles, animId, mouse;
let themeObserver = null;

const CONFIG = {
  maxParticles: 80,
  baseDensity: 15000,
  radius: 1.5,
  speed: 0.3,
  linkDistance: 120,
  mouseRadius: 150,
};

export function initParticles(container) {
  // Only show on home page
  destroyParticles();

  canvas = document.createElement('canvas');
  canvas.style.cssText = 'position:fixed;inset:0;z-index:0;pointer-events:none;';
  container.prepend(canvas);

  ctx = canvas.getContext('2d');
  mouse = { x: -1000, y: -1000 };
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
      vx: (Math.random() - 0.5) * CONFIG.speed,
      vy: (Math.random() - 0.5) * CONFIG.speed,
    });
  }
}

function getColors() {
  const isDark = document.documentElement.getAttribute('data-theme') === 'dark';
  return {
    particle: isDark ? 'rgba(255,255,255,0.2)' : 'rgba(128,128,128,0.3)',
    line: isDark ? 'rgba(255,255,255,' : 'rgba(128,128,128,',
  };
}

function animate() {
  if (!canvas || !ctx) return;
  ctx.clearRect(0, 0, canvas.width, canvas.height);

  const colors = getColors();

  // Update & draw particles
  for (const p of particles) {
    p.x += p.vx;
    p.y += p.vy;

    // Bounce off edges
    if (p.x < 0 || p.x > canvas.width) p.vx *= -1;
    if (p.y < 0 || p.y > canvas.height) p.vy *= -1;

    // Mouse attraction
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CONFIG.mouseRadius && dist > 0) {
      const force = (CONFIG.mouseRadius - dist) / CONFIG.mouseRadius * 0.01;
      p.vx += dx * force;
      p.vy += dy * force;
    }

    // Clamp speed
    const speed = Math.sqrt(p.vx * p.vx + p.vy * p.vy);
    if (speed > CONFIG.speed * 2) {
      p.vx = (p.vx / speed) * CONFIG.speed * 2;
      p.vy = (p.vy / speed) * CONFIG.speed * 2;
    }

    ctx.beginPath();
    ctx.arc(p.x, p.y, CONFIG.radius, 0, Math.PI * 2);
    ctx.fillStyle = colors.particle;
    ctx.fill();
  }

  // Draw links
  for (let i = 0; i < particles.length; i++) {
    for (let j = i + 1; j < particles.length; j++) {
      const dx = particles[i].x - particles[j].x;
      const dy = particles[i].y - particles[j].y;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < CONFIG.linkDistance) {
        const opacity = (1 - dist / CONFIG.linkDistance) * 0.4;
        ctx.beginPath();
        ctx.moveTo(particles[i].x, particles[i].y);
        ctx.lineTo(particles[j].x, particles[j].y);
        ctx.strokeStyle = colors.line + opacity + ')';
        ctx.lineWidth = 0.5;
        ctx.stroke();
      }
    }
  }

  // Draw mouse links
  for (const p of particles) {
    const dx = mouse.x - p.x;
    const dy = mouse.y - p.y;
    const dist = Math.sqrt(dx * dx + dy * dy);
    if (dist < CONFIG.mouseRadius) {
      const opacity = (1 - dist / CONFIG.mouseRadius) * 0.3;
      ctx.beginPath();
      ctx.moveTo(p.x, p.y);
      ctx.lineTo(mouse.x, mouse.y);
      ctx.strokeStyle = colors.line + opacity + ')';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    }
  }

  animId = requestAnimationFrame(animate);
}

function onMouseMove(e) {
  mouse.x = e.clientX;
  mouse.y = e.clientY;
}

function onMouseLeave() {
  mouse.x = -1000;
  mouse.y = -1000;
}

function onResize() {
  resize();
  createParticles();
}

let bound = false;
function bindEvents() {
  if (bound) return;
  window.addEventListener('mousemove', onMouseMove);
  window.addEventListener('mouseleave', onMouseLeave);
  window.addEventListener('resize', onResize);
  bound = true;

  // Watch theme changes
  themeObserver = new MutationObserver(() => {}); // Colors are read each frame
  themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
}

function unbindEvents() {
  if (!bound) return;
  window.removeEventListener('mousemove', onMouseMove);
  window.removeEventListener('mouseleave', onMouseLeave);
  window.removeEventListener('resize', onResize);
  bound = false;
}
