(function () {
  window.PRODUCT_DATA = {
    product: {
      title: 'COOWIN Enhance Basics® Composite Deck Board',
      fallbackPrice: '$30.99',
      badge: 'Local Demo',
      utilityButtonText: 'Deck Calculator',
      helperNote: '',
      breadcrumb: [
        { label: 'Shop All', href: '#' },
        { label: 'COOWIN Decking', href: '#' },
        { label: 'COOWIN Enhance Basics® Composite Deck Board' }
      ]
    },
    defaults: {
      color: 'saddle',
      size: '12-ft',
      edge: 'grooved-edge'
    },
    attributes: {
      color: [
        { slug: 'saddle', label: 'Saddle', pattern: 'Warm cedar tone', swatch: './images/Saddle-swatch.svg' },
        { slug: 'rocky-harbor', label: 'Rocky Harbor', pattern: 'Driftwood gray', swatch: './images/Rocky-Harbor-swatch.svg' },
        { slug: 'clam-shell', label: 'Clam Shell', pattern: 'Soft coastal beige', swatch: './images/Clam-Shell-swatch.svg' }
      ],
      size: [
        { slug: '12-ft', label: '12 ft' },
        { slug: '16-ft', label: '16 ft' },
        { slug: '20-ft', label: '20 ft' }
      ],
      edge: [
        { slug: 'grooved-edge', label: 'Grooved Edge' },
        { slug: 'square-edge', label: 'Square Edge' }
      ]
    },
    galleriesByColor: {
      saddle: buildGallery('Saddle', [
        './images/Saddle-01.svg',
        './images/Saddle-02.svg',
        './images/Saddle-03.svg',
        './images/Saddle-04.svg'
      ]),
      'rocky-harbor': buildGallery('Rocky Harbor', [
        './images/Rocky-Harbor-01.svg',
        './images/Rocky-Harbor-02.svg',
        './images/Rocky-Harbor-03.svg',
        './images/Rocky-Harbor-04.svg'
      ]),
      'clam-shell': buildGallery('Clam Shell', [
        './images/Clam-Shell-01.svg',
        './images/Clam-Shell-02.svg',
        './images/Clam-Shell-03.svg',
        './images/Clam-Shell-04.svg'
      ])
    },
    variations: [
      { id: 1001, attributes: { color: 'saddle', size: '12-ft', edge: 'grooved-edge' }, sku: 'TRX-SAD-12-GR', price: '$30.99', stock: 'instock', stockMessage: 'In stock. Ready to ship.', imageStrategy: { type: 'color' } },
      { id: 1002, attributes: { color: 'saddle', size: '12-ft', edge: 'square-edge' }, sku: 'TRX-SAD-12-SQ', price: '$31.49', stock: 'outofstock', stockMessage: 'Square Edge is currently out of stock.', imageStrategy: { type: 'color' } },
      { id: 1003, attributes: { color: 'saddle', size: '16-ft', edge: 'grooved-edge' }, sku: 'TRX-SAD-16-GR', price: '$38.99', stock: 'instock', stockMessage: 'In stock. Limited inventory.', imageStrategy: { type: 'color' } },
      { id: 1004, attributes: { color: 'saddle', size: '20-ft', edge: 'grooved-edge' }, sku: 'TRX-SAD-20-GR', price: '$47.99', stock: 'instock', stockMessage: 'Made to order. Ships in 7–10 days.', imageStrategy: { type: 'color' } },
      { id: 1011, attributes: { color: 'rocky-harbor', size: '12-ft', edge: 'grooved-edge' }, sku: 'TRX-RH-12-GR', price: '$30.99', stock: 'instock', stockMessage: 'In stock. Ready to ship.', imageStrategy: { type: 'color' } },
      { id: 1012, attributes: { color: 'rocky-harbor', size: '16-ft', edge: 'grooved-edge' }, sku: 'TRX-RH-16-GR', price: '$39.49', stock: 'instock', stockMessage: 'In stock. Ready to ship.', imageStrategy: { type: 'color' } },
      { id: 1013, attributes: { color: 'rocky-harbor', size: '16-ft', edge: 'square-edge' }, sku: 'TRX-RH-16-SQ', price: '$39.99', stock: 'instock', stockMessage: 'Square Edge is available.', imageStrategy: { type: 'variation', images: buildGallery('Rocky Harbor Square Edge', [
        './images/Rocky-Harbor-02.svg',
        './images/Rocky-Harbor-04.svg',
        './images/Rocky-Harbor-01.svg',
        './images/Rocky-Harbor-03.svg'
      ]) } },
      { id: 1021, attributes: { color: 'clam-shell', size: '12-ft', edge: 'grooved-edge' }, sku: 'TRX-CS-12-GR', price: '$31.99', stock: 'instock', stockMessage: 'In stock. Ready to ship.', imageStrategy: { type: 'color' } },
      { id: 1022, attributes: { color: 'clam-shell', size: '16-ft', edge: 'grooved-edge' }, sku: 'TRX-CS-16-GR', price: '$40.49', stock: 'outofstock', stockMessage: '16 ft is currently out of stock.', imageStrategy: { type: 'color' } },
      { id: 1023, attributes: { color: 'clam-shell', size: '20-ft', edge: 'grooved-edge' }, sku: 'TRX-CS-20-GR', price: '$49.49', stock: 'instock', stockMessage: 'Only 3 bundles left.', imageStrategy: { type: 'color' } }
    ]
  };

  function buildGallery(baseLabel, files) {
    return files.map(function (file, index) {
      return {
        large: file,
        thumb: file,
        width: 1200,
        height: 1200,
        alt: baseLabel + ' - View ' + (index + 1)
      };
    });
  }
})();
