/* Prothiese integration: Clarum stays an independent React frontend and backend. */
(function () {
  'use strict';
  var SS = window.SS, h = SS.ui.h;

  SS.views.clarum = function (root) {
    var frame = h('iframe', {
      class: 'clarum-frame',
      src: '/clarum/',
      title: 'Clarum repository intelligence workspace',
      loading: 'eager',
      referrerpolicy: 'same-origin',
      allow: 'clipboard-read; clipboard-write'
    });
    root.append(h('section', { class: 'clarum-surface' }, frame));
    return function () {
      // The route owns the embedded document. Removing it releases its React app.
      frame.src = 'about:blank';
    };
  };
})();
