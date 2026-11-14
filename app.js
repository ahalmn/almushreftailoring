'use strict';
let products = [], message = '';
const grid = document.querySelector('#product-grid');
const previews = [...document.querySelectorAll('[data-preview]')];
const filters = [...document.querySelectorAll('[data-filter]')];
const arrivalFilters = document.querySelector('.arrival-filters');
const catalogueFilters = document.querySelector('.catalogue-filters');
let arrivalFilter = 'all';
const pagination = document.querySelector('.catalogue-pagination');
const resultsTitle = document.querySelector('#catalogue-results-title');
const pageSize = 8;
const categories = { all: 'All styles', Abaya: 'Abayas', Sheila: 'Sheilas', new: 'New Arrivals' };
let activeFilter = 'all', cataloguePage = 1, totalPages = 1;
const productName = p => localText(p.name, p.ar?.name || p.name);
const productCategory = p => localText(p.category.toUpperCase(), p.category === 'Abaya' ? 'عباية' : 'شيلة');
const photoAlt = (p, photo) => localText(photo.alt || p.alt || p.name,
  [productName(p), photo.label && t(photo.label)].filter(Boolean).join('، '));
const dialog = document.querySelector('#product-dialog');
const form = document.querySelector('#enquiry-form');
const escapeHtml = value => String(value ?? '').replace(/[&<>"']/g, char => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[char]));
const formatPrice = value => typeof value === 'number' && Number.isFinite(value) && value >= 0 ? (isArabic ? value.toLocaleString('ar-AE', {minimumFractionDigits:2, maximumFractionDigits:2}) + ' درهم' : 'AED ' + value.toLocaleString('en-AE', {minimumFractionDigits:2, maximumFractionDigits:2})) : null;
function priceMarkup(p) {
  const retail = formatPrice(p.retailPrice), wholesale = formatPrice(p.wholesalePrice);
  return [retail && `<span class="price-line">${localText('Retail', 'تجزئة')} ${retail}</span>`, wholesale && `<span class="price-line">${t('Wholesale')} ${wholesale} / ${localText('piece', 'قطعة')}</span>`].filter(Boolean).join('') || escapeHtml(t(p.priceLabel || 'Enquire for details & pricing'));
}
const validImage = filename => typeof filename === 'string' && /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(png|jpe?g|webp|avif)$/i.test(filename);
function visual(p) {
  if (validImage(p.image)) {
    return `<img src="assets/${escapeHtml(p.image)}" alt="${escapeHtml(photoAlt(p, p))}" loading="lazy" width="800" height="1100">`;
  }
  return `<div class="fabric ${p.fabric === 'emb' ? 'emb' : 'plain'}" role="img" aria-label="${escapeHtml(localText(`Illustrative ${p.name} fabric styling`, `صورة توضيحية لقماش ${productName(p)}`))}"><span>${t('ILLUSTRATIVE FABRIC STYLING')}</span></div>`;
}
function productGallery(p) {
  const photos = Array.isArray(p.gallery) ? p.gallery.filter(photo => validImage(photo?.image)) : [];
  if (!photos.length) return `<div class="dialog-visual">${visual(p)}</div>`;

  const choices = photos.map((photo, index) =>
    `<button type="button" data-gallery-photo="${escapeHtml(photo.image)}" data-gallery-alt="${escapeHtml(photoAlt(p, photo))}" aria-pressed="${index === 0}">${escapeHtml(t(photo.label))}</button>`
  ).join('');
  return `<div class="product-gallery"><div class="dialog-visual">
    <img src="assets/${escapeHtml(photos[0].image)}" alt="${escapeHtml(photoAlt(p, photos[0]))}" width="1200" height="1500">
  </div><div class="gallery-choices" role="group" aria-label="${t('Product photo views')}">${choices}</div></div>`;
}
function productWhatsApp(p) {
  const text = `Hello AL MUSHREF, I am interested in ${p.name}${p.code ? ' (' + p.code + ')' : ''}. Please share available sizes, colours, retail and wholesale prices, and delivery details.`;
  const arabicText = `مرحبًا المشرف للخياطة والتطريز، أود الاستفسار عن ${productName(p)}${p.code ? ' (' + p.code + ')' : ''}. يرجى تزويدي بالمقاسات والألوان المتاحة وأسعار التجزئة والجملة وتفاصيل التوصيل.`;
  return 'https://wa.me/971502002394?text=' + encodeURIComponent(localText(text, arabicText));
}
const whatsappIcon = '<img class="wa-icon" src="assets/whatsapp-logo.svg" width="18" height="18" alt="">';
function cardPrice(p) {
  if (formatPrice(p.retailPrice) || formatPrice(p.wholesalePrice) || (p.priceLabel && p.priceLabel !== 'Enquire on WhatsApp')) {
    return `<div class="card-bottom"><span>${priceMarkup(p)}</span></div>`;
  }
  return '';
}
function renderCards(items) {
  return items.map(({ p, i }) => `<article class="product-card"><button type="button" data-product="${i}" aria-label="${localText('Explore', 'عرض')} ${escapeHtml(productName(p))}"><div class="product-picture">${visual(p)}</div><span class="card-label">${escapeHtml(t(p.label))}</span><p class="category">${escapeHtml(productCategory(p))}</p><h3>${escapeHtml(productName(p))}</h3>${cardPrice(p)}</button></article>`).join('') ||
    `<p class="empty-collection">${t('Please enquire about this collection.')} <a class="text-link" href="#enquire">${t('Contact us')}</a></p>`;
}
function newestFirst(items) {
  return items.slice().sort((a, b) =>
    (Date.parse(b.p.addedAt) || 0) - (Date.parse(a.p.addedAt) || 0) || b.i - a.i
  );
}
function latestArrivals(items) {
  const counts = { Abaya: 0, Sheila: 0 };
  return newestFirst(items).filter(({ p }) => counts[p.category]++ < 6);
}
function updateCatalogueOffsets() {
  const header = document.querySelector('header');
  const root = document.documentElement;
  root.style.setProperty('--catalogue-header-height', header.offsetHeight + 'px');
  root.style.setProperty('--catalogue-filters-height', catalogueFilters.offsetHeight + 'px');
}

function renderCatalogue({ scrollToResults = false, moveFocus = false } = {}) {
  const items = products.map((p, i) => ({ p, i }));
  const matching = activeFilter === 'new'
    ? latestArrivals(items).filter(({ p }) => arrivalFilter === 'all' || p.category === arrivalFilter)
    : items.filter(({ p }) => activeFilter === 'all' || p.category === activeFilter);
  arrivalFilters.hidden = activeFilter !== 'new';
  for (const button of arrivalFilters.querySelectorAll('button')) {
    const selected = button.dataset.arrivalFilter === arrivalFilter;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  }
  totalPages = Math.max(1, Math.ceil(matching.length / pageSize));
  cataloguePage = Math.max(1, Math.min(cataloguePage, totalPages));
  const offset = (cataloguePage - 1) * pageSize;
  const page = matching.slice(offset, offset + pageSize);
  resultsTitle.textContent = t(categories[activeFilter]);
  document.querySelector('#catalogue-status').textContent = matching.length
    ? localText(`Showing ${offset + 1}–${offset + page.length} of ${matching.length}`, `عرض ${offset + 1} إلى ${offset + page.length} من أصل ${matching.length}`)
    : t('No styles to show');
  grid.innerHTML = renderCards(page);
  filters.forEach(button => {
    const selected = activeFilter === button.dataset.filter;
    button.classList.toggle('selected', selected);
    button.setAttribute('aria-pressed', String(selected));
  });
  pagination.hidden = totalPages === 1;
  for (const button of pagination.querySelectorAll('button')) {
    button.disabled = ['first', 'previous'].includes(button.dataset.page)
      ? cataloguePage === 1 : cataloguePage === totalPages;
  }
  updateCatalogueOffsets();
  if (moveFocus) resultsTitle.focus({ preventScroll: true });
  if (scrollToResults) resultsTitle.scrollIntoView({ block: 'start' });
}
function readCatalogueLocation() {
  const params = new URLSearchParams(location.search);
  const category = params.get('category');
  activeFilter = filters.find(button => button.dataset.filter.toLowerCase() === category)?.dataset.filter || 'all';
  const arrival = params.get('arrival');
  arrivalFilter = arrival === 'abaya' ? 'Abaya' : arrival === 'sheila' ? 'Sheila' : 'all';
  cataloguePage = Number(params.get('page'));
  if (!Number.isSafeInteger(cataloguePage)) cataloguePage = 1;
}
function updateCatalogue(filter, page, arrival = 'all', moveFocus = false) {
  if (activeFilter === filter && cataloguePage === page && arrivalFilter === arrival) return;
  arrivalFilter = arrival;
  activeFilter = filter;
  cataloguePage = page;
  const url = new URL(location.href);
  if (filter === 'all') url.searchParams.delete('category');
  else url.searchParams.set('category', filter.toLowerCase());
  if (filter === 'new' && arrival !== 'all') url.searchParams.set('arrival', arrival.toLowerCase());
  else url.searchParams.delete('arrival');
  if (page === 1) url.searchParams.delete('page');
  else url.searchParams.set('page', String(page));
  history.pushState(null, '', url);
  renderCatalogue({ scrollToResults: true, moveFocus });
}
async function loadCatalogue() {
  try {
    const response = await fetch('catalogue.json', {cache:'no-store'});
    if (!response.ok) throw new Error('Catalogue unavailable');
    const data = await response.json();
    if (!Array.isArray(data)) throw new Error('Catalogue unavailable');
    products = data.filter(p => p.active !== false && typeof p.name === 'string' && ['Abaya','Sheila'].includes(p.category));
    const select = document.querySelector('#style');
    const previous = select.value;
    const general = select.options[0], extra = Array.from(select.options).slice(1);
    select.replaceChildren(general, ...products.map(p => {const o = document.createElement('option'); o.textContent = productName(p); o.value = p.name; return o;}), ...extra);
    select.value = Array.from(select.options).some(o => o.value === previous) ? previous : general.value;
    const indexed = products.map((p, i) => ({ p, i }));
    previews.forEach(preview => {
      preview.innerHTML = renderCards(indexed.filter(({ p }) => p.category === preview.dataset.preview).slice(0, 4));
    });
    document.querySelectorAll('[data-gallery-category]').forEach(startFeaturedGallery);
    if (grid) {
      readCatalogueLocation();
      renderCatalogue();
      const catalogueLayout = new ResizeObserver(updateCatalogueOffsets);
      catalogueLayout.observe(document.querySelector('header'));
      catalogueLayout.observe(catalogueFilters);
      filters.forEach(button => button.addEventListener('click', () => updateCatalogue(button.dataset.filter, 1)));
      arrivalFilters.addEventListener('click', event => {
        const button = event.target.closest('[data-arrival-filter]');
        if (button) updateCatalogue('new', 1, button.dataset.arrivalFilter);
      });
      pagination.addEventListener('click', event => {
        const button = event.target.closest('button[data-page]');
        if (!button || button.disabled) return;
        const pages = { first: 1, previous: cataloguePage - 1, next: cataloguePage + 1, last: totalPages };
        updateCatalogue(activeFilter, pages[button.dataset.page], arrivalFilter, true);
      });
      window.addEventListener('popstate', () => {
        readCatalogueLocation();
        renderCatalogue();
      });
    }
  } catch {
    for (const container of grid ? [grid] : previews) container.innerHTML = `<p class="empty-collection">${t('Our collection is being updated.')} <a class="text-link" href="#enquire">${t('Contact us for available Abayas and Sheilas')}</a></p>`;
  }
}
const menu = document.querySelector('.menu-toggle'), nav = document.querySelector('#navigation');
menu.addEventListener('click', () => {const open = menu.getAttribute('aria-expanded') !== 'true'; menu.setAttribute('aria-expanded',String(open)); nav.classList.toggle('open',open);});
nav.addEventListener('click', event => {if (event.target.closest('a')) {nav.classList.remove('open'); menu.setAttribute('aria-expanded','false');}});
function focusEnquiryName() {
  const nameField = form.elements.customer;
  nameField.closest('label').scrollIntoView({ behavior: 'instant', block: 'start' });
  nameField.focus({ preventScroll: true });
}
function hideResult() {document.querySelector('#enquiry-result').hidden = true;}
let productTrigger;
function closeDialog() {
  dialog.close();
  document.body.classList.remove('modal-open');
}
document.querySelector('.collection').addEventListener('click', event => {
  const button = event.target.closest('[data-product]');
  if (!button) return;
  const p = products[Number(button.dataset.product)];
  productTrigger = button;
  document.querySelector('#dialog-content').innerHTML = `<div class="dialog-layout">${productGallery(p)}<div class="dialog-copy"><p class="eyebrow">${escapeHtml(productCategory(p))} / ${t('AL MUSHREF')}</p><h2 id="dialog-title">${escapeHtml(productName(p))}</h2>${p.code ? `<div class="product-code">${escapeHtml(p.code)}</div>` : ''}${cardPrice(p) ? `<div class="product-price">${priceMarkup(p)}</div>` : ''}<p>${escapeHtml(localText(p.description, p.ar?.description || p.description))}</p>${p.category === 'Abaya' ? `<a class="text-link guide-size-link" href="${escapeHtml(siteLink('abaya-size-guide.html?style=' + encodeURIComponent(productName(p))))}" target="_blank" rel="noopener">${t('Abaya size guide')}</a>` : ''}<div class="dialog-actions"><a class="button dark" href="${escapeHtml(productWhatsApp(p))}" aria-label="${localText('WhatsApp enquiry about', 'استفسار عبر واتساب عن')} ${escapeHtml(productName(p))}">${whatsappIcon} ${t('Enquire on WhatsApp')}</a><button class="button customise-enquiry" id="ask-product">${t('Customise my enquiry')}</button></div><small>${escapeHtml(t(p.note))}</small></div></div>`;
  dialog.showModal(); document.body.classList.add('modal-open');
  document.querySelector('#ask-product').addEventListener('click', () => {
    productTrigger = null;
    document.querySelector('#style').value = p.name; hideResult(); closeDialog();
    focusEnquiryName();
  });
});
dialog.addEventListener('click', event => {
  const choice = event.target.closest('[data-gallery-photo]');
  if (!choice) return;
  const gallery = choice.closest('.product-gallery');
  const photo = gallery.querySelector('img');
  photo.src = 'assets/' + choice.dataset.galleryPhoto;
  photo.alt = choice.dataset.galleryAlt;
  gallery.querySelectorAll('[data-gallery-photo]').forEach(button => {
    button.setAttribute('aria-pressed', String(button === choice));
  });
});
document.querySelector('.dialog-close').addEventListener('click',closeDialog);
dialog.addEventListener('close', () => {
  document.body.classList.remove('modal-open');
  productTrigger?.focus({ preventScroll: true });
  productTrigger = null;
});
dialog.addEventListener('click',event => {if (event.target === dialog) {const r = dialog.getBoundingClientRect(); if (event.clientX < r.left || event.clientX > r.right || event.clientY < r.top || event.clientY > r.bottom) closeDialog();}});
document.querySelector('#wholesale-start')?.addEventListener('click',() => {
  form.elements.mode.value = 'Wholesale'; form.elements.quantity.value = 12; hideResult();
  focusEnquiryName();
});
form.addEventListener('input',hideResult);
form.addEventListener('submit',event => {
  event.preventDefault(); if (!form.reportValidity()) return;
  const v = new FormData(form), product = products.find(p => p.name === v.get('style'));
  message = `Hello AL MUSHREF,\n\nI would like to discuss a ${v.get('mode').toLowerCase()} enquiry.\n\nName: ${v.get('customer').trim()}\nStyle: ${v.get('style')}${product?.code ? '\nProduct code: '+product.code : ''}\nQuantity: ${v.get('quantity')} piece(s)\nDestination: ${v.get('destination').trim()}\nRequirements: ${v.get('details').trim() || 'Please share available options.'}\n\nPlease confirm availability, sizing, price in AED, production time, delivery and payment terms. Thank you.`;
  if (isArabic) {
    message = `مرحبًا المشرف للخياطة والتطريز،

أود الاستفسار عن ${v.get('mode') === 'Wholesale' ? 'طلب جملة' : 'شراء بالتجزئة'}.

الاسم: ${v.get('customer').trim()}
التصميم: ${product ? productName(product) : t(v.get('style'))}${product?.code ? '\nرمز القطعة: ' + product.code : ''}
الكمية: ${v.get('quantity')}
الوجهة: ${v.get('destination').trim()}
المتطلبات: ${v.get('details').trim() || 'يرجى مشاركة الخيارات المتاحة.'}

يرجى تأكيد التوفّر والمقاسات والسعر بالدرهم الإماراتي ومدة الإنتاج والتوصيل وشروط الدفع. شكرًا لكم.`;
  }
  document.querySelector('#message-preview').textContent = message;
  document.querySelector('#whatsapp-link').href = 'https://wa.me/971502002394?text=' + encodeURIComponent(message);
  document.querySelector('#email-link').href = 'mailto:almushreftailoringembroidery@gmail.com?subject=' + encodeURIComponent(localText('AL MUSHREF '+v.get('mode')+' enquiry', 'المشرف | استفسار ' + (v.get('mode') === 'Wholesale' ? 'جملة' : 'تجزئة'))) + '&body=' + encodeURIComponent(message);
  document.querySelector('#copy-message').textContent = t('Copy message');
  document.querySelector('#enquiry-result').hidden = false;
  document.querySelector('#enquiry-result').scrollIntoView({behavior:'smooth',block:'nearest'});
});
document.querySelector('#copy-message').addEventListener('click',async event => {
  try {await navigator.clipboard.writeText(message); event.target.textContent = t('Copied ✓');}
  catch {const selection = window.getSelection(), range = document.createRange(); range.selectNodeContents(document.querySelector('#message-preview')); selection.removeAllRanges(); selection.addRange(range); event.target.textContent = t('Message selected — copy it');}
});

const featuredTiming = 2500;
const featuredEffects = ['fade', 'slide-left', 'slide-right', 'slide-up', 'slide-down', 'reveal-left', 'reveal-right', 'reveal-top', 'reveal-bottom', 'reveal-centre'];

function featuredCaption(product, photoIndex) {
  if (photoIndex === 0) return ['name', escapeHtml(productName(product))];
  if (isArabic) {
    if (product.category === 'Sheila') return ['sheila-sizes',
      '<strong>صغير · <bdi dir="ltr">72 × 28</bdi> بوصة</strong><strong>كبير · <bdi dir="ltr">80 × 30</bdi> بوصة</strong><span>مقاسات خاصة عند الطلب</span><em>الإتقان في كل غرزة</em>'];
    return [
      ['sizes', '<strong>المقاسات المتاحة من 52 إلى 60</strong><span>مقاسات خاصة عند الطلب</span>'],
      ['colours', '<strong>خيارات الألوان</strong><span>اسألينا عن الألوان المتاحة</span>'],
      ['description', escapeHtml(product.ar?.slideshowDescription || product.ar?.description || productName(product))],
      ['motto', t('Excellence in Every Stitch')]
    ][photoIndex - 1];
  }
  if (product.category === 'Sheila') return ['sheila-sizes',
    '<strong>Small · 72 × 28 in</strong><strong>Large · 80 × 30 in</strong><span>Custom sizes on request</span><em>Excellence in Every Stitch</em>'];
  return [
    ['sizes', '<strong>Sizes 52–60 available</strong><span>Custom sizes on request</span>'],
    ['colours', '<strong>Colour options</strong><span>Ask us about available colours</span>'],
    ['description', escapeHtml(product.slideshowDescription || product.description?.match(/^[^.!?]+[.!?]?/)?.[0] || product.name)],
    ['motto', 'Excellence in Every Stitch']
  ][photoIndex - 1];
}

function startFeaturedGallery(gallery) {
  const category = gallery.dataset.galleryCategory;
  const photoCount = category === 'Abaya' ? 5 : 2;
  const frame = gallery.querySelector('.featured-photos');
  const ordered = newestFirst(products.map((p, i) => ({ p, i })));
  const groups = ordered.filter(({ p }) => p.category === category).map(({ p: product }) => ({
    product, photos: Array.isArray(product.gallery) ? product.gallery.filter(photo => validImage(photo?.image)) : []
  })).filter(({ photos }) => new Set(photos.map(photo => photo.image)).size >= photoCount);
  const slides = groups.flatMap(({ product, photos }) =>
    photos.slice(0, photoCount).map((photo, photoIndex) => ({ product, photo, photoIndex }))
  );
  if (!slides.length) return;

  const controls = gallery.querySelector('.featured-controls');
  const caption = gallery.querySelector('.featured-caption');
  const pause = controls.querySelector('[data-featured-pause]');
  let currentImage = frame.querySelector('img');
  let outgoingImage;
  let preparedImage;
  let index = 0;
  let effectIndex = 0;
  let paused = false;
  let timer;

  function createImage(product, photo) {
    const image = new Image();
    image.decoding = 'async';
    image.alt = photoAlt(product, photo);
    image.src = 'assets/' + photo.image;
    return image;
  }

  function showSlide(offset, announce = false) {
    const nextIndex = (index + offset + slides.length) % slides.length;
    const { product, photo, photoIndex } = slides[nextIndex];
    if (offset) {
      outgoingImage?.remove();
      outgoingImage = currentImage;
      outgoingImage.className = 'is-outgoing';
      outgoingImage.setAttribute('aria-hidden', 'true');
      gallery.dataset.effect = featuredEffects[effectIndex];
      effectIndex = (effectIndex + 1) % featuredEffects.length;
      currentImage = preparedImage?.getAttribute('src') === 'assets/' + photo.image ? preparedImage : createImage(product, photo);
      currentImage.className = 'is-current';
      frame.append(currentImage);
    } else if (currentImage.getAttribute('src') !== 'assets/' + photo.image) {
      currentImage.src = 'assets/' + photo.image;
    }
    currentImage.alt = photoAlt(product, photo);
    index = nextIndex;
    const upcoming = slides[(index + 1) % slides.length];
    preparedImage = createImage(upcoming.product, upcoming.photo);
    const [style, content] = featuredCaption(product, photoIndex);
    caption.dataset.caption = style;
    const text = document.createElement('span');
    text.className = 'featured-caption-text';
    text.innerHTML = content;
    caption.replaceChildren(text);
    controls.querySelector('.featured-count').textContent = `${photoIndex + 1} / ${photoCount}`;
    if (announce) controls.querySelector('.featured-status').textContent = `${productName(product)}${localText(',', '،')} ${localText('photo', 'الصورة')} ${photoIndex + 1} ${localText('of', 'من')} ${photoCount}. ${caption.textContent}`;
  }

  function schedule() {
    window.clearInterval(timer);
    if (!document.hidden && !paused) timer = window.setInterval(() => showSlide(1), featuredTiming);
  }

  function setPaused(value) {
    paused = value;
    pause.textContent = t(paused ? 'Play' : 'Pause');
    schedule();
  }

  for (const [selector, step] of [['[data-featured-prev]', -1], ['[data-featured-next]', 1]]) {
    controls.querySelector(selector).addEventListener('click', () => {
      showSlide(step, true);
      schedule();
    });
  }
  pause.addEventListener('click', () => setPaused(!paused));
  document.addEventListener('visibilitychange', schedule);
  showSlide(0);
  controls.hidden = false;
  setPaused(paused);
}

loadCatalogue();
