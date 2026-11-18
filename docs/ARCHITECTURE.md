# Prothiese architecture

## Product surface

Prothiese is one website with two independent product domains. The SkillSphere shell
owns the sign-in screen, the authenticated left navigation and the shared entry point.
The Clarum option opens the separately built Clarum React application inside an
isolated iframe surface at `/clarum/`. Clarum uses hash-based inner routes so refreshing
a Learn/Build view still resolves to the embedded app's static entry point.

## Service boundaries

| Area | Responsibility | Persistence / API |
|---|---|---|
| SkillSphere | Campus projects, people, applications, workspaces, chat, tasks, notifications and sign-in | Original `SS.store` adapter and its own browser storage keys |
| Clarum v2 | GitHub repository ingestion, source scanning, dependency graph, AI Learn/Build analysis and project history | Independent FastAPI service, its own SQLite DB, repo cache and Gemini configuration |
| Prothiese frontend | Shared visual shell and navigation between both experiences | No shared business database |

## Request/data flow

- SkillSphere screens call only `SS.store`.
- Clarum React screens call only Clarum's FastAPI endpoints through `src/lib/api.js`.
- Clarum progress remains in its own `clarum_project_*` localStorage keys.
- No SkillSphere records are written into Clarum's DB, and no Clarum records are written into SkillSphere's DB.
- The only intentional integration is the visible frontend entry point and a client-side check for the SkillSphere session key before rendering the Clarum interface.

## Important current-state limitation

The supplied SkillSphere web version has no server-side backend. It stores its demo account data and session in browser localStorage and uses a lightweight non-cryptographic password hash. The Prothiese merge preserves that behavior; it does not claim to provide server-side identity, cross-device accounts, or secure authorization. For production, implement a real SkillSphere identity/API service and have it issue a verifiable token that Clarum can validate independently (or place both APIs behind a separately configured identity-aware gateway).

## Clarum backend configuration

The Clarum backend reads `services/clarum/backend/.env`. Copy `.env.example` to `.env` and provide a fresh Gemini API key. Never place that key in frontend code. Configure `CLARUM_CORS_ORIGINS` for the exact deployed Prothiese frontend origin(s).
