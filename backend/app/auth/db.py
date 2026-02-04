from datetime import datetime, timedelta, timezone
from typing import Optional

from sqlmodel import SQLModel, Field, create_engine, Session, select
import os
from pathlib import Path

# ✅ Import models so SQLModel knows to create tables
from app.questionnaires.models import Questionnaire  # noqa: F401


# -----------------------------
# Engine (Postgres in production, SQLite locally)
# -----------------------------
DATABASE_URL = os.getenv("DATABASE_URL")

if DATABASE_URL:
    # Render Postgres (recommended)
    engine = create_engine(DATABASE_URL, echo=False, pool_pre_ping=True)
else:
    # Local dev fallback (SQLite file)
    DEFAULT_DB_PATH = Path(__file__).resolve().parent.parent / "data" / "auth.sqlite"
    DB_PATH = Path(os.getenv("AUTH_DB_PATH", str(DEFAULT_DB_PATH))).resolve()
    DB_PATH.parent.mkdir(parents=True, exist_ok=True)
    engine = create_engine(f"sqlite:///{DB_PATH}", echo=False)


def utcnow_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


# -----------------------------
# Models (auth)
# -----------------------------
class User(SQLModel, table=True):
    id: Optional[int] = Field(default=None, primary_key=True)
    email: str = Field(index=True, unique=True)
    password_hash: str
    role: str = Field(default="user")  # user | admin | superadmin
    is_active: bool = Field(default=True)

    # Email verification - no longer used, but kept for record
    is_verified: bool = Field(default=False)
    verified_at: Optional[str] = Field(default=None)

    created_at: str = Field(default_factory=lambda: datetime.utcnow().isoformat())


class AuthToken(SQLModel, table=True):
    """
    Stores hashed, expiring, single-use tokens.
    purpose: "verify_email" | "reset_password"
    """
    id: Optional[int] = Field(default=None, primary_key=True)

    user_id: int = Field(index=True, foreign_key="user.id")

    purpose: str = Field(index=True)
    token_hash: str = Field(index=True)

    expires_at: str
    used_at: Optional[str] = Field(default=None)

    created_at: str = Field(default_factory=utcnow_iso)


# -----------------------------
# DB helpers
# -----------------------------
def init_db():
    # Creates User/AuthToken/Questionnaire tables (because models are imported)
    SQLModel.metadata.create_all(engine)


def get_session():
    return Session(engine)


def get_user_by_email(session: Session, email: str) -> Optional[User]:
    return session.exec(select(User).where(User.email == email)).first()


def get_user_by_id(session: Session, user_id: int) -> Optional[User]:
    return session.get(User, user_id)


# -----------------------------
# Token helpers
# -----------------------------
def create_auth_token(
    session: Session,
    user_id: int,
    purpose: str,
    token_hash: str,
    expires_in_seconds: int,
) -> AuthToken:
    exp = datetime.now(timezone.utc) + timedelta(seconds=expires_in_seconds)
    t = AuthToken(
        user_id=user_id,
        purpose=purpose,
        token_hash=token_hash,
        expires_at=exp.isoformat(),
    )
    session.add(t)
    session.commit()
    session.refresh(t)
    return t


def find_valid_auth_token(
    session: Session,
    token_hash: str,
    purpose: str,
) -> Optional[AuthToken]:
    t = session.exec(
        select(AuthToken)
        .where(AuthToken.token_hash == token_hash)
        .where(AuthToken.purpose == purpose)
        .order_by(AuthToken.id.desc())
    ).first()

    if not t:
        return None
    if t.used_at is not None:
        return None

    exp = datetime.fromisoformat(t.expires_at)
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)

    if exp <= datetime.now(timezone.utc):
        return None

    return t


def mark_auth_token_used(session: Session, token_id: int) -> None:
    t = session.get(AuthToken, token_id)
    if not t:
        return
    t.used_at = utcnow_iso()
    session.add(t)
    session.commit()


def set_user_verified(session: Session, user_id: int) -> None:
    u = session.get(User, user_id)
    if not u:
        return
    u.is_verified = True
    u.verified_at = utcnow_iso()
    session.add(u)
    session.commit()
