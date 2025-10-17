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
import jwt

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

# JWT Configuration
JWT_SECRET_KEY = os.environ.get("JWT_SECRET_KEY", secrets.token_urlsafe(32))
JWT_ALGORITHM = "HS256"
JWT_EXPIRATION_HOURS = 24

# JWT Helper Functions
def create_access_token(data: dict, expires_delta: timedelta = None):
    """Crea un JWT token"""
    to_encode = data.copy()
    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET_KEY, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def verify_token(token: str):
    """Verifica e decodifica un JWT token"""
    try:
        payload = jwt.decode(token, JWT_SECRET_KEY, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token scaduto. Effettua nuovamente il login."
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido."
        )

# HTTP Bearer security scheme
security = HTTPBearer()

# Admin authentication dependency (JWT-based)
async def verify_admin(credentials: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica che l'utente sia admin tramite JWT token"""
    token = credentials.credentials
    payload = verify_token(token)
    
    email = payload.get("sub")
    is_admin = payload.get("is_admin", False)
    
    if not email:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token non valido: email mancante."
        )
    
    if not is_admin or email != "admin@nutrikids.com":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Accesso negato. Solo gli amministratori possono accedere a questa risorsa."
        )
    
    # Verifica che l'utente admin esista nel database
    admin_user = await db.users.find_one({"email": email})
    if not admin_user:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Utente amministratore non trovato."
        )
    
    return email

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
    token: Optional[str] = None

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
    allergens_detected: List[str] = []  # Allergeni rilevati nel piatto
    allergen_warning: Optional[str] = None  # Messaggio di avviso allergie

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
    allergies: List[str] = []  # Lista allergie/intolleranze
    points: int = 0  # Punti gamification
    level: int = 1  # Livello calcolato dai punti
    badges: List[str] = []  # Badge guadagnati
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChildCreate(BaseModel):
    parent_email: str
    name: str
    age: int
    allergies: Optional[List[str]] = []

# Weekly Meal Plan Models
class MealPlanDay(BaseModel):
    breakfast: str = ""
    lunch: str = ""
    dinner: str = ""
    snack: str = ""

class WeeklyPlan(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    week_start_date: str  # Format: YYYY-MM-DD
    num_people: int = 2
    monday: MealPlanDay = Field(default_factory=MealPlanDay)
    tuesday: MealPlanDay = Field(default_factory=MealPlanDay)
    wednesday: MealPlanDay = Field(default_factory=MealPlanDay)
    thursday: MealPlanDay = Field(default_factory=MealPlanDay)
    friday: MealPlanDay = Field(default_factory=MealPlanDay)
    saturday: MealPlanDay = Field(default_factory=MealPlanDay)
    sunday: MealPlanDay = Field(default_factory=MealPlanDay)
    shopping_list: Optional[str] = None  # Generated by AI
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class WeeklyPlanCreate(BaseModel):
    user_email: str
    week_start_date: str
    num_people: int = 2
    monday: Optional[MealPlanDay] = None
    tuesday: Optional[MealPlanDay] = None
    wednesday: Optional[MealPlanDay] = None
    thursday: Optional[MealPlanDay] = None
    friday: Optional[MealPlanDay] = None
    saturday: Optional[MealPlanDay] = None
    sunday: Optional[MealPlanDay] = None

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
    stripe_publishable_key: Optional[str] = None
    stripe_secret_key: Optional[str] = None
    sendgrid_api_key: Optional[str] = None
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
    
    # Check if user is admin
    is_admin = user["email"] == "admin@nutrikids.com"
    
    # Create JWT token
    access_token = create_access_token(
        data={"sub": user["email"], "is_admin": is_admin}
    )
    
    return UserResponse(
        email=user["email"],
        name=user.get("name"),
        created_at=user["created_at"],
        is_premium=user.get("is_premium", False),
        token=access_token
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
        # Get children allergies
        children_cursor = db.children.find({"parent_email": request.user_email})
        children = await children_cursor.to_list(length=100)
        
        all_allergies = []
        for child in children:
            allergies = child.get("allergies", [])
            all_allergies.extend(allergies)
        
        # Remove duplicates
        all_allergies = list(set(all_allergies))
        
        allergies_info = ""
        if all_allergies:
            allergies_info = f"\n\nIMPORTANTE: I bambini hanno le seguenti allergie/intolleranze: {', '.join(all_allergies)}. Controlla se nel piatto ci sono questi allergeni e segnalalo nel campo 'allergens'."
        
        system_message = f"""Sei un esperto nutrizionista specializzato nell'analisi visiva dei piatti. 
        Analizza l'immagine del piatto e fornisci:
        1. Lista degli alimenti riconosciuti
        2. Stima dei valori nutrizionali (calorie, proteine, carboidrati, grassi, fibre)
        3. Suggerimenti nutrizionali per bambini
        4. Un punteggio di salute da 1 a 10
        5. Lista di eventuali allergeni comuni presenti (lattosio, glutine, uova, frutta secca, pesce, crostacei, soia, ecc.)
        {allergies_info}
        
        Rispondi in italiano in formato JSON con questa struttura:
        {{
            "foods": ["alimento1", "alimento2"],
            "nutrition": {{
                "calories": 450,
                "proteins": 20,
                "carbs": 50,
                "fats": 15,
                "fiber": 8
            }},
            "suggestions": "suggerimenti dettagliati",
            "health_score": 8,
            "allergens": ["lattosio", "glutine"]
        }}"""
        
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
        
        # Check allergens
        detected_allergens = result.get("allergens", [])
        allergen_warning = None
        
        if all_allergies and detected_allergens:
            # Check if any detected allergen matches user allergies
            dangerous_allergens = [a for a in detected_allergens if a.lower() in [al.lower() for al in all_allergies]]
            if dangerous_allergens:
                allergen_warning = f"⚠️ ATTENZIONE! Questo piatto contiene: {', '.join(dangerous_allergens)}. Allergia segnalata nel profilo del bambino!"
        
        return PhotoAnalysisResponse(
            foods_detected=result.get("foods", []),
            nutritional_info=result.get("nutrition", {}),
            suggestions=result.get("suggestions", ""),
            health_score=result.get("health_score", 5),
            allergens_detected=detected_allergens,
            allergen_warning=allergen_warning
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

@api_router.put("/children/{child_id}", response_model=Child)
async def update_child(child_id: str, child_update: ChildCreate):
    """Aggiorna un profilo bambino"""
    existing = await db.children.find_one({"id": child_id})
    if not existing:
        raise HTTPException(status_code=404, detail="Child not found")
    
    # Update fields
    update_data = {
        "name": child_update.name,
        "age": child_update.age,
        "allergies": child_update.allergies or []
    }
    
    await db.children.update_one(
        {"id": child_id},
        {"$set": update_data}
    )
    
    updated = await db.children.find_one({"id": child_id})
    return Child(**updated)

@api_router.delete("/children/{child_id}")
async def delete_child(child_id: str):
    result = await db.children.delete_one({"id": child_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Child not found")
    return {"message": "Child deleted"}

# Gamification - Award Points
@api_router.post("/children/{child_id}/award-points")
async def award_points(child_id: str, points_to_add: int):
    """Assegna punti a un bambino e calcola il nuovo livello"""
    child = await db.children.find_one({"id": child_id})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    current_points = child.get("points", 0)
    new_points = current_points + points_to_add
    
    # Calculate level: 1 level = 100 points
    new_level = max(1, (new_points // 100) + 1)
    
    # Check for new badges
    current_badges = child.get("badges", [])
    new_badges = current_badges.copy()
    
    # Badge: First 100 points
    if new_points >= 100 and "first_century" not in new_badges:
        new_badges.append("first_century")
    
    # Badge: Level 5
    if new_level >= 5 and "level_5" not in new_badges:
        new_badges.append("level_5")
    
    # Badge: Level 10
    if new_level >= 10 and "level_10" not in new_badges:
        new_badges.append("level_10")
    
    await db.children.update_one(
        {"id": child_id},
        {"$set": {
            "points": new_points,
            "level": new_level,
            "badges": new_badges
        }}
    )
    
    return {
        "child_id": child_id,
        "points": new_points,
        "level": new_level,
        "level_up": new_level > child.get("level", 1),
        "new_badges": [b for b in new_badges if b not in current_badges]
    }

# Weekly Meal Plans
@api_router.post("/meal-plan", response_model=WeeklyPlan)
async def create_meal_plan(plan: WeeklyPlanCreate):
    """Crea o aggiorna un piano settimanale"""
    # Check if plan already exists for this week
    existing = await db.meal_plans.find_one({
        "user_email": plan.user_email,
        "week_start_date": plan.week_start_date
    })
    
    if existing:
        # Update existing plan
        update_data = plan.dict(exclude_unset=True)
        await db.meal_plans.update_one(
            {"_id": existing["_id"]},
            {"$set": update_data}
        )
        updated = await db.meal_plans.find_one({"_id": existing["_id"]})
        return WeeklyPlan(**updated)
    else:
        # Create new plan
        plan_obj = WeeklyPlan(**plan.dict())
        await db.meal_plans.insert_one(plan_obj.dict())
        return plan_obj

@api_router.get("/meal-plan/{user_email}/{week_start_date}", response_model=WeeklyPlan)
async def get_meal_plan(user_email: str, week_start_date: str):
    """Ottiene il piano per una settimana specifica"""
    plan = await db.meal_plans.find_one({
        "user_email": user_email,
        "week_start_date": week_start_date
    })
    
    if not plan:
        # Return empty plan
        return WeeklyPlan(
            user_email=user_email,
            week_start_date=week_start_date,
            num_people=2
        )
    
    return WeeklyPlan(**plan)

# Dashboard Statistics
@api_router.get("/dashboard/stats/{user_email}")
async def get_dashboard_stats(user_email: str):
    """Ottiene statistiche per la dashboard"""
    try:
        # Data di riferimento: ultimi 7 giorni
        seven_days_ago = datetime.utcnow() - timedelta(days=7)
        
        # 1. Conta pasti nel diario (ultimi 7 giorni)
        diary_entries = await db.diary.count_documents({
            "user_email": user_email,
            "timestamp": {"$gte": seven_days_ago}
        })
        
        # 2. Ottieni punteggi salute medi
        diary_cursor = db.diary.find({
            "user_email": user_email,
            "timestamp": {"$gte": seven_days_ago}
        })
        diary_list = await diary_cursor.to_list(length=100)
        
        health_scores = [entry.get("health_score", 0) for entry in diary_list if entry.get("health_score")]
        avg_health_score = sum(health_scores) / len(health_scores) if health_scores else 0
        
        # 3. Conta messaggi Coach Maya (ultimi 7 giorni)
        # Assumiamo che ogni messaggio salvato sia una richiesta
        coach_messages = await db.coach_messages.count_documents({
            "user_email": user_email,
            "timestamp": {"$gte": seven_days_ago}
        })
        
        # 4. Pasti per giorno (ultimi 7 giorni)
        daily_meals = {}
        for entry in diary_list:
            date = entry.get("timestamp", datetime.utcnow()).strftime("%Y-%m-%d")
            daily_meals[date] = daily_meals.get(date, 0) + 1
        
        # 5. Distribuzione per tipo pasto
        meal_types = {}
        for entry in diary_list:
            meal_type = entry.get("meal_type", "Altro")
            meal_types[meal_type] = meal_types.get(meal_type, 0) + 1
        
        # 6. Ottieni numero bambini
        children_count = await db.children.count_documents({"parent_email": user_email})
        
        return {
            "total_meals_7days": diary_entries,
            "total_scans_7days": diary_entries,  # Assumiamo 1 scan = 1 entry
            "coach_messages_7days": coach_messages,
            "avg_health_score": round(avg_health_score, 1),
            "daily_meals": daily_meals,
            "meal_types": meal_types,
            "children_count": children_count,
            "period": "7 days"
        }
    except Exception as e:
        logging.error(f"Error getting dashboard stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore nel recupero statistiche: {str(e)}")

@api_router.post("/meal-plan/generate-shopping-list")
async def generate_shopping_list(user_email: str, week_start_date: str):
    """Genera la lista della spesa usando AI basata sui profili bambini"""
    # Get the meal plan
    plan = await db.meal_plans.find_one({
        "user_email": user_email,
        "week_start_date": week_start_date
    })
    
    if not plan:
        raise HTTPException(status_code=404, detail="Piano non trovato")
    
    # Get children profiles for this user
    children_cursor = db.children.find({"parent_email": user_email})
    children = await children_cursor.to_list(length=100)
    
    if not children:
        raise HTTPException(status_code=400, detail="Nessun profilo bambino trovato. Crea prima un profilo bambino nella sezione Profilo.")
    
    # Build children info string with allergies
    children_info = []
    all_allergies = []
    
    for child in children:
        name = child.get('name', 'Bambino')
        age = child.get('age', 0)
        allergies = child.get('allergies', [])
        
        # Collect all allergies
        all_allergies.extend(allergies)
        
        # Determine age category
        if age < 1:
            age_cat = "lattante (6-12 mesi)"
        elif age <= 3:
            age_cat = "prima infanzia (1-3 anni)"
        elif age <= 6:
            age_cat = "età prescolare (3-6 anni)"
        else:
            age_cat = "età scolare (6-10 anni)"
        
        allergy_text = f" - ALLERGIE: {', '.join(allergies)}" if allergies else ""
        children_info.append(f"{name}, {age} anni ({age_cat}){allergy_text}")
    
    children_description = "\n".join([f"- {info}" for info in children_info])
    num_children = len(children)
    
    # Remove duplicates from allergies
    all_allergies = list(set(all_allergies))
    
    # Collect all meals
    all_meals = []
    days = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday']
    for day in days:
        day_meals = plan.get(day, {})
        for meal_type in ['breakfast', 'lunch', 'dinner', 'snack']:
            meal = day_meals.get(meal_type, '')
            if meal:
                all_meals.append(f"{meal_type.capitalize()}: {meal}")
    
    if not all_meals:
        raise HTTPException(status_code=400, detail="Nessun piatto inserito nel piano")
    
    # Generate shopping list with AI with detailed allergy breakdown
    allergen_instructions = ""
    if all_allergies:
        # Build detailed allergy map per child
        allergy_details = []
        for child in children:
            name = child.get('name', 'Bambino')
            allergies = child.get('allergies', [])
            if allergies:
                allergy_details.append(f"  - {name}: {', '.join(allergies)}")
        
        allergy_breakdown = "\n".join(allergy_details) if allergy_details else "  - Nessuna allergia"
        
        allergen_instructions = f"""
🚨 ALLERGIE PER BAMBINO (IMPORTANTE - LEGGI ATTENTAMENTE):
{allergy_breakdown}

ISTRUZIONI CRITICHE:
1. **CALCOLA QUANTITÀ SEPARATE** per bambini con/senza allergie:
   Esempio: Se 1 bambino su 3 ha allergia al lattosio:
   - Latte vaccino: quantità per 2 bambini (quelli SENZA allergia)
   - Latte vegetale: quantità per 1 bambino (quello CON allergia)
   
2. **SOSTITUISCI SOLO LE ALLERGIE PRESENTI** (non inventare sostituzioni):
   - Solo se c'è "Lattosio" → aggiungi latte vegetale per quel bambino
   - Solo se c'è "Glutine" → aggiungi pasta senza glutine per quel bambino
   - Solo se c'è "Uova" → aggiungi sostituto per quel bambino

3. **INDICA CHIARAMENTE**:
   "⚠️ Per [nome bambino] con allergia a [allergene]"

4. **NON sostituire** ingredienti per allergie non presenti nell'elenco sopra
"""
    
    prompt = f"""Sei un nutrizionista pediatrico specializzato in alimentazione infantile E gestione allergie. Analizza i seguenti pasti della settimana e genera una lista della spesa SICURA per questi bambini.

PROFILI BAMBINI (personalizza le porzioni in base all'età):
{children_description}

TOTALE BAMBINI: {num_children}
{allergen_instructions}

Pasti della settimana:
{chr(10).join(all_meals)}

ISTRUZIONI IMPORTANTI:
1. Calcola le quantità PERSONALIZZATE in base all'età specifica di ogni bambino
2. Usa le seguenti linee guida per età:
   - Lattanti (6-12 mesi): porzioni molto piccole, cibi morbidi
   - Prima infanzia (1-3 anni): 30-50g pasta/riso, 30-40g proteine
   - Età prescolare (3-6 anni): 50-70g pasta/riso, 40-60g proteine
   - Età scolare (6-10 anni): 70-90g pasta/riso, 60-80g proteine
3. Se ci sono bambini di età diverse, somma le quantità appropriate per ciascuno
4. Considera sicurezza alimentare per ogni fascia d'età
5. Organizza per categorie (Frutta e Verdura, Proteine, Carboidrati, Latticini, ecc.)

Formato richiesto:
**Categoria**
- Ingrediente: quantità totale ⚠️ [Se sostituito, indica: "Sostituito per allergia a X"]
"""
    
    try:
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"shopping_{user_email}_{week_start_date}",
            system_message="Sei un nutrizionista pediatrico esperto in alimentazione infantile (6 mesi - 10 anni). Crei liste della spesa con porzioni appropriate per bambini, considerando sicurezza alimentare e sviluppo."
        ).with_model("openai", "gpt-4o-mini")
        
        user_message = UserMessage(text=prompt)
        response = await chat.send_message(user_message)
        shopping_list = response
        
        # Update plan with shopping list
        await db.meal_plans.update_one(
            {"user_email": user_email, "week_start_date": week_start_date},
            {"$set": {"shopping_list": shopping_list}}
        )
        
        return {"shopping_list": shopping_list}
        
    except Exception as e:
        logging.error(f"Error generating shopping list: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Errore nella generazione: {str(e)}")

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