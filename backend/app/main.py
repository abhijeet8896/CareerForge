import logging
import httpx
from contextlib import asynccontextmanager
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from app.core.config import settings
from app.api import auth, analysis, health
from app.db.database import engine, Base

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(name)s] %(levelname)s: %(message)s",
)
logger = logging.getLogger(__name__)


async def _check_ollama_on_startup():
    """
    Non-blocking check: warns if Ollama is not reachable or model is not pulled.
    Never raises — the app starts regardless.
    """
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                models = [m["name"] for m in resp.json().get("models", [])]
                if any(settings.OLLAMA_MODEL in m for m in models):
                    logger.info(f"[Ollama] Model '{settings.OLLAMA_MODEL}' is ready. ✓")
                else:
                    logger.warning(
                        f"[Ollama] Model '{settings.OLLAMA_MODEL}' not found locally. "
                        f"Run: ollama pull {settings.OLLAMA_MODEL}"
                    )
            else:
                logger.warning(f"[Ollama] Unexpected response: HTTP {resp.status_code}")
    except Exception as e:
        logger.warning(
            f"[Ollama] Not reachable at startup: {e}. "
            f"Start Ollama and run: ollama pull {settings.OLLAMA_MODEL}"
        )


@asynccontextmanager
async def lifespan(app: FastAPI):
    # ── Startup ───────────────────────────────────────────────────
    logger.info("CareerForge API starting up...")
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    logger.info("Database tables verified.")
    await _check_ollama_on_startup()
    yield
    # ── Shutdown ──────────────────────────────────────────────────
    await engine.dispose()
    logger.info("Database connections closed.")


app = FastAPI(
    title="CareerForge API",
    description="AI Employability Copilot — Multi-Agent Career Intelligence System (100% local via Ollama)",
    version="1.0.0",
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,   # FIX: use lifespan instead of deprecated on_event
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router,     prefix="/api/v1")
app.include_router(analysis.router, prefix="/api/v1")
app.include_router(health.router,   prefix="/api/v1")


# ── Global exception handler ──────────────────────────────────────
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled exception on {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "Internal server error. Please try again."},
    )


@app.get("/health", tags=["Health"])
async def health_check():
    return {"status": "ok", "app": settings.APP_NAME, "version": "1.0.0", "env": settings.APP_ENV}
