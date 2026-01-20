from fastapi import APIRouter, HTTPException
from app.models.schemas import (
    ChatCompletionRequest,
    ChatCompletionResponse,
    AIProvider
)
from app.services.ai_provider import AIProviderFactory
from app.core.config import settings
from datetime import datetime
import uuid


router = APIRouter(prefix="/api/v1/ai", tags=["AI Provider (Optional)"])


@router.post("/chat/completions", response_model=ChatCompletionResponse)
async def chat_completion(request: ChatCompletionRequest):
    """
    Optional external AI chat completion endpoint.
    
    ⚠️ This endpoint uses external AI providers (Groq, OpenAI, etc.)
    ⚠️ Only use if admin has enabled external AI
    ⚠️ Costs money with paid providers
    
    For interviews, use /api/v1/interview/* endpoints instead (FREE, built-in intelligence)
    """
    
    # Check if AI is enabled by admin
    if not _is_external_ai_enabled():
        raise HTTPException(
            status_code=403,
            detail="External AI is disabled. Use built-in intelligence instead (interview endpoints)."
        )
    
    try:
        # Get provider
        provider_type = request.provider or AIProvider(settings.DEFAULT_AI_PROVIDER)
        provider = AIProviderFactory.get_provider(provider_type)
        
        # Generate completion
        result = await provider.chat_completion(
            messages=request.messages,
            max_tokens=request.max_tokens,
            temperature=request.temperature,
            model=request.model
        )
        
        # Format response
        response = ChatCompletionResponse(
            id=result.get('id', str(uuid.uuid4())),
            provider=provider_type.value,
            model=result.get('model', request.model or 'unknown'),
            content=result['choices'][0]['message']['content'],
            usage=result.get('usage', {
                'prompt_tokens': 0,
                'completion_tokens': 0,
                'total_tokens': 0
            })
        )
        
        return response
    
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except ConnectionError as e:
        raise HTTPException(status_code=503, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"AI request failed: {str(e)}")


@router.get("/providers")
async def list_providers():
    """
    List available AI providers.
    Shows which providers are configured and ready to use.
    """
    available = AIProviderFactory.get_available_providers()
    
    return {
        "available_providers": available,
        "default_provider": settings.DEFAULT_AI_PROVIDER,
        "external_ai_enabled": _is_external_ai_enabled(),
        "note": "External AI is optional. Built-in intelligence works without any provider."
    }


@router.get("/status")
async def ai_status():
    """
    Get AI system status.
    Shows configuration and whether external AI is enabled.
    """
    return {
        "built_in_intelligence": {
            "status": "active",
            "features": [
                "Smart question selection",
                "Intelligent answer evaluation",
                "Adaptive difficulty",
                "Performance analysis",
                "Personalized recommendations"
            ],
            "cost": "FREE",
            "performance": "Fast (< 100ms)"
        },
        "external_ai": {
            "enabled": _is_external_ai_enabled(),
            "providers_configured": AIProviderFactory.get_available_providers(),
            "default_provider": settings.DEFAULT_AI_PROVIDER if _is_external_ai_enabled() else None,
            "cost": "Variable (depends on provider)",
            "use_case": "Optional enhancement for feedback quality"
        },
        "recommendation": "Use built-in intelligence for cost efficiency. Enable external AI only for premium features."
    }


def _is_external_ai_enabled() -> bool:
    """
    Check if external AI is enabled by admin.
    By default, it's DISABLED to save costs.
    """
    # Admin can set this via environment variable
    # For now, we disable it by default
    return False
    
    # Future: Check from database or admin settings
    # return settings.ENABLE_EXTERNAL_AI
