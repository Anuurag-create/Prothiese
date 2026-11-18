/* SkillSphere web — Workspace: Chat, Members, Tasks (WorkspaceActivity + its fragments) */
(function () {
  'use strict';
  var SS = window.SS, ui = SS.ui, h = ui.h, store = SS.store, C = SS.C;

  function fail(err) { ui.toast(err && err.message ? err.message : 'Something went wrong'); }

  SS.views.workspace = function (root, nav, params) {
    var pid = params[0];
    var tab = /^(chat|members|tasks)$/.test(params[1] || '') ? params[1] : 'chat';
    var me = store.currentUserId();
    var alive = true;
    var panelCleanup = null;
    var project = null;

    var titleEl = h('h1', { class: 'subhead-title' }, 'Workspace');
    var panelBox = h('div', { class: 'ws-panel', role: 'tabpanel', tabindex: '-1' });

    var tabDefs = [
      { id: 'chat', label: 'Chat', icon: 'chat' },
      { id: 'members', label: 'Members', icon: 'users' },
      { id: 'tasks', label: 'Tasks', icon: 'tasks' }
    ];
    var tabEls = {};
    var tablist = h('div', { class: 'tabs ws-tabs', role: 'tablist', 'aria-label': 'Workspace sections' }, tabDefs.map(function (t) {
      var b = h('button', { type: 'button', role: 'tab', id: 'wtab-' + t.id, 'aria-controls': 'wpanel', 'aria-selected': 'false', tabindex: '-1' }, ui.icon(t.icon, 18), t.label);
      b.addEventListener('click', function () { selectTab(t.id, true); });
      b.addEventListener('keydown', function (e) {
        var i = tabDefs.findIndex(function (x) { return x.id === tab; });
        if (e.key === 'ArrowRight') { selectTab(tabDefs[(i + 1) % 3].id, true); tabEls[tab].focus(); }
        if (e.key === 'ArrowLeft') { selectTab(tabDefs[(i + 2) % 3].id, true); tabEls[tab].focus(); }
      });
      tabEls[t.id] = b;
      return b;
    }));
    panelBox.id = 'wpanel';

    root.append(h('div', { class: 'ws' },
      ui.subhead(nav, titleEl, { fallback: '/workspaces' }),
      h('div', { class: 'ws-bar' }, h('div', { class: 'wrap' }, tablist)),
      panelBox));

    function selectTab(id, updateUrl) {
      if (panelCleanup) { panelCleanup(); panelCleanup = null; }
      tab = id;
      tabDefs.forEach(function (t) {
        tabEls[t.id].setAttribute('aria-selected', t.id === id ? 'true' : 'false');
        tabEls[t.id].tabIndex = t.id === id ? 0 : -1;
      });
      panelBox.setAttribute('aria-labelledby', 'wtab-' + id);
      if (updateUrl) { try { history.replaceState(null, '', '#/workspace/' + pid + '/' + id); } catch (e) { /* ignore */ } }
      var built = id === 'chat' ? chatPanel() : id === 'members' ? membersPanel() : tasksPanel();
      panelBox.replaceChildren(built.el);
      panelCleanup = built.destroy;
    }

    /* ----- Chat ----- */
    function chatPanel() {
      var list = h('div', { class: 'msgs', role: 'log', 'aria-label': 'Messages', tabindex: '0' });
      var input = h('input', { class: 'input', type: 'text', placeholder: 'Type a message…', maxlength: C.MAX_MESSAGE_LENGTH, 'aria-label': 'Message', autocomplete: 'off' });
      var form = h('form', { class: 'composer' }, input,
        h('button', { type: 'submit', class: 'btn', 'aria-label': 'Send message' }, ui.icon('send', 18), h('span', { class: 'btn-label' }, 'Send')));
      var firstRender = true;
      var live = true;

      form.addEventListener('submit', function (e) {
        e.preventDefault();
        var text = input.value.trim();
        if (!text) return;
        input.value = '';
        store.sendMessage(pid, text).then(function () { input.focus(); }).catch(function (err) { input.value = text; fail(err); });
      });

      function render(msgs) {
        var nearBottom = list.scrollHeight - list.scrollTop - list.clientHeight < 80;
        var last = msgs[msgs.length - 1];
        list.replaceChildren.apply(list, msgs.length ? msgs.map(function (m) {
          var mine = m.senderId === me;
          return h('div', { class: 'msg ' + (mine ? 'sent' : 'recv') },
            mine ? null : h('span', { class: 'msg-name' }, m.senderName || 'Unknown'),
            h('p', { class: 'msg-text' }, m.content),
            h('time', { class: 'msg-time', datetime: new Date(m.timestamp).toISOString() }, ui.formatTime(m.timestamp)));
        }) : [h('div', { class: 'msgs-empty' }, h('strong', {}, 'No messages yet'), h('span', {}, 'Start the conversation!'))]);
        if (firstRender || nearBottom || (last && last.senderId === me)) list.scrollTop = list.scrollHeight;
        firstRender = false;
      }
      function refresh() { store.listMessages(pid).then(function (m) { if (live && alive) render(m); }); }
      refresh();
      var unsub = store.subscribe(refresh);
      setTimeout(function () { if (live) input.focus(); }, 50);
      return { el: h('div', { class: 'chat' }, list, form), destroy: function () { live = false; unsub(); } };
    }

    /* ----- Members ----- */
    function membersPanel() {
      var box = h('div', { class: 'wrap content' });
      var live = true;

      function inviteDialog() {
        var email = ui.field({ label: 'Email address', type: 'email', placeholder: 'name@university.edu', autocomplete: 'off' });
        var content = h('form', { novalidate: true }, h('p', { class: 'dialog-text' }, 'Enter the email address of the person you want to invite.'), email.root);
        var m = ui.modal({
          title: 'Invite member', content: content,
          actions: [
            { label: 'Cancel', kind: 'ghost' },
            { label: 'Invite', onClick: function (api) { submit(api); } }
          ]
        });
        content.addEventListener('submit', function (e) { e.preventDefault(); submit(m); });
        function submit(api) {
          if (!email.value) { email.setError('Enter email'); email.input.focus(); return; }
          store.addMemberByEmail(pid, email.value).then(function () { ui.toast('Member invited!'); api.close(); })
            .catch(function (err) { email.setError(err.message); email.input.focus(); });
        }
      }

      function render(members, p) {
        var isLead = p.leadId === me;
        box.replaceChildren(
          h('div', { class: 'list-head' },
            h('h2', { class: 'section-title' }, 'Team members (' + members.length + '/' + p.maxMembers + ')'),
            isLead ? h('button', { type: 'button', class: 'btn sm', onclick: inviteDialog }, ui.icon('plus', 16), 'Invite') : null),
          members.length
            ? h('ul', { class: 'member-list' }, members.map(function (u) {
              return h('li', { class: 'member' },
                ui.avatar(u, { size: 44 }),
                h('div', { class: 'member-body' }, h('strong', {}, u.name || 'Unknown'), h('small', {}, u.department || '')),
                u.role === 'lead' ? h('span', { class: 'chip solid' }, 'Lead') : null);
            }))
            : ui.emptyState({ title: 'No members found' }));
      }
      function refresh() {
        Promise.all([store.listMembers(pid), store.getProject(pid)]).then(function (r) { if (live && alive && r[1]) render(r[0], r[1]); });
      }
      refresh();
      var unsub = store.subscribe(refresh);
      return { el: box, destroy: function () { live = false; unsub(); } };
    }

    /* ----- Tasks ----- */
    function tasksPanel() {
      var box = h('div', { class: 'wrap content' });
      var live = true;
      var memberNames = [];

      function addDialog() {
        var t = ui.field({ label: 'Task title *', placeholder: 'e.g. Implement search feature' });
        var d = ui.field({ label: 'Description (optional)', tag: 'textarea', rows: 3, placeholder: 'Describe requirements…' });
        var a = ui.field({ label: 'Assign to (optional)', placeholder: 'Type or pick a name', list: 'assignee-list', autocomplete: 'off' });
        var dl = h('datalist', { id: 'assignee-list' }, memberNames.map(function (n) { return h('option', { value: n }); }));
        var content = h('form', { novalidate: true }, t.root, d.root, a.root, dl);
        var m = ui.modal({
          title: 'Add new task', content: content,
          actions: [{ label: 'Cancel', kind: 'ghost' }, { label: 'Add task', onClick: function (api) { submit(api); } }]
        });
        content.addEventListener('submit', function (e) { e.preventDefault(); submit(m); });
        function submit(api) {
          if (!t.value) { t.setError('Task title is required'); t.input.focus(); return; }
          store.addTask(pid, { title: t.value, description: d.value, assignee: a.value })
            .then(function () { ui.toast('Task added!'); api.close(); })
            .catch(function (err) { t.setError(err.message); });
        }
      }

      function taskRow(task) {
        var done = task.status === 'done';
        var cb = h('input', { type: 'checkbox', checked: done, 'aria-labelledby': 'tt-' + task.id });
        cb.addEventListener('change', function () {
          store.setTaskStatus(pid, task.id, cb.checked ? 'done' : 'pending').catch(function (err) { cb.checked = !cb.checked; fail(err); });
        });
        return h('li', { class: 'task' + (done ? ' done' : '') },
          h('label', { class: 'task-label' }, cb, h('span', { class: 'box', 'aria-hidden': 'true' }, ui.icon('check', 14)),
            h('span', { class: 'task-body' },
              h('strong', { id: 'tt-' + task.id }, task.title),
              task.description ? h('span', { class: 'task-desc' }, task.description) : null,
              h('small', {}, task.assignedName ? 'Assigned to ' + task.assignedName : 'Unassigned'))));
      }

      function render(tasks) {
        var doneCount = tasks.filter(function (x) { return x.status === 'done'; }).length;
        box.replaceChildren(
          h('div', { class: 'list-head' },
            h('h2', { class: 'section-title' }, 'Tasks', tasks.length ? h('span', { class: 'count' }, doneCount + ' of ' + tasks.length + ' done') : null),
            h('button', { type: 'button', class: 'btn sm', onclick: addDialog }, ui.icon('plus', 16), 'Add task')),
          tasks.length
            ? h('ul', { class: 'task-list' }, tasks.map(taskRow))
            : ui.emptyState({ title: 'No tasks yet', text: 'Create your first task to get started.',
              actions: [h('button', { type: 'button', class: 'btn', onclick: addDialog }, ui.icon('plus', 16), 'Add task')] }));
      }
      function refresh() {
        Promise.all([store.listTasks(pid), store.listMembers(pid)]).then(function (r) {
          if (!live || !alive) return;
          memberNames = r[1].map(function (u) { return u.name; });
          render(r[0]);
        });
      }
      refresh();
      var unsub = store.subscribe(refresh);
      return { el: box, destroy: function () { live = false; unsub(); } };
    }

    /* ----- boot ----- */
    store.getProject(pid).then(function (p) {
      if (!alive) return;
      if (!p) { ui.toast('This project no longer exists'); nav.go('/workspaces', { replace: true }); return; }
      if (p.members.indexOf(me) === -1) { ui.toast('Join this project to open its workspace'); nav.go('/project/' + pid, { replace: true }); return; }
      project = p;
      titleEl.textContent = p.title;
      document.title = p.title + ' · Prothiese';
      selectTab(tab, false);
    });

    // If the project is deleted or the user is removed while open, leave gracefully.
    var unsubGuard = store.subscribe(function () {
      if (!project) return;
      store.getProject(pid).then(function (p) {
        if (!alive) return;
        if (!p || p.members.indexOf(me) === -1) { alive = false; ui.toast('This workspace is no longer available'); nav.go('/workspaces', { replace: true }); }
      });
    });

    return function () { alive = false; unsubGuard(); if (panelCleanup) panelCleanup(); };
  };
})();
