export function createPagination({ page, hasMore, onChange }) {
  const nav = document.createElement('nav');
  nav.className = 'pagination';

  const prevDisabled = page <= 1;

  nav.innerHTML = `
    <button class="pagination__btn ${prevDisabled ? 'is-disabled' : ''}" data-action="prev">&larr; Previous</button>
    <span class="pagination__info">Page ${page}</span>
    <button class="pagination__btn ${!hasMore ? 'is-disabled' : ''}" data-action="next">Next &rarr;</button>
  `;

  nav.addEventListener('click', e => {
    const btn = e.target.closest('[data-action]');
    if (!btn || btn.classList.contains('is-disabled')) return;

    const action = btn.dataset.action;
    if (action === 'prev' && page > 1) onChange(page - 1);
    if (action === 'next' && hasMore) onChange(page + 1);
  });

  return nav;
}
