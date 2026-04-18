export function setupInteractions() {
  const jumpLink = document.querySelector('[data-action="jump-about"]');

  if (!jumpLink) {
    return;
  }

  jumpLink.addEventListener('click', () => {
    document.querySelector('#about')?.scrollIntoView({ behavior: 'smooth' });
  });
}
