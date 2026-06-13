import { getSiteValue } from '../api/site-config.js';
import { initScrollAnimations } from '../modules/scroll-animations.js';

const PROJECTS = [
  {
    name: 'ChemVision',
    desc: '让大模型「能画化学」，更让用户「能改化学」。基于 Dart 开发的化学结构可视化与 AI 绘图工具。',
    lang: 'Dart',
    url: 'https://github.com/panda-lsy/ChemVision',
    demo: 'https://chemvision.qzz.io/',
    tags: ['AI', 'Chemistry', 'Dart'],
  },
  {
    name: 'SVL - Stardew Valley Launcher',
    desc: '一站式星露谷物语启动器，集成 Mod 管理器和 Modpack 工具，让游戏模组管理变得简单。',
    lang: 'C#',
    url: 'https://github.com/panda-lsy/SVL-StardewValleyLauncher',
    demo: 'https://svl.qzz.io/',
    tags: ['Game', 'C#', 'Mod Manager'],
    stars: 9,
  },
  {
    name: 'ChainGuard · 链智护',
    desc: '面向 AI 训练数据安全与版权保护的微服务系统，包含认证、版权管理、特征提取、对抗扰动和侵权检测。支持 Web / Windows / Android 多端。',
    lang: 'Docker + React + Python',
    url: null,
    demo: 'https://chainguard.qzz.io/',
    tags: ['AI Safety', 'Copyright', 'Microservices'],
  },
];

export function renderProjects(app) {
  const cardsHtml = PROJECTS.map((p, i) => {
    const tagsHtml = p.tags.map(t => `<span class="tag">${escHtml(t)}</span>`).join('');
    const ghLink = p.url
      ? `<a class="project-card__link" href="${p.url}" target="_blank" rel="noopener noreferrer">GitHub &rarr;</a>`
      : `<span class="project-card__link project-card__link--local">Local Project</span>`;
    const demoLink = p.demo
      ? `<a class="project-card__link project-card__link--demo" href="${p.demo}" target="_blank" rel="noopener noreferrer">View Demo &rarr;</a>`
      : '';
    const starsHtml = p.stars ? `<span class="project-card__stars">&#9733; ${p.stars}</span>` : '';

    return `
      <article class="project-card">
        <div class="project-card__header">
          <h3 class="project-card__name">${escHtml(p.name)}</h3>
          ${starsHtml}
        </div>
        <p class="project-card__desc">${escHtml(p.desc)}</p>
        <div class="project-card__meta">
          <span class="project-card__lang">${escHtml(p.lang)}</span>
          ${tagsHtml}
        </div>
        <div class="project-card__links">
          ${ghLink}
          ${demoLink}
        </div>
      </article>
    `;
  }).join('');

  app.innerHTML = `
    <div class="page">
      <div class="container">
        <div class="projects-header">
          <h1 class="projects-header__title">Projects</h1>
        </div>
        <div class="projects-list">${cardsHtml}</div>
      </div>
    </div>
  `;

  document.title = `Projects - ${getSiteValue('siteName')}`;
  initScrollAnimations(app);
}

function escHtml(str) {
  const d = document.createElement('div');
  d.textContent = str;
  return d.innerHTML;
}
