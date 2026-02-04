from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, EmailStr
import os

from app.auth.config import (
    ALLOWED_EMAIL_DOMAIN,
    ACCESS_TOKEN_EXPIRE_SECONDS,
    COOKIE_NAME,
    COOKIE_SECURE,
    COOKIE_SAMESITE,
    COOKIE_DOMAIN,
)

from app.auth.security import (
    hash_password,
    verify_password,
    create_jwt,
    decode_jwt,
)

from app.auth.db import (
    init_db,
    get_session,
    get_user_by_email,
    get_user_by_id,
    User,
)

router = APIRouter(prefix="/auth", tags=["auth"])


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class ChangePasswordPayload(BaseModel):
    current_password: str
    new_password: str
    confirm_password: str


def require_domain(email: str):
    """
    Kept for admin-created users consistency (admin endpoint can reuse this)
    """
    domain = email.split("@")[-1].lower().strip()
    if domain != ALLOWED_EMAIL_DOMAIN.lower():
        raise HTTPException(
            status_code=400,
            detail=f"Email must end with @{ALLOWED_EMAIL_DOMAIN}",
        )


def set_session_cookie(resp: Response, token: str):
    resp.set_cookie(
        key=COOKIE_NAME,
        value=token,
        httponly=True,
        secure=COOKIE_SECURE,
        samesite=COOKIE_SAMESITE,  # "lax" or "none"
        max_age=ACCESS_TOKEN_EXPIRE_SECONDS,
        domain=COOKIE_DOMAIN,
        path="/",
    )


def clear_session_cookie(resp: Response):
    resp.delete_cookie(
        key=COOKIE_NAME,
        path="/",
        domain=COOKIE_DOMAIN,
    )


def get_current_user(request: Request, response: Response) -> User:
    token = request.cookies.get(COOKIE_NAME)
    if not token:
        raise HTTPException(status_code=401, detail="Not logged in")

    payload = decode_jwt(token)
    if not payload or payload.get("type") != "session":
        raise HTTPException(status_code=401, detail="Invalid session")

    user_id = payload.get("sub")
    if not user_id:
        raise HTTPException(status_code=401, detail="Invalid session")

    with get_session() as session:
        user = get_user_by_id(session, int(user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Account inactive")

        # ✅ SLIDING / INACTIVITY EXPIRY:
        # Re-mint a fresh session token and re-set cookie on every authenticated request.
        new_token = create_jwt(
            {"type": "session", "sub": str(user.id), "role": user.role},
            expires_in_seconds=ACCESS_TOKEN_EXPIRE_SECONDS,
        )
        set_session_cookie(response, new_token)

        return user


@router.on_event("startup")
def _startup():
    init_db()


# Seed superadmin (unchanged concept, but no email verification now)
SUPERADMIN_EMAIL = os.getenv("SUPERADMIN_EMAIL", "").lower()
SUPERADMIN_PASSWORD = os.getenv("SUPERADMIN_PASSWORD", "")


@router.on_event("startup")
def seed_superadmin():
    if not SUPERADMIN_EMAIL or not SUPERADMIN_PASSWORD:
        return
    with get_session() as session:
        u = get_user_by_email(session, SUPERADMIN_EMAIL)
        if not u:
            u = User(
                email=SUPERADMIN_EMAIL,
                password_hash=hash_password(SUPERADMIN_PASSWORD),
                role="superadmin",
                is_active=True,
            )
            session.add(u)
            session.commit()


@router.post("/login")
def login(payload: LoginPayload, response: Response):
    with get_session() as session:
        user = get_user_by_email(session, payload.email.lower())
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        session_token = create_jwt(
            {"type": "session", "sub": str(user.id), "role": user.role},
            expires_in_seconds=ACCESS_TOKEN_EXPIRE_SECONDS,
        )
        set_session_cookie(response, session_token)

        return {"ok": True, "email": user.email, "role": user.role}


@router.post("/logout")
def logout(response: Response):
    clear_session_cookie(response)
    return {"ok": True}


@router.get("/me")
def me(user: User = Depends(get_current_user)):
    return {"ok": True, "email": user.email, "role": user.role}


@router.post("/change-password")
def change_password(payload: ChangePasswordPayload, user: User = Depends(get_current_user)):
    """
    Logged-in users can change password from within the app.
    No email flows required.
    """
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # bcrypt limits
    pw_bytes = payload.new_password.encode("utf-8")
    if len(pw_bytes) > 72:
        raise HTTPException(status_code=400, detail="Password is too long (maximum 72 bytes).")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    with get_session() as session:
        db_user = get_user_by_id(session, int(user.id))
        if not db_user or not db_user.is_active:
            raise HTTPException(status_code=401, detail="Invalid session")

        if not verify_password(payload.current_password, db_user.password_hash):
            raise HTTPException(status_code=400, detail="Current password incorrect")

        db_user.password_hash = hash_password(payload.new_password)
        session.add(db_user)
        session.commit()

    return {"ok": True}
