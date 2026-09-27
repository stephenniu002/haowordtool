(() => {
  const products = JSON.parse(document.getElementById('sb-data').textContent);
  const bySlug = new Map(products.map(product => [product.slug, product]));
  const grid = document.querySelector('.sb-grid');
  const cards = [...grid.children];
  const search = document.getElementById('sb-search');
  const category = document.getElementById('sb-category');
  const sort = document.getElementById('sb-sort');
  const dialog = document.getElementById('sb-dialog');
  let opener;
  function filter() {
    const terms = search.value.trim().toLowerCase().split(/\s+/).filter(Boolean);
    let visible = 0;
    const ordered = [...cards];
    if (sort.value === 'title') ordered.sort((a, b) => a.dataset.title.localeCompare(b.dataset.title));
    if (sort.value === 'price') ordered.sort((a, b) => Number(a.dataset.price) - Number(b.dataset.price));
    for (const card of ordered) {
      card.hidden = !((!category.value || card.dataset.category === category.value) && terms.every(term => card.dataset.search.includes(term)));
      if (!card.hidden) visible++;
      grid.append(card);
    }
    document.getElementById('sb-count').textContent = `${visible} ${visible === 1 ? 'skill' : 'skills'}`;
    document.getElementById('sb-empty').hidden = visible > 0;
  }
  search.addEventListener('input', filter);
  category.addEventListener('change', filter);
  sort.addEventListener('change', filter);
  document.getElementById('sb-reset').addEventListener('click', () => {
    search.value = ''; category.value = ''; sort.value = 'default'; filter(); search.focus();
  });
  const set = (id, value) => { document.getElementById(id).textContent = value; };
  function openSkill(slug) {
    const product = bySlug.get(slug);
    if (!product) return;
    if (!dialog.open) opener = document.activeElement;
    set('sb-dialog-title', product.title);
    set('sb-dialog-category', product.category);
    set('sb-dialog-outcome', `Create ${product.outcome}.`);
    set('sb-dialog-audience', product.audience);
    set('sb-dialog-inputs', product.inputs);
    set('sb-dialog-price', `$${product.price} USD`);
    set('sb-dialog-example', product.example + '.');
    set('sb-dialog-acceptance', 'Quality check: ' + product.acceptance + '.');
    const image = document.getElementById('sb-dialog-image');
    image.src = product.image; image.alt = product.title + ' workflow cover';
    const list = document.getElementById('sb-dialog-steps');
    list.replaceChildren(...product.steps.map(step => { const li = document.createElement('li'); li.textContent = step + '.'; return li; }));
    document.getElementById('sb-buy').href = product.checkout;
    const source = document.getElementById('sb-dialog-source');
    source.href = 'https://github.com/' + product.repository;
    source.textContent = product.repository;
    dialog.querySelector('.sb-example').open = false;
    if (!dialog.open) dialog.showModal();
    dialog.scrollTop = 0;
  }
  document.addEventListener('click', event => {
    const link = event.target.closest('[data-skill]');
    if (!link) return;
    event.preventDefault();
    history.pushState(null, '', '#' + link.dataset.skill);
    openSkill(link.dataset.skill);
  });
  function closeSkill() { dialog.close(); }
  dialog.querySelector('.sb-close').addEventListener('click', closeSkill);
  dialog.addEventListener('click', event => {
    if (event.target !== dialog) return;
    const rect = dialog.getBoundingClientRect();
    if (event.clientX < rect.left || event.clientX > rect.right || event.clientY < rect.top || event.clientY > rect.bottom) closeSkill();
  });
  dialog.addEventListener('close', () => {
    if (bySlug.has(location.hash.slice(1))) history.replaceState(null, '', location.pathname + location.search);
    opener?.focus();
  });
  function followHash() {
    const slug = location.hash.slice(1);
    if (bySlug.has(slug)) openSkill(slug);
    else if (dialog.open) dialog.close();
  }
  window.addEventListener('hashchange', followHash);
  window.addEventListener('popstate', followHash);
  followHash();
})();
