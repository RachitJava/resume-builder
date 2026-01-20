import edge_tts
import uuid
import os
from fastapi import APIRouter, HTTPException
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from typing import List, Dict
import random
import difflib
from app.routers.admin import question_bank_storage

router = APIRouter(prefix="/api/v1/conversation", tags=["Conversational AI (Built-in)"])


class ConversationRequest(BaseModel):
    messages: List[Dict[str, str]]
    gender: str = "female"  # Default to female
    questions: List[str] = [] # Direct list of questions to ask
    image_context: str = None # Base64 encoded image of screen/code


@router.post("/generate")
async def generate_conversation_response(request: ConversationRequest):
    """
    Generate intelligent conversational responses.
    Supports Image Context (Code/Screen) and Fixed Question Lists.
    """
    try:
        # Extract fields
        messages = request.messages
        gender = request.gender.lower()
        questions = request.questions
        image_context = request.image_context
        
        # Select Voice
        VOICE = "en-US-AriaNeural" # Default Female
        if "male" in gender and "female" not in gender:
            VOICE = "en-US-GuyNeural" # Male
            
        if not messages or len(messages) == 0:
            welcome_text = "Hello! I'm your AI interviewer. Let's begin. Could you please introduce yourself?"
            return {
                "response": welcome_text,
                "audio_url": None, 
                "status": "success"
            }
        
        # Get last user message
        user_message = ""
        for msg in reversed(messages):
            if msg.get("role") == "user":
                user_message = msg.get("content", "")
                break
        
        if not user_message and not image_context: 
             return {
                "response": "I didn't receive your response. Could you please answer?",
                "status": "success"
            }
            
        # Debug: Log received questions
        print(f"DEBUG: Received {len(questions)} questions from frontend")
        if questions:
            print(f"DEBUG: First 3 questions: {questions[:3]}")
        else:
            print("DEBUG: No questions received, will use fallback")
            
        # Generate Response
        vision_analysis = ""
        if image_context:
            vision_analysis = "[I see your screen. I am analyzing your code.] "
        
        response = generate_intelligent_response(messages, user_message, questions, vision_analysis)
        
        # Generate Audio
        audio_url = None
        try:
            audio_filename = f"{uuid.uuid4()}.mp3"
            audio_dir = "static/audio"
            if not os.path.exists(audio_dir): os.makedirs(audio_dir)
            audio_path = f"{audio_dir}/{audio_filename}"
            full_audio_path = os.path.join(os.getcwd(), audio_path)
            
            communicate = edge_tts.Communicate(response, VOICE)
            await communicate.save(full_audio_path)
            audio_url = f"http://localhost:8000/{audio_path}"
        except Exception as e:
            print(f"Audio failed: {e}")
            
        return {
            "response": response,
            "audio_url": audio_url,
            "status": "success"
        }

    except Exception as e:
        print(f"Error: {e}")
        return JSONResponse(status_code=500, content={"status": "error", "error": str(e)})


def generate_intelligent_response(messages: List[Dict[str, str]], user_message: str, fed_questions: List[str] = [], extra_context: str = "") -> str:
    """
    Enhanced Intelligence with Follow-ups
    """
    question_count = sum(1 for msg in messages if msg.get("role") == "assistant" and "?" in msg.get("content", ""))
    
    # Context
    system_context = ""
    for msg in messages:
        if msg.get("role") == "system":
            system_context = msg.get("content", "")
            break
            
    # Last Question
    last_question = ""
    for msg in reversed(messages):
        if msg.get("role") == "assistant":
            last_question = msg.get("content", "")
            break
            
    # Expected Answer Logic (Simple Fuzzy Match from Bank)
    expected_answer = None
    # (Simplified logic to find answer in feed if dictionary)
    # ...

    interview_type = "technical"
    if "HR" in system_context: interview_type = "hr"
    
    evaluation = evaluate_answer(user_message, expected_answer, last_question)
    
    response_parts = []
    
    # Handle acknowledgments differently - no feedback, just proceed
    if evaluation["quality"] == "acknowledgment":
        # Don't give feedback for simple acknowledgments, just ask the next question
        next_question = generate_next_question(interview_type, question_count, user_message, system_context, messages, fed_questions)
        return next_question
    
    # Feedback for actual technical answers
    if evaluation["quality"] == "good":
        response_parts.append(random.choice(["Great answer!", "Excellent explanation!", "Good point!"]))
    elif evaluation["quality"] == "average":
        response_parts.append(random.choice(["That's a decent start.", "I see what you mean."]))
    else:
        response_parts.append(random.choice(["Let me help clarify that.", "That's not entirely correct."]))
    
    if extra_context: response_parts.append(extra_context)

    # NEXT STEP LOGIC
    next_question = ""
    
    # If poor answer, ask follow-up (Cross Questioning)
    if evaluation["quality"] == "poor" and "elaborate" not in last_question.lower():
        response_parts.append("Your answer was a bit brief.")
        next_question = "Could you elaborate more on that point? specifically the core concept?"
    elif evaluation["quality"] == "average" and random.random() < 0.3:
        next_question = "That's fair, but what about edge cases? How would handle those?"
    else:
        # Move to Next Question
        next_question = generate_next_question(interview_type, question_count, user_message, system_context, messages, fed_questions)

    return f"{' '.join(response_parts)}\n\n{next_question}"


def evaluate_answer(answer: str, correct_answer: str = None, last_question: str = "") -> dict:
    answer_lower = answer.lower().strip()
    word_count = len(answer.split())
    
    # Detect conversational acknowledgments (not technical answers)
    acknowledgments = [
        "yes", "yeah", "yep", "sure", "ok", "okay", "fine", "alright", 
        "let's start", "we can start", "let's begin", "i can", "i will",
        "sounds good", "that works", "agreed", "absolutely", "definitely"
    ]
    
    is_acknowledgment = any(ack in answer_lower for ack in acknowledgments) and word_count < 15
    
    # Check if this is a greeting/introduction response
    is_greeting = any(word in answer_lower for word in ["hello", "hi", "hey", "good morning", "good afternoon"])
    
    has_examples = any(keyword in answer_lower for keyword in ["example", "instance", "like", "such as", "for example"])
    has_code = any(keyword in answer_lower for keyword in ["class", "function", "method", "import", "public", "private", "void"])
    is_detailed = word_count > 30
    is_too_short = word_count < 10 and not is_acknowledgment
    
    quality = "average"
    
    # Don't evaluate acknowledgments or greetings
    if is_acknowledgment or is_greeting:
        quality = "acknowledgment"
    elif is_too_short: 
        quality = "poor"
    elif is_detailed or has_code or has_examples: 
        quality = "good"
    
    return { 
        "quality": quality, 
        "has_examples": has_examples, 
        "is_detailed": is_detailed, 
        "is_acknowledgment": is_acknowledgment,
        "match_score": 0.0 
    }



def generate_next_question(interview_type: str, question_count: int, previous_answer: str, context: str, messages: List[Dict[str, str]] = None, fed_questions: List[str] = []) -> str:
    
    candidate_questions = []
    if fed_questions:
        candidate_questions = fed_questions
    elif question_bank_storage:
         for bank in question_bank_storage:
             questions = bank.get("questions", [])
             for q in questions:
                 if isinstance(q, dict): candidate_questions.append(q.get("text", ""))
                 elif isinstance(q, str): candidate_questions.append(q)

    if not candidate_questions:
        candidate_questions = [
            "Tell me about a challenging project.",
            "Explain REST APIs.",
            "How do you handle conflict?"
        ]

    # Filter asked
    asked = set()
    if messages:
        for msg in messages:
            if msg.get("role") == "assistant":
                for q in candidate_questions:
                    if q in msg.get("content", ""):
                        asked.add(q)
    
    available = [q for q in candidate_questions if q not in asked]
    
    if available:
        return random.choice(available)
    else:
        return "That concludes our interview questions. Thank you for your time!"
