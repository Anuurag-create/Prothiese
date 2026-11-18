# Prothiese

**One website. Two independent products.** Prothiese combines SkillSphere's campus collaboration experience with Clarum v2's open-source repository intelligence workspace.

## What is where

- `frontend/site/` — the Prothiese website. SkillSphere is the authenticated shell; Clarum is mounted at `/clarum/` and entered from the left sidebar.
- `services/skillsphere/` — notes on the preserved SkillSphere storage/auth boundary.
- `services/clarum/frontend/` — Clarum's original React/Vite source.
- `services/clarum/backend/` — Clarum's independent FastAPI service, SQLite DB and repository-analysis engine.
- `docs/ARCHITECTURE.md` — boundaries and request/data flow.

## Requirements

- Python 3.12 recommended for the Clarum backend (matching its original project guidance).
- Node.js 22 LTS recommended to build Clarum's React frontend.
- A Gemini API key is required for AI Learn/Build report generation. Repository intake and non-AI routes can start without it.

## First-time setup (Windows PowerShell)

```powershell
# 1. Configure Clarum's private backend environment
cd services/clarum/backend
Copy-Item .env.example .env
notepad .env   # Add a fresh GEMINI_API_KEY

# 2. Install Clarum backend dependencies
py -3.12 -m venv .venv
.\.venv\Scripts\Activate.ps1
python -m pip install -r requirements.txt

# 3. Build the embedded Clarum frontend (from another terminal)
cd services/clarum/frontend
npm ci
npm run build

# 4. Start Clarum API (from the backend directory)
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000

# 5. Serve the Prothiese website (from the repository root)
py -m http.server 8080 --directory frontend/site
```

Open **http://127.0.0.1:8080**. The SkillSphere demo login remains available; demo password is `password123`. Select **Try a demo account** to populate credentials. Clarum becomes available in the left navigation after login.

## Linux / macOS

```bash
cd services/clarum/backend
cp .env.example .env
# Add GEMINI_API_KEY to .env
python3.12 -m venv .venv
source .venv/bin/activate
python -m pip install -r requirements.txt
python -m uvicorn app.main:app --reload --host 127.0.0.1 --port 8000
```

In a second terminal, build Clarum and serve the unified website:

```bash
cd services/clarum/frontend
npm ci
npm run build
cd ../../..
python3 -m http.server 8080 --directory frontend/site
```

Open **http://127.0.0.1:8080**.

## Configuration

`frontend/site/config.js` controls the Clarum API address at runtime:

```js
window.PROTHIESE_CONFIG = {
  clarumApiBaseUrl: 'http://127.0.0.1:8000'
};
```

For deployment, point it to the deployed Clarum API and set the backend's `CLARUM_CORS_ORIGINS` to the exact Prothiese frontend origin. Keep Gemini credentials only in the backend `.env`.

## Current limitations (do not mistake this for production auth)

- The supplied SkillSphere browser version stores its users, password hashes and session in localStorage. It is a demo frontend data layer, not a secure backend or production identity provider.
- The Clarum interface checks for the SkillSphere session key before rendering, but Clarum's API is not protected by a server-verified SkillSphere identity token. Do not expose either service publicly with sensitive data until proper server-side auth is implemented.
- Clarum's AI Learn/Build generation requires your own valid Gemini API key.
- User data stores remain separate. The two apps do not share a DB or domain logic.

See `docs/ARCHITECTURE.md` for the separation model.
