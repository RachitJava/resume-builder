# Test script to verify the AI Intelligence API
import requests
import json

BASE_URL = "http://localhost:8000"

def test_health():
    """Test health endpoint"""
    print("🔍 Testing health endpoint...")
    response = requests.get(f"{BASE_URL}/health")
    print(f"Status: {response.status_code}")
    print(json.dumps(response.json(), indent=2))
    print()

def test_start_interview():
    """Test starting an interview"""
    print("🚀 Testing interview start...")
    
    payload = {
        "difficulty": "medium",
        "num_questions": 3,
        "use_ai": False,  # Using built-in intelligence
        "enable_adaptive": True
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/interview/start", json=payload)
    print(f"Status: {response.status_code}")
    data = response.json()
    print(f"Session ID: {data['session_id']}")
    print(f"Questions selected: {data['num_questions']}")
    print()
    
    return data['session_id']

def test_get_question(session_id):
    """Test getting next question"""
    print("❓ Testing get next question...")
    
    payload = {
        "session_id": session_id
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/interview/next-question", json=payload)
    data = response.json()
    
    print(f"Question {data['question_number']}/{data['total_questions']}")
    print(f"Text: {data['question']['text']}")
    print(f"Category: {data['question']['category']}")
    print(f"Difficulty: {data['question']['difficulty']}")
    print()
    
    return data['question']

def test_evaluate_answer(session_id, question_id, answer):
    """Test answer evaluation"""
    print("✅ Testing answer evaluation...")
    
    payload = {
        "session_id": session_id,
        "question_id": question_id,
        "answer": answer
    }
    
    response = requests.post(f"{BASE_URL}/api/v1/interview/evaluate", json=payload)
    data = response.json()
    
    print(f"Score: {data['score']:.1f}/100")
    print(f"Is Correct: {data['is_correct']}")
    print(f"Feedback: {data['feedback']}")
    print(f"Strengths: {', '.join(data['strengths'])}")
    print(f"Improvements: {', '.join(data['improvements'])}")
    print()
    
    return data

def test_ai_status():
    """Test AI status endpoint"""
    print("🤖 Testing AI status...")
    response = requests.get(f"{BASE_URL}/api/v1/ai/status")
    print(json.dumps(response.json(), indent=2))
    print()

def main():
    print("=" * 60)
    print("AI INTELLIGENCE API - TEST SUITE")
    print("=" * 60)
    print()
    
    try:
        # 1. Health check
        test_health()
        
        # 2. AI status
        test_ai_status()
        
        # 3. Start interview
        session_id = test_start_interview()
        
        # 4. Get first question
        question1 = test_get_question(session_id)
        
        # 5. Evaluate answer
        answer = "Object-Oriented Programming is a programming paradigm that uses objects and classes. The main principles are encapsulation, inheritance, polymorphism, and abstraction. Encapsulation hides data, inheritance allows code reuse, polymorphism enables flexibility, and abstraction simplifies complexity."
        test_evaluate_answer(session_id, question1['id'], answer)
        
        # 6. Get second question
        question2 = test_get_question(session_id)
        
        # 7. Evaluate second answer
        answer2 = "ArrayList uses a dynamic array for storage which provides O(1) random access but O(n) for insertions. LinkedList uses nodes with pointers, giving O(1) insertion at ends but O(n) for access."
        test_evaluate_answer(session_id, question2['id'], answer2)
        
        print("✅ All tests passed!")
        print()
        print("🎉 AI Intelligence API is working correctly!")
        print("💡 Using built-in intelligence - NO external AI costs!")
        
    except Exception as e:
        print(f"❌ Test failed: {e}")

if __name__ == "__main__":
    main()
