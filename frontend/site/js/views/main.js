/* SkillSphere web — Home, Discover, Workspaces (the main tabs) */
(function () {
  'use strict';
  var SS = window.SS, ui = SS.ui, h = ui.h, store = SS.store;

  function guard(fn) {
    return function (err) { ui.toast(err && err.message ? err.message : 'Something went wrong'); if (fn) fn(); };
  }

  /* ---------- Home (HomeFragment) ---------- */
  SS.views.home = function (root, nav) {
    var me = store.currentUserId();
    var alive = true;

    var title = h('h1', { class: 'band-title' }, 'Hey there');
    var badge = h('span', { class: 'badge', hidden: true });
    var bell = h('a', { class: 'bell', href: '#/notifications', 'aria-label': 'Notifications' }, ui.icon('bell', 22), badge);
    var band = h('header', { class: 'band' },
      h('div', { class: 'wrap band-inner' },
        h('div', {}, h('p', { class: 'band-kicker' }, ui.greeting()), title), bell));

    var reqSection = h('section', { class: 'section', hidden: true, 'aria-labelledby': 'req-h' });
    var projSection = h('section', { class: 'section', 'aria-labelledby': 'proj-h' });
    root.append(band, h('div', { class: 'wrap content' }, reqSection, projSection));

    store.getUser(me).then(function (u) {
      if (alive && u && u.name) title.textContent = 'Hey, ' + u.name;
    });

    function requestRow(r) {
      var isInvite = r.type === 'invite';
      var skills = (r.fromUserSkills || []).slice(0, 3).join(', ') || 'No skills listed';
      return h('li', { class: 'req' },
        ui.avatar({ name: r.fromUserName }, { size: 44 }),
        h('div', { class: 'req-body' },
          h('p', { class: 'req-line' }, h('strong', {}, r.fromUserName || 'Unknown'),
            isInvite ? ' invited you to join ' : ' wants to join ', h('strong', {}, r.projectTitle || 'a project')),
          h('p', { class: 'req-skills' }, skills)),
        h('div', { class: 'req-actions' },
          h('button', { type: 'button', class: 'btn sm', onclick: function () { respond(r, true); } }, ui.icon('check', 16), 'Accept'),
          h('button', { type: 'button', class: 'btn sm ghost', onclick: function () { respond(r, false); } }, ui.icon('x', 16), 'Reject')));
    }

    function respond(r, accept) {
      store.respondToRequest(r.id, accept)
        .then(function () { ui.toast(accept ? 'Accepted successfully!' : 'Request rejected'); })
        .catch(guard());
    }

    function refresh() {
      Promise.all([store.listMyProjects(me), store.listPendingRequests(me), store.unreadCount(me)]).then(function (res) {
        if (!alive) return;
        var projects = res[0], requests = res[1], unread = res[2];

        badge.hidden = unread === 0;
        badge.textContent = unread > 9 ? '9+' : String(unread);
        bell.setAttribute('aria-label', unread ? 'Notifications, ' + unread + ' unread' : 'Notifications');

        reqSection.hidden = requests.length === 0;
        reqSection.replaceChildren(
          h('h2', { class: 'section-title', id: 'req-h' }, 'Join requests', h('span', { class: 'count' }, requests.length)),
          h('ul', { class: 'req-list' }, requests.map(requestRow)));

        projSection.replaceChildren(
          h('h2', { class: 'section-title', id: 'proj-h' }, 'My active projects', projects.length ? h('span', { class: 'count' }, projects.length) : null),
          projects.length
            ? h('div', { class: 'proj-list' }, projects.map(function (p) { return ui.projectCard(p, me, function () { nav.go('/project/' + p.id); }); }))
            : ui.emptyState({
              title: 'No projects yet',
              text: 'Create your first project or discover existing ones to join.',
              actions: [
                h('a', { class: 'btn', href: '#/create' }, ui.icon('plus', 16), 'Create project'),
                h('a', { class: 'btn ghost', href: '#/discover' }, 'Discover projects')
              ]
            }));
      });
    }

    refresh();
    var unsub = store.subscribe(refresh);
    return function () { alive = false; unsub(); };
  };

  /* ---------- Discover (DiscoverFragment) ---------- */
  SS.views.discover = function (root, nav) {
    var me = store.currentUserId();
    var alive = true;
    var tab = 'projects';
    var query = '';
    var data = { projects: [], people: [] };

    var search = h('input', {
      class: 'input search', type: 'search', placeholder: 'Search skills, students, projects…',
      'aria-label': 'Search skills, students, projects', autocomplete: 'off'
    });
    search.addEventListener('input', function () { query = search.value; renderList(); });

    var tabProjects = h('button', { type: 'button', role: 'tab', id: 'tab-projects', 'aria-selected': 'true', 'aria-controls': 'discover-panel' }, 'Projects');
    var tabPeople = h('button', { type: 'button', role: 'tab', id: 'tab-people', 'aria-selected': 'false', 'aria-controls': 'discover-panel', tabindex: '-1' }, 'People');
    function select(t) {
      tab = t;
      [[tabProjects, 'projects'], [tabPeople, 'people']].forEach(function (p) {
        p[0].setAttribute('aria-selected', p[1] === t ? 'true' : 'false');
        p[0].tabIndex = p[1] === t ? 0 : -1;
      });
      panel.setAttribute('aria-labelledby', 'tab-' + t);
      renderList();
    }
    tabProjects.addEventListener('click', function () { select('projects'); });
    tabPeople.addEventListener('click', function () { select('people'); });
    [tabProjects, tabPeople].forEach(function (b) {
      b.addEventListener('keydown', function (e) {
        if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
          var next = tab === 'projects' ? 'people' : 'projects';
          select(next); (next === 'projects' ? tabProjects : tabPeople).focus();
        }
      });
    });

    var summary = h('p', { class: 'result-count', 'aria-live': 'polite' });
    var panel = h('div', { id: 'discover-panel', role: 'tabpanel', 'aria-labelledby': 'tab-projects' });

    root.append(h('div', { class: 'wrap content' },
      h('h1', { class: 'page-title' }, 'Discover'),
      h('div', { class: 'search-wrap' }, ui.icon('search', 20), search),
      h('div', { class: 'tabs', role: 'tablist', 'aria-label': 'Discover' }, tabProjects, tabPeople),
      summary, panel));

    function matches(q, fields) {
      return !q || fields.some(function (f) { return f && String(f).toLowerCase().indexOf(q) !== -1; });
    }

    function renderList() {
      var q = query.toLowerCase().trim();
      if (tab === 'projects') {
        var list = data.projects.filter(function (p) {
          return matches(q, [p.title, p.category, (p.skillsRequired || []).join(' '), (p.categories || []).join(' ')]);
        });
        summary.textContent = ui.plural(list.length, 'project') + ' found';
        panel.replaceChildren(list.length
          ? h('div', { class: 'proj-list' }, list.map(function (p) { return ui.projectCard(p, me, function () { nav.go('/project/' + p.id); }); }))
          : ui.emptyState({ title: q ? 'No projects match “' + query.trim() + '”' : 'No projects to show yet', text: q ? 'Try a different skill or category.' : 'Be the first to post one.' }));
      } else {
        var people = data.people.filter(function (u) {
          return matches(q, [u.name, u.department, (u.skills || []).join(' ')]);
        });
        summary.textContent = ui.plural(people.length, 'student') + ' found';
        panel.replaceChildren(people.length
          ? h('div', { class: 'people-list' }, people.map(personCard))
          : ui.emptyState({ title: q ? 'No students match “' + query.trim() + '”' : 'No students to show yet', text: q ? 'Try a different name, department or skill.' : 'People who allow discovery will appear here.' }));
      }
    }

    function personCard(u) {
      var skills = (u.skills || []).slice(0, 3).join(' · ') || 'No skills listed';
      var online = u.isOnline && u.showOnlineStatus;
      return h('article', { class: 'person' },
        ui.avatar(u, { size: 52, dot: online }),
        h('div', { class: 'person-body' },
          h('h3', {}, u.name || 'Unknown'),
          h('p', { class: 'person-dept' }, u.department || ''),
          h('p', { class: 'person-skills' }, skills)),
        h('button', { type: 'button', class: 'btn sm ghost', onclick: function () { invite(u); } }, ui.icon('plus', 16), 'Invite'));
    }

    function invite(user) {
      store.listLedProjects(me).then(function (mine) {
        if (!mine.length) { ui.toast('You don’t have any projects to invite people to.'); return; }
        return ui.pickOne({
          title: 'Invite ' + user.name + ' to…',
          options: mine.map(function (p) { return { value: p.id, label: p.title, sub: ui.plural(p.members.length, 'member') + ' of ' + p.maxMembers }; })
        }).then(function (pid) {
          if (!pid) return;
          return store.sendInvite(pid, user.id).then(function () { ui.toast('Invitation sent to ' + user.name); });
        });
      }).catch(guard());
    }

    function refresh() {
      Promise.all([store.listPublicProjects(), store.listDiscoverUsers(me)]).then(function (res) {
        if (!alive) return;
        data.projects = res[0]; data.people = res[1];
        renderList();
      });
    }
    refresh();
    var unsub = store.subscribe(refresh);
    return function () { alive = false; unsub(); };
  };

  /* ---------- Workspaces list (WorkspaceFragment) ---------- */
  SS.views.workspaces = function (root, nav) {
    var me = store.currentUserId();
    var alive = true;
    var list = h('div', { class: 'section' });
    root.append(h('div', { class: 'wrap content' },
      h('h1', { class: 'page-title' }, 'My workspaces'),
      h('p', { class: 'page-sub' }, 'All your active project spaces.'),
      list));

    function refresh() {
      store.listMyProjects(me).then(function (projects) {
        if (!alive) return;
        list.replaceChildren(projects.length
          ? h('div', { class: 'proj-list' }, projects.map(function (p) { return ui.projectCard(p, me, function () { nav.go('/workspace/' + p.id); }); }))
          : ui.emptyState({
            title: 'No workspaces yet',
            text: 'Join a project or post your own and its workspace will show up here.',
            actions: [h('a', { class: 'btn', href: '#/discover' }, 'Discover projects'), h('a', { class: 'btn ghost', href: '#/create' }, 'Create project')]
          }));
      });
    }
    refresh();
    var unsub = store.subscribe(refresh);
    return function () { alive = false; unsub(); };
  };
})();
