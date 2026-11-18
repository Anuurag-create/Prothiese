import os
from pathlib import Path

from sqlalchemy import create_engine
from sqlalchemy.orm import declarative_base, sessionmaker

# Importing config loads backend/.env before reading database settings.
from app.config import BACKEND_DIR  # noqa: E402

# The old relative URL (sqlite:///./clarum.db) depended on the directory from
# which uvicorn was launched and could silently create a second empty database.
_default_db_path = (BACKEND_DIR / "clarum.db").resolve()
DATABASE_URL = os.getenv("DATABASE_URL", f"sqlite:///{_default_db_path.as_posix()}")

# Resolve older relative SQLite settings (for example sqlite:///./clarum.db)
# against backend/, not whichever directory happened to launch uvicorn.
if DATABASE_URL.startswith("sqlite:///") and not DATABASE_URL.startswith("sqlite:////"):
    sqlite_path = DATABASE_URL[len("sqlite:///"):]
    if sqlite_path != ":memory:":
        resolved_path = Path(sqlite_path)
        if not resolved_path.is_absolute():
            resolved_path = BACKEND_DIR / resolved_path
        resolved_path = resolved_path.resolve()
        resolved_path.parent.mkdir(parents=True, exist_ok=True)
        DATABASE_URL = f"sqlite:///{resolved_path.as_posix()}"

_engine_options = {"pool_pre_ping": True}
if DATABASE_URL.startswith("sqlite:"):
    _engine_options["connect_args"] = {"check_same_thread": False}

engine = create_engine(DATABASE_URL, **_engine_options)
SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
Base = declarative_base()


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()
