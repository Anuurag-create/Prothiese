import re
import shutil
from pathlib import Path
from urllib.parse import urlparse

from git import Repo

from app.config import BACKEND_DIR

REPOS_DIR = BACKEND_DIR / "repos"
_GITHUB_PART_RE = re.compile(r"^[A-Za-z0-9_.-]+$")


class GitHubService:
    @staticmethod
    def normalize_github_url(url: str) -> str:
        """Validate and canonicalize a public GitHub repository URL."""
        candidate = url.strip()
        parsed = urlparse(candidate)
        if parsed.scheme not in {"https", "http"} or (parsed.hostname or "").lower() not in {"github.com", "www.github.com"}:
            raise ValueError("Enter a GitHub repository URL, such as https://github.com/owner/repository.")
        try:
            has_custom_port = parsed.port is not None
        except ValueError as exc:
            raise ValueError("The GitHub URL contains an invalid port.") from exc
        if parsed.username or parsed.password or has_custom_port:
            raise ValueError("GitHub URLs must not include credentials or a custom port.")

        parts = [part for part in parsed.path.split("/") if part]
        if len(parts) != 2:
            raise ValueError("Use the repository page URL only: https://github.com/owner/repository.")

        owner, repo_name = parts
        if repo_name.endswith(".git"):
            repo_name = repo_name[:-4]
        if (
            not owner or not repo_name
            or owner in {".", ".."} or repo_name in {".", ".."}
            or not _GITHUB_PART_RE.fullmatch(owner)
            or not _GITHUB_PART_RE.fullmatch(repo_name)
        ):
            raise ValueError("The GitHub owner or repository name is invalid.")

        return f"https://github.com/{owner}/{repo_name}"

    @classmethod
    def extract_repo_name(cls, url: str) -> str:
        normalized = cls.normalize_github_url(url)
        return normalized.rstrip("/").split("/")[-1]

    @classmethod
    def checkout_path(cls, url: str, legacy_name: str | None = None) -> Path:
        normalized = cls.normalize_github_url(url)
        owner, repo_name = normalized.rstrip("/").split("/")[-2:]
        canonical = REPOS_DIR / f"{owner}__{repo_name}"
        if canonical.is_dir():
            return canonical

        # Backward compatibility with checkouts created by earlier Clarum
        # versions, which used the repository name alone as the folder name.
        if legacy_name:
            legacy = REPOS_DIR / legacy_name
            if legacy.is_dir() and (legacy / ".git").is_dir():
                try:
                    origin = Repo(legacy).remotes.origin.url
                    if cls.normalize_github_url(origin) == normalized:
                        return legacy
                except Exception:
                    # A stale or malformed legacy cache should not block a fresh clone.
                    pass
        return canonical

    @classmethod
    def clone_repository(cls, url: str) -> str:
        normalized = cls.normalize_github_url(url)
        owner, repo_name = normalized.rstrip("/").split("/")[-2:]
        target_path = REPOS_DIR / f"{owner}__{repo_name}"
        REPOS_DIR.mkdir(parents=True, exist_ok=True)

        if target_path.is_dir() and (target_path / ".git").is_dir():
            try:
                origin = Repo(target_path).remotes.origin.url
                if cls.normalize_github_url(origin) == normalized:
                    return str(target_path)
            except Exception:
                pass
            raise RuntimeError(
                f"A checkout folder already exists at {target_path}. Remove that folder or use a different repository."
            )
        if target_path.exists():
            raise RuntimeError(f"The checkout path exists but is not a Git repository: {target_path}")

        try:
            Repo.clone_from(normalized, str(target_path), depth=1)
            return str(target_path)
        except Exception as exc:
            # A failed clone can leave a partial directory that blocks retries.
            if target_path.exists():
                shutil.rmtree(target_path, ignore_errors=True)
            raise RuntimeError(
                "Git could not clone this repository. Confirm the URL is correct and that the repository is public."
            ) from exc
