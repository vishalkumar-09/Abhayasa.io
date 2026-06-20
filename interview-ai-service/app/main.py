import sys
sys.modules['google._upb._message'] = None

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.settings import settings
from app.core.logging_config import setup_logging

import google.generativeai as genai
if settings.GEMINI_API_KEY:
    genai.configure(api_key=settings.GEMINI_API_KEY)
else:
    import logging
    logging.getLogger("app").warning("GEMINI_API_KEY is not configured in .env!")

from app.routers.api import api_router

# 1. Setup Application Logging
setup_logging()
logger = logging.getLogger("app")

# 2. Define Lifecycle Lifespan Manager
@asynccontextmanager
async def lifespan(app: FastAPI):
    logger.info("Initializing %s microservice...", settings.PROJECT_NAME)
    # Here you would typically initialize clients (e.g. Gemini, Qdrant client connection test)
    yield
    logger.info("Shutting down %s microservice...", settings.PROJECT_NAME)

from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse

# 3. Create FastAPI App Instance
app = FastAPI(
    title=settings.PROJECT_NAME,
    openapi_url=f"{settings.API_V1_STR}/openapi.json",
    lifespan=lifespan
)

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request, exc):
    import logging
    logging.getLogger("app").error("Validation error: %s", exc.errors())
    logging.getLogger("app").error("Request body: %s", await request.body())
    return JSONResponse(
        status_code=422,
        content={"detail": exc.errors()},
    )

# 4. Configure CORS Middlewares
# Allow cross-origin requests from Next.js (port 3000) and Spring Boot (port 8080)
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:8080"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 5. Include API Routers
app.include_router(api_router, prefix=settings.API_V1_STR)

# 6. Global Root Endpoints
@app.get("/", tags=["Root"])
def read_root():
    """Service landing page showing basic metadata."""
    return {
        "message": f"Welcome to {settings.PROJECT_NAME}",
        "docs_url": "/docs",
        "version": "1.0.0"
    }

@app.get("/health", tags=["Health"])
def health_check():
    """Simple ping health endpoint."""
    return {"status": "healthy"}
