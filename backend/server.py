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

class DiaryEntry(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    meal_type: str  # colazione, pranzo, cena, snack
    description: str
    date: str
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class DiaryEntryCreate(BaseModel):
    user_email: str
    meal_type: str
    description: str
    date: str

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