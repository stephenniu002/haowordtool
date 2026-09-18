(() => {
  const search = document.querySelector('#affiliate-product-search');
  const cards = [...document.querySelectorAll('[data-affiliate-product]')];
  const sections = [...document.querySelectorAll('[data-product-category]')];
  const count = document.querySelector('#affiliate-product-count');
  const empty = document.querySelector('#affiliate-product-empty');
  const categoryLinks = [...document.querySelectorAll('[data-category-jump]')];

  function update() {
    const term = (search?.value || '').trim().toLowerCase();
    let visible = 0;

    for (const card of cards) {
      const match = !term || card.textContent.toLowerCase().includes(term);
      card.hidden = !match;
      if (match) visible += 1;
    }

    for (const section of sections) {
      section.hidden = !section.querySelector('[data-affiliate-product]:not([hidden])');
    }

    if (count) count.textContent = String(visible);
    if (empty) empty.hidden = visible !== 0;
  }

  search?.addEventListener('input', update);
  search?.form?.addEventListener('submit', event => {
    event.preventDefault();
    update();
    document.querySelector('[data-affiliate-product]:not([hidden])')?.scrollIntoView({behavior: 'smooth', block: 'center'});
  });

  for (const link of categoryLinks) {
    link.addEventListener('click', () => {
      search.value = '';
      update();
    });
  }

  update();
})();
