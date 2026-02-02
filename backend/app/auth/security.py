from datetime import datetime, timedelta, timezone
from typing import Optional, Dict, Any

from jose import jwt, JWTError
from passlib.context import CryptContext

from app.auth.config import SECRET_KEY, ALGORITHM
import secrets
import hashlib


pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def verify_password(password: str, password_hash: str) -> bool:
    return pwd_context.verify(password, password_hash)


def create_jwt(payload: Dict[str, Any], expires_in_seconds: int) -> str:
    now = datetime.now(timezone.utc)
    exp = now + timedelta(seconds=expires_in_seconds)
    to_encode = {**payload, "exp": exp}
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)


def decode_jwt(token: str) -> Optional[Dict[str, Any]]:
    try:
        return jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
    except JWTError:
        return None

def new_raw_token() -> str:
    # random token safe to put in URL
    return secrets.token_urlsafe(32)


def hash_token(token: str) -> str:
    # store only hash in DB
    return hashlib.sha256(token.encode("utf-8")).hexdigest()
