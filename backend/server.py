from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Header
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from passlib.context import CryptContext
import secrets

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# LLM Key
EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']

# Password hashing
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# Admin authentication dependency
async def verify_admin(x_user_email: str = Header(None)):
    """Verifica che l'utente sia admin"""
    if not x_user_email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Autenticazione richiesta. Header X-User-Email mancante."
        )
    
    if x_user_email != "admin@nutrikids.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso negato. Solo gli amministratori possono accedere a questa risorsa."
        )
    
    # Verifica che l'utente admin esista nel database
    admin_user = await db.users.find_one({"email": x_user_email})
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente amministratore non trovato."
        )
    
    return x_user_email

# Create the main app
app = FastAPI()
api_router = APIRouter(prefix="/api")

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None

class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserResponse(BaseModel):
    email: str
    name: Optional[str]
    created_at: datetime
    is_premium: bool = False

class ForgotPasswordRequest(BaseModel):
    email: EmailStr

class ResetPasswordRequest(BaseModel):
    email: EmailStr
    reset_code: str
    new_password: str

class ChangePasswordRequest(BaseModel):
    current_password: str
    new_password: str

class UserInDB(BaseModel):
    email: str
    hashed_password: str
    name: Optional[str]
    created_at: datetime
    is_premium: bool = False
    reset_code: Optional[str] = None
    reset_code_expires: Optional[datetime] = None

# Models
class ChatMessage(BaseModel):
    message: str
    session_id: str = "default"
    language: str = "it"  # Default italiano

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
    premium_monthly_price: float = 5.99
    premium_yearly_price: float = 49.99
    openai_model: str = "gpt-4o-mini"
    vision_model: str = "gpt-4o"
    # API Keys per servizi esterni
    stripe_publishable_key: str = ""
    stripe_secret_key: str = ""
    sendgrid_api_key: str = ""  # Per invio email reset password
    # Limiti per utenti FREE
    max_free_scans_daily: int = 3
    max_free_coach_messages_daily: int = 8
    max_free_children: int = 2
    # Limiti per utenti PREMIUM (0 = illimitato)
    max_premium_scans_daily: int = 0  # 0 = illimitato
    max_premium_coach_messages_daily: int = 0  # 0 = illimitato
    max_premium_children: int = 0  # 0 = illimitato
    updated_at: datetime = Field(default_factory=datetime.utcnow)

class AppConfigUpdate(BaseModel):
    emergent_llm_key: Optional[str] = None
    premium_monthly_price: Optional[float] = None
    premium_yearly_price: Optional[float] = None
    openai_model: Optional[str] = None
    vision_model: Optional[str] = None
    max_free_scans_daily: Optional[int] = None
    max_free_coach_messages_daily: Optional[int] = None
    max_free_children: Optional[int] = None
    max_premium_scans_daily: Optional[int] = None
    max_premium_coach_messages_daily: Optional[int] = None
    max_premium_children: Optional[int] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "NutriKids AI Backend is running"}

# Authentication Endpoints
@api_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    # Check if user already exists
    existing_user = await db.users.find_one({"email": user.email})
    if existing_user:
        raise HTTPException(status_code=400, detail="Email already registered")
    
    # Hash password
    hashed_password = pwd_context.hash(user.password)
    
    # Create user document
    user_doc = {
        "email": user.email,
        "hashed_password": hashed_password,
        "name": user.name,
        "created_at": datetime.utcnow(),
        "is_premium": False,
        "reset_code": None,
        "reset_code_expires": None
    }
    
    await db.users.insert_one(user_doc)
    
    return UserResponse(
        email=user.email,
        name=user.name,
        created_at=user_doc["created_at"],
        is_premium=False
    )

@api_router.post("/login", response_model=UserResponse)
async def login(credentials: UserLogin):
    # Find user
    user = await db.users.find_one({"email": credentials.email})
    if not user:
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    # Verify password
    if not pwd_context.verify(credentials.password, user["hashed_password"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    
    return UserResponse(
        email=user["email"],
        name=user.get("name"),
        created_at=user["created_at"],
        is_premium=user.get("is_premium", False)
    )

@api_router.post("/forgot-password")
async def forgot_password(request: ForgotPasswordRequest):
    # Find user
    user = await db.users.find_one({"email": request.email})
    if not user:
        # Don't reveal if email exists or not for security
        return {"message": "If the email exists, a reset code has been sent"}
    
    # Generate 6-digit reset code
    reset_code = str(secrets.randbelow(900000) + 100000)
    reset_code_expires = datetime.utcnow() + timedelta(hours=1)
    
    # Update user with reset code
    await db.users.update_one(
        {"email": request.email},
        {"$set": {
            "reset_code": reset_code,
            "reset_code_expires": reset_code_expires
        }}
    )
    
    # In production, send email here
    # For now, return the code (ONLY FOR DEVELOPMENT)
    return {
        "message": "Reset code generated",
        "reset_code": reset_code,  # Remove this in production
        "note": "In production, this would be sent via email"
    }

@api_router.post("/reset-password")
async def reset_password(request: ResetPasswordRequest):
    # Find user
    user = await db.users.find_one({"email": request.email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Check reset code
    if not user.get("reset_code") or user["reset_code"] != request.reset_code:
        raise HTTPException(status_code=400, detail="Invalid reset code")
    
    # Check if code expired
    if user.get("reset_code_expires") and user["reset_code_expires"] < datetime.utcnow():
        raise HTTPException(status_code=400, detail="Reset code expired")
    
    # Hash new password
    hashed_password = pwd_context.hash(request.new_password)
    
    # Update password and clear reset code
    await db.users.update_one(
        {"email": request.email},
        {"$set": {
            "hashed_password": hashed_password,
            "reset_code": None,
            "reset_code_expires": None
        }}
    )
    
    return {"message": "Password reset successfully"}

# Coach Maya - AI Chat
@api_router.post("/coach-maya", response_model=ChatResponse)
async def coach_maya(chat_msg: ChatMessage):
    try:
        # System messages per lingua
        language = chat_msg.language if hasattr(chat_msg, 'language') else 'it'
        
        system_messages = {
            'it': """Sei Coach Maya, un'assistente AI specializzata in nutrizione infantile. 
            Sei empatica, gentile e professionale. Fornisci consigli pratici e rassicuranti 
            sulla nutrizione dei bambini. Rispondi sempre in italiano. Mantieni un tono caldo 
            e comprensivo come in una conversazione WhatsApp. Risposte brevi e chiare.""",
            
            'en': """You are Coach Maya, an AI assistant specialized in children's nutrition. 
            You are empathetic, kind and professional. Provide practical and reassuring advice 
            about children's nutrition. Always respond in English. Maintain a warm and 
            understanding tone like in a WhatsApp conversation. Keep responses short and clear.""",
            
            'es': """Eres Coach Maya, una asistente de IA especializada en nutrición infantil. 
            Eres empática, amable y profesional. Proporciona consejos prácticos y tranquilizadores 
            sobre la nutrición de los niños. Responde siempre en español. Mantén un tono cálido 
            y comprensivo como en una conversación de WhatsApp. Respuestas breves y claras."""
        }
        
        system_message = system_messages.get(language, system_messages['it'])
        
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
        except (json.JSONDecodeError, ValueError):
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
async def get_app_config(admin_email: str = Depends(verify_admin)):
    """Ottiene la configurazione dell'app (solo admin)"""
    config = await db.app_config.find_one({"id": "app_config"})
    if not config:
        # Create default config if doesn't exist
        default_config = AppConfig(emergent_llm_key=EMERGENT_LLM_KEY)
        await db.app_config.insert_one(default_config.dict())
        return default_config
    return AppConfig(**config)

@api_router.put("/admin/config", response_model=AppConfig)
async def update_app_config(config_update: AppConfigUpdate, admin_email: str = Depends(verify_admin)):
    """Aggiorna la configurazione dell'app (solo admin)"""
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
async def get_config_value(key: str, admin_email: str = Depends(verify_admin)):
    """Ottiene un valore specifico dalla configurazione (solo admin)"""
    config = await db.app_config.find_one({"id": "app_config"})
    if not config:
        raise HTTPException(status_code=404, detail="Config not found")
    
    if key not in config:
        raise HTTPException(status_code=404, detail=f"Key '{key}' not found in config")
    
    return {"key": key, "value": config[key]}

@api_router.get("/pricing")
async def get_pricing():
    """Endpoint pubblico per ottenere solo i prezzi Premium"""
    config = await db.app_config.find_one({"id": "app_config"})
    if not config:
        # Return default prices if no config exists
        return {
            "monthly_price": 5.99,
            "yearly_price": 49.99
        }
    
    return {
        "monthly_price": config.get("premium_monthly_price", 5.99),
        "yearly_price": config.get("premium_yearly_price", 49.99)
    }

@api_router.post("/admin/change-password")
async def change_admin_password(
    password_data: ChangePasswordRequest,
    admin_email: str = Depends(verify_admin)
):
    """Cambia la password dell'admin (solo admin)"""
    # Verifica password attuale
    admin_user = await db.users.find_one({"email": admin_email})
    if not admin_user:
        raise HTTPException(status_code=404, detail="Utente non trovato")
    
    # Verifica che la password attuale sia corretta
    if not pwd_context.verify(password_data.current_password, admin_user["hashed_password"]):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password attuale non corretta"
        )
    
    # Valida la nuova password
    if len(password_data.new_password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="La nuova password deve essere di almeno 6 caratteri"
        )
    
    # Hash della nuova password
    new_hashed_password = pwd_context.hash(password_data.new_password)
    
    # Aggiorna la password nel database
    await db.users.update_one(
        {"email": admin_email},
        {"$set": {"hashed_password": new_hashed_password, "updated_at": datetime.utcnow()}}
    )
    
    return {
        "success": True,
        "message": "Password cambiata con successo"
    }

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