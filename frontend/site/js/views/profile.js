/* SkillSphere web — Profile (ProfileFragment) and Edit Profile (EditProfileActivity) */
(function () {
  'use strict';
  var SS = window.SS, ui = SS.ui, h = ui.h, store = SS.store, C = SS.C;

  function fail(err) { ui.toast(err && err.message ? err.message : 'Something went wrong'); }

  /* ---------- Profile ---------- */
  SS.views.profile = function (root, nav) {
    var me = store.currentUserId();
    var alive = true;
    var user = null;

    var avatarSlot = h('div', { class: 'profile-avatar' });
    var nameEl = h('h1', { class: 'profile-name' }, '');
    var bioEl = h('p', { class: 'profile-bio', hidden: true });
    var emailEl = h('p', { class: 'profile-line' });
    var instEl = h('p', { class: 'profile-line', hidden: true });
    var skillsBox = h('div', { class: 'section-body' });

    var fileInput = h('input', { type: 'file', accept: 'image/*', class: 'visually-hidden', tabindex: '-1', 'aria-hidden': 'true' });
    fileInput.addEventListener('change', function () {
      var f = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!f) return;
      ui.readImage(f).then(function (url) { return store.updateUser(me, { photoUrl: url }); })
        .then(function () { ui.toast('Photo updated!'); }).catch(fail);
    });

    function photoOptions() {
      var opts = [{ value: 'gallery', label: 'Choose from gallery' }];
      if (user && user.photoUrl) opts.push({ value: 'remove', label: 'Remove photo' });
      ui.pickOne({ title: 'Profile photo', options: opts }).then(function (v) {
        if (v === 'gallery') fileInput.click();
        else if (v === 'remove') store.updateUser(me, { photoUrl: '' }).then(function () { ui.toast('Photo removed'); }).catch(fail);
      });
    }

    // switch rows -------------------------------------------------
    function toggleRow(o) {
      var id = 'sw-' + o.key;
      var input = h('input', { type: 'checkbox', role: 'switch', id: id, 'aria-labelledby': id + '-t', 'aria-describedby': id + '-d' });
      input.addEventListener('change', function () {
        var patch = {}; patch[o.key] = input.checked;
        store.updateUser(me, patch)
          .then(function () { ui.toast(o.toast(input.checked)); })
          .catch(function (e) { input.checked = !input.checked; fail(e); });
      });
      var row = h('div', { class: 'row-item' },
        ui.icon(o.icon, 22),
        h('label', { class: 'row-text', for: id }, h('strong', { id: id + '-t' }, o.title), h('small', { id: id + '-d' }, o.sub)),
        h('span', { class: 'switch' }, input, h('span', { class: 'track', 'aria-hidden': 'true' })));
      row.input = input;
      return row;
    }
    var rows = {
      push: toggleRow({ key: 'pushNotifications', icon: 'bell', title: 'Push notifications', sub: 'Join requests, invites, messages, tasks', toast: function (on) { return 'Notifications ' + (on ? 'enabled' : 'disabled'); } }),
      dnd: toggleRow({ key: 'doNotDisturb', icon: 'moon', title: 'Do not disturb', sub: 'Silence all notifications', toast: function (on) { return 'Do not disturb ' + (on ? 'enabled' : 'disabled'); } }),
      online: toggleRow({ key: 'showOnlineStatus', icon: 'eye', title: 'Show online status', sub: 'Others see a dot when you’re active', toast: function (on) { return 'Online status ' + (on ? 'visible' : 'hidden'); } }),
      discover: toggleRow({ key: 'appearInDiscover', icon: 'search', title: 'Appear in Discover', sub: 'Others can find your profile', toast: function (on) { return 'Privacy mode ' + (on ? 'disabled' : 'enabled'); } })
    };

    function section(titleText, body) {
      return h('section', { class: 'section' }, h('h2', { class: 'section-title' }, titleText), body);
    }

    var editRow = h('a', { class: 'row-item link', href: '#/edit-profile' },
      ui.icon('edit', 22), h('span', { class: 'row-text' }, h('strong', {}, 'Edit profile'), h('small', {}, 'Name, bio, skills, photo')), ui.icon('chevron', 18));
    var passRow = h('button', { type: 'button', class: 'row-item link' },
      ui.icon('lock', 22), h('span', { class: 'row-text' }, h('strong', {}, 'Change password'), h('small', {}, 'Update your password')), ui.icon('chevron', 18));
    passRow.addEventListener('click', function () {
      ui.toast('Password reset email sent to ' + (user && user.email ? user.email : 'your email'));
    });

    var logoutBtn = h('button', { type: 'button', class: 'btn ghost block logout' }, ui.icon('logout', 18), 'Log out');
    logoutBtn.addEventListener('click', function () {
      ui.confirm({ title: 'Log out?', message: 'You’ll need to sign in again to access your projects.', confirmLabel: 'Log out' }).then(function (ok) {
        if (!ok) return;
        store.signOut().then(function () { nav.go('/login', { replace: true }); });
      });
    });

    root.append(h('div', { class: 'wrap content profile' },
      h('header', { class: 'profile-head' },
        avatarSlot,
        h('div', { class: 'profile-info' }, nameEl, bioEl, emailEl, instEl)),
      fileInput,
      section('Skills', skillsBox),
      section('Account', h('div', { class: 'row-list' }, editRow, passRow)),
      section('Notifications', h('div', { class: 'row-list' }, rows.push, rows.dnd)),
      section('Privacy', h('div', { class: 'row-list' }, rows.online, rows.discover)),
      logoutBtn));

    function populate() {
      if (!user) return;
      document.title = user.name + ' · Prothiese';
      nameEl.textContent = user.name || 'No name';
      emailEl.textContent = user.email || '';
      var bio = user.bio || '';
      bioEl.hidden = !bio;
      bioEl.textContent = bio.length > 60 ? bio.slice(0, 57) + '…' : bio;
      instEl.hidden = !user.university;
      instEl.textContent = user.university || '';

      var av = ui.avatar(user, { size: 112 });
      var change = h('button', { type: 'button', class: 'avatar-edit', 'aria-label': 'Change profile photo', onclick: photoOptions }, ui.icon('camera', 18));
      avatarSlot.replaceChildren(av, change);

      skillsBox.replaceChildren(user.skills && user.skills.length
        ? ui.chips(user.skills, 'outline')
        : h('p', { class: 'muted' }, 'No skills added yet. ', h('a', { href: '#/edit-profile' }, 'Add your skills')));

      rows.push.input.checked = !!user.pushNotifications;
      rows.dnd.input.checked = !!user.doNotDisturb;
      rows.online.input.checked = !!user.showOnlineStatus;
      rows.discover.input.checked = !!user.appearInDiscover;
    }

    function refresh() {
      store.getUser(me).then(function (u) { if (alive) { user = u; populate(); } });
    }
    refresh();
    var unsub = store.subscribe(refresh);
    return function () { alive = false; unsub(); };
  };

  /* ---------- Edit profile ---------- */
  SS.views.editProfile = function (root, nav) {
    var me = store.currentUserId();
    var alive = true;
    var user = null;
    var selected = [];
    var pendingPhoto = null;

    var f = {
      name: ui.field({ label: 'Full name *', autocomplete: 'name' }),
      email: ui.field({ label: 'Email address', type: 'email' }),
      username: ui.field({ label: 'Username (optional)', autocomplete: 'username' }),
      phone: ui.field({ label: 'Phone number (optional)', type: 'tel', autocomplete: 'tel' }),
      bio: ui.field({ label: 'Bio / about me', tag: 'textarea', rows: 4, maxlength: 300, counter: true }),
      university: ui.field({ label: 'College / company name' }),
      department: ui.field({ label: 'Department / branch' }),
      year: ui.field({ label: 'Year / experience' }),
      location: ui.field({ label: 'Location (city, country)' }),
      linkedin: ui.field({ label: 'LinkedIn / portfolio URL', type: 'url', placeholder: 'https://' })
    };
    f.email.input.readOnly = true;
    f.email.root.classList.add('readonly');

    var avatarSlot = h('div', { class: 'profile-avatar' });
    var fileInput = h('input', { type: 'file', accept: 'image/*', class: 'visually-hidden', tabindex: '-1', 'aria-hidden': 'true' });
    fileInput.addEventListener('change', function () {
      var file = fileInput.files && fileInput.files[0];
      fileInput.value = '';
      if (!file) return;
      ui.readImage(file).then(function (url) { pendingPhoto = url; drawAvatar(); }).catch(fail);
    });
    function drawAvatar() {
      var preview = { name: f.name.input.value || (user && user.name), photoUrl: pendingPhoto || (user && user.photoUrl) };
      avatarSlot.replaceChildren(
        ui.avatar(preview, { size: 112 }),
        h('button', { type: 'button', class: 'avatar-edit', 'aria-label': 'Choose a profile photo', onclick: function () { fileInput.click(); } }, ui.icon('camera', 18)));
    }

    /* skills picker */
    var countEl = h('p', { class: 'skill-count', 'aria-live': 'polite' });
    var skillSearch = h('input', { class: 'input search', type: 'search', placeholder: 'Search skills…', 'aria-label': 'Search skills', autocomplete: 'off' });
    var groupsBox = h('div', { class: 'skill-groups' });
    var groupEls = [];

    function updateCount() { countEl.textContent = ui.plural(selected.length, 'skill') + ' selected'; }
    function buildGroups() {
      var known = {};
      var groups = C.SKILL_GROUPS.map(function (g) { g.items.forEach(function (s) { known[s] = 1; }); return g; });
      var extra = selected.filter(function (s) { return !known[s]; });
      if (extra.length) groups = groups.concat([{ id: 'other', label: 'Other', items: extra }]);
      groupEls = groups.map(function (g) {
        var chipEls = g.items.map(function (item) {
          var on = selected.indexOf(item) !== -1;
          var b = h('button', { type: 'button', class: 'chip toggle' + (on ? ' on' : ''), 'aria-pressed': on ? 'true' : 'false' }, item);
          b.addEventListener('click', function () {
            var i = selected.indexOf(item);
            if (i === -1) selected.push(item); else selected.splice(i, 1);
            b.classList.toggle('on', i === -1);
            b.setAttribute('aria-pressed', i === -1 ? 'true' : 'false');
            updateCount();
          });
          return { item: item, el: b };
        });
        var wrap = h('fieldset', { class: 'pick-group' }, h('legend', {}, g.label), h('div', { class: 'chips' }, chipEls.map(function (c) { return c.el; })));
        return { wrap: wrap, chips: chipEls };
      });
      groupsBox.replaceChildren.apply(groupsBox, groupEls.map(function (g) { return g.wrap; }));
      updateCount();
    }
    skillSearch.addEventListener('input', function () {
      var q = skillSearch.value.toLowerCase().trim();
      var any = false;
      groupEls.forEach(function (g) {
        var vis = false;
        g.chips.forEach(function (c) {
          var show = c.item.toLowerCase().indexOf(q) !== -1;
          c.el.hidden = !show;
          if (show) vis = true;
        });
        g.wrap.hidden = !vis;
        if (vis) any = true;
      });
      noMatch.hidden = any;
    });
    var noMatch = h('p', { class: 'muted', hidden: true }, 'No skills match your search.');

    var save = h('button', { type: 'submit', class: 'btn block' }, 'Update profile');
    var form = h('form', { class: 'edit-form', novalidate: true },
      h('div', { class: 'profile-head edit-head' }, avatarSlot, h('p', { class: 'muted' }, 'Choose a photo up to ' + C.MAX_IMAGE_SIZE_MB + ' MB.')),
      fileInput,
      h('fieldset', { class: 'form-group' }, h('legend', {}, 'Basic information'), f.name.root, f.email.root, f.username.root, f.phone.root, f.bio.root),
      h('fieldset', { class: 'form-group' }, h('legend', {}, 'Education / work'), f.university.root, h('div', { class: 'row2' }, f.department.root, f.year.root)),
      h('fieldset', { class: 'form-group' }, h('legend', {}, 'Links & location (optional)'), f.location.root, f.linkedin.root),
      h('fieldset', { class: 'form-group' }, h('legend', {}, 'Skills'), countEl,
        h('div', { class: 'search-wrap' }, ui.icon('search', 20), skillSearch), groupsBox, noMatch),
      h('div', { class: 'form-actions' }, save));

    root.append(
      ui.subhead(nav, 'Edit profile', { fallback: '/profile' }),
      h('div', { class: 'wrap content narrow' }, form));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      if (!f.name.value) { f.name.setError('Name is required'); f.name.input.focus(); return; }
      save.disabled = true; save.textContent = 'Saving…';
      var patch = {
        name: f.name.value, username: f.username.value, phone: f.phone.value, bio: f.bio.value,
        university: f.university.value, department: f.department.value, year: f.year.value,
        location: f.location.value, linkedin: f.linkedin.value, skills: selected.slice()
      };
      if (pendingPhoto) patch.photoUrl = pendingPhoto;
      store.updateUser(me, patch).then(function () {
        ui.toast('Profile updated successfully!');
        nav.back('/profile');
      }).catch(function (err) { save.disabled = false; save.textContent = 'Update profile'; fail(err); });
    });

    store.getUser(me).then(function (u) {
      if (!alive || !u) return;
      user = u;
      f.name.input.value = u.name || ''; f.email.input.value = u.email || ''; f.username.input.value = u.username || '';
      f.phone.input.value = u.phone || ''; f.bio.input.value = u.bio || '';
      f.bio.input.dispatchEvent(new Event('input'));
      f.university.input.value = u.university || ''; f.department.input.value = u.department || '';
      f.year.input.value = u.year || ''; f.location.input.value = u.location || ''; f.linkedin.input.value = u.linkedin || '';
      selected = (u.skills || []).slice();
      buildGroups();
      drawAvatar();
    });
    buildGroups(); drawAvatar();
    return function () { alive = false; };
  };
})();
