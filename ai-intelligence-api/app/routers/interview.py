from fastapi import APIRouter, HTTPException, Depends
from typing import List
from app.models.schemas import (
    InterviewStartRequest,
    InterviewSession,
    NextQuestionRequest,
    NextQuestionResponse,
    EvaluateResponseRequest,
    EvaluationResult,
    CompleteInterviewRequest,
    InterviewSummary,
    QuestionModel
)
from app.services.interview_service import interview_service
from app.core.config import settings
import httpx


router = APIRouter(prefix="/api/v1/interview", tags=["Interview"])


async def fetch_question_bank(bank_id: str) -> List[QuestionModel]:
    """
    Fetch questions from Resume Builder's question bank.
    This integrates with your existing Java backend.
    """
    if not bank_id:
        # Return mock questions for demo
        return get_demo_questions()
    
    try:
        async with httpx.AsyncClient() as client:
            response = await client.get(
                f"{settings.RESUME_BUILDER_API_URL}/question-bank/{bank_id}/questions",
                timeout=10.0
            )
            response.raise_for_status()
            
            # Convert Java response to our models
            data = response.json()
            return [QuestionModel(**q) for q in data]
    
    except Exception as e:
        # Fallback to demo questions
        print(f"Failed to fetch from Resume Builder API: {e}")
        return get_demo_questions()


def get_demo_questions() -> List[QuestionModel]:
    """Demo questions for testing"""
    from app.models.schemas import DifficultyLevel
    
    return [
        QuestionModel(
            id="q1",
            text="What is Object-Oriented Programming and what are its main principles?",
            category="Programming Fundamentals",
            difficulty=DifficultyLevel.EASY,
            expected_answer="OOP is a programming paradigm based on objects. Main principles: Encapsulation, Inheritance, Polymorphism, Abstraction.",
            tags=["oop", "fundamentals", "programming"]
        ),
        QuestionModel(
            id="q2",
            text="Explain the difference between ArrayList and LinkedList in Java.",
            category="Data Structures",
            difficulty=DifficultyLevel.MEDIUM,
            expected_answer="ArrayList uses dynamic array, O(1) access, O(n) insertion. LinkedList uses doubly-linked nodes, O(n) access, O(1) insertion at ends.",
            tags=["java", "collections", "data-structures"]
        ),
        QuestionModel(
            id="q3",
            text="Design a URL shortening service like bit.ly. Explain your approach.",
            category="System Design",
            difficulty=DifficultyLevel.HARD,
            expected_answer="Hash function for URLs, database with key-value store, redirect service, analytics, handle collisions, scale with sharding.",
            tags=["system-design", "architecture", "scalability"]
        ),
        QuestionModel(
            id="q4",
            text="What is a REST API and what are its constraints?",
            category="Web Development",
            difficulty=DifficultyLevel.EASY,
            expected_answer="REST is architectural style for web services. Constraints: Client-server, stateless, cacheable, uniform interface, layered system.",
            tags=["rest", "api", "web"]
        ),
        QuestionModel(
            id="q5",
            text="Explain how Spring Boot dependency injection works.",
            category="Java Frameworks",
            difficulty=DifficultyLevel.MEDIUM,
            expected_answer="Spring Boot uses IoC container to inject dependencies via @Autowired, constructor injection, or setter injection. Manages bean lifecycle.",
            tags=["spring-boot", "dependency-injection", "java"]
        )
    ]


@router.post("/start", response_model=InterviewSession)
async def start_interview(request: InterviewStartRequest):
    """
    Start a new interview session.
    
    This endpoint:
    1. Fetches questions from your question bank
    2. Intelligently selects appropriate questions
    3. Creates an interview session
    4. Does NOT require external AI (uses built-in intelligence)
    """
    try:
        # Fetch questions from Resume Builder API
        question_bank = await fetch_question_bank(request.question_bank_id)
        
        if not question_bank:
            raise HTTPException(status_code=404, detail="Question bank not found or empty")
        
        # Start interview using our intelligent service
        session = await interview_service.start_interview(request, question_bank)
        
        return session
    
    except HTTPException:
        raise
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to start interview: {str(e)}")


@router.post("/next-question", response_model=NextQuestionResponse)
async def get_next_question(request: NextQuestionRequest):
    """
    Get the next question in the interview.
    
    Uses adaptive difficulty if enabled:
    - Performing well? → Harder questions
    - Struggling? → Easier questions
    - Average? → Maintain difficulty
    """
    try:
        response = await interview_service.get_next_question(
            session_id=request.session_id,
            previous_answer=request.previous_answer
        )
        return response
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to get next question: {str(e)}")


@router.post("/evaluate", response_model=EvaluationResult)
async def evaluate_response(request: EvaluateResponseRequest):
    """
    Evaluate user's response to a question.
    
    Uses intelligent built-in evaluation:
    - Keyword matching
    - Content analysis  
    - Structure assessment
    - Technical depth evaluation
    
    External AI is OPTIONAL and controlled by admin settings.
    """
    try:
        evaluation = await interview_service.evaluate_response(
            session_id=request.session_id,
            question_id=request.question_id,
            answer=request.answer,
            context=request.context
        )
        return evaluation
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to evaluate response: {str(e)}")


@router.post("/complete", response_model=InterviewSummary)
async def complete_interview(request: CompleteInterviewRequest):
    """
    Complete the interview and get comprehensive summary.
    
    Provides:
    - Overall score and performance
    - Category-wise breakdown
    - Strengths and weaknesses
    - Personalized recommendations
    - Learning resources
    """
    try:
        summary = await interview_service.complete_interview(request.session_id)
        return summary
    
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to complete interview: {str(e)}")


@router.get("/session/{session_id}", response_model=InterviewSession)
async def get_session(session_id: str):
    """Get interview session details"""
    try:
        session = interview_service._get_session(session_id)
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))
