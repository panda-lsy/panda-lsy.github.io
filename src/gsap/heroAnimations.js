import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

gsap.registerPlugin(ScrollTrigger);

export function setupHeroAnimations() {
  gsap.from('.hero__headline', {
    y: 36,
    opacity: 0,
    duration: 1,
    ease: 'power3.out',
  });

  gsap.from('.hero__subhead', {
    y: 24,
    opacity: 0,
    duration: 1,
    delay: 0.2,
    ease: 'power3.out',
  });

  gsap.to('.hero__canvas-shell', {
    yPercent: -12,
    ease: 'none',
    scrollTrigger: {
      trigger: '.hero',
      start: 'top top',
      end: 'bottom top',
      scrub: true,
    },
  });
}
