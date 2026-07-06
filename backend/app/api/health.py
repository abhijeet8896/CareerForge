from fastapi import APIRouter
from app.core.config import settings
import httpx

router = APIRouter(prefix="/health", tags=["Health"])


@router.get("/ollama")
async def ollama_health():
    """
    Check Ollama connectivity and model availability.
    Returns model_ready=true only when the configured model is pulled and available.
    """
    try:
        async with httpx.AsyncClient(timeout=5) as client:
            resp = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags")
            if resp.status_code == 200:
                data = resp.json()
                models = [m["name"] for m in data.get("models", [])]
                model_ready = any(settings.OLLAMA_MODEL in m for m in models)
                return {
                    "status": "ok",
                    "model": settings.OLLAMA_MODEL,
                    "available_models": models,
                    "model_ready": model_ready,
                    "pull_command": f"ollama pull {settings.OLLAMA_MODEL}" if not model_ready else None,
                }
            else:
                return {
                    "status": "error",
                    "message": f"Ollama returned HTTP {resp.status_code}",
                    "model": settings.OLLAMA_MODEL,
                    "model_ready": False,
                }
    except Exception as e:
        return {
            "status": "error",
            "message": str(e),
            "model": settings.OLLAMA_MODEL,
            "model_ready": False,
            "hint": "Start Ollama, then run: ollama pull " + settings.OLLAMA_MODEL,
        }
