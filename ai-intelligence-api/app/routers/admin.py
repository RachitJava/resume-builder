from fastapi import APIRouter, HTTPException
from pydantic import BaseModel
from typing import List, Dict, Any, Optional
from datetime import datetime
import json

router = APIRouter(prefix="/api/v1/admin", tags=["Admin & Data Management"])


class SyncDataRequest(BaseModel):
    source: str
    use_case: Optional[str] = "general"
    timestamp: str
    totalBanks: Optional[int] = 0
    banks: List[Dict[str, Any]]
    category: Optional[str] = None


class DataSyncResponse(BaseModel):
    success: bool
    message: str
    processedBanks: int
    totalQuestions: int
    timestamp: str
    stats: Dict[str, Any]


# In-memory storage for now (you can connect to a database later)
question_bank_storage = []
system_statistics = {
    "total_syncs": 0,
    "total_question_banks": 0,
    "total_questions": 0,
    "last_sync": None,
    "categories": {}
}


@router.post("/sync-data", response_model=DataSyncResponse)
async def sync_data_from_database(request: SyncDataRequest):
    """
    Receive data from backend database and process it for Rachit Intelligence.
    This endpoint allows feeding question banks and other training data to the AI system.
    """
    try:
        processed_banks = 0
        total_questions = 0
        
        # Process each question bank
        for bank in request.banks:
            # Parse questions JSON if it's a string
            questions_data = bank.get("questions", "[]")
            if isinstance(questions_data, str):
                try:
                    questions_list = json.loads(questions_data)
                except:
                    questions_list = []
            else:
                questions_list = questions_data
            
            # Create processed bank entry
            processed_bank = {
                "id": bank.get("id"),
                "name": bank.get("name"),
                "category": bank.get("category"),
                "questions": questions_list,
                "question_count": len(questions_list),
                "synced_at": datetime.now().isoformat(),
                "source": request.source,
                "use_case": request.use_case  # Store use_case
            }
            
            # Store in memory (or save to database)
            question_bank_storage.append(processed_bank)
            processed_banks += 1
            total_questions += len(questions_list)
            
            # Update category statistics
            category = bank.get("category", "uncategorized")
            if category not in system_statistics["categories"]:
                system_statistics["categories"][category] = {
                    "banks": 0,
                    "questions": 0
                }
            system_statistics["categories"][category]["banks"] += 1
            system_statistics["categories"][category]["questions"] += len(questions_list)
        
        # Update global statistics
        system_statistics["total_syncs"] += 1
        system_statistics["total_question_banks"] = len(question_bank_storage)
        system_statistics["total_questions"] = total_questions
        system_statistics["last_sync"] = datetime.now().isoformat()
        
        # Prepare response
        stats = {
            "total_banks_in_system": len(question_bank_storage),
            "total_questions_in_system": system_statistics["total_questions"],
            "categories": list(system_statistics["categories"].keys()),
            "category_breakdown": system_statistics["categories"]
        }
        
        return DataSyncResponse(
            success=True,
            message=f"Successfully processed {processed_banks} question banks with {total_questions} questions",
            processedBanks=processed_banks,
            totalQuestions=total_questions,
            timestamp=datetime.now().isoformat(),
            stats=stats
        )
        
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Sync failed: {str(e)}")


class GenericDataRequest(BaseModel):
    source: str
    use_case: Optional[str] = "general"
    data_type: str  # "users", "templates", "resumes", "general"
    count: int
    data: List[Dict[str, Any]]
    timestamp: str


@router.post("/feed-data")
async def feed_custom_data(request: GenericDataRequest):
    """
    Generic endpoint to feed any table data into Rachit Intelligence.
    Supports Users, Templates, Resumes, and other structured data.
    """
    try:
        # Store in global stats for now
        if "custom_data" not in system_statistics:
            system_statistics["custom_data"] = {}
        
        if request.data_type not in system_statistics["custom_data"]:
            system_statistics["custom_data"][request.data_type] = {
                "count": 0,
                "latest_feed": None,
                "use_cases": []
            }
            
        # detailed processing could happen here (e.g. vector embedding)
        
        # Update stats
        system_statistics["custom_data"][request.data_type]["count"] += request.count
        system_statistics["custom_data"][request.data_type]["latest_feed"] = datetime.now().isoformat()
        if request.use_case and request.use_case not in system_statistics["custom_data"][request.data_type]["use_cases"]:
             system_statistics["custom_data"][request.data_type]["use_cases"].append(request.use_case)
        
        return {
            "success": True,
            "message": f"Successfully ingested {request.count} items of type '{request.data_type}'",
            "data_type": request.data_type,
            "items_processed": request.count,
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Feed failed: {str(e)}")


class RevokeDataRequest(BaseModel):
    use_case: str
    data_type: Optional[str] = None


@router.post("/revoke-data")
async def revoke_data(request: RevokeDataRequest):
    """
    Revoke/Delete training data associated with a specific use case.
    """
    global question_bank_storage, system_statistics
    
    try:
        revoked_count = 0
        
        # 1. Provide "Clear All" functionality if use_case is "all" or "manual" (optional)
        if request.use_case == "all":
             return await clear_all_data()

        # 2. Filter out question banks with matching use_case
        new_storage = [bank for bank in question_bank_storage if bank.get("use_case") != request.use_case]
        removed_items = len(question_bank_storage) - len(new_storage)
        question_bank_storage = new_storage
        
        revoked_count += removed_items

        # Recalculate stats
        total_q = sum(len(b["questions"]) for b in question_bank_storage)
        system_statistics["total_question_banks"] = len(question_bank_storage)
        system_statistics["total_questions"] = total_q
        
        # 3. Clean up custom data stats if needed
        # (This is simplistic as we don't store individual custom items yet, just counts)
        # We will just acknowledge the request for custom data types
        
        return {
            "success": True,
            "message": f"Revoked training data for Use Case: {request.use_case}",
            "items_removed": revoked_count,
            "remaining_banks": len(question_bank_storage),
            "timestamp": datetime.now().isoformat()
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Revoke failed: {str(e)}")


@router.get("/system-stats")
async def get_system_statistics():
    """
    Get comprehensive Rachit Intelligence system statistics
    """
    return {
        "rachit_intelligence": {
            "status": "active",
            "version": "1.0.0",
            "uptime": "100%"
        },
        "data_statistics": system_statistics,
        "storage": {
            "question_banks": len(question_bank_storage),
            "total_questions": sum(bank["question_count"] for bank in question_bank_storage),
            "storage_type": "in-memory"
        },
        "last_updated": datetime.now().isoformat()
    }


@router.get("/question-banks")
async def get_synced_question_banks():
    """
    Get all synced question banks
    """
    return {
        "total": len(question_bank_storage),
        "banks": question_bank_storage,
        "categories": list(system_statistics["categories"].keys())
    }


@router.get("/question-banks/{bank_id}")
async def get_question_bank_details(bank_id: str):
    """
    Get details of a specific question bank
    """
    for bank in question_bank_storage:
        if bank["id"] == bank_id:
            return bank
    
    raise HTTPException(status_code=404, detail="Question bank not found")


@router.get("/questions/by-category/{category}")
async def get_questions_by_category(category: str):
    """
    Get all questions from a specific category
    """
    questions = []
    banks = []
    
    for bank in question_bank_storage:
        if bank["category"] == category:
            banks.append(bank["name"])
            questions.extend(bank["questions"])
    
    return {
        "category": category,
        "total_banks": len(banks),
        "banks": banks,
        "total_questions": len(questions),
        "questions": questions
    }


@router.delete("/clear-data")
async def clear_all_data():
    """
    Clear all synced data (use with caution!)
    """
    global question_bank_storage, system_statistics
    
    question_bank_storage = []
    system_statistics = {
        "total_syncs": 0,
        "total_question_banks": 0,
        "total_questions": 0,
        "last_sync": None,
        "categories": {},
        "custom_data": {}
    }
    
    return {
        "success": True,
        "message": "All data cleared successfully",
        "timestamp": datetime.now().isoformat()
    }


@router.post("/train-from-feedback")
async def train_from_interview_feedback(feedback_data: Dict[str, Any]):
    """
    Future endpoint: Train Rachit Intelligence from interview feedback
    This will allow the system to learn from real interview data
    """
    # TODO: Implement learning algorithm
    return {
        "success": True,
        "message": "Training endpoint - Coming soon!",
        "note": "This will allow Rachit Intelligence to learn from interview feedback"
    }


@router.get("/health-check")
async def admin_health_check():
    """
    Admin health check with detailed system information
    """
    return {
        "system": "Rachit Intelligence™",
        "status": "operational",
        "version": "1.0.0",
        "data_loaded": len(question_bank_storage) > 0,
        "question_banks": len(question_bank_storage),
        "total_questions": sum(bank["question_count"] for bank in question_bank_storage),
        "last_sync": system_statistics.get("last_sync"),
        "categories_available": list(system_statistics.get("categories", {}).keys()),
        "timestamp": datetime.now().isoformat()
    }
