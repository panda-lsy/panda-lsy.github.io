import { loadSiteConfig, getSiteValue } from '../api/site-config.js';
import { renderMarkdown } from '../utils/markdown.js';
import { initScrollAnimations } from '../modules/scroll-animations.js';

const DEFAULT_ABOUT = `## 关于我

我是 **panda-lsy**，一名热爱技术与创造的开发者。

专注于前端开发、桌面应用和 AI 应用领域，喜欢用代码解决实际问题。

## 技能

- **前端**: JavaScript, TypeScript, React, Vue, CSS
- **桌面**: C#, WPF, Electron, Tauri
- **后端**: Node.js, Python, Docker, PostgreSQL
- **AI/ML**: 大模型应用开发, 图像处理

## 联系

- GitHub: [panda-lsy](https://github.com/panda-lsy)
- Email: shengxia23@hainnu.edu.cn
`;

export async function renderAbout(app) {
  await loadSiteConfig();
  const content = getSiteValue('aboutContent') || DEFAULT_ABOUT;
  const html = renderMarkdown(content);

  app.innerHTML = `
    <div class="page">
      <div class="container">
        <div class="about-page">
          <div class="about-content post-detail__body">${html}</div>
        </div>
      </div>
    </div>
  `;

  document.title = `About - ${getSiteValue('siteName')}`;
  initScrollAnimations(app);
}
