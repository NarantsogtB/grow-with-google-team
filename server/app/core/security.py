# =============================================================================
# SECURITY MODULE — app/core/security.py
# =============================================================================
# Centralizes all authentication logic so it lives in one place.
# Endpoints and services import these helpers instead of duplicating JWT/bcrypt
# logic in multiple files.
#
# WHAT IS A JWT?
# A JSON Web Token (JWT) is a compact, signed string: header.payload.signature
# Example: eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiI1MDUifQ.abc123_signature
#          ─────── header ──────  ──── payload ────  ─── signature ───
#
# - The header says which algorithm was used (HS256 = HMAC-SHA256)
# - The payload contains the user's UUID ("sub") and expiry time ("exp")
# - The signature is a cryptographic hash of header+payload using our secret key
#
# The client stores this token (in localStorage or a cookie) and sends it with
# every request in the Authorization: Bearer <token> header.
# We verify the signature to confirm the token was issued by us, not forged.
#
# WHAT IS BCRYPT?
# A one-way password hashing algorithm. "One-way" means:
#   - We can hash "password123" → "$2b$12$randomsalt_hashed_output"
#   - We can verify "password123" matches the stored hash
#   - We CANNOT reverse the hash back to "password123"
# So even if the database is leaked, passwords are safe.
# =============================================================================

from datetime import datetime, timedelta, timezone

from app.core.config import settings
from jose import jwt
from passlib.context import CryptContext

# CryptContext manages password hashing schemes.
# schemes=["bcrypt"] means we use bcrypt for new hashes.
# deprecated="auto" means if we add a stronger scheme later, old bcrypt hashes
# are automatically identified as "needs upgrade" during login verification.
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(plain_password: str) -> str:
    """
    Hash a plain-text password for secure storage.

    Example:
        stored_hash = hash_password("mypassword123")
        # → "$2b$12$Eklx.bY0...long_hash_string..."

    NEVER store plain-text passwords. Always call this before db.add(user).
    """
    return pwd_context.hash(plain_password)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """
    Check if a plain-text password matches a stored hash.

    Example:
        verify_password("mypassword123", stored_hash)  # → True
        verify_password("wrongpassword", stored_hash)  # → False

    Used during login — we fetch the user's hash from DB and verify the input.
    """
    return pwd_context.verify(plain_password, hashed_password)


def create_access_token(subject: str) -> str:
    """
    Create a signed JWT access token.

    Args:
        subject: The user's UUID as a string.
                 This identifies WHO the token belongs to.

    Returns:
        A JWT string: "eyJ...header.eyJ...payload.signature"

    The token expires after JWT_EXPIRE_HOURS hours (default: 24).
    After expiry, the client must log in again.
    """
    expire = datetime.now(timezone.utc) + timedelta(hours=settings.JWT_EXPIRE_HOURS)
    payload = {
        # "sub" (subject) is the standard JWT claim for the token owner's identifier
        "sub": subject,
        # "exp" (expiry) is a Unix timestamp; jose will reject tokens past this time
        "exp": expire,
    }
    return jwt.encode(payload, settings.JWT_SECRET_KEY, algorithm=settings.JWT_ALGORITHM)


def decode_access_token(token: str) -> str:
    """
    Decode a JWT and return the subject (user UUID string).

    Raises:
        jose.JWTError: If the token is invalid, expired, or tampered with.

    This is called by the get_current_patient dependency in api/deps.py
    to authenticate every protected endpoint.
    """
    payload = jwt.decode(
        token,
        settings.JWT_SECRET_KEY,
        algorithms=[settings.JWT_ALGORITHM],
    )
    subject: str = payload["sub"]
    return subject
