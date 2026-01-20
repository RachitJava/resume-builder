from typing import List, Dict, Any, Optional
from datetime import datetime
import random
import re
from collections import Counter
from app.models.schemas import (
    QuestionModel, 
    DifficultyLevel, 
    EvaluationResult,
    InterviewSession
)


class IntelligentQuestionSelector:
    """
    Smart question selection engine that works WITHOUT external AI.
    Uses algorithms and heuristics for intelligent interview management.
    """
    
    def __init__(self):
        self.difficulty_weights = {
            DifficultyLevel.EASY: 1.0,
            DifficultyLevel.MEDIUM: 1.5,
            DifficultyLevel.HARD: 2.0,
            DifficultyLevel.EXPERT: 2.5
        }
    
    def select_questions(
        self,
        question_bank: List[QuestionModel],
        difficulty: DifficultyLevel,
        num_questions: int,
        enable_adaptive: bool = True,
        user_context: Optional[Dict[str, Any]] = None
    ) -> List[QuestionModel]:
        """
        Intelligently select questions from the bank.
        Uses weighted random selection based on difficulty and relevance.
        """
        
        # Filter by difficulty level
        difficulty_order = [DifficultyLevel.EASY, DifficultyLevel.MEDIUM, DifficultyLevel.HARD, DifficultyLevel.EXPERT]
        target_idx = difficulty_order.index(difficulty)
        
        # Include target difficulty and adjacent levels
        allowed_difficulties = [difficulty]
        if target_idx > 0:
            allowed_difficulties.append(difficulty_order[target_idx - 1])
        if target_idx < len(difficulty_order) - 1:
            allowed_difficulties.append(difficulty_order[target_idx + 1])
        
        filtered = [q for q in question_bank if q.difficulty in allowed_difficulties]
        
        # If user context provided, prioritize relevant questions
        if user_context:
            filtered = self._score_by_relevance(filtered, user_context)
        
        # Ensure diversity in categories
        selected = self._ensure_category_diversity(filtered, num_questions)
        
        # Order by increasing difficulty
        selected.sort(key=lambda q: self.difficulty_weights[q.difficulty])
        
        return selected[:num_questions]
    
    def _score_by_relevance(
        self, 
        questions: List[QuestionModel], 
        context: Dict[str, Any]
    ) -> List[QuestionModel]:
        """Score questions by relevance to user context"""
        
        context_keywords = set()
        if 'skills' in context:
            context_keywords.update(str(context['skills']).lower().split())
        if 'experience' in context:
            context_keywords.update(str(context['experience']).lower().split())
        if 'job_title' in context:
            context_keywords.update(str(context['job_title']).lower().split())
        
        def relevance_score(question: QuestionModel) -> float:
            question_text = question.text.lower()
            question_tags = set(tag.lower() for tag in (question.tags or []))
            
            # Count keyword matches
            text_matches = sum(1 for kw in context_keywords if kw in question_text)
            tag_matches = len(context_keywords & question_tags)
            
            return text_matches + (tag_matches * 2)  # Tags weighted higher
        
        # Sort by relevance
        scored = sorted(questions, key=relevance_score, reverse=True)
        return scored
    
    def _ensure_category_diversity(
        self, 
        questions: List[QuestionModel], 
        num_questions: int
    ) -> List[QuestionModel]:
        """Ensure questions cover diverse categories"""
        
        if len(questions) <= num_questions:
            return questions
        
        # Group by category
        by_category = {}
        for q in questions:
            category = q.category
            if category not in by_category:
                by_category[category] = []
            by_category[category].append(q)
        
        # Round-robin selection from categories
        selected = []
        categories = list(by_category.keys())
        category_idx = 0
        
        while len(selected) < num_questions and by_category:
            category = categories[category_idx % len(categories)]
            
            if by_category[category]:
                selected.append(by_category[category].pop(0))
            else:
                # Remove empty category
                del by_category[category]
                categories.remove(category)
                continue
            
            category_idx += 1
        
        return selected
    
    def get_next_adaptive_question(
        self,
        session: InterviewSession,
        last_performance: Optional[float] = None
    ) -> Optional[QuestionModel]:
        """
        Adaptively select next question based on user's performance.
        Increases difficulty if user is doing well, decreases if struggling.
        """
        
        remaining = [q for q in session.questions if q.id not in 
                    [r.get('question_id') for r in session.responses]]
        
        if not remaining:
            return None
        
        # If no previous performance, return next question in order
        if last_performance is None:
            return remaining[0]
        
        # Adaptive difficulty adjustment
        current_avg_score = session.score
        
        if current_avg_score > 80:  # Doing well
            # Prefer harder questions
            harder = sorted(remaining, key=lambda q: self.difficulty_weights[q.difficulty], reverse=True)
            return harder[0]
        elif current_avg_score < 50:  # Struggling
            # Prefer easier questions
            easier = sorted(remaining, key=lambda q: self.difficulty_weights[q.difficulty])
            return easier[0]
        else:
            # Stay at current difficulty
            return remaining[0]


class IntelligentEvaluator:
    """
    Smart response evaluation engine that works WITHOUT external AI.
    Uses NLP techniques, keyword matching, and heuristics.
    """
    
    def __init__(self):
        pass
    
    def evaluate_response(
        self,
        question: QuestionModel,
        user_answer: str,
        use_external_ai: bool = False
    ) -> EvaluationResult:
        """
        Evaluate user's answer intelligently without external AI.
        """
        
        if not user_answer or not user_answer.strip():
            return EvaluationResult(
                question_id=question.id,
                user_answer=user_answer,
                score=0.0,
                feedback="No answer provided.",
                strengths=[],
                improvements=["Please provide an answer to the question."],
                suggested_resources=[],
                is_correct=False,
                confidence=1.0
            )
        
        # Extract key information
        answer_lower = user_answer.lower().strip()
        question_lower = question.text.lower()
        expected = question.expected_answer.lower() if question.expected_answer else ""
        
        # Scoring components
        score = 0.0
        strengths = []
        improvements = []
        confidence = 0.8
        
        # 1. Length analysis (not too short, not too long)
        word_count = len(answer_lower.split())
        if word_count < 10:
            improvements.append("Provide more detailed explanation")
            score -= 10
        elif 10 <= word_count <= 50:
            strengths.append("Good answer length")
            score += 20
        elif word_count > 100:
            improvements.append("Try to be more concise")
            score -= 5
        else:
            strengths.append("Well-detailed response")
            score += 15
        
        # 2. Keyword matching with expected answer
        if expected:
            expected_keywords = self._extract_keywords(expected)
            answer_keywords = self._extract_keywords(answer_lower)
            
            matches = len(expected_keywords & answer_keywords)
            match_ratio = matches / len(expected_keywords) if expected_keywords else 0
            
            keyword_score = match_ratio * 50
            score += keyword_score
            
            if match_ratio > 0.7:
                strengths.append("Covers key concepts effectively")
            elif match_ratio > 0.4:
                strengths.append("Addresses some important points")
                improvements.append("Include more key concepts from the topic")
            else:
                improvements.append("Missing several important concepts")
                confidence = 0.6
        
        # 3. Question relevance check
        question_keywords = self._extract_keywords(question_lower)
        answer_has_context = any(kw in answer_lower for kw in question_keywords)
        
        if answer_has_context:
            strengths.append("Answer is relevant to the question")
            score += 15
        else:
            improvements.append("Make sure to address the specific question asked")
            score -= 10
        
        # 4. Structure and clarity analysis
        has_examples = any(word in answer_lower for word in ['example', 'for instance', 'such as', 'like'])
        has_explanation = any(word in answer_lower for word in ['because', 'therefore', 'thus', 'hence', 'so'])
        
        if has_examples:
            strengths.append("Good use of examples")
            score += 10
        
        if has_explanation:
            strengths.append("Provides clear reasoning")
            score += 10
        
        # 5. Technical depth (for technical questions)
        if question.category.lower() in ['technical', 'programming', 'algorithm', 'system design']:
            technical_terms = self._detect_technical_terms(answer_lower)
            if len(technical_terms) >= 3:
                strengths.append("Demonstrates technical knowledge")
                score += 15
            elif len(technical_terms) >= 1:
                score += 5
            else:
                improvements.append("Include more technical details")
        
        # 6. Difficulty adjustment
        difficulty_multiplier = self.difficulty_weights.get(question.difficulty, 1.0)
        base_score = max(0, min(100, score))
        
        # Normalize score
        final_score = base_score
        
        # Determine if correct
        is_correct = final_score >= 60
        
        # Generate feedback
        feedback = self._generate_feedback(final_score, strengths, improvements)
        
        # Suggest resources based on performance
        resources = []
        if final_score < 60:
            resources = self._suggest_resources(question.category, question.tags)
        
        return EvaluationResult(
            question_id=question.id,
            user_answer=user_answer,
            score=final_score,
            feedback=feedback,
            strengths=strengths[:3],  # Top 3
            improvements=improvements[:3],  # Top 3
            suggested_resources=resources,
            is_correct=is_correct,
            confidence=confidence
        )
    
    def _extract_keywords(self, text: str) -> set:
        """Extract important keywords from text"""
        # Remove common stop words
        stop_words = {
            'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
            'of', 'with', 'by', 'from', 'as', 'is', 'was', 'are', 'were', 'be',
            'been', 'being', 'have', 'has', 'had', 'do', 'does', 'did', 'will',
            'would', 'should', 'could', 'may', 'might', 'can', 'this', 'that',
            'these', 'those', 'i', 'you', 'he', 'she', 'it', 'we', 'they'
        }
        
        # Extract words, filter stop words
        words = re.findall(r'\b\w+\b', text.lower())
        keywords = {w for w in words if w not in stop_words and len(w) > 2}
        
        return keywords
    
    def _detect_technical_terms(self, text: str) -> List[str]:
        """Detect technical terminology in answer"""
        technical_patterns = [
            r'\b[A-Z]{2,}\b',  # Acronyms
            r'\b\w+(?:tion|ment|ness|ity|ism)\b',  # Technical suffixes
            r'\b(?:algorithm|data|structure|pattern|architecture|design)\b',
            r'\b(?:function|method|class|interface|api)\b',
            r'\b(?:database|query|index|transaction)\b',
            r'\b(?:concurrent|asynchronous|parallel|distributed)\b'
        ]
        
        terms = []
        for pattern in technical_patterns:
            terms.extend(re.findall(pattern, text, re.IGNORECASE))
        
        return list(set(terms))
    
    def _generate_feedback(
        self, 
        score: float, 
        strengths: List[str], 
        improvements: List[str]
    ) -> str:
        """Generate natural feedback based on score"""
        
        if score >= 85:
            opening = "Excellent answer! "
        elif score >= 70:
            opening = "Good response! "
        elif score >= 60:
            opening = "Decent answer. "
        elif score >= 40:
            opening = "Your answer shows some understanding, but needs improvement. "
        else:
            opening = "Your answer needs significant improvement. "
        
        feedback = opening
        
        if strengths:
            feedback += "Strengths: " + ", ".join(strengths[:2]) + ". "
        
        if improvements:
            feedback += "Areas to work on: " + ", ".join(improvements[:2]) + "."
        
        return feedback
    
    def _suggest_resources(self, category: str, tags: Optional[List[str]]) -> List[str]:
        """Suggest learning resources based on category and tags"""
        
        resources = []
        
        # Generic suggestions based on category
        category_resources = {
            'programming': ['Practice on LeetCode', 'Read "Clean Code" by Robert Martin'],
            'system design': ['Read "Designing Data-Intensive Applications"', 'Practice on System Design Primer'],
            'algorithms': ['Study on GeeksforGeeks', 'Watch MIT OpenCourseWare lectures'],
            'database': ['Practice SQL on HackerRank', 'Read PostgreSQL documentation'],
        }
        
        for cat, res in category_resources.items():
            if cat in category.lower():
                resources.extend(res)
        
        return resources[:3]
    
    @property
    def difficulty_weights(self) -> Dict[DifficultyLevel, float]:
        return {
            DifficultyLevel.EASY: 1.0,
            DifficultyLevel.MEDIUM: 1.5,
            DifficultyLevel.HARD: 2.0,
            DifficultyLevel.EXPERT: 2.5
        }
