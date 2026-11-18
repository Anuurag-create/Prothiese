from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.database.db import get_db
from app.models.repository import Repository
from app.models.analysis import AnalysisReport
from app.schemas.repository import RepositoryCreate, RepositoryResponse
from app.services.github_service import GitHubService

router = APIRouter(prefix="/repositories", tags=["Repositories"])


@router.post("", response_model=RepositoryResponse, status_code=status.HTTP_201_CREATED)
def create_repository(payload: RepositoryCreate, db: Session = Depends(get_db)):
    try:
        normalized_url = GitHubService.normalize_github_url(payload.url)
        repo_name = GitHubService.extract_repo_name(normalized_url)
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    existing_repo = None
    for candidate in db.query(Repository).all():
        try:
            if GitHubService.normalize_github_url(candidate.repo_url) == normalized_url:
                existing_repo = candidate
                break
        except ValueError:
            continue

    if existing_repo:
        # Existing databases may contain the original URL with .git or a trailing slash.
        if existing_repo.repo_url != normalized_url:
            existing_repo.repo_url = normalized_url
            db.commit()
            db.refresh(existing_repo)
        # Re-create a missing checkout, but preserve a valid legacy checkout.
        checkout = GitHubService.checkout_path(normalized_url, existing_repo.repo_name)
        if not checkout.is_dir():
            try:
                GitHubService.clone_repository(normalized_url)
            except Exception as exc:
                raise HTTPException(status_code=400, detail=str(exc)) from exc
        return existing_repo

    try:
        GitHubService.clone_repository(normalized_url)
    except Exception as exc:
        raise HTTPException(status_code=400, detail=str(exc)) from exc

    new_repo = Repository(repo_url=normalized_url, repo_name=repo_name, status="cloned")
    db.add(new_repo)
    db.commit()
    db.refresh(new_repo)

    db.add(AnalysisReport(repository_id=new_repo.id))
    db.commit()
    return new_repo


@router.get("", response_model=list[RepositoryResponse])
def list_repositories(db: Session = Depends(get_db)):
    return db.query(Repository).all()
