from typing import List, Dict, Any, Optional
import uuid
from datetime import datetime, timedelta
from app.models.schemas import (
    InterviewSession,
    InterviewStartRequest,
    QuestionModel,
    NextQuestionResponse,
    EvaluationResult,
    InterviewSummary,
    DifficultyLevel
)
from app.services.intelligence_engine import IntelligentQuestionSelector, IntelligentEvaluator
from app.services.ai_provider import AIProviderFactory
from app.core.config import settings


class InterviewService:
    """
    Main interview service that orchestrates the intelligent interview process.
    Uses built-in intelligence by default, external AI only if admin enables it.
    """
    
    def __init__(self):
        self.sessions: Dict[str, InterviewSession] = {}
        self.question_selector = IntelligentQuestionSelector()
        self.evaluator = IntelligentEvaluator()
    
    async def start_interview(
        self,
        request: InterviewStartRequest,
        question_bank: List[QuestionModel]
    ) -> InterviewSession:
        """
        Start a new interview session.
        Intelligently selects questions from the bank.
        """
        
        # Select questions using our intelligent selector
        selected_questions = self.question_selector.select_questions(
            question_bank=question_bank,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            enable_adaptive=request.enable_adaptive,
            user_context=request.user_context
        )
        
        # Create session
        session = InterviewSession(
            session_id=str(uuid.uuid4()),
            question_bank_id=request.question_bank_id,
            difficulty=request.difficulty,
            num_questions=request.num_questions,
            current_question_index=0,
            questions=selected_questions,
            responses=[],
            score=0.0,
            use_ai=request.use_ai and self._is_ai_enabled()
        )
        
        # Store session
        self.sessions[session.session_id] = session
        
        return session
    
    async def get_next_question(
        self,
        session_id: str,
        previous_answer: Optional[str] = None
    ) -> NextQuestionResponse:
        """
        Get the next question in the interview.
        If adaptive mode is enabled, adjusts difficulty based on performance.
        """
        
        session = self._get_session(session_id)
        
        # If previous answer provided, evaluate it first
        if previous_answer and session.current_question_index > 0:
            prev_question = session.questions[session.current_question_index - 1]
            evaluation = await self.evaluate_response(
                session_id=session_id,
                question_id=prev_question.id,
                answer=previous_answer
            )
        
        # Check if interview is complete
        if session.current_question_index >= len(session.questions):
            raise ValueError("Interview is already complete")
        
        # Get next question (adaptive or sequential)
        if session.use_ai and settings.ENABLE_ADAPTIVE_DIFFICULTY:
            last_score = session.responses[-1].get('score') if session.responses else None
            question = self.question_selector.get_next_adaptive_question(
                session=session,
                last_performance=last_score
            )
        else:
            question = session.questions[session.current_question_index]
        
        # Generate AI context if external AI is enabled
        ai_context = None
        if session.use_ai and self._is_ai_enabled():
            ai_context = await self._generate_question_context(question, session)
        
        response = NextQuestionResponse(
            question=question,
            question_number=session.current_question_index + 1,
            total_questions=len(session.questions),
            ai_context=ai_context,
            follow_up_from_previous=False
        )
        
        # Update session
        session.current_question_index += 1
        
        return response
    
    async def evaluate_response(
        self,
        session_id: str,
        question_id: str,
        answer: str,
        context: Optional[Dict[str, Any]] = None
    ) -> EvaluationResult:
        """
        Evaluate user's response to a question.
        Uses built-in intelligence, optionally enhanced by external AI.
        """
        
        session = self._get_session(session_id)
        
        # Find the question
        question = next((q for q in session.questions if q.id == question_id), None)
        if not question:
            raise ValueError(f"Question {question_id} not found in session")
        
        # Use our built-in intelligent evaluator
        evaluation = self.evaluator.evaluate_response(
            question=question,
            user_answer=answer,
            use_external_ai=session.use_ai and self._is_ai_enabled()
        )
        
        # If external AI is enabled, enhance the evaluation
        if session.use_ai and self._is_ai_enabled():
            evaluation = await self._enhance_evaluation_with_ai(evaluation, question, answer)
        
        # Store response in session
        session.responses.append({
            'question_id': question_id,
            'question': question.text,
            'answer': answer,
            'score': evaluation.score,
            'feedback': evaluation.feedback,
            'timestamp': datetime.utcnow().isoformat()
        })
        
        # Update session score
        total_score = sum(r['score'] for r in session.responses)
        session.score = total_score / len(session.responses)
        
        return evaluation
    
    async def complete_interview(
        self,
        session_id: str
    ) -> InterviewSummary:
        """
        Complete the interview and generate a comprehensive summary.
        """
        
        session = self._get_session(session_id)
        
        # Mark as completed
        session.completed_at = datetime.utcnow()
        
        # Calculate duration
        duration = (session.completed_at - session.started_at).total_seconds() / 60
        
        # Analyze responses by category
        category_scores = self._calculate_category_scores(session)
        
        # Identify strengths and weaknesses
        strengths, improvements = self._analyze_performance(session, category_scores)
        
        # Generate recommendations
        recommendations = self._generate_recommendations(session, category_scores)
        
        summary = InterviewSummary(
            session_id=session_id,
            total_questions=len(session.questions),
            questions_answered=len(session.responses),
            overall_score=session.score,
            difficulty=session.difficulty,
            duration_minutes=duration,
            strengths=strengths,
            areas_for_improvement=improvements,
            category_scores=category_scores,
            recommendations=recommendations,
            completed_at=session.completed_at
        )
        
        return summary
    
    def _get_session(self, session_id: str) -> InterviewSession:
        """Get interview session by ID"""
        session = self.sessions.get(session_id)
        if not session:
            raise ValueError(f"Session {session_id} not found")
        return session
    
    def _is_ai_enabled(self) -> bool:
        """
        Check if external AI is enabled.
        This would be controlled by admin settings.
        By default, we DON'T use external AI.
        """
        # Check if any AI provider is configured
        has_provider = bool(
            settings.GROQ_API_KEY or 
            settings.OPENAI_API_KEY or 
            settings.OLLAMA_BASE_URL
        )
        
        # Return False by default (use built-in intelligence)
        # Admin can enable this through settings
        return False  # Changed from has_provider to False
    
    async def _generate_question_context(
        self,
        question: QuestionModel,
        session: InterviewSession
    ) -> str:
        """Generate helpful context for a question using external AI (optional)"""
        try:
            from app.services.ai_provider import AIProviderFactory
            from app.models.schemas import ChatMessage, MessageRole
            
            provider = AIProviderFactory.get_provider()
            
            messages = [
                ChatMessage(
                    role=MessageRole.SYSTEM,
                    content="You are a helpful interview assistant. Provide a brief, encouraging hint for the question."
                ),
                ChatMessage(
                    role=MessageRole.USER,
                    content=f"Question: {question.text}\n\nProvide a brief hint (1-2 sentences max):"
                )
            ]
            
            response = await provider.chat_completion(messages, max_tokens=100)
            return response['choices'][0]['message']['content']
        except:
            return None
    
    async def _enhance_evaluation_with_ai(
        self,
        evaluation: EvaluationResult,
        question: QuestionModel,
        answer: str
    ) -> EvaluationResult:
        """Optionally enhance evaluation with external AI insights"""
        try:
            from app.services.ai_provider import AIProviderFactory
            from app.models.schemas import ChatMessage, MessageRole
            
            provider = AIProviderFactory.get_provider()
            
            messages = [
                ChatMessage(
                    role=MessageRole.SYSTEM,
                    content="You are an expert technical interviewer. Provide constructive feedback."
                ),
                ChatMessage(
                    role=MessageRole.USER,
                    content=f"Question: {question.text}\n\nAnswer: {answer}\n\nExpected: {question.expected_answer or 'N/A'}\n\nProvide brief additional insight:"
                )
            ]
            
            response = await provider.chat_completion(messages, max_tokens=150)
            ai_feedback = response['choices'][0]['message']['content']
            
            # Enhance the feedback
            evaluation.feedback += f"\n\nAI Insight: {ai_feedback}"
            
        except:
            pass  # Fail silently, keep original evaluation
        
        return evaluation
    
    def _calculate_category_scores(self, session: InterviewSession) -> Dict[str, float]:
        """Calculate average scores by category"""
        category_totals = {}
        category_counts = {}
        
        for i, response in enumerate(session.responses):
            question = session.questions[i]
            category = question.category
            
            if category not in category_totals:
                category_totals[category] = 0
                category_counts[category] = 0
            
            category_totals[category] += response['score']
            category_counts[category] += 1
        
        return {
            cat: category_totals[cat] / category_counts[cat]
            for cat in category_totals
        }
    
    def _analyze_performance(
        self,
        session: InterviewSession,
        category_scores: Dict[str, float]
    ) -> tuple[List[str], List[str]]:
        """Identify strengths and areas for improvement"""
        
        strengths = []
        improvements = []
        
        # Analyze by category
        for category, score in category_scores.items():
            if score >= 80:
                strengths.append(f"Strong performance in {category}")
            elif score < 60:
                improvements.append(f"Need more practice in {category}")
        
        # Analyze consistency
        scores = [r['score'] for r in session.responses]
        if scores:
            variance = sum((s - session.score) ** 2 for s in scores) / len(scores)
            if variance < 100:
                strengths.append("Consistent performance across questions")
            else:
                improvements.append("Work on consistency")
        
        # Overall performance
        if session.score >= 85:
            strengths.append("Excellent overall performance")
        elif session.score >= 70:
            strengths.append("Good overall understanding")
        elif session.score < 60:
            improvements.append("Focus on fundamentals")
        
        return strengths[:5], improvements[:5]
    
    def _generate_recommendations(
        self,
        session: InterviewSession,
        category_scores: Dict[str, float]
    ) -> List[str]:
        """Generate personalized recommendations"""
        
        recommendations = []
        
        # Based on overall score
        if session.score < 60:
            recommendations.append("Review fundamental concepts before attempting more questions")
            recommendations.append("Start with easier difficulty level to build confidence")
        elif session.score < 80:
            recommendations.append("Practice more questions in weak categories")
            recommendations.append("Try explaining answers out loud to improve clarity")
        else:
            recommendations.append("Challenge yourself with harder questions")
            recommendations.append("Focus on optimizing your solutions")
        
        # Category-specific
        weak_categories = [cat for cat, score in category_scores.items() if score < 65]
        if weak_categories:
            recommendations.append(f"Focus on: {', '.join(weak_categories)}")
        
        # Time management
        duration = (session.completed_at - session.started_at).total_seconds() / 60
        avg_time_per_question = duration / len(session.responses) if session.responses else 0
        
        if avg_time_per_question > 5:
            recommendations.append("Practice time management - aim for 3-4 minutes per question")
        
        return recommendations[:5]


# Singleton instance
interview_service = InterviewService()
