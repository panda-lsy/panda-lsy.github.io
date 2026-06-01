import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function killAllAnimations() {
  ScrollTrigger.getAll().forEach(t => t.kill());
  gsap.killTweensOf('*');
  // Force-clear any inline styles GSAP may have left
  document.querySelectorAll('[style*="opacity: 0"]').forEach(el => {
    el.style.opacity = '';
    el.style.transform = '';
  });
}

export function initScrollAnimations(pageEl) {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;

  // Use requestAnimationFrame to ensure DOM is fully rendered
  requestAnimationFrame(() => {
    const hero = pageEl.querySelector('.home-hero');
    const postsList = pageEl.querySelector('.posts-list');
    const postDetail = pageEl.querySelector('.post-detail__title');

    if (hero) animateHome(pageEl);
    if (postsList) animatePostsList(pageEl);
    if (postDetail) animatePostDetail(pageEl);
  });
}

function animateHome(pageEl) {
  const title = pageEl.querySelector('.home-hero__title');
  const tagline = pageEl.querySelector('.home-hero__tagline');
  const recentHeader = pageEl.querySelector('.home-recent__header');
  const cards = pageEl.querySelectorAll('.post-card');

  if (title) {
    gsap.fromTo(title,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, ease: 'power3.out' }
    );
  }

  if (tagline) {
    gsap.fromTo(tagline,
      { opacity: 0, y: 30 },
      { opacity: 1, y: 0, duration: 0.8, delay: 0.2, ease: 'power3.out' }
    );
  }

  if (recentHeader) {
    gsap.fromTo(recentHeader,
      { opacity: 0, x: -20 },
      {
        opacity: 1, x: 0, duration: 0.6, ease: 'power2.out',
        scrollTrigger: { trigger: recentHeader, start: 'top 85%', toggleActions: 'play none none none' },
      }
    );
  }

  if (cards.length) {
    gsap.fromTo(cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.6, stagger: 0.1, ease: 'power2.out',
        scrollTrigger: { trigger: cards[0], start: 'top 85%', toggleActions: 'play none none none' },
      }
    );
  }
}

function animatePostsList(pageEl) {
  const header = pageEl.querySelector('.posts-header__title');
  const cards = pageEl.querySelectorAll('.post-card');

  if (header) {
    gsap.fromTo(header,
      { opacity: 0, y: 20 },
      { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out' }
    );
  }

  if (cards.length) {
    gsap.fromTo(cards,
      { opacity: 0, y: 40 },
      {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: 'power2.out',
        scrollTrigger: { trigger: cards[0], start: 'top 85%', toggleActions: 'play none none none' },
      }
    );
  }
}

function animatePostDetail(pageEl) {
  const back = pageEl.querySelector('.post-detail__back');
  const title = pageEl.querySelector('.post-detail__title');
  const meta = pageEl.querySelector('.post-detail__meta');
  const bodyEls = pageEl.querySelectorAll('.post-detail__body > *');

  if (back) gsap.fromTo(back, { opacity: 0, x: -10 }, { opacity: 1, x: 0, duration: 0.4 });
  if (title) gsap.fromTo(title, { opacity: 0, y: 20 }, { opacity: 1, y: 0, duration: 0.6, ease: 'power2.out', delay: 0.1 });
  if (meta) gsap.fromTo(meta, { opacity: 0, y: 10 }, { opacity: 1, y: 0, duration: 0.5, delay: 0.2 });

  if (bodyEls.length) {
    gsap.fromTo(bodyEls,
      { opacity: 0, y: 20 },
      {
        opacity: 1, y: 0, duration: 0.5, stagger: 0.05, ease: 'power2.out',
        scrollTrigger: { trigger: bodyEls[0], start: 'top 90%', toggleActions: 'play none none none' },
      }
    );
  }
}
