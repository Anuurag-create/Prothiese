
/* ==========================================================================
   SkillSphere web — data layer
   --------------------------------------------------------------------------
   THIS IS THE FIREBASE SWAP POINT.

   Every screen talks to the backend only through `SS.store`. Right now it is
   backed by localStorage so the whole site works offline with demo data.
   Each method is async and shaped like the Firestore call it replaces.

   NOT SECURE: passwords are only lightly hashed and live in the browser.
   This is a placeholder for Firebase Auth, never ship it as real auth.
   ========================================================================== */

(function () {
  'use strict';

  var SS = (window.SS = window.SS || {});
  var C = SS.C;

  var DB_KEY = 'skillsphere.db.v1';
  var SESSION_KEY = 'skillsphere.session.v1';
  var DEMO_PASSWORD = 'password123';

  var db = null;
  var memorySession = null;
  var listeners = new Set();
  var emitQueued = false;

  /* ---------- helpers ---------- */

  function now() {
    return Date.now();
  }

  function newId(prefix) {
    return prefix + '_' + Math.random().toString(36).slice(2, 10) + now().toString(36);
  }

  // Small non-cryptographic string hash (cyrb53). Placeholder for Firebase Auth.
  function hash(str) {
    var h1 = 0xdeadbeef, h2 = 0x41c6ce57;

    for (var i = 0, ch; i < str.length; i++) {
      ch = str.charCodeAt(i);
      h1 = Math.imul(h1 ^ ch, 2654435761);
      h2 = Math.imul(h2 ^ ch, 1597334677);
    }

    h1 = Math.imul(h1 ^ (h1 >>> 16), 2246822507) ^
      Math.imul(h2 ^ (h2 >>> 13), 3266489909);

    h2 = Math.imul(h2 ^ (h2 >>> 16), 2246822507) ^
      Math.imul(h1 ^ (h1 >>> 13), 3266489909);

    return (4294967296 * (2097151 & h2) + (h1 >>> 0)).toString(36);
  }

  function clone(x) {
    return x == null ? x : JSON.parse(JSON.stringify(x));
  }

  function lsGet(key) {
    try {
      return window.localStorage.getItem(key);
    } catch (e) {
      return null;
    }
  }

  function lsSet(key, val) {
    try {
      window.localStorage.setItem(key, val);
      return true;
    } catch (e) {
      return false;
    }
  }

  function lsRemove(key) {
    try {
      window.localStorage.removeItem(key);
    } catch (e) {
      /* ignore */
    }
  }

  /* ---------- persistence + change notifications ---------- */

  function load() {
    var raw = lsGet(DB_KEY);

    if (raw) {
      try {
        var parsed = JSON.parse(raw);
        if (parsed && parsed.users) return parsed;
      } catch (e) {
        /* fall through to reseed */
      }
    }

    var fresh = seed();
    lsSet(DB_KEY, JSON.stringify(fresh));
    return fresh;
  }

  function save() {
    lsSet(DB_KEY, JSON.stringify(db));
    emit();
  }

  function emit() {
    if (emitQueued) return;

    emitQueued = true;

    setTimeout(function () {
      emitQueued = false;

      listeners.forEach(function (fn) {
        try {
          fn();
        } catch (e) {
          console.error(e);
        }
      });
    }, 0);
  }

  // Firestore: onSnapshot(...)
  function subscribe(fn) {
    listeners.add(fn);
    return function () {
      listeners.delete(fn);
    };
  }

  // Another tab changed the data: reload and notify.
  window.addEventListener('storage', function (e) {
    if (e.key === DB_KEY) {
      db = load();
      emit();
    }

    if (e.key === SESSION_KEY) {
      emit();
      window.dispatchEvent(new Event('ss:session'));
    }
  });

  /* ---------- session ---------- */

  function currentUserId() {
    var v = lsGet(SESSION_KEY);
    return v || memorySession;
  }

  function setSession(uid) {
    memorySession = uid;

    if (uid) {
      lsSet(SESSION_KEY, uid);
    } else {
      lsRemove(SESSION_KEY);
    }
  }

  /* ---------- seed data ---------- */

  function seed() {
    var t = now();

    var d = {
      users: {},
      auth: {},
      projects: {},
      requests: {},
      notifications: {},
      messages: {},
      tasks: {}
    };

    function addUser(id, name, email, dept, year, skills, bio, university) {
      d.users[id] = {
        id: id,
        name: name,
        email: email,
        username: '',
        photoUrl: '',
        bio: bio,
        university: university || '',
        department: dept,
        year: year,
        phone: '',
        location: '',
        linkedin: '',
        skills: skills,
        projectsCount: 0,
        tasksCompletedCount: 0,
        isOnline: id !== 'mock_user_3',
        lastActive: t,
        appearInDiscover: true,
        showOnlineStatus: true,
        pushNotifications: true,
        doNotDisturb: false,
        createdAt: t
      };

      d.auth[email.toLowerCase()] = {
        uid: id,
        hash: hash(DEMO_PASSWORD)
      };

      d.notifications[id] = [];
    }

    addUser(
      'mock_user_1',
      'Sarah Jenkins',
      'sarah@university.edu',
      'Computer Science',
      '3rd Year',
      ['Java', 'Android', 'Firebase'],
      'Passionate about mobile development and UI/UX design.'
    );

    addUser(
      'mock_user_2',
      'David Chen',
      'david@university.edu',
      'Artificial Intelligence',
      '4th Year',
      ['Python', 'PyTorch', 'Data Science'],
      'Working on deep learning projects for healthcare.'
    );

    addUser(
      'mock_user_3',
      'Emily Rodriguez',
      'emily@university.edu',
      'Design',
      '2nd Year',
      ['Figma', 'Adobe XD', 'UI Design'],
      'Helping teams build beautiful and intuitive interfaces.'
    );

    // Fourth demo account.
    addUser(
      'mock_user_4',
      'Blaze',
      'blaze@university.edu',
      'Computer Engineering',
      '3rd Year',
      ['C++', 'Linux', 'Docker'],
      'Unus ex creatoribus sum.'
    );

    function addProject(
      id, title, desc, leadId, skills, category,
      max, status, ageMs, extraMembers
    ) {
      var lead = d.users[leadId];
      var members = [leadId].concat(extraMembers || []);
      var details = {};

      members.forEach(function (m) {
        details[m] = {
          name: d.users[m].name,
          role: m === leadId ? 'lead' : 'member',
          joinedAt: t - ageMs
        };
      });

      d.projects[id] = {
        id: id,
        title: title,
        icon: C.CATEGORY_ICONS[category] || C.DEFAULT_ICON,
        description: desc,
        categories: [category],
        category: category,
        skillsRequired: skills,
        university: lead.university,
        leadId: leadId,
        leadName: lead.name,
        members: members,
        memberDetails: details,
        maxMembers: max,
        status: status,
        visibility: 'public',
        createdAt: t - ageMs,
        deadline: 0,
        completedAt: 0,
        lastMessageAt: 0,
        lastActivityAt: t - ageMs
      };

      d.messages[id] = [];
      d.tasks[id] = [];
    }

    addProject(
      'mock_proj_1',
      'HealthTrack App',
      'A fitness tracking application with social features.',
      'mock_user_1',
      ['Android', 'Java'],
      'Mobile',
      4,
      'forming',
      86400000
    );

    addProject(
      'mock_proj_2',
      'AI Study Buddy',
      'Intelligent chatbot to help students organize study materials.',
      'mock_user_2',
      ['Python', 'NLP'],
      'AI/ML',
      3,
      'active',
      172800000,
      ['mock_user_3']
    );

    addProject(
      'mock_proj_3',
      'Campus Food Finder',
      'Real-time locator for food stalls and student discounts.',
      'mock_user_3',
      ['React Native', 'Node.js'],
      'Web Dev',
      5,
      'forming',
      3600000
    );

    // Initial sample activity.
    d.messages.mock_proj_2 = [
      {
        id: 'm1',
        senderId: 'mock_user_2',
        senderName: 'David Chen',
        type: 'text',
        content: 'Welcome to the workspace. First goal: get a working prototype of the study planner.',
        timestamp: t - 7200000
      },
      {
        id: 'm2',
        senderId: 'mock_user_3',
        senderName: 'Emily Rodriguez',
        type: 'text',
        content: 'Sketching the onboarding screens now. I will share Figma links tonight.',
        timestamp: t - 5400000
      }
    ];

    d.tasks.mock_proj_2 = [
      {
        id: 't1',
        projectId: 'mock_proj_2',
        title: 'Design onboarding screens',
        description: 'Three screens: welcome, subjects, schedule.',
        assignedTo: 'mock_user_3',
        assignedName: 'Emily Rodriguez',
        createdBy: 'mock_user_2',
        status: 'in_progress',
        priority: 'medium',
        dueDate: 0,
        createdAt: t - 6000000,
        completedAt: 0
      },
      {
        id: 't2',
        projectId: 'mock_proj_2',
        title: 'Set up the NLP pipeline',
        description: '',
        assignedTo: 'mock_user_2',
        assignedName: 'David Chen',
        createdBy: 'mock_user_2',
        status: 'pending',
        priority: 'medium',
        dueDate: 0,
        createdAt: t - 6500000,
        completedAt: 0
      }
    ];

    return d;
  }

  /* ---------- internal lookups ---------- */

  function me() {
    var uid = currentUserId();
    return uid ? db.users[uid] : null;
  }

  function requireMe() {
    var u = me();

    if (!u) {
      throw new Error('Please log in to continue');
    }

    return u;
  }

  function requireProject(id) {
    var p = db.projects[id];

    if (!p) {
      throw new Error('Project not found');
    }

    return p;
  }

  function sortDesc(list, key) {
    return list.slice().sort(function (a, b) {
      return (b[key] || 0) - (a[key] || 0);
    });
  }

  function pushNotification(toUid, n) {
    if (!db.notifications[toUid]) {
      db.notifications[toUid] = [];
    }

    db.notifications[toUid].push({
      id: newId('n'),
      type: n.type,
      title: n.title,
      body: n.body,
      projectId: n.projectId || null,
      projectTitle: n.projectTitle || '',
      fromUserId: n.fromUserId || null,
      fromUserName: n.fromUserName || '',
      actionType: n.actionType || 'view_only',
      requestId: n.requestId || null,
      isRead: false,
      createdAt: now()
    });
  }

  function addMemberInternal(project, userId, name) {
    if (project.members.indexOf(userId) === -1) {
      project.members.push(userId);
    }

    project.memberDetails[userId] = {
      name: name,
      role: 'member',
      joinedAt: now()
    };

    project.lastActivityAt = now();
  }

  function openSlots(p) {
    return Math.max(0, (p.maxMembers || 0) - p.members.length);
  }

  /* ---------- public API ---------- */

  function A(fn) {
    return function () {
      var args = arguments;

      return new Promise(function (resolve, reject) {
        try {
          resolve(clone(fn.apply(null, args)));
        } catch (e) {
          reject(e);
        }
      });
    };
  }

  var api = {
    subscribe: subscribe,
    DEMO_PASSWORD: DEMO_PASSWORD,

    /* ----- auth ----- */

    currentUserId: currentUserId,

    isLoggedIn: function () {
      var u = currentUserId();
      return !!(u && db.users[u]);
    },

    signUp: A(function (f) {
      var email = f.email.trim().toLowerCase();

      if (db.auth[email]) {
        throw new Error('This email is already registered');
      }

      var id = newId('user');

      db.users[id] = {
        id: id,
        name: f.name.trim(),
        email: f.email.trim(),
        username: '',
        photoUrl: '',
        bio: '',
        university: '',
        department: f.department,
        year: f.year,
        phone: '',
        location: '',
        linkedin: '',
        skills: f.skills || [],
        projectsCount: 0,
        tasksCompletedCount: 0,
        isOnline: true,
        lastActive: now(),
        appearInDiscover: true,
        showOnlineStatus: true,
        pushNotifications: true,
        doNotDisturb: false,
        createdAt: now()
      };

      db.auth[email] = {
        uid: id,
        hash: hash(f.password)
      };

      db.notifications[id] = [];
      setSession(id);
      save();

      return db.users[id];
    }),

    signIn: A(function (email, password) {
      var rec = db.auth[String(email).trim().toLowerCase()];

      if (!rec || rec.hash !== hash(password)) {
        throw new Error('Authentication failed');
      }

      setSession(rec.uid);

      var u = db.users[rec.uid];
      u.isOnline = true;
      u.lastActive = now();

      save();

      return u;
    }),

    signOut: A(function () {
      var u = me();

      if (u) {
        u.isOnline = false;
        u.lastActive = now();
      }

      setSession(null);
      save();

      return true;
    }),

    resetDemo: A(function () {
      setSession(null);
      db = seed();
      save();

      return true;
    }),

    /* ----- users ----- */

    getUser: A(function (id) {
      return db.users[id] || null;
    }),

    updateUser: A(function (id, patch) {
      var u = db.users[id];

      if (!u) {
        throw new Error('User not found');
      }

      Object.keys(patch).forEach(function (k) {
        u[k] = patch[k];
      });

      save();
      return u;
    }),

    listDiscoverUsers: A(function (excludeId) {
      return Object.keys(db.users)
        .map(function (k) { return db.users[k]; })
        .filter(function (u) {
          return u.appearInDiscover && u.id !== excludeId;
        });
    }),

    /* ----- projects ----- */

    getProject: A(function (id) {
      return db.projects[id] || null;
    }),

    listPublicProjects: A(function () {
      return sortDesc(
        Object.keys(db.projects)
          .map(function (k) { return db.projects[k]; })
          .filter(function (p) { return p.visibility === 'public'; }),
        'createdAt'
      );
    }),

    listMyProjects: A(function (uid) {
      return sortDesc(
        Object.keys(db.projects)
          .map(function (k) { return db.projects[k]; })
          .filter(function (p) { return p.members.indexOf(uid) !== -1; }),
        'createdAt'
      );
    }),

    listLedProjects: A(function (uid) {
      return sortDesc(
        Object.keys(db.projects)
          .map(function (k) { return db.projects[k]; })
          .filter(function (p) { return p.leadId === uid; }),
        'createdAt'
      );
    }),

    createProject: A(function (f) {
      var u = requireMe();
      var id = newId('proj');
      var cats = f.categories.slice();

      db.projects[id] = {
        id: id,
        title: f.title.trim(),
        icon: C.CATEGORY_ICONS[cats[0]] || C.DEFAULT_ICON,
        description: f.description.trim(),
        categories: cats,
        category: cats[0],
        skillsRequired: cats,
        university: '',
        leadId: u.id,
        leadName: u.name || 'Lead',
        members: [u.id],
        memberDetails: {},
        maxMembers: C.MAX_PROJECT_MEMBERS,
        status: 'forming',
        visibility: 'public',
        createdAt: now(),
        deadline: 0,
        completedAt: 0,
        lastMessageAt: 0,
        lastActivityAt: now()
      };

      db.projects[id].memberDetails[u.id] = {
        name: u.name || 'Lead',
        role: 'lead',
        joinedAt: now()
      };

      db.messages[id] = [];
      db.tasks[id] = [];

      save();
      return db.projects[id];
    }),

    deleteProject: A(function (id) {
      var u = requireMe();
      var p = requireProject(id);

      if (p.leadId !== u.id) {
        throw new Error('Only the project lead can delete this project');
      }

      delete db.projects[id];
      delete db.messages[id];
      delete db.tasks[id];

      Object.keys(db.requests).forEach(function (k) {
        if (db.requests[k].projectId === id) {
          delete db.requests[k];
        }
      });

      save();
      return true;
    }),

    listMembers: A(function (projectId) {
      var p = requireProject(projectId);

      return p.members.map(function (uid) {
        var user = db.users[uid];

        if (!user) return null;

        var m = clone(user);
        m.role = uid === p.leadId ? 'lead' : 'member';

        return m;
      }).filter(Boolean);
    }),

    addMemberByEmail: A(function (projectId, email) {
      var u = requireMe();
      var p = requireProject(projectId);

      if (p.leadId !== u.id) {
        throw new Error('Only the project lead can invite members');
      }

      var key = String(email).trim().toLowerCase();
      var rec = db.auth[key];

      if (!rec) throw new Error('User not found');

      if (p.members.indexOf(rec.uid) !== -1) {
        throw new Error('That person is already a member');
      }

      if (openSlots(p) <= 0) {
        throw new Error('This team is full');
      }

      addMemberInternal(p, rec.uid, db.users[rec.uid].name);

      pushNotification(rec.uid, {
        type: 'accepted',
        title: 'Added to a project',
        body: u.name + ' added you to ' + p.title,
        projectId: p.id,
        projectTitle: p.title,
        fromUserId: u.id,
        fromUserName: u.name
      });

      save();
      return db.users[rec.uid];
    }),

    /* ----- requests ----- */

    hasPendingJoinRequest: A(function (userId, projectId) {
      return Object.keys(db.requests).some(function (k) {
        var r = db.requests[k];

        return r.fromUserId === userId &&
          r.projectId === projectId &&
          r.status === 'pending' &&
          r.type === 'join_request';
      });
    }),

    listPendingRequests: A(function (uid) {
      return sortDesc(
        Object.keys(db.requests)
          .map(function (k) { return db.requests[k]; })
          .filter(function (r) {
            return r.toUserId === uid && r.status === 'pending';
          }),
        'createdAt'
      );
    }),

    getRequest: A(function (id) {
      return db.requests[id] || null;
    }),

    sendJoinRequest: A(function (projectId) {
      var u = requireMe();
      var p = requireProject(projectId);

      var dup = Object.keys(db.requests).some(function (k) {
        var r = db.requests[k];

        return r.fromUserId === u.id &&
          r.projectId === projectId &&
          r.status === 'pending' &&
          r.type === 'join_request';
      });

      if (dup) throw new Error('You already sent a request');

      var id = newId('req');

      db.requests[id] = {
        id: id,
        type: 'join_request',
        fromUserId: u.id,
        fromUserName: u.name || 'Unknown',
        fromUserSkills: (u.skills || []).slice(),
        toUserId: p.leadId,
        projectId: p.id,
        projectTitle: p.title,
        status: 'pending',
        createdAt: now(),
        respondedAt: 0,
        expiresAt: 0
      };

      pushNotification(p.leadId, {
        type: 'join_request',
        title: 'New Join Request',
        body: (u.name || 'Someone') + ' wants to join ' + p.title,
        projectId: p.id,
        projectTitle: p.title,
        fromUserId: u.id,
        fromUserName: u.name,
        actionType: 'accept_reject',
        requestId: id
      });

      save();
      return db.requests[id];
    }),

    sendInvite: A(function (projectId, toUserId) {
      var u = requireMe();
      var p = requireProject(projectId);
      var target = db.users[toUserId];

      if (!target) throw new Error('User not found');

      if (p.leadId !== u.id) {
        throw new Error('Only the project lead can send invitations');
      }

      if (p.members.indexOf(toUserId) !== -1) {
        throw new Error(target.name + ' is already in this project.');
      }

      var dup = Object.keys(db.requests).some(function (k) {
        var r = db.requests[k];

        return r.projectId === projectId &&
          r.toUserId === toUserId &&
          r.status === 'pending';
      });

      if (dup) {
        throw new Error('An invitation is already pending for this user.');
      }

      var id = newId('req');

      db.requests[id] = {
        id: id,
        type: 'invite',
        fromUserId: u.id,
        fromUserName: u.name || 'Project Lead',
        fromUserSkills: (u.skills || []).slice(),
        toUserId: toUserId,
        projectId: p.id,
        projectTitle: p.title,
        status: 'pending',
        createdAt: now(),
        respondedAt: 0,
        expiresAt: 0
      };

      pushNotification(toUserId, {
        type: 'invite',
        title: 'Project Invitation',
        body: (u.name || 'A project lead') + ' invited you to join ' + p.title,
        projectId: p.id,
        projectTitle: p.title,
        fromUserId: u.id,
        fromUserName: u.name,
        actionType: 'accept_reject',
        requestId: id
      });

      save();
      return db.requests[id];
    }),

    respondToRequest: A(function (requestId, accept) {
      var u = requireMe();
      var r = db.requests[requestId];

      if (!r) throw new Error('This request no longer exists');
      if (r.status !== 'pending') throw new Error('This request was already answered');
      if (r.toUserId !== u.id) throw new Error('This request is not addressed to you');

      var p = db.projects[r.projectId];
      if (!p) throw new Error('Project not found');

      var isInvite = r.type === 'invite';
      var joiningId = isInvite ? u.id : r.fromUserId;

      var joiningName = (
        isInvite
          ? u.name
          : (r.fromUserName || (db.users[joiningId] && db.users[joiningId].name))
      ) || 'New Member';

      if (accept) {
        if (openSlots(p) <= 0 && p.members.indexOf(joiningId) === -1) {
          throw new Error('This team is full');
        }

        addMemberInternal(p, joiningId, joiningName);
        r.status = 'accepted';
      } else {
        r.status = 'rejected';
      }

      r.respondedAt = now();

      if (isInvite) {
        pushNotification(r.fromUserId, {
          type: accept ? 'accepted' : 'rejected',
          title: accept ? 'Invitation Accepted' : 'Invitation Declined',
          body: joiningName + (accept ? ' joined ' : ' declined to join ') + p.title,
          projectId: p.id,
          projectTitle: p.title,
          fromUserId: u.id,
          fromUserName: u.name
        });
      } else {
        pushNotification(joiningId, {
          type: accept ? 'accepted' : 'rejected',
          title: accept ? 'Request Accepted!' : 'Request Declined',
          body: accept
            ? 'You are now a member of ' + p.title
            : 'Your request to join ' + p.title + ' was declined',
          projectId: p.id,
          projectTitle: p.title,
          fromUserId: u.id,
          fromUserName: u.name
        });
      }

      (db.notifications[u.id] || []).forEach(function (n) {
        if (n.requestId === requestId) n.isRead = true;
      });

      save();
      return r;
    }),

    /* ----- notifications ----- */

    listNotifications: A(function (uid) {
      return sortDesc(db.notifications[uid] || [], 'createdAt');
    }),

    unreadCount: A(function (uid) {
      return (db.notifications[uid] || []).filter(function (n) {
        return !n.isRead;
      }).length;
    }),

    markAllRead: A(function (uid) {
      (db.notifications[uid] || []).forEach(function (n) {
        n.isRead = true;
      });

      save();
      return true;
    }),

    /* ----- chat ----- */

    listMessages: A(function (projectId) {
      return (db.messages[projectId] || []).slice().sort(function (a, b) {
        return a.timestamp - b.timestamp;
      });
    }),

    sendMessage: A(function (projectId, text) {
      var u = requireMe();
      var p = requireProject(projectId);

      if (p.members.indexOf(u.id) === -1) {
        throw new Error('Only members can send messages');
      }

      var content = String(text).trim().slice(0, C.MAX_MESSAGE_LENGTH);
      if (!content) return null;

      var msg = {
        id: newId('msg'),
        senderId: u.id,
        senderName: u.name,
        type: 'text',
        content: content,
        timestamp: now()
      };

      (db.messages[projectId] = db.messages[projectId] || []).push(msg);
      p.lastMessageAt = msg.timestamp;

      save();
      return msg;
    }),

    /* ----- tasks ----- */

    listTasks: A(function (projectId) {
      return sortDesc(db.tasks[projectId] || [], 'createdAt');
    }),

    addTask: A(function (projectId, f) {
      var u = requireMe();
      var p = requireProject(projectId);

      if (p.members.indexOf(u.id) === -1) {
        throw new Error('Only members can add tasks');
      }

      var task = {
        id: newId('task'),
        projectId: projectId,
        title: f.title.trim(),
        description: (f.description || '').trim(),
        assignedTo: u.id,
        assignedName: (f.assignee || '').trim(),
        createdBy: u.id,
        status: 'pending',
        priority: 'medium',
        dueDate: 0,
        createdAt: now(),
        completedAt: 0
      };

      (db.tasks[projectId] = db.tasks[projectId] || []).push(task);

      save();
      return task;
    }),

    setTaskStatus: A(function (projectId, taskId, status) {
      var list = db.tasks[projectId] || [];
      var t = list.filter(function (x) {
        return x.id === taskId;
      })[0];

      if (!t) throw new Error('Task not found');

      t.status = status;
      t.completedAt = status === 'done' ? now() : 0;

      save();
      return t;
    })
  };

  /* ---------- initialize database ---------- */

  db = load();

  
  /* ---------- migrate Blaze into existing databases ---------- */

  (function ensureBlazeAccount() {
    var email = 'blaze@university.edu';

    db.users = db.users || {};
    db.auth = db.auth || {};
    db.notifications = db.notifications || {};

    var existingAuth = db.auth[email];
    var id = null;

    // Reuse the existing linked profile if it belongs to this email.
    if (existingAuth && existingAuth.uid && db.users[existingAuth.uid]) {
      var linkedUser = db.users[existingAuth.uid];
      var linkedEmail = String(linkedUser.email || '').trim().toLowerCase();

      if (!linkedEmail || linkedEmail === email) {
        id = existingAuth.uid;
      }
    }

    // Otherwise, look for an existing profile with this email.
    if (!id) {
      id = Object.keys(db.users).filter(function (userId) {
        var user = db.users[userId];

        return user &&
          String(user.email || '').trim().toLowerCase() === email;
      })[0] || null;
    }

    // Create a new ID only if no matching profile exists.
    if (!id) {
      id = db.users.mock_user_4
        ? newId('user')
        : 'mock_user_4';
    }

    var t = now();

    // Create the profile if it doesn't exist.
    if (!db.users[id]) {
      db.users[id] = {
        id: id,
        name: 'Blaze',
        email: email,
        username: '',
        photoUrl: '',
        bio: 'Unus ex creatoribus sum.',
        university: '',
        department: 'Computer Engineering',
        year: '3rd Year',
        phone: '',
        location: '',
        linkedin: '',
        skills: ['C++', 'Linux', 'Docker'],
        projectsCount: 0,
        tasksCompletedCount: 0,
        isOnline: true,
        lastActive: t,
        appearInDiscover: true,
        showOnlineStatus: true,
        pushNotifications: true,
        doNotDisturb: false,
        createdAt: t
      };
    }

    // Ensure the profile has the correct email.
    db.users[id].email = email;

    // IMPORTANT:
    // Always enforce the known demo password.
    // Existing profile data remains untouched.
    db.auth[email] = {
      uid: id,
      hash: hash(DEMO_PASSWORD)
    };

    db.notifications[id] = db.notifications[id] || [];

    save();

  })();


  /* ---------- expose API ---------- */

  SS.store = api;

})();
