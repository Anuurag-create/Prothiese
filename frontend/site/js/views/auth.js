/* SkillSphere web — splash, login, signup */
(function () {
  'use strict';
  var SS = window.SS, ui = SS.ui, h = ui.h, store = SS.store, C = SS.C;
  var EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

  function brand() {
    return h('div', { class: 'brand' }, h('span', { class: 'brand-mark' }, 'P'), h('span', { class: 'brand-name' }, 'Prothiese'));
  }

  function authLayout(formContent) {
    return h('div', { class: 'auth' },
      h('section', { class: 'auth-art', 'aria-hidden': 'true' },
        brand(),
        h('div', { class: 'auth-words' }, h('span', {}, 'Connect'), h('span', { class: 'outline' }, 'Collaborate'), h('span', {}, 'Create')),
        h('p', { class: 'auth-sub' }, 'One workspace for collaboration and understanding software.')),
      h('section', { class: 'auth-form' }, formContent));
  }

  /* ---------- Splash (SplashActivity: 2s, then login or main) ---------- */
  SS.views.splash = function (root, nav) {
    root.append(h('div', { class: 'splash' },
      h('span', { class: 'splash-mark' }, 'P'),
      h('h1', {}, 'Prothiese'),
      h('p', { class: 'splash-tag' }, 'Connect · Collaborate · Create'),
      h('div', { class: 'splash-foot' },
        h('div', { class: 'splash-bar', 'aria-hidden': 'true' }, h('i')),
        h('p', {}, 'Initialising…'))));
    var t = setTimeout(function () {
      try { sessionStorage.setItem('ss.splash', '1'); } catch (e) { /* ignore */ }
      nav.go(store.isLoggedIn() ? '/home' : '/login', { replace: true });
    }, 2000);
    return function () { clearTimeout(t); };
  };

  /* ---------- Login ---------- */
  SS.views.login = function (root, nav) {
    var email = ui.field({ label: 'Email address', type: 'email', placeholder: 'you@university.edu', autocomplete: 'email', inputmode: 'email' });
    var pw = ui.field({ label: 'Password', type: 'password', password: true, placeholder: 'Enter your password', autocomplete: 'current-password' });
    var formErr = h('p', { class: 'err form-err', hidden: true, role: 'alert' });
    var submit = h('button', { type: 'submit', class: 'btn block' }, 'Log in');

    var demo = [
      { name: 'Sarah Jenkins', email: 'sarah@university.edu', note: 'Leads HealthTrack App' },
      { name: 'David Chen', email: 'david@university.edu', note: 'Leads AI Study Buddy' },
      { name: 'Emily Rodriguez', email: 'emily@university.edu', note: 'Leads Campus Food Finder' },
      { name: 'Blaze', email: 'blaze@university.edu', note: 'Unus ex creatoribus sum' }
    ];

    var form = h('form', { class: 'auth-card', novalidate: true },
      h('h1', { class: 'auth-title' }, 'Welcome back'),
      h('p', { class: 'auth-lead' }, 'Sign in to continue building.'),
      email.root, pw.root, formErr, submit,
      h('p', { class: 'auth-switch' }, 'Don’t have an account? ', h('a', { href: '#/signup' }, 'Sign up')),
      h('details', { class: 'demo' },
        h('summary', {}, 'Try a demo account'),
        h('p', { class: 'hint' }, 'Password for all demo accounts: ', h('code', {}, store.DEMO_PASSWORD)),
        h('ul', {}, demo.map(function (d) {
          return h('li', {}, h('button', {
            type: 'button', class: 'demo-pick',
            onclick: function () { email.input.value = d.email; pw.input.value = store.DEMO_PASSWORD; email.setError(''); pw.setError(''); submit.focus(); }
          }, h('strong', {}, d.name), h('span', {}, d.note)));
        })),
        h('button', {
          type: 'button', class: 'link-btn',
          onclick: function () {
            ui.confirm({ title: 'Reset demo data?', message: 'This erases everything stored in this browser (accounts, projects, chats) and restores the demo data.', confirmLabel: 'Reset' })
              .then(function (ok) { if (ok) store.resetDemo().then(function () { ui.toast('Demo data restored'); }); });
          }
        }, 'Reset demo data')));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formErr.hidden = true;
      var em = email.value, pass = pw.input.value.trim();
      var ok = true;
      if (!EMAIL_RE.test(em)) { email.setError('Invalid email format'); ok = false; }
      if (pass.length < C.MIN_PASSWORD_LENGTH) { pw.setError('Password must be at least 6 characters'); ok = false; }
      if (!ok) { (email.root.classList.contains('has-error') ? email : pw).input.focus(); return; }

      submit.disabled = true; submit.textContent = 'Signing in…';
      store.signIn(em, pass).then(function () {
        nav.go('/home', { replace: true });
      }).catch(function (err) {
        submit.disabled = false; submit.textContent = 'Log in';
        formErr.replaceChildren(ui.icon('alert', 16), h('span', {}, err.message + '. Check your email and password.'));
        formErr.hidden = false;
        ui.toast(err.message);
      });
    });

    root.append(authLayout(form));
    return function () { };
  };

  /* ---------- Signup ---------- */
  SS.views.signup = function (root, nav) {
    var name = ui.field({ label: 'Full name', placeholder: 'Enter your full name', autocomplete: 'name' });
    var email = ui.field({ label: 'Email address', type: 'email', placeholder: 'name@university.edu', autocomplete: 'email', inputmode: 'email' });
    var dept = ui.field({
      label: 'Department', tag: 'select', value: '',
      children: [h('option', { value: '' }, 'Select department')].concat(C.DEPARTMENTS.map(function (d) { return h('option', { value: d }, d); }))
    });
    var year = ui.field({ label: 'Year', placeholder: 'e.g. 3rd' });
    var pw = ui.field({ label: 'Password', type: 'password', password: true, placeholder: 'Min 6 characters', autocomplete: 'new-password' });
    var confirm = ui.field({ label: 'Confirm password', type: 'password', password: true, placeholder: 'Re-enter password', autocomplete: 'new-password' });

    var selected = [];
    var skillChips = h('div', { class: 'chips removable', 'aria-live': 'polite' });
    function renderSkills() {
      skillChips.replaceChildren.apply(skillChips, selected.map(function (s) {
        return h('span', { class: 'chip solid' }, s,
          h('button', {
            type: 'button', class: 'chip-x', 'aria-label': 'Remove ' + s,
            onclick: function () { selected.splice(selected.indexOf(s), 1); renderSkills(); }
          }, ui.icon('x', 12)));
      }));
    }
    var pickBtn = h('button', {
      type: 'button', class: 'btn ghost sm',
      onclick: function () {
        ui.pickMulti({
          title: 'Select your skills', selected: selected,
          groups: C.SKILL_GROUPS.filter(function (g) { return g.signup; }).map(function (g) { return { label: g.label, items: g.items }; })
        }).then(function (res) { if (res) { selected = res; renderSkills(); } });
      }
    }, ui.icon('plus', 16), 'Add skills');

    var formErr = h('p', { class: 'err form-err', hidden: true, role: 'alert' });
    var submit = h('button', { type: 'submit', class: 'btn block' }, 'Create account');

    var form = h('form', { class: 'auth-card wide', novalidate: true },
      h('button', { type: 'button', class: 'back-link', onclick: function () { nav.back('/login'); } }, ui.icon('back', 18), 'Back'),
      h('h1', { class: 'auth-title' }, 'Create account'),
      h('p', { class: 'auth-lead' }, 'Join our community of developers.'),
      name.root, email.root,
      h('div', { class: 'row2' }, dept.root, year.root),
      h('div', { class: 'row2' }, pw.root, confirm.root),
      h('div', { class: 'field' },
        h('span', { class: 'label' }, 'Your skills'),
        skillChips, h('div', {}, pickBtn)),
      formErr, submit,
      h('p', { class: 'auth-switch' }, 'Already have an account? ', h('a', { href: '#/login' }, 'Sign in')));

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      formErr.hidden = true;
      var errors = [];
      function bad(f, msg) { f.setError(msg); errors.push(f); }
      if (!name.value) bad(name, 'Name cannot be empty');
      if (!EMAIL_RE.test(email.value)) bad(email, 'Invalid email format');
      if (!dept.input.value) bad(dept, 'Department cannot be empty');
      if (!year.value) bad(year, 'Year cannot be empty');
      var p1 = pw.input.value.trim(), p2 = confirm.input.value.trim();
      if (p1.length < C.MIN_PASSWORD_LENGTH) bad(pw, 'Password must be at least 6 characters');
      else if (p1 !== p2) bad(confirm, 'Passwords don’t match');
      if (errors.length) { errors[0].input.focus(); return; }

      submit.disabled = true; submit.textContent = 'Creating account…';
      store.signUp({ name: name.value, email: email.value, password: p1, department: dept.input.value, year: year.value, skills: selected })
        .then(function () { ui.toast('Account created successfully!'); nav.go('/home', { replace: true }); })
        .catch(function (err) {
          submit.disabled = false; submit.textContent = 'Create account';
          formErr.replaceChildren(ui.icon('alert', 16), h('span', {}, err.message));
          formErr.hidden = false;
        });
    });

    root.append(authLayout(form));
    return function () { };
  };
})();
