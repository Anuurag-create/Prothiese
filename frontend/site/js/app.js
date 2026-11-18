/* SkillSphere web — router + app shell
   Hash-based routes (#/home, #/project/ID …) so the site works from any static
   host, or straight from the file system, with no server configuration. */
(function () {
  'use strict';
  var SS = window.SS, ui = SS.ui, h = ui.h, store = SS.store;

  var appEl = document.getElementById('app');
  var cleanup = null;
  var shell = null;
  var lastIdx = -1;
  var currentIdx = 0;
  var replaceNext = false;

  /* layout: bare = full-screen (splash/auth) · tab = main screens · sub = detail screens */
  var routes = [
    { re: /^\/splash$/, view: 'splash', layout: 'bare', pub: true, title: 'Prothiese' },
    { re: /^\/login$/, view: 'login', layout: 'bare', pub: true, title: 'Log in' },
    { re: /^\/signup$/, view: 'signup', layout: 'bare', pub: true, title: 'Create account' },
    { re: /^\/home$/, view: 'home', layout: 'tab', tab: 'home', title: 'Home' },
    { re: /^\/discover$/, view: 'discover', layout: 'tab', tab: 'discover', title: 'Discover' },
    { re: /^\/workspaces$/, view: 'workspaces', layout: 'tab', tab: 'workspaces', title: 'My workspaces' },
    { re: /^\/profile$/, view: 'profile', layout: 'tab', tab: 'profile', title: 'Profile' },
    { re: /^\/clarum$/, view: 'clarum', layout: 'tab', tab: 'clarum', title: 'Clarum' },
    { re: /^\/project\/([^/]+)$/, view: 'projectDetail', layout: 'sub', tab: 'discover', title: 'Project details' },
    { re: /^\/create$/, view: 'createProject', layout: 'sub', tab: 'home', title: 'Create project' },
    { re: /^\/workspace\/([^/]+)(?:\/(chat|members|tasks))?$/, view: 'workspace', layout: 'sub', tab: 'workspaces', title: 'Workspace' },
    { re: /^\/notifications$/, view: 'notifications', layout: 'sub', tab: 'home', title: 'Notifications' },
    { re: /^\/edit-profile$/, view: 'editProfile', layout: 'sub', tab: 'profile', title: 'Edit profile' }
  ];

  var NAV = [
    { id: 'home', label: 'Home', icon: 'home', href: '#/home' },
    { id: 'discover', label: 'Discover', icon: 'search', href: '#/discover' },
    { id: 'workspaces', label: 'Workspace', icon: 'workspace', href: '#/workspaces' },
    { id: 'clarum', label: 'Clarum', icon: 'clarum', href: '#/clarum' },
    { id: 'profile', label: 'Profile', icon: 'user', href: '#/profile' }
  ];

  /* ---------- navigation ---------- */
  function currentPath() {
    var p = (location.hash || '').replace(/^#/, '').split('?')[0];
    return p;
  }

  var nav = {
    go: function (path, opts) {
      var target = '#' + path;
      if (opts && opts.replace) {
        if (location.hash !== target) replaceNext = true;
        location.replace(target);
        if (location.hash === target && replaceNext) { /* hashchange will fire */ }
      } else {
        location.hash = path;
      }
    },
    // Go to the previous in-app screen, or to `fallback` when this is the first one.
    back: function (fallback) {
      if (currentIdx > 0) history.back();
      else nav.go(fallback || '/home', { replace: true });
    }
  };

  function trackIndex() {
    var st = history.state;
    if (st && typeof st.i === 'number') { currentIdx = st.i; }
    else {
      currentIdx = replaceNext ? Math.max(lastIdx, 0) : lastIdx + 1;
      try { history.replaceState({ i: currentIdx }, ''); } catch (e) { /* file:// quirks */ }
    }
    lastIdx = currentIdx;
    replaceNext = false;
  }

  /* ---------- shell (sidebar / tab bar) ---------- */
  function buildShell() {
    var main = h('main', { id: 'main', class: 'main', tabindex: '-1' });

    function navLink(item, cls) {
      return h('a', { class: cls, href: item.href, 'data-tab': item.id }, ui.icon(item.icon, 22), h('span', {}, item.label));
    }

    var userBox = h('a', { class: 'rail-user', href: '#/profile', 'aria-label': 'Your profile' });
    var rail = h('aside', { class: 'rail' },
      h('a', { class: 'brand', href: '#/home', 'aria-label': 'Prothiese home' }, h('span', { class: 'brand-mark' }, 'P'), h('span', { class: 'brand-name' }, 'Prothiese')),
      h('nav', { 'aria-label': 'Main' }, h('ul', { class: 'rail-nav' }, NAV.map(function (n) { return h('li', {}, navLink(n, 'rail-link')); }))),
      h('a', { class: 'btn invert block rail-new', href: '#/create' }, ui.icon('plus', 18), 'Create project'),
      userBox);

    var tabbar = h('nav', { class: 'tabbar', 'aria-label': 'Main' }, NAV.map(function (n) { return navLink(n, 'tab-link'); }));
    var fab = h('a', { class: 'fab', href: '#/create', 'aria-label': 'Create project' }, ui.icon('plus', 26));
    var skip = h('button', { type: 'button', class: 'skip', onclick: function () { main.focus(); } }, 'Skip to content');

    var el = h('div', { class: 'shell' }, skip, rail, main, tabbar, fab);

    function refreshUser() {
      var uid = store.currentUserId();
      if (!uid) return;
      store.getUser(uid).then(function (u) {
        if (!u) return;
        userBox.replaceChildren(ui.avatar(u, { size: 36 }),
          h('span', { class: 'rail-user-text' }, h('strong', {}, u.name || 'You'), h('small', {}, u.email || '')));
      });
    }
    store.subscribe(refreshUser);

    return {
      el: el, main: main, fab: fab, refreshUser: refreshUser,
      setRoute: function (route) {
        el.setAttribute('data-layout', route.layout);
        el.querySelectorAll('[data-tab]').forEach(function (a) {
          if (a.getAttribute('data-tab') === route.tab) a.setAttribute('aria-current', 'page');
          else a.removeAttribute('aria-current');
        });
        fab.hidden = route.layout !== 'tab' || route.tab === 'profile' || route.tab === 'clarum';
      }
    };
  }

  /* ---------- render ---------- */
  function resolve(path) {
    for (var i = 0; i < routes.length; i++) {
      var m = routes[i].re.exec(path);
      if (m) return { route: routes[i], params: m.slice(1).map(function (x) { return x == null ? x : decodeURIComponent(x); }) };
    }
    return null;
  }

  function render() {
    if (cleanup) { try { cleanup(); } catch (e) { console.error(e); } cleanup = null; }
    ui.closeAllModals();
    trackIndex();

    var path = currentPath();
    var loggedIn = store.isLoggedIn();

    if (!path || path === '/') {
      var seen = false;
      try { seen = sessionStorage.getItem('ss.splash') === '1'; } catch (e) { /* ignore */ }
      nav.go(seen ? (loggedIn ? '/home' : '/login') : '/splash', { replace: true });
      return;
    }
    var hit = resolve(path);
    if (!hit) { nav.go(loggedIn ? '/home' : '/login', { replace: true }); return; }
    var route = hit.route;
    if (!route.pub && !loggedIn) { nav.go('/login', { replace: true }); return; }
    if (route.pub && route.view !== 'splash' && loggedIn) { nav.go('/home', { replace: true }); return; }

    var container;
    if (route.layout === 'bare') {
      container = h('div', { class: 'bare' });
      appEl.replaceChildren(container);
    } else {
      if (!shell) shell = buildShell();
      if (appEl.firstChild !== shell.el) appEl.replaceChildren(shell.el);
      shell.setRoute(route);
      shell.refreshUser();
      container = h('div', { class: 'view view-' + route.view });
      shell.main.replaceChildren(container);
    }

    document.title = route.title + ' · Prothiese';
    window.scrollTo(0, 0);
    cleanup = SS.views[route.view](container, nav, hit.params) || null;
    if (shell && route.layout !== 'bare') { try { shell.main.focus({ preventScroll: true }); } catch (e) { /* ignore */ } }
  }

  window.addEventListener('hashchange', render);
  window.addEventListener('ss:session', render);
  render();
})();
