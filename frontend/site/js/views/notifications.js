/* SkillSphere web — Notifications (NotificationsActivity) */
(function () {
  'use strict';
  var SS = window.SS, ui = SS.ui, h = ui.h, store = SS.store;

  function fail(err) { ui.toast(err && err.message ? err.message : 'Something went wrong'); }

  SS.views.notifications = function (root, nav) {
    var me = store.currentUserId();
    var alive = true;
    var list = h('div', { class: 'notif-wrap' });
    var markAll = h('button', { type: 'button', class: 'btn sm ghost' }, ui.icon('check', 16), 'Mark all read');
    markAll.addEventListener('click', function () {
      store.markAllRead(me).then(function () { ui.toast('All marked as read'); }).catch(fail);
    });

    root.append(
      ui.subhead(nav, 'Notifications', { fallback: '/home', actions: [markAll] }),
      h('div', { class: 'wrap content narrow' }, list));

    function item(n, req) {
      var pending = n.actionType === 'accept_reject' && req && req.status === 'pending';
      var settled = n.actionType === 'accept_reject' && req && req.status !== 'pending';
      var actions = null;
      if (pending) {
        actions = h('div', { class: 'notif-actions' },
          h('button', { type: 'button', class: 'btn sm', onclick: function () { respond(n, true); } }, ui.icon('check', 16), 'Accept'),
          h('button', { type: 'button', class: 'btn sm ghost', onclick: function () { respond(n, false); } }, ui.icon('x', 16), 'Reject'));
      } else if (settled) {
        actions = h('p', { class: 'notif-status' }, req.status === 'accepted' ? 'Accepted' : 'Declined');
      } else if (n.projectId) {
        actions = h('div', { class: 'notif-actions' }, h('a', { class: 'link-btn', href: '#/project/' + n.projectId }, 'View project'));
      }
      return h('li', { class: 'notif' + (n.isRead ? '' : ' unread') },
        h('span', { class: 'notif-mark', 'aria-hidden': 'true' }),
        h('div', { class: 'notif-body' },
          h('div', { class: 'notif-top' },
            h('h3', {}, n.title || 'Notification'),
            h('time', { datetime: new Date(n.createdAt).toISOString() }, ui.relTime(n.createdAt))),
          h('p', {}, n.body || ''),
          n.isRead ? null : h('span', { class: 'visually-hidden' }, 'Unread'),
          actions));
    }

    function respond(n, accept) {
      store.respondToRequest(n.requestId, accept)
        .then(function () { ui.toast(accept ? 'Request accepted!' : 'Request rejected'); })
        .catch(fail);
    }

    function refresh() {
      store.listNotifications(me).then(function (notifs) {
        return Promise.all(notifs.map(function (n) {
          return n.requestId ? store.getRequest(n.requestId) : Promise.resolve(null);
        })).then(function (reqs) {
          if (!alive) return;
          list.replaceChildren(notifs.length
            ? h('ul', { class: 'notif-list' }, notifs.map(function (n, i) { return item(n, reqs[i]); }))
            : ui.emptyState({ title: 'No notifications yet', text: 'Join requests, invitations and replies will show up here.' }));
          markAll.disabled = !notifs.some(function (n) { return !n.isRead; });
        });
      });
    }
    refresh();
    var unsub = store.subscribe(refresh);
    return function () { alive = false; unsub(); };
  };
})();
