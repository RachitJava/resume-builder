from pydantic import BaseModel, Field
from typing import List, Optional, Dict, Any
from datetime import datetime
from enum import Enum


class AIProvider(str, Enum):
    """Supported AI providers"""
    GROQ = "groq"
    OLLAMA = "ollama"
    OPENAI = "openai"
    ANTHROPIC = "anthropic"


class DifficultyLevel(str, Enum):
    """Question difficulty levels"""
    EASY = "easy"
    MEDIUM = "medium"
    HARD = "hard"
    EXPERT = "expert"


class MessageRole(str, Enum):
    """Chat message roles"""
    SYSTEM = "system"
    USER = "user"
    ASSISTANT = "assistant"


class ChatMessage(BaseModel):
    """Chat message model"""
    role: MessageRole
    content: str


class ChatCompletionRequest(BaseModel):
    """Request model for chat completions"""
    messages: List[ChatMessage]
    provider: Optional[AIProvider] = None
    model: Optional[str] = None
    max_tokens: Optional[int] = None
    temperature: float = Field(default=0.7, ge=0.0, le=2.0)
    stream: bool = False


class ChatCompletionResponse(BaseModel):
    """Response model for chat completions"""
    id: str
    provider: str
    model: str
    content: str
    usage: Dict[str, int]
    created_at: datetime = Field(default_factory=datetime.utcnow)


class QuestionModel(BaseModel):
    """Question model synced from Resume Builder"""
    id: str
    text: str
    category: str
    difficulty: DifficultyLevel
    expected_answer: Optional[str] = None
    hints: Optional[List[str]] = None
    tags: Optional[List[str]] = None


class InterviewStartRequest(BaseModel):
    """Request to start an interview session"""
    question_bank_id: Optional[str] = None
    difficulty: DifficultyLevel = DifficultyLevel.MEDIUM
    num_questions: int = Field(default=10, ge=1, le=50)
    use_ai: bool = True
    enable_adaptive: bool = True
    user_context: Optional[Dict[str, Any]] = None


class InterviewSession(BaseModel):
    """Interview session model"""
    session_id: str
    question_bank_id: Optional[str]
    difficulty: DifficultyLevel
    num_questions: int
    current_question_index: int = 0
    questions: List[QuestionModel]
    responses: List[Dict[str, Any]] = []
    score: float = 0.0
    started_at: datetime = Field(default_factory=datetime.utcnow)
    completed_at: Optional[datetime] = None
    use_ai: bool = True


class NextQuestionRequest(BaseModel):
    """Request for next question"""
    session_id: str
    previous_answer: Optional[str] = None


class NextQuestionResponse(BaseModel):
    """Response with next question"""
    question: QuestionModel
    question_number: int
    total_questions: int
    ai_context: Optional[str] = None
    follow_up_from_previous: bool = False


class EvaluateResponseRequest(BaseModel):
    """Request to evaluate user's response"""
    session_id: str
    question_id: str
    answer: str
    context: Optional[Dict[str, Any]] = None


class EvaluationResult(BaseModel):
    """Evaluation result model"""
    question_id: str
    user_answer: str
    score: float = Field(..., ge=0.0, le=100.0)
    feedback: str
    strengths: List[str] = []
    improvements: List[str] = []
    suggested_resources: List[str] = []
    is_correct: bool
    confidence: float = Field(..., ge=0.0, le=1.0)


class CompleteInterviewRequest(BaseModel):
    """Request to complete interview"""
    session_id: str


class InterviewSummary(BaseModel):
    """Interview completion summary"""
    session_id: str
    total_questions: int
    questions_answered: int
    overall_score: float
    difficulty: DifficultyLevel
    duration_minutes: float
    strengths: List[str]
    areas_for_improvement: List[str]
    category_scores: Dict[str, float]
    recommendations: List[str]
    completed_at: datetime = Field(default_factory=datetime.utcnow)


class HealthResponse(BaseModel):
    """Health check response"""
    status: str
    version: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)
    providers: Dict[str, str]
    cache_status: str
