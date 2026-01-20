# 🧠 Rachit Intelligence Management Dashboard - User Guide

## Overview

The **Rachit Intelligence Dashboard** is your central control panel for managing and training your proprietary AI system. It allows you to feed data from your database tables directly into Rachit Intelligence, making it smarter and more capable.

---

## 🎯 Key Features

### 1. **Dashboard Overview**
   - Real-time system status
   - Quick statistics (question banks, total questions, cost savings)  
   - Performance metrics
   - Quick action buttons

### 2. **Question Bank Management**
   - View all question banks from your database
   - Browse questions by bank
   - Sync data to Rachit Intelligence
   - Category-based filtering

### 3. **AI Settings Control**
   - Toggle Rachit Intelligence (always on, FREE)
   - Enable/disable external AI boost (costs money)
   - Monitor token usage and costs
   - Configure API endpoints

### 4. **Analytics & Insights**
   - Usage statistics
   - Cost analysis  
   - Performance metrics
   - System health monitoring

---

## 🚀 How to Use

### Access the Dashboard

1. Navigate to admin section in your app
2. Import the dashboard component:
```jsx
import RachitIntelligenceDashboard from './components/RachitIntelligenceDashboard';

// In your admin route
<Route path="/admin/rachit-intelligence" element={<RachitIntelligenceDashboard />} />
```

### Sync Data from Database

#### ** Method 1: Using the Dashboard UI**

1. Click the **🔄 Sync Data** button in the header
2. System automatically fetches data from question_banks table
3. Sends data to Rachit Intelligence API
4. Shows success/error notification

#### **Method 2: Using the API Directly**

**Test Connection:**
```bash
curl http://localhost:8080/api/admin/rachit-intelligence/test-connection
```

**Sync All Question Banks:**
```bash
curl -X POST http://localhost:8080/api/admin/rachit-intelligence/sync/question-banks
```

**Sync by Category:**
```bash
curl -X POST http://localhost:8080/api/admin/rachit-intelligence/sync/category/Java
```

**Get Dashboard Stats:**
```bash
curl http://localhost:8080/api/admin/rachit-intelligence/dashboard/stats
```

---

## 📊 Database Tables

### Current Tables Feeding Rachit Intelligence:

#### 1. **question_banks**
   - **What It Contains**: Interview questions organized by category
   - **Fields Used**:
     - `id` - Unique identifier
     - `title` - Bank name
     - `category` - Question category (Java, React, etc.)
     - `questions` - JSON array of questions
     - `created_at` - Creation timestamp
   
   - **How It's Used**: 
     - Questions are parsed and stored in Rachit Intelligence
     - Used for intelligent question selection
     - Category-based organization
     - Adaptive difficulty matching

#### 2. **Future Tables** (Coming Soon)

You can add more tables to train Rachit Intelligence:

- **interview_history** - Historical interview data for learning
- **user_feedback** - Feedback to improve question quality
- **performance_metrics** - Interview performance data

---

## 🔄 Data Sync Flow

```
Database (PostgreSQL)
   ↓
Java Backend API
  `/api/admin/rachit-intelligence/sync/question-banks`
   ↓
HTTP POST Request
   ↓
Rachit Intelligence API (Python)
  `/api/v1/admin/sync-data`
   ↓
Data Processing & Storage
   ↓
✅ Ready for AI to use!
```

---

## 💾 What Happens When You Sync?

1. **Fetch**: Backend queries your database tables
2. **Transform**: Converts data to AI-friendly format
3. **Send**: HTTP POST to Rachit Intelligence API  
4. **Process**: AI system parses and indexes questions
5. **Store**: Data stored in AI system's memory/database
6. **Update**: System statistics updated
7. **Ready**: Questions available for intelligent selection

---

## 📋 API Endpoints Reference

### Backend (Java Spring Boot)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/rachit-intelligence/dashboard/stats` | GET | Get dashboard statistics |
| `/api/admin/rachit-intelligence/sync/question-banks` | POST | Sync all question banks |
| `/api/admin/rachit-intelligence/sync/category/{category}` | POST | Sync specific category |
| `/api/admin/rachit-intelligence/training/question-bank/{id}` | GET | Get bank details for training |
| `/api/admin/rachit-intelligence/database/tables` | GET | List available tables |
| `/api/admin/rachit-intelligence/test-connection` | GET | Test AI API connection |

### Intelligence API (Python FastAPI)

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/v1/admin/sync-data` | POST | Receive synced data |
| `/api/v1/admin/system-stats` | GET | Get system statistics |
| `/api/v1/admin/question-banks` | GET | List all synced banks |
| `/api/v1/admin/question-banks/{id}` | GET | Get specific bank |
| `/api/v1/admin/questions/by-category/{category}` | GET | Get questions by category |
| `/api/v1/admin/clear-data` | DELETE | Clear all synced data |
| `/api/v1/admin/health-check` | GET | Health check with data info |

---

## 🎨 Dashboard Tabs Explained

### 📊 Overview Tab
- **System Status**: Shows if Rachit Intelligence is active
- **Question Banks Count**: Total banks in system
- **Cost Savings**: Monthly cost (should be $0.00)
- **Performance**: Average response time
- **Quick Actions**: Shortcuts to common tasks

### 📚 Question Banks Tab
- **Banks List** (Left): All question banks from database
- **Questions Viewer** (Right): Questions from selected bank
- **Features**:
  - Click bank to view its questions
  - See question difficulty badges
  - View category tags
  - Quick edit/sync buttons

### ⚙️ Settings Tab
- **Rachit Intelligence**: Always active status
- **External AI Boost**: Toggle for paid AI (default: OFF)
- **Intelligence API URL**: Configure API endpoint
- **Usage Stats**: Token usage if external AI enabled

### 📈 Analytics Tab
- **Usage Charts**: Token usage over time
- **Cost Breakdown**: Rachit Intelligence ($0) vs External AI
- **Performance Metrics**: Response time, success rate, uptime

---

## 💡 Best Practices

### 1. **Regular Syncing**
   - Sync data weekly or when you add new question banks
   - Keeps AI system up-to-date with latest questions
   - Improves question selection quality

### 2. **Category Organization**
   - Organize questions by clear categories (Java, React, SQL, etc.)
   - Helps AI select relevant questions for interviews
   - Enables category-specific training

### 3. **Question Quality**
   - Ensure questions have proper difficulty levels
   - Include diverse question types
   - Add expected answers where possible

### 4. **Monitor Performance**
   - Check dashboard stats regularly
   - Watch for any sync errors
   - Verify question counts are correct

### 5. **Cost Management**
   - Keep external AI OFF unless needed
   - Monitor token usage if AI is enabled
   - Set budget limits in settings

---

## 🔧 Troubleshooting

### Sync Fails
**Problem**: "Failed to sync data"
**Solutions**:
1. Check if Rachit Intelligence API is running (port 8000)
2. Verify `RACHIT_INTELLIGENCE_API_URL` in backend config
3. Check network connectivity
4. View backend logs for detailed error

### Questions Not Appearing
**Problem**: Questions don't show after sync
**Solutions**:
1. Click "Refresh" button in dashboard
2. Check if questions JSON is properly formatted in database
3. Verify sync completed successfully
4. Check Rachit Intelligence logs

### Dashboard Not Loading
**Problem**: Dashboard shows loading forever
**Solutions**:
1. Check if backend API is running (port 8080)
2. Verify API endpoints are accessible
3. Check browser console for errors
4. Ensure CORS is configured correctly

---

## 📚 Example: Adding a New Question Bank

1. **In Your Database** (via admin panel or SQL):
```sql
INSERT INTO question_banks (id, title, category, questions, created_at)
VALUES (
  'uuid-here',
  'Advanced Java Concepts',
  'Java',
  '[
    {"question": "Explain JVM architecture", "difficulty": "hard"},
    {"question": "What is garbage collection?", "difficulty": "medium"}
  ]',
  NOW()
);
```

2. **Sync to Rachit Intelligence**:
   - Open dashboard → Click "🔄 Sync Data"
   - Or use API: `POST /api/admin/rachit-intelligence/sync/question-banks`

3. **Verify**:
   - Go to "Question Banks" tab
   - Find "Advanced Java Concepts"  
   - Click to view questions
   - Confirm 2 questions appear

4. **Use in Interview**:
   - Questions are now available for intelligent selection
   - Rachit Intelligence will use them based on category and difficulty

---

## 🌟 Future Enhancements

### Planned Features:
- **Machine Learning Integration**: Train from interview feedback
- **Question Recommendations**: AI suggests new questions based on trends
- **Performance Analytics**: Detailed user performance insights
- **Automatic Question Generation**: AI creates new questions
- **Multi-language Support**: Questions in different languages
- **Version Control**: Track question changes over time

---

## 🎯 Summary

**Rachit Intelligence Dashboard**  gives you complete control over your AI system:

✅ Feed data from database tables  
✅ Monitor system performance  
✅ Control costs (keep it FREE!)  
✅ Train and improve AI  
✅ Analyze interview quality  

**Your AI, Your Data, Your Control!** 🚀

---

Need help? Check the API documentation at `http://localhost:8000/docs` for detailed endpoint information.
