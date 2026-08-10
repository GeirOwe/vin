from __future__ import annotations

from http import HTTPStatus

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.orm import Session

from ...core.security import (
    create_access_token,
    get_current_user,
    hash_password,
    verify_password,
)
from ...database import get_db
from ...models import User
from ...schemas_auth import AuthResponse, LoginRequest, MeResponse, RegisterRequest

router = APIRouter(prefix="/api/auth", tags=["auth"])


@router.post("/register", response_model=AuthResponse, status_code=HTTPStatus.CREATED)
def register(payload: RegisterRequest, db: Session = Depends(get_db)) -> AuthResponse:
    existing = db.execute(
        select(User).where(User.bruker_id == payload.bruker_id)
    ).scalar_one_or_none()
    if existing:
        raise HTTPException(
            status_code=HTTPStatus.CONFLICT,
            detail="Denne bruker-ID-en er allerede i bruk.",
        )

    user = User(
        bruker_id=payload.bruker_id,
        password_hash=hash_password(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    token = create_access_token(user_id=user.id, bruker_id=user.bruker_id)
    return AuthResponse(access_token=token, bruker_id=user.bruker_id)


@router.post("/login", response_model=AuthResponse)
def login(payload: LoginRequest, db: Session = Depends(get_db)) -> AuthResponse:
    bruker_id = payload.bruker_id.strip()
    user = db.execute(select(User).where(User.bruker_id == bruker_id)).scalar_one_or_none()
    if user is None or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=HTTPStatus.UNAUTHORIZED,
            detail="Ugyldig bruker-ID eller passord.",
        )
    token = create_access_token(user_id=user.id, bruker_id=user.bruker_id)
    return AuthResponse(access_token=token, bruker_id=user.bruker_id)


@router.get("/me", response_model=MeResponse)
def me(current_user: User = Depends(get_current_user)) -> MeResponse:
    return MeResponse(id=current_user.id, bruker_id=current_user.bruker_id)
