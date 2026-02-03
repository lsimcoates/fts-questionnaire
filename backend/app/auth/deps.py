from fastapi import Depends, HTTPException, Request
from app.auth.config import COOKIE_NAME
from app.auth.security import decode_jwt
from app.auth.db import get_session, get_user_by_id, User


def get_current_user(request: Request) -> User:
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
        return user


def require_admin(user: User = Depends(get_current_user)) -> User:
    if user.role not in ("admin", "superadmin"):
        raise HTTPException(status_code=403, detail="Admin access required")
    return user


def require_superadmin(user: User = Depends(get_current_user)) -> User:
    if user.role != "superadmin":
        raise HTTPException(status_code=403, detail="Superadmin access required")
    return user
