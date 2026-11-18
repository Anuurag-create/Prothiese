import shutil
from pathlib import Path

from fastapi import FastAPI, status
from fastapi.middleware.cors import CORSMiddleware

from app.config import BACKEND_DIR, CORS_ORIGINS
from app.database.init_db import init_models
from app.api import repositories, analysis

init_models()

app = FastAPI(title="Clarum V2 Engine", version="2.0.1")

app.add_middleware(
    CORSMiddleware,
    allow_origins=CORS_ORIGINS,
    allow_credentials=False,
    allow_methods=["GET", "POST", "OPTIONS"],
    allow_headers=["Content-Type", "Authorization"],
)

app.include_router(repositories.router)
app.include_router(analysis.router)


@app.post("/cleanup", status_code=status.HTTP_200_OK, tags=["Housekeeping"])
def cleanup_local_cache():
    """Delete cached repository checkouts without deleting saved project records."""
    repos_dir = BACKEND_DIR / "repos"
    if repos_dir.exists():
        for item in repos_dir.iterdir():
            try:
                if item.is_dir():
                    shutil.rmtree(item)
                else:
                    item.unlink()
            except OSError as exc:
                return {
                    "status": "partial_cleanup",
                    "detail": f"Could not remove {item.name}: {exc}",
                }
    return {"status": "success", "detail": "Cached local repositories have been removed."}


@app.get("/health", tags=["Health"])
def health_check():
    return {"status": "ok", "service": "Clarum V2 Engine"}


@app.get("/")
def read_root():
    return {"status": "Clarum V2 Engine is operational", "docs": "/docs", "health": "/health"}
