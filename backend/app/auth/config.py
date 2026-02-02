import os

ALLOWED_EMAIL_DOMAIN = os.getenv("ALLOWED_EMAIL_DOMAIN", "forensic-testing.co.uk")

# Used to sign JWTs (SESSION + email verify tokens)
SECRET_KEY = os.getenv("SECRET_KEY", "CHANGE_ME_IN_PROD")
ALGORITHM = "HS256"

# 1 hour sessions
ACCESS_TOKEN_EXPIRE_SECONDS = int(os.getenv("ACCESS_TOKEN_EXPIRE_SECONDS", "3600"))

# verification tokens (e.g. 24h)
VERIFY_TOKEN_EXPIRE_SECONDS = int(os.getenv("VERIFY_TOKEN_EXPIRE_SECONDS", "86400"))

# Cookie config
COOKIE_NAME = os.getenv("COOKIE_NAME", "fts_session")
COOKIE_SECURE = os.getenv("COOKIE_SECURE", "false").lower() == "true"
COOKIE_SAMESITE = os.getenv("COOKIE_SAMESITE", "lax")  # "lax" or "none" (for cross-site https)
COOKIE_DOMAIN = os.getenv("COOKIE_DOMAIN", None)  # optionally set on work server
