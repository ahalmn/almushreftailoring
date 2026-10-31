'use strict';
let products = [], activeFilter = 'all', message = '';
const grid = document.querySelector('#product-grid');
const dialog = document.querySelector('#product-dialog');
const form = document.querySelector('#enquiry-form');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const formatPrice = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? 'AED ' + value.toLocaleString('en-AE', {minimumFractionDigits:2, maximumFractionDigits:2}) : null;
function priceMarkup(p) {
  const retail = formatPrice(p.retailPrice), wholesale = formatPrice(p.wholesalePrice);
  return [retail && `<span class="price-line">Retail ${retail}</span>`, wholesale && `<span class="price-line">Wholesale ${wholesale} / piece</span>`].filter(Boolean).join('') || 'Enquire for details & pricing';
}
function visual(p) {
  if (p.image && /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp|avif)$/i.test(p.image)) {
    return `<img src="assets/${escapeHtml(p.image)}" alt="${escapeHtml(p.alt || p.name)}" loading="lazy" width="800" height="1100">`;
  }
  return `<div class="fabric ${p.fabric === 'emb' ? 'emb' : 'plain'}" role="img" aria-label="Illustrative ${escapeHtml(p.name)} fabric styling"><span>ILLUSTRATIVE FABRIC STYLING</span></div>`;
}
function productWhatsApp(p) {
  const text = `Hello AL MUSHREF, I am interested in ${p.name}${p.code ? ' (' + p.code + ')' : ''}. Please share available sizes, colours, retail and wholesale prices, and delivery details.`;
  return 'https://wa.me/971502002394?text=' + encodeURIComponent(text);
}
function render() {
  grid.innerHTML = products.map((p,i) => ({p,i})).filter(({p}) => activeFilter === 'all' || p.category === activeFilter).map(({p,i}) => `<article class="product-card"><button type="button" data-product="${i}" aria-label="Explore ${escapeHtml(p.name)}"><div class="product-picture">${visual(p)}</div><span class="card-label">${escapeHtml(p.label)}</span><p class="category">${escapeHtml(p.category.toUpperCase())}</p><h3>${escapeHtml(p.name)}</h3><div class="card-bottom"><span>${priceMarkup(p)}</span><span class="card-arrow" aria-hidden="true">↗</span></div></button><a class="quick-contact" href="${escapeHtml(productWhatsApp(p))}" target="_blank" rel="noopener" aria-label="WhatsApp enquiry about ${escapeHtml(p.name)}">WhatsApp enquiry <span aria-hidden="true">↗</span></a></article>`).join('') || '<p class="empty-collection">Please enquire about this collection. We can discuss available styles with you.</p>';
}
async function loadCatalogue() {
  try {
    const response = await fetch('catalogue.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Catalogue unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Catalogue unavailable');
    products = data.filter(p => p.active !== false && typeof p.name === 'string' && ['Abaya','Sheila'].includes(p.category));
    document.querySelectorAll('[data-filter]').forEach(button => {
      const count = products.filter(p => button.dataset.filter === 'all' || p.category === button.dataset.filter).length;
      button.querySelector('span').textContent = String(count).padStart(2,'0');
    });
    const select = document.querySelector('#style');
    const previous = select.value;
    const general = select.options[0], extra = Array.from(select.options).slice(1);
    select.replaceChildren(general, ...products.map(p => {const o = document.createElement('option'); o.textContent = p.name; o.value = p.name; return o;}), ...extra);
    select.value = Array.from(select.options).some(o => o.value === previous) ? previous : general.value;
    render();
  } catch {
    grid.innerHTML = '<p class="empty-collection">Our collection is being updated. <a class="text-link" href="#enquire">Contact us for available Abayas and Sheilas ↗</a></p>';
  }
}
loadCatalogue();
document.querySelectorAll('[data-filter]').forEach(button => button.addEventListener('click', () => {
  activeFilter = button.dataset.filter;
  document.querySelectorAll('[data-filter]').forEach(other => {other.classList.toggle('selected',other === button); other.setAttribute('aria-pressed',String(other === button));});
  render();
}));
const menu = document.querySelector('.menu-toggle'), nav = document.querySelector('#navigation');
menu.addEventListener('click', () => {const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); nav.classList.toggle('open',open);});
nav.addEventListener('click', event => {if (event.target.closest('a')) {nav.classList.remove('open'); menu.setAttribute('aria-expanded','false');}});
function hideResult() {document.querySelector('#enquiry-result').hidden = true;}
function closeDialog() {dialog.close(); document.body.classList.remove('modal-open');}
grid.addEventListener('click', event => {
  const button = event.target.closest('[data-product]');
  if (!button) return;
  const p = products[Number(button.dataset.product)];
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-layout"><div class="dialog-visual">${visual(p)}</div><div class="dialog-copy"><p class="eyebrow">${escapeHtml(p.category.toUpperCase())} / AL MUSHREF</p><h2 id="dialog-title">${escapeHtml(p.name)}</h2>${p.code ? `<div class="product-code">${escapeHtml(p.code)}</div>` : ''}<div class="product-price">${priceMarkup(p)}</div><p>${escapeHtml(p.description)}</p>${p.category === 'Abaya' ? `<a class="text-link guide-size-link" href="abaya-size-guide.html?style=${encodeURIComponent(p.name)}" target="_blank" rel="noopener">Abaya size guide ↗</a>` : ''}<div class="dialog-actions"><a class="button dark" href="${escapeHtml(productWhatsApp(p))}" target="_blank" rel="noopener" aria-label="WhatsApp enquiry about ${escapeHtml(p.name)}">Enquire on WhatsApp ↗</a><button class="button customise-enquiry" id="ask-product">Customise my enquiry ↗</button></div><small>${escapeHtml(p.note)}</small></div></div>`;
  dialog.showModal(); document.body.classList.add('modal-open');
  document.querySelector('#ask-product').addEventListener('click', () => {
    document.querySelector('#style').value = p.name; hideResult(); closeDialog();
    document.querySelector('#enquire').scrollIntoView({behavior:'smooth'});
    form.elements.customer.focus({preventScroll:true});
  });
});
document.querySelector('.dialog-close').addEventListener('click',closeDialog);
dialog.addEventListener('close',() => document.body.classList.remove('modal-open'));
dialog.addEventListener('click',event => {if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog();}});
document.querySelector('#wholesale-start').addEventListener('click',() => {
  form.elements.mode.value = 'Wholesale'; form.elements.quantity.value = 12; hideResult();
  document.querySelector('#enquire').scrollIntoView({behavior:'smooth'}); form.elements.customer.focus({preventScroll:true});
});
form.addEventListener('input',hideResult);
form.addEventListener('submit',event => {
  event.preventDefault(); if (!form.reportValidity()) return;
  const v = new FormData(form), product = products.find(p => p.name === v.get('style'));
  message = `Hello AL MUSHREF,\n\nI would like to discuss a ${v.get('mode').toLowerCase()} enquiry.\n\nName: ${v.get('customer').trim()}\nStyle: ${v.get('style')}${product?.code ? '\nProduct code: '+product.code : ''}\nQuantity: ${v.get('quantity')} piece(s)\nDestination: ${v.get('destination').trim()}\nRequirements: ${v.get('details').trim() || 'Please share available options.'}\n\nPlease confirm availability, sizing, price in AED, production time, delivery and payment terms. Thank you.`;
  document.querySelector('#message-preview').textContent = message;
  document.querySelector('#whatsapp-link').href = 'https://wa.me/971502002394?text=' + encodeURIComponent(message);
  document.querySelector('#email-link').href = 'mailto:almushreftailoringembroidery@gmail.com?subject=' + encodeURIComponent('AL MUSHREF '+v.get('mode')+' enquiry') + '&body=' + encodeURIComponent(message);
  document.querySelector('#copy-message').textContent = 'Copy message';
  document.querySelector('#enquiry-result').hidden = false;
  document.querySelector('#enquiry-result').scrollIntoView({behavior:'smooth',block:'nearest'});
});
document.querySelector('#copy-message').addEventListener('click',async event => {
  try {await navigator.clipboard.writeText(message); event.target.textContent = 'Copied ✓';}
  catch {const selection = window.getSelection(), range = document.createRange(); range.selectNodeContents(document.querySelector('#message-preview')); selection.removeAllRanges(); selection.addRange(range); event.target.textContent = 'Message selected — copy it';}
});
