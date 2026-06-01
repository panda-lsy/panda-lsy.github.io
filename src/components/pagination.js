export function createPagination({ page, hasMore, onChange }) {
  const nav = document.createElement('nav');
  nav.className = 'pagination';

  const prevDisabled = page <= 1;
  const nextDisabled = !hasMore;

  nav.innerHTML = `
    <button class="pagination__btn pagination__btn--prev ${prevDisabled ? 'is-disabled' : ''}" data-action="prev">
      <span class="pagination__arrow">&larr;</span> Previous
    </button>
    <span class="pagination__info">Page ${page}</span>
    <button class="pagination__btn pagination__btn--next ${nextDisabled ? 'is-disabled' : ''}" data-action="next">
      Next <span class="pagination__arrow">&rarr;</span>
    </button>
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
