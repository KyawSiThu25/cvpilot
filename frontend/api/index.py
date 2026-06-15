"""CVPilot — FastAPI backend entry point."""

import logging
import sys

import uvicorn
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import settings
from app.routes import router

# ---------------------------------------------------------------------------
# Logging
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s | %(levelname)-7s | %(name)s | %(message)s",
    stream=sys.stdout,
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Application
# ---------------------------------------------------------------------------
app = FastAPI(
    title="CVPilot API",
    description=(
        "AI-powered resume tailoring backend. Accepts a candidate profile and "
        "a target job description, then returns an ATS-optimized resume in Markdown."
    ),
    version="0.1.0",
    docs_url="/docs",
    redoc_url="/redoc",
)

# ---------------------------------------------------------------------------
# Middleware
# ---------------------------------------------------------------------------
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origin_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---------------------------------------------------------------------------
# Routes
# ---------------------------------------------------------------------------
app.include_router(router)


@app.get("/", tags=["Health"])
async def health_check():
    """Simple liveness probe."""
    return {"status": "ok", "service": "cvpilot-api", "version": "0.1.0"}


# ---------------------------------------------------------------------------
# Run with `python main.py`
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    logger.info("Starting CVPilot API on %s:%s", settings.host, settings.port)
    uvicorn.run(
        "main:app",
        host=settings.host,
        port=settings.port,
        reload=True,
    )
