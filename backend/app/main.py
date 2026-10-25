from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
import logging

from app.core.config import settings
from app.core.database import engine, Base, SessionLocal
from app.api.endpoints import router as api_router
from data.seed_data import seed_database_if_empty

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("agenttrust")

# Create database tables
Base.metadata.create_all(bind=engine)

# Seed sample data on first run
try:
    with SessionLocal() as db:
        seed_database_if_empty(db)
except Exception as ex:
    logger.warning(f"Seed data initialization skipped or error: {ex}")

app = FastAPI(
    title=settings.PROJECT_NAME,
    description="AgentTrust: Test AI Agents. Measure Risk. Prove Reliability. Deterministic local-first AI agent security testing platform.",
    version=settings.VERSION,
    docs_url="/docs",
    redoc_url="/redoc",
    openapi_url="/api/v1/openapi.json"
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global safe exception handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error processing {request.method} {request.url.path}: {exc}")
    return JSONResponse(
        status_code=500,
        content={
            "error": "InternalServerError",
            "message": "An unexpected error occurred while processing the request. Details logged safely."
        }
    )

# Root status
@app.get("/", tags=["Root"])
def root_info():
    return {
        "platform": settings.PROJECT_NAME,
        "tagline": "Test AI Agents. Measure Risk. Prove Reliability.",
        "version": settings.VERSION,
        "status": "online",
        "docs": "/docs",
        "api_v1": settings.API_V1_STR
    }

# Mount API endpoints
app.include_router(api_router, prefix=settings.API_V1_STR)
