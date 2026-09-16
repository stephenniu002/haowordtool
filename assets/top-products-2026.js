(() => {
  const search = document.querySelector('#product-search');
  const filters = [...document.querySelectorAll('[data-category-filter]')];
  const cards = [...document.querySelectorAll('[data-product-card]')];
  const count = document.querySelector('#visible-count');
  if (!search || !cards.length) return;

  let activeCategory = 'all';

  function applyFilters() {
    const query = search.value.trim().toLowerCase();
    let visible = 0;
    for (const card of cards) {
      const categoryMatch = activeCategory === 'all' || card.dataset.category === activeCategory;
      const textMatch = !query || card.textContent.toLowerCase().includes(query);
      const show = categoryMatch && textMatch;
      card.hidden = !show;
      if (show) visible += 1;
    }
    count.textContent = String(visible);
  }

  search.addEventListener('input', applyFilters);
  filters.forEach(button => {
    button.addEventListener('click', () => {
      activeCategory = button.dataset.categoryFilter;
      filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
      applyFilters();
    });
  });
})();
