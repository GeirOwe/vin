from __future__ import annotations

import os
import re
from datetime import datetime, timedelta, timezone
from typing import Any

import jwt
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPAuthorizationCredentials, HTTPBearer
from passlib.context import CryptContext
from sqlalchemy import select
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import User

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
bearer_scheme = HTTPBearer(auto_error=False)

BRUKER_ID_RE = re.compile(r"^[A-Za-z0-9._-]{3,80}$")
TOKEN_EXPIRE_DAYS = 14


def get_secret_key() -> str:
    return os.getenv("SECRET_KEY", "dev-only-change-me-vin-owen-labs")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_access_token(*, user_id: int, bruker_id: str) -> str:
    expire = datetime.now(timezone.utc) + timedelta(days=TOKEN_EXPIRE_DAYS)
    payload: dict[str, Any] = {
        "sub": str(user_id),
        "bruker_id": bruker_id,
        "exp": expire,
    }
    return jwt.encode(payload, get_secret_key(), algorithm="HS256")


def decode_access_token(token: str) -> dict[str, Any]:
    try:
        return jwt.decode(token, get_secret_key(), algorithms=["HS256"])
    except jwt.PyJWTError as exc:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Ugyldig eller utløpt innlogging. Logg inn på nytt.",
            headers={"WWW-Authenticate": "Bearer"},
        ) from exc


def get_current_user(
    credentials: HTTPAuthorizationCredentials | None = Depends(bearer_scheme),
    db: Session = Depends(get_db),
) -> User:
    if credentials is None or credentials.scheme.lower() != "bearer":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Logg inn for å fortsette.",
            headers={"WWW-Authenticate": "Bearer"},
        )
    payload = decode_access_token(credentials.credentials)
    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Ugyldig token.")
    user = db.execute(select(User).where(User.id == int(user_id))).scalar_one_or_none()
    if user is None:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Bruker finnes ikke.")
    return user
