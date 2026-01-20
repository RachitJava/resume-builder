from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from datetime import datetime
import time

from app.core.config import settings
from app.routers import interview, ai, conversation, admin
from app.models.schemas import HealthResponse


# Create FastAPI app
app = FastAPI(
    title="Rachit Intelligence API",
    version=settings.API_VERSION,
    description="""
    ## Rachit Intelligence - Proprietary AI System
    
    **Your independent, cost-effective AI engine** for intelligent interview management.
    
    ### 🎯 Key Features
    - **Rachit Intelligence Core**: Smart algorithms that work WITHOUT external AI
    - **Zero Cost**: No API fees for core features
    - **Fast Performance**: Sub-100ms response times
    - **Easy Integration**: Works with any language (Java, React, Vue, etc.)
    - **Optional AI Boost**: Admin can enable external AI for enhanced features
    
    ### 🚀 Quick Start
    
    1. **Start Interview**: `POST /api/v1/interview/start`
    2. **Get Questions**: `POST /api/v1/interview/next-question`
    3. **Evaluate Answers**: `POST /api/v1/interview/evaluate`
    4. **Complete**: `POST /api/v1/interview/complete`
    
    ### 💡 Intelligence Features
    
    - Smart question selection from your question bank
    - Adaptive difficulty based on performance
    - Intelligent answer evaluation (keyword matching, NLP)
    - Category-wise performance analysis
    - Personalized recommendations
    
    ### 💰 Cost Savings
    
    - **Rachit Intelligence**: FREE (no external API calls)
    - **External AI Boost**: Optional, disabled by default
    - **Admin Control**: Toggle AI providers on/off
    
    ---
    
    **Powered by Rachit Intelligence™**
    """,
    docs_url="/docs",
    redoc_url="/redoc"
)

from fastapi.staticfiles import StaticFiles

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount static files
app.mount("/static", StaticFiles(directory="static"), name="static")

# Request timing middleware
@app.middleware("http")
async def add_process_time_header(request: Request, call_next):
    start_time = time.time()
    response = await call_next(request)
    process_time = time.time() - start_time
    response.headers["X-Process-Time"] = f"{process_time:.4f}s"
    return response

# Include routers
app.include_router(interview.router)
app.include_router(ai.router)
app.include_router(conversation.router)
app.include_router(admin.router)


@app.get("/", tags=["Root"])
async def root():
    """Root endpoint with API information"""
    return {
        "name": "Rachit Intelligence API",
        "version": settings.API_VERSION,
        "status": "running",
        "message": "Rachit Intelligence - Your Proprietary AI System",
        "tagline": "Independent, Cost-Effective, Intelligent",
        "features": {
            "rachit_intelligence": "active",
            "external_ai_boost": "optional (disabled by default)",
            "cost": "FREE for core features"
        },
        "docs": "/docs",
        "health": "/health"
    }


@app.get("/health", response_model=HealthResponse, tags=["Health"])
async def health_check():
    """
    Health check endpoint.
    Shows system status and available providers.
    """
    from app.services.ai_provider import AIProviderFactory
    
    # Check available providers
    providers_status = {}
    
    # Groq
    if settings.GROQ_API_KEY:
        providers_status["groq"] = "configured"
    else:
        providers_status["groq"] = "not configured"
    
    # Ollama
    try:
        import httpx
        async with httpx.AsyncClient() as client:
            response = await client.get(f"{settings.OLLAMA_BASE_URL}/api/tags", timeout=2.0)
            providers_status["ollama"] = "available" if response.status_code == 200 else "unavailable"
    except:
        providers_status["ollama"] = "not running"
    
    # OpenAI
    if settings.OPENAI_API_KEY:
        providers_status["openai"] = "configured"
    else:
        providers_status["openai"] = "not configured"
    
    # Rachit Intelligence (always available)
    providers_status["rachit_intelligence"] = "active"
    
    # Cache status
    cache_status = "enabled" if settings.ENABLE_CACHING else "disabled"
    
    return HealthResponse(
        status="healthy",
        version=settings.API_VERSION,
        timestamp=datetime.utcnow(),
        providers=providers_status,
        cache_status=cache_status
    )


@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Global exception handler"""
    return JSONResponse(
        status_code=500,
        content={
            "detail": str(exc),
            "type": type(exc).__name__,
            "path": str(request.url)
        }
    )


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host=settings.API_HOST,
        port=settings.API_PORT,
        reload=settings.DEBUG
    )
