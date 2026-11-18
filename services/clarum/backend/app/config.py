"""Central application configuration for local development and deployment."""

import os
from pathlib import Path

from dotenv import load_dotenv

BACKEND_DIR = Path(__file__).resolve().parents[1]
ENV_FILE = BACKEND_DIR / ".env"

# Load the backend's own .env regardless of the shell's current working directory.
load_dotenv(ENV_FILE)

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY", "").strip()
GEMINI_MODEL = os.getenv("GEMINI_MODEL", "gemini-2.5-flash").strip() or "gemini-2.5-flash"
GEMINI_API_VERSION = os.getenv("GEMINI_API_VERSION", "v1beta").strip() or "v1beta"

_raw_origins = os.getenv(
    "CLARUM_CORS_ORIGINS",
    "http://localhost:5173,http://127.0.0.1:5173,http://localhost:8080,http://127.0.0.1:8080",
)
CORS_ORIGINS = [origin.strip() for origin in _raw_origins.split(",") if origin.strip()]
