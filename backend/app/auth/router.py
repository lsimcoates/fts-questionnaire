from fastapi import APIRouter, HTTPException, Response, Request, Depends
from pydantic import BaseModel, EmailStr
import os

from app.auth.config import (
    ALLOWED_EMAIL_DOMAIN,
    ACCESS_TOKEN_EXPIRE_SECONDS,
    VERIFY_TOKEN_EXPIRE_SECONDS,
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
    new_raw_token,
    hash_token,
)

from app.auth.db import (
    init_db,
    get_session,
    get_user_by_email,
    get_user_by_id,
    User,
    create_auth_token,
    find_valid_auth_token,
    mark_auth_token_used,
    set_user_verified,
)

from app.auth.emailer import send_verification_email, send_password_reset_email

router = APIRouter(prefix="/auth", tags=["auth"])


class SignupPayload(BaseModel):
    email: EmailStr
    password: str
    confirm_password: str


class LoginPayload(BaseModel):
    email: EmailStr
    password: str


class ForgotPasswordPayload(BaseModel):
    email: EmailStr


class ResetPasswordPayload(BaseModel):
    token: str
    new_password: str
    confirm_password: str


def require_domain(email: str):
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


# Seed superadmin (unchanged)
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
                is_verified=True,
            )
            session.add(u)
            session.commit()


@router.post("/signup")
def signup(payload: SignupPayload):
    require_domain(payload.email)

    if payload.password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    # bcrypt limits
    password_bytes = payload.password.encode("utf-8")
    if len(password_bytes) > 72:
        raise HTTPException(
            status_code=400,
            detail="Password is too long (maximum 72 characters)."
        )

    if len(payload.password) < 8:
        raise HTTPException(
            status_code=400,
            detail="Password must be at least 8 characters."
        )

    with get_session() as session:
        existing = get_user_by_email(session, payload.email.lower())
        if existing:
            raise HTTPException(status_code=400, detail="Account already exists")

        user = User(
            email=payload.email.lower(),
            password_hash=hash_password(payload.password),
            role="user",
            is_active=True,
            is_verified=False,
        )
        session.add(user)
        session.commit()
        session.refresh(user)

        # ✅ Create opaque verification token stored in DB (hashed)
        raw_token = new_raw_token()
        create_auth_token(
            session=session,
            user_id=user.id,
            purpose="verify_email",
            token_hash=hash_token(raw_token),
            expires_in_seconds=VERIFY_TOKEN_EXPIRE_SECONDS,
        )

        send_verification_email(user.email, raw_token)

        return {"ok": True, "message": "Account created. Please verify your email."}


@router.post("/verify")
def verify_email(token: str):
    with get_session() as session:
        t = find_valid_auth_token(
            session=session,
            token_hash=hash_token(token),
            purpose="verify_email",
        )
        if not t:
            raise HTTPException(status_code=400, detail="Invalid/expired token")

        user = get_user_by_id(session, int(t.user_id))
        if not user:
            raise HTTPException(status_code=404, detail="User not found")

        set_user_verified(session, user.id)
        mark_auth_token_used(session, t.id)

    return {"ok": True}


@router.post("/login")
def login(payload: LoginPayload, response: Response):
    with get_session() as session:
        user = get_user_by_email(session, payload.email.lower())
        if not user or not user.is_active:
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not verify_password(payload.password, user.password_hash):
            raise HTTPException(status_code=401, detail="Invalid credentials")

        if not user.is_verified:
            raise HTTPException(status_code=403, detail="Email not verified")

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


@router.post("/forgot-password")
def forgot_password(payload: ForgotPasswordPayload):
    # Always respond ok to avoid user enumeration
    with get_session() as session:
        user = get_user_by_email(session, payload.email.lower())
        if not user or not user.is_active:
            return {"ok": True, "message": "If the account exists, an email was sent."}

        # ✅ Create opaque reset token stored in DB (hashed)
        raw_token = new_raw_token()
        create_auth_token(
            session=session,
            user_id=user.id,
            purpose="reset_password",
            token_hash=hash_token(raw_token),
            expires_in_seconds=VERIFY_TOKEN_EXPIRE_SECONDS,  # consider adding RESET_TOKEN_EXPIRE_SECONDS later
        )

        send_password_reset_email(user.email, raw_token)

    return {"ok": True, "message": "If the account exists, an email was sent."}


@router.post("/reset-password")
def reset_password(payload: ResetPasswordPayload):
    if payload.new_password != payload.confirm_password:
        raise HTTPException(status_code=400, detail="Passwords do not match")

    pw_bytes = payload.new_password.encode("utf-8")
    if len(pw_bytes) > 72:
        raise HTTPException(status_code=400, detail="Password is too long (maximum 72 bytes).")
    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="Password must be at least 8 characters")

    with get_session() as session:
        t = find_valid_auth_token(
            session=session,
            token_hash=hash_token(payload.token),
            purpose="reset_password",
        )
        if not t:
            raise HTTPException(status_code=400, detail="Invalid or expired token")

        user = get_user_by_id(session, int(t.user_id))
        if not user or not user.is_active:
            raise HTTPException(status_code=404, detail="User not found")

        user.password_hash = hash_password(payload.new_password)
        session.add(user)
        session.commit()

        mark_auth_token_used(session, t.id)

    return {"ok": True}
