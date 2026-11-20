"""
Service-to-service authentication middleware and dependencies.
Ensures only authorized internal callers (e.g., SkillBridge Node.js backend)
can invoke protected AI endpoints using a high-entropy shared secret.
"""
import os
import hmac
from typing import Optional
from fastapi import Request, HTTPException, Security
from fastapi.security import APIKeyHeader
from dotenv import load_dotenv

# Ensure environment variables are loaded
load_dotenv()

INTERNAL_SERVICE_KEY_HEADER = "X-Internal-Service-Key"
_api_key_header = APIKeyHeader(name=INTERNAL_SERVICE_KEY_HEADER, auto_error=False)

def get_expected_service_key() -> str:
    """
    Retrieve and validate the configured internal service key.
    Fails closed if missing or insufficiently long.
    """
    key = os.getenv("INTERNAL_SERVICE_KEY", "").strip()
    if not key:
        raise RuntimeError("CRITICAL: INTERNAL_SERVICE_KEY environment variable is not configured.")
    if len(key) < 32:
        raise RuntimeError("CRITICAL: INTERNAL_SERVICE_KEY must be at least 32 characters long.")
    return key


def verify_service_key(header_key: Optional[str] = Security(_api_key_header)) -> bool:
    """
    FastAPI security dependency to verify the internal service authentication header.
    Uses hmac.compare_digest for constant-time comparison to prevent timing attacks.
    """
    try:
        expected_key = get_expected_service_key()
    except RuntimeError as err:
        # Fail safe with 500 configuration error
        raise HTTPException(status_code=500, detail="Service authentication is misconfigured.") from err

    if not header_key:
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Missing service authentication header."
        )

    # Constant-time comparison
    if not hmac.compare_digest(header_key.encode("utf-8"), expected_key.encode("utf-8")):
        raise HTTPException(
            status_code=401,
            detail="Unauthorized: Invalid service authentication credentials."
        )

    return True
