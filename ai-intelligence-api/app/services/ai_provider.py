from abc import ABC, abstractmethod
from typing import List, Dict, Any
import httpx
import json
from app.models.schemas import ChatMessage, AIProvider
from app.core.config import settings


class BaseAIProvider(ABC):
    """Abstract base class for AI providers"""
    
    @abstractmethod
    async def chat_completion(
        self,
        messages: List[ChatMessage],
        max_tokens: int = None,
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion"""
        pass
    
    @abstractmethod
    def count_tokens(self, text: str) -> int:
        """Count tokens in text"""
        pass


class GroqProvider(BaseAIProvider):
    """Groq AI provider - Fast and cost-effective"""
    
    def __init__(self):
        self.api_key = settings.GROQ_API_KEY
        self.model = settings.GROQ_MODEL
        self.base_url = "https://api.groq.com/openai/v1"
    
    async def chat_completion(
        self,
        messages: List[ChatMessage],
        max_tokens: int = None,
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using Groq"""
        
        if not self.api_key:
            raise ValueError("Groq API key not configured")
        
        headers = {
            "Authorization": f"Bearer {self.api_key}",
            "Content-Type": "application/json"
        }
        
        payload = {
            "model": kwargs.get("model", self.model),
            "messages": [{"role": msg.role.value, "content": msg.content} for msg in messages],
            "temperature": temperature,
            "max_tokens": max_tokens or settings.GROQ_MAX_TOKENS
        }
        
        async with httpx.AsyncClient() as client:
            response = await client.post(
                f"{self.base_url}/chat/completions",
                headers=headers,
                json=payload,
                timeout=30.0
            )
            response.raise_for_status()
            return response.json()
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count (rough approximation)"""
        return len(text) // 4


class OllamaProvider(BaseAIProvider):
    """Ollama local AI provider - Free and private"""
    
    def __init__(self):
        self.base_url = settings.OLLAMA_BASE_URL
        self.model = settings.OLLAMA_MODEL
        self.timeout = settings.OLLAMA_TIMEOUT
    
    async def chat_completion(
        self,
        messages: List[ChatMessage],
        max_tokens: int = None,
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using Ollama"""
        
        payload = {
            "model": kwargs.get("model", self.model),
            "messages": [{"role": msg.role.value, "content": msg.content} for msg in messages],
            "stream": False,
            "options": {
                "temperature": temperature,
                "num_predict": max_tokens or 2000
            }
        }
        
        async with httpx.AsyncClient() as client:
            try:
                response = await client.post(
                    f"{self.base_url}/api/chat",
                    json=payload,
                    timeout=self.timeout
                )
                response.raise_for_status()
                result = response.json()
                
                # Convert Ollama format to OpenAI-like format
                return {
                    "id": "ollama-" + str(hash(result.get("message", {}).get("content", ""))),
                    "model": self.model,
                    "choices": [{
                        "message": {
                            "role": "assistant",
                            "content": result.get("message", {}).get("content", "")
                        }
                    }],
                    "usage": {
                        "prompt_tokens": result.get("prompt_eval_count", 0),
                        "completion_tokens": result.get("eval_count", 0),
                        "total_tokens": result.get("prompt_eval_count", 0) + result.get("eval_count", 0)
                    }
                }
            except httpx.ConnectError:
                raise ConnectionError(
                    f"Could not connect to Ollama at {self.base_url}. "
                    "Make sure Ollama is running: 'ollama serve'"
                )
    
    def count_tokens(self, text: str) -> int:
        """Estimate token count"""
        return len(text) // 4


class OpenAIProvider(BaseAIProvider):
    """OpenAI provider - Premium quality"""
    
    def __init__(self):
        self.api_key = settings.OPENAI_API_KEY
        self.model = settings.OPENAI_MODEL
    
    async def chat_completion(
        self,
        messages: List[ChatMessage],
        max_tokens: int = None,
        temperature: float = 0.7,
        **kwargs
    ) -> Dict[str, Any]:
        """Generate chat completion using OpenAI"""
        
        if not self.api_key:
            raise ValueError("OpenAI API key not configured")
        
        from openai import AsyncOpenAI
        client = AsyncOpenAI(api_key=self.api_key)
        
        response = await client.chat.completions.create(
            model=kwargs.get("model", self.model),
            messages=[{"role": msg.role.value, "content": msg.content} for msg in messages],
            temperature=temperature,
            max_tokens=max_tokens or settings.OPENAI_MAX_TOKENS
        )
        
        return response.model_dump()
    
    def count_tokens(self, text: str) -> int:
        """Count tokens using tiktoken"""
        try:
            import tiktoken
            encoding = tiktoken.encoding_for_model(self.model)
            return len(encoding.encode(text))
        except:
            return len(text) // 4


class AIProviderFactory:
    """Factory to create AI provider instances"""
    
    _providers = {
        AIProvider.GROQ: GroqProvider,
        AIProvider.OLLAMA: OllamaProvider,
        AIProvider.OPENAI: OpenAIProvider,
    }
    
    @classmethod
    def get_provider(cls, provider_type: AIProvider = None) -> BaseAIProvider:
        """Get AI provider instance"""
        if provider_type is None:
            provider_type = AIProvider(settings.DEFAULT_AI_PROVIDER)
        
        provider_class = cls._providers.get(provider_type)
        if not provider_class:
            raise ValueError(f"Unsupported provider: {provider_type}")
        
        return provider_class()
    
    @classmethod
    def get_available_providers(cls) -> List[str]:
        """Get list of configured providers"""
        available = []
        
        if settings.GROQ_API_KEY:
            available.append("groq")
        if settings.OPENAI_API_KEY:
            available.append("openai")
        if settings.ANTHROPIC_API_KEY:
            available.append("anthropic")
        
        # Ollama is always available if running
        available.append("ollama")
        
        return available
