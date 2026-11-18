# SkillSphere service boundary

SkillSphere is currently the original static web application. Its `SS.store` module
is the sole data boundary and persists users, sessions, projects, requests, chat,
tasks and notifications in browser `localStorage` (`skillsphere.db.v1` and
`skillsphere.session.v1`). It is not a server-side API in the supplied source.

Prothiese preserves that implementation and does not connect it to Clarum's SQLite
database or FastAPI routes. A real SkillSphere backend (for example, Firebase Auth
and a database) can replace `SS.store` later without changing the screen modules,
following the adapter contract documented in `frontend/site/README.md`.

**Security limitation:** the current demo authentication and client-side storage are
not suitable for production accounts or sensitive data. The login gate around Clarum
is a frontend integration gate, not server-side authorization.
