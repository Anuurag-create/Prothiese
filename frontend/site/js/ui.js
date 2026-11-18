/* SkillSphere web — UI toolkit */
(function () {
  'use strict';
  var SS = (window.SS = window.SS || {});

  /* ---------- DOM helper ----------
     h('div', {class:'x', onclick: fn}, child, [children], 'text')
     User-supplied strings are only ever added as text nodes (never innerHTML). */
  function append(el, kids) {
    for (var i = 0; i < kids.length; i++) {
      var k = kids[i];
      if (k == null || k === false) continue;
      if (Array.isArray(k)) append(el, k);
      else el.append(k.nodeType ? k : document.createTextNode(String(k)));
    }
  }
  function h(tag, props) {
    var el = document.createElement(tag);
    var deferred = null;
    if (props) {
      for (var k in props) {
        var v = props[k];
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (k.slice(0, 2) === 'on' && typeof v === 'function') el.addEventListener(k.slice(2).toLowerCase(), v);
        else if (k === 'value') deferred = v; // set after <option> children exist
        else if (k === 'checked' || k === 'disabled' || k === 'selected' || k === 'hidden') el[k] = !!v;
        else el.setAttribute(k, v === true ? '' : v);
      }
    }
    append(el, Array.prototype.slice.call(arguments, 2));
    if (deferred !== null) el.value = deferred;
    return el;
  }

  /* ---------- icons (static markup only) ---------- */
  var ICONS = {
    home: '<path d="M3 11l9-8 9 8"/><path d="M5 10v10h14V10"/><path d="M10 20v-6h4v6"/>',
    search: '<circle cx="11" cy="11" r="7"/><path d="M20 20l-3.5-3.5"/>',
    workspace: '<rect x="3" y="3" width="7" height="9"/><rect x="14" y="3" width="7" height="5"/><rect x="14" y="12" width="7" height="9"/><rect x="3" y="16" width="7" height="5"/>',
    clarum: '<path d="M4 5.5A2.5 2.5 0 016.5 3H20v15H6.5A2.5 2.5 0 014 15.5z"/><path d="M4 7h16M8 11h8M8 14h5"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>',
    users: '<circle cx="9" cy="8" r="3.5"/><path d="M2 20c0-3.6 3-6 7-6s7 2.4 7 6"/><circle cx="17" cy="9" r="2.5"/><path d="M17 14c3 0 5 2 5 5"/>',
    bell: '<path d="M6 8a6 6 0 0112 0c0 7 3 8 3 8H3s3-1 3-8"/><path d="M10 20a2 2 0 004 0"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    back: '<path d="M19 12H5M11 6l-6 6 6 6"/>',
    send: '<path d="M22 2L11 13"/><path d="M22 2l-7 20-4-9-9-4 20-7z"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7"/>',
    x: '<path d="M6 6l12 12M18 6L6 18"/>',
    trash: '<path d="M4 7h16"/><path d="M9 7V4h6v3"/><path d="M6 7l1 13h10l1-13"/><path d="M10 11v6M14 11v6"/>',
    edit: '<path d="M4 20h4L19 9l-4-4L4 16v4z"/><path d="M13.5 6.5l4 4"/>',
    lock: '<rect x="5" y="11" width="14" height="10"/><path d="M8 11V7a4 4 0 018 0v4"/>',
    camera: '<path d="M3 8h4l2-3h6l2 3h4v12H3z"/><circle cx="12" cy="14" r="4"/>',
    chat: '<path d="M4 4h16v12H9l-5 4z"/>',
    tasks: '<rect x="4" y="3" width="16" height="18"/><path d="M8 9l2 2 3.5-4M8 16h8"/>',
    logout: '<path d="M9 4H4v16h5"/><path d="M16 8l4 4-4 4M20 12H9"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>',
    eyeOff: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/><path d="M3 3l18 18"/>',
    moon: '<path d="M20 14.5A8 8 0 019.5 4 8 8 0 1020 14.5z"/>',
    mail: '<rect x="3" y="5" width="18" height="14"/><path d="M3 6l9 7 9-7"/>',
    chevron: '<path d="M9 5l7 7-7 7"/>',
    alert: '<circle cx="12" cy="12" r="9"/><path d="M12 7v6M12 16.5v.5"/>',
    person: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
  };
  function icon(name, size) {
    var s = document.createElement('span');
    s.className = 'icon';
    s.setAttribute('aria-hidden', 'true');
    var px = size || 20;
    s.innerHTML = '<svg viewBox="0 0 24 24" width="' + px + '" height="' + px + '" fill="none" stroke="currentColor" ' +
      'stroke-width="2" stroke-linecap="square" stroke-linejoin="miter">' + (ICONS[name] || '') + '</svg>';
    return s;
  }

  /* ---------- text + time ---------- */
  function initials(name) {
    if (!name || !String(name).trim()) return '?';
    var p = String(name).trim().split(/\s+/);
    if (p.length >= 2) return (p[0][0] + p[1][0]).toUpperCase();
    return String(name).slice(0, 2).toUpperCase();
  }
  function greeting() {
    var hr = new Date().getHours();
    return hr < 12 ? 'Good morning' : hr < 17 ? 'Good afternoon' : 'Good evening';
  }
  function formatDate(ts) {
    return new Date(ts).toLocaleDateString(undefined, { month: 'short', day: '2-digit', year: 'numeric' });
  }
  function formatTime(ts) {
    return new Date(ts).toLocaleTimeString(undefined, { hour: 'numeric', minute: '2-digit' });
  }
  function relTime(ts) {
    var diff = Date.now() - ts;
    var min = Math.floor(diff / 60000);
    if (min < 1) return 'Just now';
    if (min < 60) return min + ' min ago';
    var hr = Math.floor(min / 60);
    if (hr < 24) return hr + ' hr ago';
    if (hr < 48) return 'Yesterday';
    return formatDate(ts);
  }
  function plural(n, one, many) { return n + ' ' + (n === 1 ? one : (many || one + 's')); }
  function cap(s) { s = String(s || ''); return s.charAt(0).toUpperCase() + s.slice(1); }

  // Ported from ProjectAdapter.clean(): hides raw IDs / emails that leaked into display fields.
  function clean(s, fallback) {
    if (s == null) return fallback;
    s = String(s);
    if (!s.trim() || s.indexOf('[Ljava.lang.String;') === 0 || s.indexOf('@') !== -1) return fallback;
    if (s.length >= 20 && /^[a-zA-Z0-9_-]+$/.test(s)) return fallback;
    return s.trim();
  }

  /* ---------- toast ---------- */
  var toastBox = null;
  function toast(msg) {
    if (!toastBox) {
      toastBox = h('div', { class: 'toasts', role: 'status', 'aria-live': 'polite' });
      document.body.append(toastBox);
    }
    var t = h('div', { class: 'toast' }, msg);
    while (toastBox.children.length >= 3) toastBox.firstChild.remove();
    toastBox.append(t);
    setTimeout(function () {
      t.classList.add('out');
      setTimeout(function () { t.remove(); }, 250);
    }, 2800);
  }

  /* ---------- modal ---------- */
  var modalCount = 0;
  var openModals = [];
  function modal(opts) {
    var prevFocus = document.activeElement;
    var titleId = 'dlg-title-' + (++modalCount);
    var overlay = h('div', { class: 'overlay' });
    var closed = false;
    var api = { close: close, el: null };

    function close(result) {
      if (closed) return;
      closed = true;
      var oi = openModals.indexOf(api);
      if (oi !== -1) openModals.splice(oi, 1);
      document.removeEventListener('keydown', onKey, true);
      overlay.remove();
      document.body.classList.remove('has-modal');
      if (prevFocus && prevFocus.focus) { try { prevFocus.focus(); } catch (e) { /* ignore */ } }
      if (opts.onClose) opts.onClose(result);
    }

    var footer = null;
    if (opts.actions && opts.actions.length) {
      footer = h('div', { class: 'dialog-foot' }, opts.actions.map(function (a) {
        return h('button', {
          type: 'button',
          class: 'btn' + (a.kind === 'ghost' ? ' ghost' : '') + (a.danger ? ' danger' : ''),
          onclick: function () { if (a.onClick) a.onClick(api); else close(); }
        }, a.label);
      }));
      api.footer = footer;
    }

    var dlg = h('div', { class: 'dialog' + (opts.wide ? ' wide' : ''), role: 'dialog', 'aria-modal': 'true', 'aria-labelledby': titleId },
      h('div', { class: 'dialog-head' },
        h('h2', { id: titleId }, opts.title),
        h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Close', onclick: function () { close(); } }, icon('x'))),
      h('div', { class: 'dialog-body' }, opts.content),
      footer);
    overlay.append(dlg);
    overlay.addEventListener('mousedown', function (e) { if (e.target === overlay) close(); });

    function onKey(e) {
      if (e.key === 'Escape') { e.stopPropagation(); close(); return; }
      if (e.key !== 'Tab') return;
      var f = dlg.querySelectorAll('button, [href], input:not([type=hidden]), select, textarea, [tabindex]:not([tabindex="-1"])');
      f = Array.prototype.filter.call(f, function (n) { return !n.disabled && n.offsetParent !== null; });
      if (!f.length) return;
      var first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    }
    document.addEventListener('keydown', onKey, true);
    document.body.append(overlay);
    document.body.classList.add('has-modal');
    api.el = dlg;
    openModals.push(api);
    var focusTarget = dlg.querySelector('[data-autofocus]') || dlg.querySelector('input, textarea, select') || dlg.querySelector('.dialog-foot .btn:last-child') || dlg;
    setTimeout(function () { (focusTarget.focus ? focusTarget : dlg).focus(); }, 0);
    return api;
  }

  function closeAllModals() { openModals.slice().forEach(function (m) { m.close(); }); }

  function confirmDialog(o) {
    return new Promise(function (resolve) {
      var answered = false;
      modal({
        title: o.title,
        content: h('p', { class: 'dialog-text' }, o.message),
        actions: [
          { label: o.cancelLabel || 'Cancel', kind: 'ghost', onClick: function (m) { answered = true; resolve(false); m.close(); } },
          { label: o.confirmLabel || 'OK', onClick: function (m) { answered = true; resolve(true); m.close(); } }
        ],
        onClose: function () { if (!answered) resolve(false); }
      });
    });
  }

  // Pick one item from a list. options: [{value,label,sub}] → resolves value or null.
  function pickOne(o) {
    return new Promise(function (resolve) {
      var done = false;
      var m = modal({
        title: o.title,
        content: h('div', { class: 'pick-list' }, o.options.map(function (opt) {
          return h('button', { type: 'button', class: 'pick-item', onclick: function () { done = true; resolve(opt.value); m.close(); } },
            h('span', {}, h('strong', {}, opt.label), opt.sub ? h('small', {}, opt.sub) : null),
            icon('chevron', 18));
        })),
        actions: [{ label: 'Cancel', kind: 'ghost' }],
        onClose: function () { if (!done) resolve(null); }
      });
    });
  }

  // Multi-select with grouped chips. groups: [{label, items:[...]}]. Resolves array or null (cancelled).
  function pickMulti(o) {
    return new Promise(function (resolve) {
      var selected = (o.selected || []).slice();
      var done = false;
      var doneBtnLabel = function () { return 'Done (' + selected.length + ' selected)'; };
      var body = h('div', { class: 'pick-groups' }, o.groups.map(function (g) {
        return h('fieldset', { class: 'pick-group' },
          g.label ? h('legend', {}, g.label) : null,
          h('div', { class: 'chips' }, g.items.map(function (item) {
            var on = selected.indexOf(item) !== -1;
            var b = h('button', { type: 'button', class: 'chip toggle' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false' }, item);
            b.addEventListener('click', function () {
              var i = selected.indexOf(item);
              if (i === -1) selected.push(item); else selected.splice(i, 1);
              var now = i === -1;
              b.classList.toggle('on', now);
              b.setAttribute('aria-pressed', now ? 'true' : 'false');
              if (m.footer) m.footer.lastChild.textContent = doneBtnLabel();
            });
            return b;
          })));
      }));
      var m = modal({
        title: o.title, content: body, wide: true,
        actions: [
          { label: 'Cancel', kind: 'ghost' },
          { label: doneBtnLabel(), onClick: function (mm) { done = true; resolve(selected); mm.close(); } }
        ],
        onClose: function () { if (!done) resolve(null); }
      });
    });
  }

  /* ---------- form fields ---------- */
  var fieldCount = 0;
  function field(o) {
    var id = o.id || 'field-' + (++fieldCount);
    var tag = o.tag || 'input';
    var props = { class: 'input', id: id };
    ['type', 'placeholder', 'autocomplete', 'maxlength', 'rows', 'value', 'inputmode', 'list', 'name'].forEach(function (k) {
      if (o[k] != null) props[k] = o[k];
    });
    var input = h.apply(null, [tag, props].concat(o.children || []));
    var err = h('p', { class: 'err', id: id + '-err', hidden: true });
    var control = input;
    var toggle = null;
    if (o.password) {
      toggle = h('button', { type: 'button', class: 'pw-toggle', 'aria-label': 'Show password', 'aria-pressed': 'false' }, icon('eye'));
      toggle.addEventListener('click', function () {
        var show = input.type === 'password';
        input.type = show ? 'text' : 'password';
        toggle.setAttribute('aria-pressed', show ? 'true' : 'false');
        toggle.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
        toggle.replaceChildren(icon(show ? 'eyeOff' : 'eye'));
      });
      control = h('div', { class: 'pw' }, input, toggle);
    }
    var counter = null;
    if (o.counter && o.maxlength) {
      counter = h('span', { class: 'counter', 'aria-hidden': 'true' }, '0/' + o.maxlength);
      input.addEventListener('input', function () { counter.textContent = input.value.length + '/' + o.maxlength; });
    }
    var label = h('label', { for: id }, o.label, counter);
    var root = h('div', { class: 'field' + (o.class ? ' ' + o.class : '') }, label, control, o.hint ? h('p', { class: 'hint' }, o.hint) : null, err);

    function setError(msg) {
      if (msg) {
        err.replaceChildren(icon('alert', 16), h('span', {}, msg));
        err.hidden = false;
        root.classList.add('has-error');
        input.setAttribute('aria-invalid', 'true');
        input.setAttribute('aria-describedby', err.id);
      } else {
        err.hidden = true;
        root.classList.remove('has-error');
        input.removeAttribute('aria-invalid');
        input.removeAttribute('aria-describedby');
      }
    }
    input.addEventListener('input', function () { setError(''); });
    if (input.tagName === 'SELECT') input.addEventListener('change', function () { setError(''); });
    return { root: root, input: input, setError: setError, get value() { return input.value.trim(); } };
  }

  /* ---------- shared components ---------- */
  function avatar(user, o) {
    o = o || {};
    var size = o.size || 44;
    var el = h('span', { class: 'avatar', style: { width: size + 'px', height: size + 'px', fontSize: Math.round(size * 0.38) + 'px' } });
    if (user && user.photoUrl) el.append(h('img', { src: user.photoUrl, alt: '' }));
    else el.append(initials(user && user.name));
    if (o.dot) el.append(h('span', { class: 'dot', title: 'Online' }));
    return el;
  }

  // Segmented team meter: filled squares are members, hollow squares are open slots.
  function meter(count, max) {
    var total = Math.max(max || 0, count);
    var el = h('span', { class: 'meter', role: 'img', 'aria-label': count + ' of ' + total + ' places filled' });
    for (var i = 0; i < total; i++) el.append(h('i', { class: i < count ? 'on' : '' }));
    return el;
  }

  function chips(list, cls) {
    return h('div', { class: 'chips' }, list.map(function (s) { return h('span', { class: 'chip ' + (cls || 'soft') }, s); }));
  }

  function emptyState(o) {
    return h('div', { class: 'empty' },
      h('h3', {}, o.title),
      o.text ? h('p', {}, o.text) : null,
      o.actions ? h('div', { class: 'empty-actions' }, o.actions) : null);
  }

  // One project in a list (Home, Discover, Workspace tab).
  function projectCard(p, meId, onOpen) {
    var isPart = !!meId && (p.leadId === meId || (p.members || []).indexOf(meId) !== -1);
    var category = clean(p.category, 'General');
    var university = clean(p.university, 'SkillSphere');
    var skills = [];
    (p.skillsRequired || []).forEach(function (s) { var c = clean(s, ''); if (c) skills.push(c); });
    if (!skills.length) (p.categories || []).forEach(function (s) { var c = clean(s, ''); if (c) skills.push(c); });
    if (!skills.length) skills.push(category);
    var count = (p.members || []).length;
    var max = p.maxMembers > 0 ? p.maxMembers : 5;

    return h('article', { class: 'proj', onclick: function () { onOpen(p); } },
      h('div', { class: 'proj-icon', 'aria-hidden': 'true' }, p.icon || '🤖'),
      h('div', { class: 'proj-body' },
        h('h3', { class: 'proj-title' }, clean(p.title, 'Untitled project')),
        h('p', { class: 'proj-meta' }, h('span', { class: 'chip solid' }, category), h('span', {}, university)),
        h('p', { class: 'proj-desc' }, clean(p.description, 'No description available')),
        chips(skills.slice(0, 6))),
      h('div', { class: 'proj-side' },
        h('div', { class: 'proj-count' }, meter(count, max), h('span', {}, count + '/' + max)),
        h('button', { type: 'button', class: 'btn sm' + (isPart ? '' : ' ghost'), onclick: function (e) { e.stopPropagation(); onOpen(p); } },
          isPart ? 'Open workspace' : 'View & apply')));
  }

  function statusChip(status) {
    var s = status || 'forming';
    return h('span', { class: 'status status-' + s }, cap(s));
  }

  function backButton(nav, fallback, label) {
    return h('button', { type: 'button', class: 'icon-btn back', 'aria-label': label || 'Back', onclick: function () { nav.back(fallback); } }, icon('back'));
  }

  // Top bar for sub-pages: back button, title, optional actions on the right.
  function subhead(nav, title, o) {
    o = o || {};
    return h('header', { class: 'subhead' },
      h('div', { class: 'wrap subhead-inner' },
        backButton(nav, o.fallback || '/home'),
        typeof title === 'string' ? h('h1', { class: 'subhead-title' }, title) : title,
        h('div', { class: 'subhead-actions' }, o.actions || [])));
  }

  // Reads an image file, shrinks it, and returns a small JPEG data URL.
  function readImage(file, maxSide) {
    return new Promise(function (resolve, reject) {
      if (!file || !/^image\//.test(file.type)) return reject(new Error('Please choose an image file'));
      if (file.size > SS.C.MAX_IMAGE_SIZE_MB * 1024 * 1024) return reject(new Error('Image must be under ' + SS.C.MAX_IMAGE_SIZE_MB + ' MB'));
      var reader = new FileReader();
      reader.onerror = function () { reject(new Error('Could not read that image')); };
      reader.onload = function () {
        var img = new Image();
        img.onerror = function () { reject(new Error('Could not read that image')); };
        img.onload = function () {
          var side = maxSide || 320;
          var scale = Math.min(1, side / Math.max(img.width, img.height));
          var c = document.createElement('canvas');
          c.width = Math.round(img.width * scale); c.height = Math.round(img.height * scale);
          var ctx = c.getContext('2d');
          ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, c.width, c.height);
          ctx.drawImage(img, 0, 0, c.width, c.height);
          resolve(c.toDataURL('image/jpeg', 0.85));
        };
        img.src = reader.result;
      };
      reader.readAsDataURL(file);
    });
  }

  SS.ui = {
    h: h, icon: icon, toast: toast, modal: modal, closeAllModals: closeAllModals, confirm: confirmDialog, pickOne: pickOne, pickMulti: pickMulti,
    field: field, avatar: avatar, meter: meter, chips: chips, emptyState: emptyState, projectCard: projectCard,
    statusChip: statusChip, backButton: backButton, subhead: subhead, readImage: readImage,
    initials: initials, greeting: greeting, formatDate: formatDate, formatTime: formatTime, relTime: relTime,
    plural: plural, cap: cap, clean: clean
  };
})();
