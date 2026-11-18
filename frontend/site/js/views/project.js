/* SkillSphere web — Project detail (ProjectDetailActivity) and Create project (CreateProjectActivity) */
(function () {
  'use strict';
  var SS = window.SS, ui = SS.ui, h = ui.h, store = SS.store, C = SS.C;

  function fail(err) { ui.toast(err && err.message ? err.message : 'Something went wrong'); }

  /* ---------- Project detail ---------- */
  SS.views.projectDetail = function (root, nav, params) {
    var pid = params[0];
    var me = store.currentUserId();
    var alive = true;
    var body = h('div', { class: 'wrap content narrow' });
    var deleteBtn = h('button', { type: 'button', class: 'icon-btn', 'aria-label': 'Delete project', hidden: true }, ui.icon('trash'));
    root.append(ui.subhead(nav, 'Project details', { fallback: '/home', actions: [deleteBtn] }), body);

    deleteBtn.addEventListener('click', function () {
      ui.confirm({
        title: 'Delete project',
        message: 'Are you sure you want to delete this project? This action cannot be undone.',
        confirmLabel: 'Delete'
      }).then(function (ok) {
        if (!ok) return;
        store.deleteProject(pid).then(function () {
          alive = false;
          ui.toast('Project deleted successfully');
          nav.go('/home', { replace: true });
        }).catch(fail);
      });
    });

    function infoRow(label, content) {
      return h('div', { class: 'info-row' }, h('dt', {}, label), h('dd', {}, content));
    }

    function render(p, hasPending) {
      var isLead = p.leadId === me;
      var isMember = (p.members || []).indexOf(me) !== -1;
      var count = (p.members || []).length;
      var slots = Math.max(0, (p.maxMembers || 0) - count);
      document.title = p.title + ' · Prothiese';
      deleteBtn.hidden = !isLead;

      var skills = [];
      (p.skillsRequired || []).forEach(function (s) { if (s && String(s).indexOf('@') === -1 && String(s).trim()) skills.push(String(s).trim()); });
      var skillsContent = skills.length ? ui.chips(skills, 'outline')
        : h('span', {}, (p.skillsRequired && p.skillsRequired.length) ? 'Various skills' : 'Any skills welcome');

      var cta, note = null;
      if (isLead || isMember) {
        cta = h('button', { type: 'button', class: 'btn block lg', onclick: function () { nav.go('/workspace/' + p.id); } }, 'Open workspace');
      } else if (hasPending) {
        cta = h('button', { type: 'button', class: 'btn block lg done', disabled: true }, ui.icon('check', 18), 'Request sent');
        note = 'Waiting for the project lead to review your request.';
      } else if (slots <= 0) {
        cta = h('button', { type: 'button', class: 'btn block lg', disabled: true }, 'Team is full');
      } else {
        cta = h('button', { type: 'button', class: 'btn block lg' }, 'Apply to join');
        cta.addEventListener('click', function () {
          cta.disabled = true;
          store.sendJoinRequest(p.id).then(function () { ui.toast('Request sent to project lead!'); })
            .catch(function (e) { cta.disabled = false; fail(e); });
        });
        note = 'The lead reviews your request. You’ll be notified of the decision.';
      }

      body.replaceChildren(
        h('header', { class: 'detail-head' },
          h('div', { class: 'proj-icon big', 'aria-hidden': 'true' }, p.icon || '🤖'),
          h('div', {},
            h('h1', { class: 'detail-title' }, p.title),
            h('div', { class: 'detail-tags' }, p.category ? h('span', { class: 'chip solid' }, p.category) : null, ui.statusChip(p.status)))),
        h('section', { class: 'detail-about' }, h('h2', { class: 'section-title' }, 'About'), h('p', { class: 'detail-desc' }, p.description || 'No description available')),
        h('dl', { class: 'info' },
          infoRow('Project lead', h('span', { class: 'lead-line' }, ui.avatar({ name: p.leadName }, { size: 32 }), p.leadName || 'Unknown')),
          infoRow('Team size', h('span', { class: 'team-line' }, ui.meter(count, p.maxMembers), h('span', {}, count + '/' + p.maxMembers + ' members'),
            h('small', {}, slots > 0 ? ui.plural(slots, 'slot') + ' open' : 'Full'))),
          infoRow('Status', ui.statusChip(p.status)),
          infoRow('Skills required', skillsContent)),
        h('div', { class: 'cta' }, cta, note ? h('p', { class: 'cta-note' }, note) : null));
    }

    function refresh() {
      store.getProject(pid).then(function (p) {
        if (!alive) return;
        if (!p) { alive = false; ui.toast('This project no longer exists'); nav.go('/home', { replace: true }); return; }
        var isPart = p.leadId === me || (p.members || []).indexOf(me) !== -1;
        return (isPart ? Promise.resolve(false) : store.hasPendingJoinRequest(me, pid)).then(function (pending) {
          if (alive) render(p, pending);
        });
      });
    }
    refresh();
    var unsub = store.subscribe(refresh);
    return function () { alive = false; unsub(); };
  };

  /* ---------- Create project ---------- */
  SS.views.createProject = function (root, nav) {
    var title = ui.field({ label: 'Project title *', placeholder: 'e.g. AI Campus Study Buddy', maxlength: C.MAX_PROJECT_TITLE_LENGTH, counter: true });
    var desc = ui.field({ label: 'Description *', tag: 'textarea', rows: 6, placeholder: 'Describe your project idea…', maxlength: C.MAX_DESCRIPTION_LENGTH, counter: true });

    var selected = [];
    var chipsEl = h('div', { class: 'chips removable', 'aria-live': 'polite' });
    var catErr = h('p', { class: 'err', hidden: true });
    function renderCats() {
      chipsEl.replaceChildren.apply(chipsEl, selected.map(function (c) {
        return h('span', { class: 'chip solid' }, c,
          h('button', {
            type: 'button', class: 'chip-x', 'aria-label': 'Remove ' + c,
            onclick: function () { selected.splice(selected.indexOf(c), 1); renderCats(); }
          }, ui.icon('x', 12)));
      }));
      if (selected.length) catErr.hidden = true;
    }
    var pickBtn = h('button', {
      type: 'button', class: 'btn ghost sm',
      onclick: function () {
        ui.pickMulti({ title: 'Select project categories', selected: selected, groups: [{ label: '', items: C.CATEGORIES }] })
          .then(function (res) { if (res) { selected = res; renderCats(); } });
      }
    }, ui.icon('plus', 16), 'Select categories');

    var submit = h('button', { type: 'submit', class: 'btn block lg' }, 'Post project');
    var form = h('form', { class: 'edit-form', novalidate: true },
      title.root, desc.root,
      h('div', { class: 'field' }, h('span', { class: 'label' }, 'Project categories *'), chipsEl, h('div', {}, pickBtn), catErr),
      h('div', { class: 'form-actions' }, submit));

    root.append(ui.subhead(nav, 'Create project', { fallback: '/home' }), h('div', { class: 'wrap content narrow' }, form));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var ok = true;
      if (!title.value) { title.setError('Title required'); ok = false; }
      if (!desc.value) { desc.setError('Description required'); ok = false; }
      if (!selected.length) {
        catErr.replaceChildren(ui.icon('alert', 16), h('span', {}, 'Please select at least one category'));
        catErr.hidden = false; ok = false;
      }
      if (!ok) { (!title.value ? title : !desc.value ? desc : { input: pickBtn }).input.focus(); return; }

      submit.disabled = true; submit.textContent = 'Posting…';
      store.createProject({ title: title.value, description: desc.value, categories: selected })
        .then(function () { ui.toast('Project posted successfully!'); nav.go('/home', { replace: true }); })
        .catch(function (err) { submit.disabled = false; submit.textContent = 'Post project'; fail(err); });
    });
    return function () { };
  };
})();
