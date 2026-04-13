(function () {
  // 页面主逻辑：负责读取数据、绑定交互、同步 UI。
  var data = window.PRODUCT_DATA || {};
  if (!data || !data.product) return;

  var state = {
    selected: buildInitialSelection(),
    activeVariation: null,
    activeGallery: [],
    activeImageIndex: 0,
    lightboxOpen: false
  };

  var els = {
    title: byId('productTitle'),
    price: byId('productPrice'),
    productBadge: byId('productBadge'),
    breadcrumbNav: byId('breadcrumbNav'),
    utilityButton: byId('utilityButton'),
    helperNote: byId('helperNote'),

    colorSwatches: byId('colorSwatches'),
    sizeSelect: byId('sizeSelect'),
    edgeButtons: byId('edgeButtons'),

    currentColorLabel: byId('currentColorLabel'),
    currentEdgeLabel: byId('currentEdgeLabel'),
    stockState: byId('stockState'),
    skuValue: byId('skuValue'),
    variationIdValue: byId('variationIdValue'),
    patternValue: byId('patternValue'),
    selectionSummary: byId('selectionSummary'),
    addToCartBtn: byId('addToCartBtn'),
    qtyInput: byId('qtyInput'),

    galleryThumbs: byId('galleryThumbs'),
    mainImage: byId('galleryMainImage'),
    mainLink: byId('galleryMainLink'),
    galleryPrevBtn: byId('galleryPrevBtn'),
    galleryNextBtn: byId('galleryNextBtn'),
    openLightboxBtn: byId('openLightboxBtn'),
    galleryHint: byId('galleryHint'),

    lightbox: byId('simpleLightbox'),
    lightboxImage: byId('lightboxImage'),
    lightboxCaption: byId('lightboxCaption'),
    lightboxCloseBtn: byId('lightboxCloseBtn'),
    lightboxPrevBtn: byId('lightboxPrevBtn'),
    lightboxNextBtn: byId('lightboxNextBtn')
  };

  init();

  // 初始化入口：先渲染静态结构，再绑定事件，最后同步当前选择。
  function init() {
    renderStaticContent();
    renderColorSwatches();
    renderSizeOptions();
    renderEdgeButtons();
    bindEvents();
    syncUI();
  }

  function renderStaticContent() {
    setText(els.title, read(data, 'product.title', 'Untitled Product'));
    setText(els.price, read(data, 'product.fallbackPrice', ''));
    setText(els.productBadge, read(data, 'product.badge', ''));
    setText(els.utilityButton, read(data, 'product.utilityButtonText', 'Action'));
    setHTML(els.breadcrumbNav, buildBreadcrumbHTML(read(data, 'product.breadcrumb', [])));
    setHTML(els.helperNote, read(data, 'product.helperNote', ''));
    setText(els.galleryHint, '');
  }

  // 事件绑定：属性切换、缩略图切换、灯箱开关都集中在这里。
  function bindEvents() {
    on(els.colorSwatches, 'click', function (event) {
      var button = event.target.closest('[data-color]');
      if (!button || button.disabled) return;
      state.selected.color = button.getAttribute('data-color');
      applyClosestValidSelection();
      syncUI();
    });

    on(els.sizeSelect, 'change', function (event) {
      state.selected.size = event.target.value;
      applyClosestValidSelection();
      syncUI();
    });

    on(els.edgeButtons, 'click', function (event) {
      var button = event.target.closest('[data-edge]');
      if (!button || button.disabled) return;
      state.selected.edge = button.getAttribute('data-edge');
      applyClosestValidSelection();
      syncUI();
    });

    on(els.galleryThumbs, 'click', function (event) {
      var button = event.target.closest('[data-index]');
      if (!button) return;
      setActiveImage(Number(button.getAttribute('data-index')));
    });

    on(els.galleryPrevBtn, 'click', showPrevImage);
    on(els.galleryNextBtn, 'click', showNextImage);
    on(els.openLightboxBtn, 'click', openLightbox);
    on(els.mainLink, 'click', openLightbox);

    on(els.lightboxCloseBtn, 'click', closeLightbox);
    on(els.lightboxPrevBtn, 'click', showPrevImage);
    on(els.lightboxNextBtn, 'click', showNextImage);

    on(els.lightbox, 'click', function (event) {
      if (event.target === els.lightbox) closeLightbox();
    });

    document.addEventListener('keydown', function (event) {
      if (event.key === 'Escape' && state.lightboxOpen) {
        closeLightbox();
        return;
      }
      if (event.key === 'ArrowLeft') showPrevImage();
      if (event.key === 'ArrowRight') showNextImage();
    });

    on(els.addToCartBtn, 'click', function () {
      var variation = getExactVariation(state.selected);
      if (!variation || variation.stock !== 'instock') return;
      setText(
        els.helperNote,
        'Demo action completed: variation_id=' + variation.id + ', color=' + valueOf(variation.attributes.color) + ', size=' + valueOf(variation.attributes.size) + ', edge=' + valueOf(variation.attributes.edge)
      );
    });
  }

  // 统一刷新页面状态，避免每个事件里分别更新多个区域。
  function syncUI() {
    state.activeVariation = getExactVariation(state.selected);
    renderAvailability();
    renderMeta();
    updateGallery();
  }

  function renderColorSwatches() {
    if (!els.colorSwatches) return;
    var list = read(data, 'attributes.color', []);
    if (!list.length) {
      els.colorSwatches.innerHTML = '';
      return;
    }

    els.colorSwatches.innerHTML = list.map(function (item) {
      return '<button class="swatch-item" type="button" data-color="' + escapeHtml(item.slug) + '" aria-label="' + escapeHtml(item.label) + '" title="' + escapeHtml(item.label) + '"><img src="' + escapeHtml(item.swatch || '') + '" alt="' + escapeHtml(item.label) + '" /></button>';
    }).join('');
  }

  function renderSizeOptions() {
    if (!els.sizeSelect) return;
    var list = read(data, 'attributes.size', []);
    els.sizeSelect.innerHTML = list.map(function (item) {
      return '<option value="' + escapeHtml(item.slug) + '">' + escapeHtml(item.label) + '</option>';
    }).join('');
  }

  function renderEdgeButtons() {
    if (!els.edgeButtons) return;
    var list = read(data, 'attributes.edge', []);
    els.edgeButtons.innerHTML = list.map(function (item) {
      return '<button class="button-choice" type="button" data-edge="' + escapeHtml(item.slug) + '">' + escapeHtml(item.label) + '</button>';
    }).join('');
  }

  function renderAvailability() {
    renderSwatchAvailability();
    renderSizeAvailability();
    renderEdgeAvailability();
  }

  function renderSwatchAvailability() {
    if (!els.colorSwatches) return;
    qsa(els.colorSwatches, '[data-color]').forEach(function (button) {
      var slug = button.getAttribute('data-color');
      var available = hasCompatibleVariation({
        color: slug,
        size: state.selected.size,
        edge: state.selected.edge
      }) || hasCompatibleVariation({ color: slug });

      button.disabled = !available;
      button.classList.toggle('is-disabled', !available);
      button.classList.toggle('is-active', state.selected.color === slug);
      button.setAttribute('aria-pressed', String(state.selected.color === slug));
    });
  }

  function renderSizeAvailability() {
    if (!els.sizeSelect) return;
    Array.prototype.slice.call(els.sizeSelect.options || []).forEach(function (option) {
      var available = hasCompatibleVariation({
        color: state.selected.color,
        size: option.value,
        edge: state.selected.edge
      }) || hasCompatibleVariation({
        color: state.selected.color,
        size: option.value
      });
      option.disabled = !available;
    });
    if (state.selected.size) els.sizeSelect.value = state.selected.size;
  }

  function renderEdgeAvailability() {
    if (!els.edgeButtons) return;
    qsa(els.edgeButtons, '[data-edge]').forEach(function (button) {
      var slug = button.getAttribute('data-edge');
      var available = hasCompatibleVariation({
        color: state.selected.color,
        size: state.selected.size,
        edge: slug
      }) || hasCompatibleVariation({
        color: state.selected.color,
        edge: slug
      });

      button.disabled = !available;
      button.classList.toggle('is-disabled', !available);
      button.classList.toggle('is-active', state.selected.edge === slug);
      button.setAttribute('aria-pressed', String(state.selected.edge === slug));
    });
  }

  // 根据当前匹配到的 variation 更新价格、库存与元信息。
  function renderMeta() {
    var variation = state.activeVariation;
    var colorMeta = findAttributeMeta('color', state.selected.color);
    var sizeMeta = findAttributeMeta('size', state.selected.size);
    var edgeMeta = findAttributeMeta('edge', state.selected.edge);

    setText(els.currentColorLabel, labelOf(colorMeta));
    setText(els.currentEdgeLabel, labelOf(edgeMeta));
    setText(els.patternValue, colorMeta ? valueOf(colorMeta.pattern, '—') : '—');
    setText(els.selectionSummary, 'Selection: ' + labelOf(colorMeta) + ' / ' + labelOf(sizeMeta) + ' / ' + labelOf(edgeMeta));

    if (!variation) {
      setText(els.price, read(data, 'product.fallbackPrice', ''));
      setText(els.stockState, 'This combination is unavailable.');
      setText(els.skuValue, '—');
      setText(els.variationIdValue, '—');
      setDisabled(els.addToCartBtn, true);
      return;
    }

    setText(els.price, valueOf(variation.price, read(data, 'product.fallbackPrice', '')));
    setText(els.stockState, valueOf(variation.stockMessage, ''));
    setText(els.skuValue, valueOf(variation.sku, '—'));
    setText(els.variationIdValue, String(valueOf(variation.id, '—')));
    setDisabled(els.addToCartBtn, variation.stock !== 'instock');
  }

  // 切换图库：颜色图组优先，必要时可被 variation 专属图覆盖。
  function updateGallery() {
    state.activeGallery = resolveGalleryForSelection();
    state.activeImageIndex = 0;

    if (els.galleryThumbs) {
      els.galleryThumbs.innerHTML = state.activeGallery.map(function (item, index) {
        return '<button class="thumb-item" type="button" data-index="' + index + '" aria-label="Go to image ' + (index + 1) + '"><img src="' + escapeHtml(item.thumb) + '" alt="' + escapeHtml(item.alt) + '" /></button>';
      }).join('');
    }

    setActiveImage(0);
  }

  function setActiveImage(index) {
    if (!state.activeGallery.length) {
      if (els.mainImage) {
        els.mainImage.removeAttribute('src');
        els.mainImage.alt = 'No image available';
      }
      return;
    }

    var maxIndex = state.activeGallery.length - 1;
    if (index < 0) index = maxIndex;
    if (index > maxIndex) index = 0;

    state.activeImageIndex = index;
    var image = state.activeGallery[index];

    if (els.mainImage) {
      els.mainImage.src = image.large;
      els.mainImage.alt = image.alt;
    }

    qsa(els.galleryThumbs, '[data-index]').forEach(function (thumb) {
      thumb.classList.toggle('is-active', Number(thumb.getAttribute('data-index')) === index);
    });

    if (state.lightboxOpen) syncLightboxImage();
  }

  function showPrevImage() {
    if (!state.activeGallery.length) return;
    setActiveImage(state.activeImageIndex - 1);
  }

  function showNextImage() {
    if (!state.activeGallery.length) return;
    setActiveImage(state.activeImageIndex + 1);
  }

  function openLightbox(event) {
    if (event && typeof event.preventDefault === 'function') event.preventDefault();
    if (!state.activeGallery.length || !els.lightbox || !els.lightboxImage) return;

    state.lightboxOpen = true;
    els.lightbox.hidden = false;
    document.body.classList.add('lightbox-open');
    syncLightboxImage();
  }

  function closeLightbox() {
    if (!els.lightbox) return;
    state.lightboxOpen = false;
    els.lightbox.hidden = true;
    document.body.classList.remove('lightbox-open');
  }

  function syncLightboxImage() {
    if (!els.lightboxImage) return;
    var image = state.activeGallery[state.activeImageIndex];
    if (!image) return;

    els.lightboxImage.src = image.large;
    els.lightboxImage.alt = image.alt;
    setText(els.lightboxCaption, image.alt);
  }

  // 当用户选到不可售组合时，自动回退到最近的可售组合。
  function applyClosestValidSelection() {
    state.selected = clone(findBestMatchingSelection());
  }

  function resolveGalleryForSelection() {
    var variation = state.activeVariation;
    if (
      variation &&
      variation.imageStrategy &&
      variation.imageStrategy.type === 'variation' &&
      Array.isArray(variation.imageStrategy.images)
    ) {
      return variation.imageStrategy.images;
    }

    var byColor = read(data, 'galleriesByColor.' + state.selected.color, null);
    if (Array.isArray(byColor) && byColor.length) return byColor;

    var firstColor = read(data, 'attributes.color.0.slug', null);
    var fallback = firstColor ? read(data, 'galleriesByColor.' + firstColor, []) : [];
    return Array.isArray(fallback) ? fallback : [];
  }

  function findBestMatchingSelection() {
    var exact = getExactVariation(state.selected);
    if (exact) return clone(exact.attributes);

    var variations = read(data, 'variations', []);
    var byColorAndSize = variations.find(function (item) {
      return item.attributes.color === state.selected.color && item.attributes.size === state.selected.size;
    });
    if (byColorAndSize) return clone(byColorAndSize.attributes);

    var byColor = variations.find(function (item) {
      return item.attributes.color === state.selected.color;
    });
    if (byColor) return clone(byColor.attributes);

    return clone(state.selected);
  }

  function getExactVariation(selected) {
    var variations = read(data, 'variations', []);
    return variations.find(function (item) {
      return Object.keys(selected).every(function (key) {
        return item.attributes && item.attributes[key] === selected[key];
      });
    }) || null;
  }

  function hasCompatibleVariation(partialSelection) {
    var variations = read(data, 'variations', []);
    return variations.some(function (item) {
      return Object.keys(partialSelection).every(function (key) {
        return item.attributes && item.attributes[key] === partialSelection[key];
      });
    });
  }

  function findAttributeMeta(attributeName, slug) {
    var list = read(data, 'attributes.' + attributeName, []);
    return list.find(function (item) {
      return item.slug === slug;
    }) || null;
  }

  function buildInitialSelection() {
    var defaults = clone(read(data, 'defaults', {}));
    var variations = read(data, 'variations', []);
    if (Object.keys(defaults).length) return defaults;
    if (variations[0] && variations[0].attributes) return clone(variations[0].attributes);
    return { color: '', size: '', edge: '' };
  }

  function buildBreadcrumbHTML(items) {
    if (!Array.isArray(items) || !items.length) return '';
    return items.map(function (item, index) {
      var html = item.href
        ? '<a href="' + escapeHtml(item.href) + '">' + escapeHtml(item.label) + '</a>'
        : '<span>' + escapeHtml(item.label) + '</span>';
      if (index < items.length - 1) {
        html += '<span class="mx-2">&gt;</span>';
      }
      return html;
    }).join('');
  }

  function byId(id) {
    return document.getElementById(id);
  }

  function on(el, eventName, handler) {
    if (!el) return;
    el.addEventListener(eventName, handler);
  }

  function qsa(root, selector) {
    if (!root) return [];
    return Array.prototype.slice.call(root.querySelectorAll(selector));
  }

  function setText(el, value) {
    if (!el) return;
    el.textContent = valueOf(value, '');
  }

  function setHTML(el, value) {
    if (!el) return;
    el.innerHTML = valueOf(value, '');
  }

  function setDisabled(el, disabled) {
    if (!el) return;
    el.disabled = !!disabled;
  }

  function labelOf(meta) {
    return meta ? valueOf(meta.label, '—') : '—';
  }

  function valueOf(value, fallback) {
    return value === undefined || value === null || value === '' ? fallback : value;
  }

  // 安全读取深层对象，避免某个字段不存在时直接报错。
  function read(obj, path, fallback) {
    var result = path.split('.').reduce(function (acc, key) {
      return acc && acc[key] !== undefined ? acc[key] : undefined;
    }, obj);
    return result === undefined ? fallback : result;
  }

  function clone(obj) {
    return JSON.parse(JSON.stringify(obj || {}));
  }

  function escapeHtml(str) {
    return String(valueOf(str, ''))
      .replaceAll('&', '&amp;')
      .replaceAll('<', '&lt;')
      .replaceAll('>', '&gt;')
      .replaceAll('"', '&quot;')
      .replaceAll("'", '&#39;');
  }
})();
