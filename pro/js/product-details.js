(function () {
  // 页面主逻辑：负责读取数据、绑定交互、同步 UI 与图库。
  var data = window.PRODUCT_DATA || {};
  var defaults = data.defaults || {};

  var state = {
    selected: {
      color: defaults.color || firstSlug('color'),
      size: defaults.size || firstSlug('size'),
      edge: defaults.edge || firstSlug('edge')
    },
    activeVariation: null,
    activeGallery: []
  };

  var els = {
    productBadge: byId('productBadge'),
    title: byId('productTitle'),
    price: byId('productPrice'),
    utilityButton: byId('utilityButton'),
    breadcrumbNav: byId('breadcrumbNav'),
    helperNote: byId('helperNote'),
    currentColorLabel: byId('currentColorLabel'),
    currentEdgeLabel: byId('currentEdgeLabel'),
    patternValue: byId('patternValue'),
    stockState: byId('stockState'),
    skuValue: byId('skuValue'),
    variationIdValue: byId('variationIdValue'),
    selectionSummary: byId('selectionSummary'),
    addToCartBtn: byId('addToCartBtn'),
    colorSwatches: byId('colorSwatches'),
    sizeSelect: byId('sizeSelect'),
    edgeButtons: byId('edgeButtons'),
    galleryHint: byId('galleryHint'),
    openLightboxBtn: byId('openLightboxBtn'),
    galleryPrevBtn: byId('galleryPrevBtn'),
    galleryNextBtn: byId('galleryNextBtn'),
    mainSwiperWrapper: byId('mainSwiperWrapper'),
    thumbSwiperWrapper: byId('thumbSwiperWrapper')
  };

  var thumbSwiper = null;
  var mainSwiper = null;
  var lightbox = null;

  init();

  // 初始化入口：先渲染静态结构，再绑定事件和轮播，最后同步 UI。
  function init() {
    renderStaticContent();
    renderColorSwatches();
    renderSizeOptions();
    renderEdgeButtons();
    bindEvents();
    initSwipers();
    syncUI();
  }

  function renderStaticContent() {
    setText(els.title, read(data, 'product.title', 'Untitled Product'));
    setText(els.price, read(data, 'product.fallbackPrice', ''));
    setText(els.productBadge, read(data, 'product.badge', 'Pro Demo'));
    setText(els.utilityButton, read(data, 'product.utilityButtonText', 'Action'));
    setHTML(els.breadcrumbNav, buildBreadcrumbHTML(read(data, 'product.breadcrumb', [])));
    setHTML(els.helperNote, '');
    if (!window.Swiper || !window.PhotoSwipeLightbox || !window.PhotoSwipe) {
      setHTML(els.helperNote, 'The gallery libraries did not load. The page has fallen back to a static gallery.');
    }
    setText(els.galleryHint, '');
  }

  // 事件绑定：属性切换、放大查看、模拟购买都集中处理。
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

    on(els.openLightboxBtn, 'click', function () {
      if (lightbox && mainSwiper) {
        lightbox.loadAndOpen(mainSwiper.realIndex || 0);
      }
    });

    on(els.addToCartBtn, 'click', function () {
      var variation = getExactVariation(state.selected);
      if (!variation || variation.stock !== 'instock') return;
      setHTML(
        els.helperNote,
        'Demo action completed: variation_id=' + variation.id + ', color=' + valueOf(variation.attributes.color) + ', size=' + valueOf(variation.attributes.size) + ', edge=' + valueOf(variation.attributes.edge)
      );
    });
  }

  // 初始化 Swiper：缩略图与主图联动，导航按钮可选存在。
  function initSwipers() {
    if (!byId('productThumbSwiper') || !byId('productMainSwiper')) return;
    if (!window.Swiper) return;

    thumbSwiper = new window.Swiper('#productThumbSwiper', {
      spaceBetween: 12,
      slidesPerView: 'auto',
      watchSlidesProgress: true,
      freeMode: true
    });

    var mainConfig = {
      slidesPerView: 1,
      spaceBetween: 12,
      speed: 450,
      keyboard: { enabled: true },
      thumbs: { swiper: thumbSwiper }
    };

    if (els.galleryPrevBtn && els.galleryNextBtn) {
      mainConfig.navigation = {
        prevEl: els.galleryPrevBtn,
        nextEl: els.galleryNextBtn
      };
    }

    mainSwiper = new window.Swiper('#productMainSwiper', mainConfig);
  }

  // 统一刷新页面状态，避免事件处理函数里出现重复更新逻辑。
  function syncUI() {
    state.activeVariation = getExactVariation(state.selected);
    renderAvailability();
    renderMeta();
    updateGallery();
  }

  function renderColorSwatches() {
    if (!els.colorSwatches) return;
    var list = read(data, 'attributes.color', []);
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
      var available = hasCompatibleVariation({ color: slug, size: state.selected.size, edge: state.selected.edge }) || hasCompatibleVariation({ color: slug });
      button.disabled = !available;
      button.classList.toggle('is-disabled', !available);
      button.classList.toggle('is-active', state.selected.color === slug);
      button.setAttribute('aria-pressed', String(state.selected.color === slug));
    });
  }

  function renderSizeAvailability() {
    if (!els.sizeSelect) return;
    Array.prototype.slice.call(els.sizeSelect.options || []).forEach(function (option) {
      var available = hasCompatibleVariation({ color: state.selected.color, size: option.value, edge: state.selected.edge }) || hasCompatibleVariation({ color: state.selected.color, size: option.value });
      option.disabled = !available;
    });
    if (state.selected.size) els.sizeSelect.value = state.selected.size;
  }

  function renderEdgeAvailability() {
    if (!els.edgeButtons) return;
    qsa(els.edgeButtons, '[data-edge]').forEach(function (button) {
      var slug = button.getAttribute('data-edge');
      var available = hasCompatibleVariation({ color: state.selected.color, size: state.selected.size, edge: slug }) || hasCompatibleVariation({ color: state.selected.color, edge: slug });
      button.disabled = !available;
      button.classList.toggle('is-disabled', !available);
      button.classList.toggle('is-active', state.selected.edge === slug);
      button.setAttribute('aria-pressed', String(state.selected.edge === slug));
    });
  }

  // 根据当前 variation 更新价格、库存、SKU 和组合说明。
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

  // 更新主图与缩略图，并重新绑定 PhotoSwipe 数据源。
  function updateGallery() {
    state.activeGallery = resolveGalleryForSelection();

    if (els.mainSwiperWrapper) {
      els.mainSwiperWrapper.innerHTML = state.activeGallery.map(function (item) {
        return '<div class="swiper-slide"><a href="' + escapeHtml(item.large) + '" data-pswp-width="' + valueOf(item.width, 1200) + '" data-pswp-height="' + valueOf(item.height, 1200) + '"><img src="' + escapeHtml(item.large) + '" alt="' + escapeHtml(item.alt) + '" /></a></div>';
      }).join('');
    }

    if (els.thumbSwiperWrapper) {
      els.thumbSwiperWrapper.innerHTML = state.activeGallery.map(function (item) {
        return '<div class="swiper-slide"><img src="' + escapeHtml(item.thumb) + '" alt="' + escapeHtml(item.alt) + '" /></div>';
      }).join('');
    }

    if (thumbSwiper) thumbSwiper.update();
    toggleGalleryNavigation();
    if (mainSwiper) {
      mainSwiper.update();
      mainSwiper.slideTo(0, 0);
    }
    if (thumbSwiper) thumbSwiper.slideTo(0, 0);

    if (lightbox) lightbox.destroy();
    if (byId('productMainSwiper')) {
      if (window.PhotoSwipeLightbox && window.PhotoSwipe) {
        lightbox = new window.PhotoSwipeLightbox({
          gallery: '#productMainSwiper',
          children: 'a',
          pswpModule: window.PhotoSwipe
        });
        lightbox.init();
      }
    }
  }

  // 根据当前图库数量控制左右箭头是否可用。
  function toggleGalleryNavigation() {
    var disabled = state.activeGallery.length <= 1;
    setDisabled(els.galleryPrevBtn, disabled);
    setDisabled(els.galleryNextBtn, disabled);
  }

  // 图库优先级：variation 专属图组 > 颜色图组。
  function resolveGalleryForSelection() {
    var variation = state.activeVariation;
    if (variation && variation.imageStrategy && variation.imageStrategy.type === 'variation' && Array.isArray(variation.imageStrategy.images)) {
      return variation.imageStrategy.images;
    }
    return read(data, 'galleriesByColor.' + state.selected.color, []);
  }

  // 当用户选到不可售组合时，自动回退到最近的可售组合。
  function applyClosestValidSelection() {
    var exact = getExactVariation(state.selected);
    if (exact) {
      state.selected = copy(exact.attributes);
      return;
    }

    var byColorAndSize = (data.variations || []).find(function (item) {
      return item.attributes.color === state.selected.color && item.attributes.size === state.selected.size;
    });
    if (byColorAndSize) {
      state.selected = copy(byColorAndSize.attributes);
      return;
    }

    var byColor = (data.variations || []).find(function (item) {
      return item.attributes.color === state.selected.color;
    });
    if (byColor) state.selected = copy(byColor.attributes);
  }

  function getExactVariation(selected) {
    return (data.variations || []).find(function (item) {
      return Object.keys(selected).every(function (key) { return item.attributes[key] === selected[key]; });
    }) || null;
  }

  function hasCompatibleVariation(partialSelection) {
    return (data.variations || []).some(function (item) {
      return Object.keys(partialSelection).every(function (key) { return item.attributes[key] === partialSelection[key]; });
    });
  }

  function findAttributeMeta(key, slug) {
    return read(data, 'attributes.' + key, []).find(function (item) { return item.slug === slug; }) || null;
  }

  function firstSlug(key) {
    var first = read(data, 'attributes.' + key + '.0', null);
    return first ? first.slug : '';
  }

  function buildBreadcrumbHTML(list) {
    if (!Array.isArray(list)) return '';
    return list.map(function (item, index) {
      var label = escapeHtml(item.label || '');
      var content = item.href ? '<a href="' + escapeHtml(item.href) + '">' + label + '</a>' : '<span>' + label + '</span>';
      return index === 0 ? content : '<span class="mx-2">&gt;</span>' + content;
    }).join('');
  }

  function byId(id) { return document.getElementById(id); }
  function on(el, name, fn) { if (el) el.addEventListener(name, fn); }
  function qsa(root, selector) { return root ? Array.prototype.slice.call(root.querySelectorAll(selector)) : []; }
  function setText(el, value) { if (el) el.textContent = value == null ? '' : String(value); }
  function setHTML(el, value) { if (el) el.innerHTML = value == null ? '' : String(value); }
  function setDisabled(el, value) { if (el) el.disabled = !!value; }
  function valueOf(value, fallback) { return value == null || value === '' ? fallback : value; }
  function labelOf(item) { return item ? valueOf(item.label, '—') : '—'; }
  function copy(obj) { return JSON.parse(JSON.stringify(obj || {})); }

  // 安全读取深层对象，避免某个字段不存在时直接报错。
  function read(obj, path, fallback) {
    var result = String(path).split('.').reduce(function (acc, key) {
      return acc && acc[key] != null ? acc[key] : undefined;
    }, obj);
    return result == null ? fallback : result;
  }

  function escapeHtml(value) {
    return String(value == null ? '' : value)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }
})();
