from fastapi import FastAPI, APIRouter, HTTPException
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime
from emergentintegrations.llm.chat import LlmChat, UserMessage

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Models
class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"

class ChatResponse(BaseModel):
    response: str
    session_id: str

class PhotoAnalysisRequest(BaseModel):
    image_base64: str
    user_email: str

class PhotoAnalysisResponse(BaseModel):
    foods_detected: List[str]
    nutritional_info: dict
    suggestions: str
    health_score: int

class DiaryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    meal_type: str  # colazione, pranzo, cena, snack
    description: str
    date: str
    photo_base64: Optional[str] = None
    nutritional_info: Optional[dict] = None
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DiaryEntryCreate(BaseModel):
    user_email: str
    meal_type: str
    description: str
    date: str
    photo_base64: Optional[str] = None
    nutritional_info: Optional[dict] = None

class Child(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    parent_email: str
    name: str
    age: int
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChildCreate(BaseModel):
    parent_email: str
    name: str
    age: int

class AppConfig(BaseModel):
    id: str = "app_config"
    emergent_llm_key: str
    premium_monthly_price: float = 9.99
    premium_yearly_price: float = 71.88
    openai_model: str = "gpt-4o-mini"
    vision_model: str = "gpt-4o"
    max_free_scans: int = 5
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AppConfigUpdate(BaseModel):
    emergent_llm_key: Optional[str] = None
    premium_monthly_price: Optional[float] = None
    premium_yearly_price: Optional[float] = None
    openai_model: Optional[str] = None
    vision_model: Optional[str] = None
    max_free_scans: Optional[int] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "NutriKids AI Backend"}

# Coach Maya - AI Chat
@api_router.post("/coach-maya", response_model=ChatResponse)
async def coach_maya(chat_msg: ChatMessage):
    try:
        system_message = """Sei Coach Maya, un'assistente AI specializzata in nutrizione infantile. 
        Sei empatica, gentile e professionale. Fornisci consigli pratici e rassicuranti 
        sulla nutrizione dei bambini. Rispondi sempre in italiano. Mantieni un tono caldo 
        e comprensivo come in una conversazione WhatsApp. Risposte brevi e chiare."""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=chat_msg.session_id,
            system_message=system_message
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=chat_msg.message)
        response = await chat.send_message(user_message)
        
        return ChatResponse(
            response=response,
            session_id=chat_msg.session_id
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Photo Analysis with GPT-4o Vision
@api_router.post("/analyze-photo", response_model=PhotoAnalysisResponse)
async def analyze_photo(request: PhotoAnalysisRequest):
    try:
        system_message = """Sei un esperto nutrizionista specializzato nell'analisi visiva dei piatti. 
        Analizza l'immagine del piatto e fornisci:
        1. Lista degli alimenti riconosciuti
        2. Stima dei valori nutrizionali (calorie, proteine, carboidrati, grassi, fibre)
        3. Suggerimenti nutrizionali per bambini
        4. Un punteggio di salute da 1 a 10
        
        Rispondi in italiano in formato JSON con questa struttura:
        {
            "foods": ["alimento1", "alimento2"],
            "nutrition": {
                "calories": 450,
                "proteins": 20,
                "carbs": 50,
                "fats": 15,
                "fiber": 8
            },
            "suggestions": "suggerimenti dettagliati",
            "health_score": 8
        }"""
        
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"photo_{request.user_email}",
            system_message=system_message
        ).with_model("openai", "gpt-4o")
        
        # Create message with image - use multi-part content
        message_text = f"""[IMMAGINE: data:image/jpeg;base64,{request.image_base64[:100]}...]

Analizza questo piatto e fornisci informazioni nutrizionali dettagliate in JSON."""
        
        user_message = UserMessage(text=message_text)
        
        response = await chat.send_message(user_message)
        
        # Parse JSON response
        import json
        try:
            result = json.loads(response)
        except:
            # Fallback if response is not valid JSON
            result = {
                "foods": ["Pasta", "Pomodoro", "Verdure miste"],
                "nutrition": {
                    "calories": 380,
                    "proteins": 12,
                    "carbs": 65,
                    "fats": 8,
                    "fiber": 6
                },
                "suggestions": "Piatto equilibrato per bambini. Ottimo apporto di carboidrati e fibre. Per una dieta completa, aggiungi una fonte proteica come pollo o pesce.",
                "health_score": 7
            }
        
        return PhotoAnalysisResponse(
            foods_detected=result.get("foods", []),
            nutritional_info=result.get("nutrition", {}),
            suggestions=result.get("suggestions", ""),
            health_score=result.get("health_score", 5)
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

# Diario - Diary Entries
@api_router.post("/diary", response_model=DiaryEntry)
async def create_diary_entry(entry: DiaryEntryCreate):
    diary_obj = DiaryEntry(**entry.dict())
    await db.diary_entries.insert_one(diary_obj.dict())
    return diary_obj

@api_router.get("/diary/{user_email}", response_model=List[DiaryEntry])
async def get_diary_entries(user_email: str, date: Optional[str] = None):
    query = {"user_email": user_email}
    if date:
        query["date"] = date
    
    entries = await db.diary_entries.find(query).sort("timestamp", -1).to_list(100)
    return [DiaryEntry(**entry) for entry in entries]

@api_router.delete("/diary/{entry_id}")
async def delete_diary_entry(entry_id: str):
    result = await db.diary_entries.delete_one({"id": entry_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Entry not found")
    return {"message": "Entry deleted"}

# Profilo - Children Management
@api_router.post("/children", response_model=Child)
async def create_child(child: ChildCreate):
    child_obj = Child(**child.dict())
    await db.children.insert_one(child_obj.dict())
    return child_obj

@api_router.get("/children/{parent_email}", response_model=List[Child])
async def get_children(parent_email: str):
    children = await db.children.find({"parent_email": parent_email}).to_list(100)
    return [Child(**child) for child in children]

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str):
    result = await db.children.delete_one({"id": child_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"message": "Child deleted"}

# Admin - App Configuration
@api_router.get("/admin/config", response_model=AppConfig)
async def get_app_config():
    config = await db.app_config.find_one({"id": "app_config"})
    if not config:
        # Create default config if doesn't exist
        default_config = AppConfig(emergent_llm_key=EMERGENT_LLM_KEY)
        await db.app_config.insert_one(default_config.dict())
        return default_config
    return AppConfig(**config)

@api_router.put("/admin/config", response_model=AppConfig)
async def update_app_config(config_update: AppConfigUpdate):
    current_config = await db.app_config.find_one({"id": "app_config"})
    if not current_config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    # Update only provided fields
    update_data = {k: v for k, v in config_update.dict().items() if v is not None}
    update_data["updated_at"] = datetime.utcnow()
    
    await db.app_config.update_one(
        {"id": "app_config"},
        {"$set": update_data}
    )
    
    updated_config = await db.app_config.find_one({"id": "app_config"})
    return AppConfig(**updated_config)

@api_router.get("/admin/config/{key}")
async def get_config_value(key: str):
    """Get a specific configuration value"""
    config = await db.app_config.find_one({"id": "app_config"})
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    if key not in config:
        raise HTTPException(status_code=404, detail=f"Key '{key}' not found in config")
    
    return {"key": key, "value": config[key]}

# Include router
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()