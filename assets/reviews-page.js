(() => {
 const pages=[...document.querySelectorAll('.page')];
 const tabs=[...document.querySelectorAll('#tabsBar .tab')];
 function select(id){const target=pages.find(p=>p.id==='page-'+id)||pages[0];for(const p of pages){p.hidden=p!==target;p.classList.toggle('active',p===target)}for(const t of tabs){const active=t.dataset.page===target.id.slice(5);t.classList.toggle('active',active);t.setAttribute('aria-pressed',String(active));t.setAttribute('aria-controls','page-'+t.dataset.page)}return target;}
 function route(){const hash=location.hash.slice(1);const page=pages.find(p=>hash===p.id.slice(5)||hash.startsWith(p.id.slice(5)+'-'));select(page?.id.slice(5));if(hash&&document.getElementById(hash))document.getElementById(hash).scrollIntoView();}
 tabs.forEach(t=>t.addEventListener('click',()=>{select(t.dataset.page);location.hash=t.dataset.page;}));
 window.addEventListener('hashchange',route);route();
})();
