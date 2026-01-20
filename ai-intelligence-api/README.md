# AI Intelligence API

A high-performance, cost-efficient AI microservice built with Python FastAPI. Designed to be independent and reusable across multiple projects.

## 🚀 Features

### Core Capabilities
- **Multi-Provider Support**: Groq (fast & cheap), Ollama (local/free), OpenAI, Anthropic
- **Smart Interview Engine**: Intelligent question selection and conversation management
- **Cost Optimization**: Response caching, token counting, and budget management
- **High Performance**: Async operations, sub-second response times
- **Easy Integration**: RESTful API, works with any language/framework

### Interview Intelligence
- Pull questions from your question bank
- Adaptive difficulty based on user responses
- Context-aware follow-up questions
- Real-time response evaluation
- Interview session management
- Performance scoring and analytics

## 🏗️ Architecture

```
┌─────────────────────────────────────────────┐
│  Client Applications (Java/React/Vue/etc)   │
└────────────────┬────────────────────────────┘
                 │ HTTP/REST
                 ▼
┌─────────────────────────────────────────────┐
│         FastAPI Application Layer           │
│  - Request validation                       │
│  - Rate limiting                            │
│  - Authentication (optional)                │
└────────────────┬────────────────────────────┘
                 │
                 ▼
┌─────────────────────────────────────────────┐
│        AI Provider Manager                  │
│  - Provider selection                       │
│  - Fallback handling                        │
│  - Response caching                         │
└────────────────┬────────────────────────────┘
                 │
        ┌────────┼────────┐
        ▼        ▼        ▼
    ┌─────┐  ┌──────┐  ┌────────┐
    │Groq │  │Ollama│  │OpenAI  │
    │ API │  │Local │  │  API   │
    └─────┘  └──────┘  └────────┘
```

## 📦 Installation

### Prerequisites
- Python 3.9+
- pip or poetry

### Quick Start

```bash
# Install dependencies
pip install -r requirements.txt

# Set environment variables
cp .env.example .env
# Edit .env with your configuration

# Run the server
uvicorn main:app --reload --host 0.0.0.0 --port 8000

# Or with auto-reload
python -m uvicorn main:app --reload
```

## 🔧 Configuration

Create a `.env` file:

```env
# API Settings
API_HOST=0.0.0.0
API_PORT=8000
DEBUG=true

# Default AI Provider (groq, ollama, openai)
DEFAULT_AI_PROVIDER=groq

# Groq Configuration (Fast & Cheap)
GROQ_API_KEY=your_groq_api_key
GROQ_MODEL=llama-3.3-70b-versatile

# Ollama Configuration (Local & Free)
OLLAMA_BASE_URL=http://localhost:11434
OLLAMA_MODEL=llama3.1:latest

# OpenAI Configuration (Premium)
OPENAI_API_KEY=your_openai_key
OPENAI_MODEL=gpt-4-turbo-preview

# Cost Management
MAX_TOKENS_PER_REQUEST=1000
ENABLE_CACHING=true
CACHE_TTL_SECONDS=3600
```

## 📚 API Endpoints

### Health Check
```bash
GET /health
```

### Interview Endpoints

#### Start Interview Session
```bash
POST /api/v1/interview/start
{
  "questionBankId": "uuid",
  "difficulty": "medium",
  "numQuestions": 10,
  "useAI": true
}
```

#### Get Next Question
```bash
POST /api/v1/interview/next-question
{
  "sessionId": "uuid",
  "previousAnswer": "User's answer to previous question"
}
```

#### Evaluate Response
```bash
POST /api/v1/interview/evaluate
{
  "sessionId": "uuid",
  "questionId": "uuid",
  "answer": "User's answer",
  "context": "Additional context"
}
```

#### Complete Interview
```bash
POST /api/v1/interview/complete
{
  "sessionId": "uuid"
}
```

### General AI Endpoints

#### Chat Completion
```bash
POST /api/v1/chat/completions
{
  "messages": [
    {"role": "user", "content": "Your question"}
  ],
  "provider": "groq",
  "stream": false
}
```

## 🔌 Integration Examples

### From Java Spring Boot
```java
RestTemplate restTemplate = new RestTemplate();
String url = "http://localhost:8000/api/v1/interview/start";

InterviewStartRequest request = new InterviewStartRequest();
request.setQuestionBankId(bankId);
request.setDifficulty("medium");
request.setUseAI(true);

InterviewSession response = restTemplate.postForObject(
    url, request, InterviewSession.class
);
```

### From React/JavaScript
```javascript
const response = await fetch('http://localhost:8000/api/v1/interview/start', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    questionBankId: 'uuid',
    difficulty: 'medium',
    useAI: true
  })
});
const session = await response.json();
```

### From Vue.js
```javascript
import axios from 'axios';

const startInterview = async (bankId) => {
  const { data } = await axios.post('/api/v1/interview/start', {
    questionBankId: bankId,
    difficulty: 'medium',
    useAI: true
  });
  return data;
};
```

## 🚄 Performance

- **Response Time**: < 500ms (with caching)
- **Concurrent Requests**: 1000+ RPS
- **Cost per Request**: ~$0.0001 with Groq, $0 with Ollama

## 🔐 Security

- API Key authentication (optional)
- Rate limiting per IP
- Input validation and sanitization
- CORS configuration
- Request size limits

## 📊 Cost Savings Features

1. **Response Caching**: Identical requests return cached responses
2. **Token Optimization**: Smart prompt engineering to minimize token usage
3. **Local Model Support**: Use Ollama for zero-cost inference
4. **Provider Fallback**: Automatically switch to cheaper providers
5. **Budget Limits**: Set daily/monthly token budgets

## 🧪 Testing

```bash
# Run tests
pytest

# Run with coverage
pytest --cov=app --cov-report=html
```

## 🐳 Docker Deployment

```bash
# Build image
docker build -t ai-intelligence-api .

# Run container
docker run -p 8000:8000 --env-file .env ai-intelligence-api
```

## 📈 Monitoring

Access metrics at `/metrics` (Prometheus format)
- Request count
- Response times
- Token usage
- Error rates
- Cache hit rates

## 🔄 Reusability

This API is designed to be project-agnostic. Use it for:
- Resume Builder interviews
- Educational quizzes
- Customer support chatbots
- Content generation
- Code review assistance
- Any AI-powered feature

## 📄 License

MIT License - Free to use in any project
