"""Vestora starter backend.

Minimal FastAPI app with a health-check endpoint. Extend this file (or add
new modules under `app/`) once the BYTEATHON 2026 problem statement is known.
"""

from __future__ import annotations

import json
import os
from datetime import datetime, timezone

from dotenv import load_dotenv
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app import __version__

# Load backend/.env (if present) before reading any configuration.
load_dotenv()

DEFAULT_CORS_ORIGINS = ["http://localhost:3000", "http://127.0.0.1:3000"]

# Any loopback origin, any port. Used as the dev default so the frontend still
# works when `next dev` picks a port other than 3000 (it auto-increments when
# 3000 is busy). Loopback-only, so this is safe for local development.
LOOPBACK_ORIGIN_REGEX = r"^https?://(localhost|127\.0\.0\.1)(:\d+)?$"


def _load_cors_origins() -> list[str]:
    """Read allowed CORS origins from the BACKEND_CORS_ORIGINS env var.

    The value must be a JSON array of origin strings, e.g.
    '["http://localhost:3000"]'. Falls back to the local dev origin on any
    parsing problem so the API still starts.
    """
    raw = os.getenv("BACKEND_CORS_ORIGINS")
    if not raw:
        return DEFAULT_CORS_ORIGINS
    try:
        origins = json.loads(raw)
    except json.JSONDecodeError:
        return DEFAULT_CORS_ORIGINS
    if isinstance(origins, list) and all(isinstance(o, str) for o in origins):
        return origins
    return DEFAULT_CORS_ORIGINS


def create_app() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title="Vestora API",
        version=__version__,
        description="BYTEATHON 2026 starter backend.",
    )

    app.add_middleware(
        CORSMiddleware,
        # Explicit BACKEND_CORS_ORIGINS wins; otherwise allow any loopback origin.
        allow_origins=_load_cors_origins(),
        allow_origin_regex=None if os.getenv("BACKEND_CORS_ORIGINS") else LOOPBACK_ORIGIN_REGEX,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @app.get("/health")
    def health() -> dict[str, str]:
        """Liveness probe used by the frontend and by the tests."""
        return {
            "status": "ok",
            "service": "vestora-backend",
            "version": __version__,
            "time": datetime.now(timezone.utc).isoformat(),
        }

    return app


app = create_app()


if __name__ == "__main__":
    import uvicorn

    uvicorn.run(
        "app.main:app",
        host=os.getenv("HOST", "127.0.0.1"),
        port=int(os.getenv("PORT", "8000")),
        reload=True,
    )
