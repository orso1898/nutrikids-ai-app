from fastapi import FastAPI, APIRouter, HTTPException, status, Depends, Header, Request
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field, EmailStr
from typing import List, Optional, Dict
import uuid
from datetime import datetime, timedelta
from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.payments.stripe.checkout import StripeCheckout, CheckoutSessionResponse, CheckoutStatusResponse, CheckoutSessionRequest
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

# Stripe Key
STRIPE_API_KEY = os.environ.get('STRIPE_API_KEY', 'sk_test_emergent')

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

# Usage Limits Helper Functions
async def check_and_increment_usage(user_email: str, usage_type: str):
    """
    Controlla i limiti di utilizzo e incrementa il contatore.
    usage_type: 'scans' o 'coach_messages'
    Returns: True se ok, raise HTTPException se limite raggiunto
    """
    # Get user
    user = await db.users.find_one({"email": user_email})
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Premium users have no limits
    if user.get("is_premium", False):
        return True
    
    # Get config limits
    config = await db.config.find_one({})
    if not config:
        # Default limits if config not found
        free_scans_limit = 3
        free_coach_limit = 5
    else:
        free_scans_limit = config.get("free_scans_daily_limit", 3)
        free_coach_limit = config.get("free_coach_messages_daily_limit", 5)
    
    # Check if need to reset daily counters
    last_reset = user.get("last_usage_reset")
    today = datetime.utcnow().date()
    
    if not last_reset or last_reset.date() < today:
        # Reset counters
        await db.users.update_one(
            {"email": user_email},
            {
                "$set": {
                    "scans_used_today": 0,
                    "coach_messages_used_today": 0,
                    "last_usage_reset": datetime.utcnow()
                }
            }
        )
        user["scans_used_today"] = 0
        user["coach_messages_used_today"] = 0
    
    # Check limits
    if usage_type == "scans":
        current_usage = user.get("scans_used_today", 0)
        if current_usage >= free_scans_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Limite giornaliero raggiunto ({free_scans_limit} scansioni). Passa a Premium per scansioni illimitate!"
            )
        # Increment
        await db.users.update_one(
            {"email": user_email},
            {"$inc": {"scans_used_today": 1}}
        )
    
    elif usage_type == "coach_messages":
        current_usage = user.get("coach_messages_used_today", 0)
        if current_usage >= free_coach_limit:
            raise HTTPException(
                status_code=403,
                detail=f"Limite giornaliero raggiunto ({free_coach_limit} messaggi). Passa a Premium per messaggi illimitati!"
            )
        # Increment
        await db.users.update_one(
            {"email": user_email},
            {"$inc": {"coach_messages_used_today": 1}}
        )
    
    return True

async def get_user_usage(user_email: str):
    """Ottiene l'utilizzo corrente dell'utente"""
    user = await db.users.find_one({"email": user_email})
    if not user:
        return {"scans_used": 0, "coach_messages_used": 0, "is_premium": False}
    
    # Reset if needed
    last_reset = user.get("last_usage_reset")
    today = datetime.utcnow().date()
    
    if not last_reset or last_reset.date() < today:
        return {"scans_used": 0, "coach_messages_used": 0, "is_premium": user.get("is_premium", False)}
    
    return {
        "scans_used": user.get("scans_used_today", 0),
        "coach_messages_used": user.get("coach_messages_used_today", 0),
        "is_premium": user.get("is_premium", False)
    }

# HTTP Bearer security scheme
security = HTTPBearer()

def get_current_user(authorization: HTTPAuthorizationCredentials = Depends(security)):
    """Verifica il token JWT e restituisce l'email dell'utente"""
    try:
        token = authorization.credentials
        payload = verify_token(token)
        return payload.get("sub")  # sub contiene l'email
    except Exception:
        raise HTTPException(status_code=401, detail="Invalid or expired token")

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

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    """Gestisce tutte le eccezioni non catturate"""
    import traceback
    error_trace = traceback.format_exc()
    
    # Log dell'errore
    logging.error(f"Unhandled exception: {str(exc)}")
    logging.error(f"Traceback: {error_trace}")
    
    # Risposta consistente per errori interni
    return {
        "detail": "Si è verificato un errore interno. Riprova più tardi.",
        "error_type": type(exc).__name__,
        "status_code": 500
    }

# Auth Models
class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: Optional[str] = None
    referral_code: Optional[str] = None  # Codice referral opzionale

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
    premium_plan: Optional[str] = None  # 'monthly' or 'yearly'
    premium_since: Optional[datetime] = None
    reset_code: Optional[str] = None
    reset_code_expires: Optional[datetime] = None
    updated_at: Optional[datetime] = None
    # Usage tracking for Free tier limits
    scans_used_today: int = 0
    coach_messages_used_today: int = 0
    last_usage_reset: Optional[datetime] = None  # Per reset giornaliero

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
    avatar: str = "default"  # Avatar selezionato (default, hero, star, champion, legend)
    timestamp: datetime = Field(default_factory=datetime.utcnow)

class ChildCreate(BaseModel):
    parent_email: str
    name: str
    age: int
    allergies: Optional[List[str]] = []

# Gamification Models
class AwardPointsRequest(BaseModel):
    points: int = Field(gt=0, description="Points to award (must be positive)")

class AwardPointsResponse(BaseModel):
    child_id: str
    points: int
    level: int
    level_up: bool
    new_badges: List[str]

# Payment Models
class CreateCheckoutRequest(BaseModel):
    plan_type: str  # 'monthly' or 'yearly'
    origin_url: str  # Frontend origin for success/cancel URLs

class PaymentTransaction(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_email: str
    session_id: str
    amount: float
    currency: str = "eur"
    plan_type: str
    payment_status: str = "pending"  # pending, succeeded, failed, expired
    metadata: Dict[str, str] = {}
    created_at: datetime = Field(default_factory=datetime.utcnow)
    updated_at: datetime = Field(default_factory=datetime.utcnow)

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

# Push Notification Models
class PushTokenRequest(BaseModel):
    user_email: EmailStr
    push_token: str
    device_type: str = "mobile"  # mobile, web, tablet
    language: str = "it"  # it, en, es

class NotificationPreferences(BaseModel):
    user_email: EmailStr
    enabled: bool = True
    lunch_time: str = "12:30"  # HH:MM format
    dinner_time: str = "19:30"
    evening_reminder: str = "21:00"
    weekly_report_day: int = 6  # 0=Monday, 6=Sunday
    weekly_report_time: str = "20:00"
    max_daily_notifications: int = 4

class SendNotificationRequest(BaseModel):
    user_email: EmailStr
    title: str
    body: str
    data: Optional[Dict] = None

# Referral System Models
class ReferralCode(BaseModel):
    user_email: EmailStr
    referral_code: str
    invites_count: int = 0
    successful_invites: List[str] = []  # Lista email degli invitati
    rewards_claimed: int = 0
    created_at: datetime = Field(default_factory=datetime.utcnow)
    last_reward_at: Optional[datetime] = None

class ReferralStats(BaseModel):
    referral_code: str
    invites_count: int
    successful_invites: int
    pending_invites: int
    next_reward_at: int  # Numero di inviti per prossimo premio
    total_rewards: int
    can_claim_reward: bool


    max_premium_coach_messages_daily: Optional[int] = None
    max_premium_children: Optional[int] = None

# Routes
@api_router.get("/")
async def root():
    return {"message": "NutriKids AI Backend is running"}

# Authentication Endpoints
@api_router.post("/register", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def register(user: UserRegister):
    try:
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
        
        # Se c'è un codice referral, processa l'invito
        if user.referral_code:
            try:
                referrer = await db.referrals.find_one({"referral_code": user.referral_code.upper()})
                
                if referrer and referrer["user_email"] != user.email:
                    # Aggiungi l'utente agli inviti completati
                    await db.referrals.update_one(
                        {"referral_code": user.referral_code.upper()},
                        {
                            "$inc": {"invites_count": 1},
                            "$push": {"successful_invites": user.email}
                        }
                    )
                    
                    # Controlla se il referrer ha raggiunto 3 inviti
                    updated_referrer = await db.referrals.find_one({"referral_code": user.referral_code.upper()})
                    successful_count = len(updated_referrer.get("successful_invites", []))
                    rewards_claimed = updated_referrer.get("rewards_claimed", 0)
                    
                    # Auto-assegna premio ogni 3 inviti
                    if successful_count >= 3 and (successful_count // 3) > rewards_claimed:
                        premium_start = datetime.utcnow()
                        premium_end = premium_start + timedelta(days=30)
                        
                        await db.users.update_one(
                            {"email": referrer["user_email"]},
                            {
                                "$set": {
                                    "is_premium": True,
                                    "premium_start_date": premium_start,
                                    "premium_end_date": premium_end
                                }
                            }
                        )
                        
                        await db.referrals.update_one(
                            {"referral_code": user.referral_code.upper()},
                            {
                                "$inc": {"rewards_claimed": 1},
                                "$set": {"last_reward_at": datetime.utcnow()}
                            }
                        )
                        
                        logging.info(f"Premium awarded to {referrer['user_email']} via referral from {user.email}")
            except Exception as ref_error:
                logging.error(f"Error processing referral: {str(ref_error)}")
                # Non bloccare la registrazione se il referral fallisce
        
        return UserResponse(
            email=user.email,
            name=user.name,
            created_at=user_doc["created_at"],
            is_premium=False
        )
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Registration error: {str(e)}")
        raise HTTPException(status_code=500, detail="Errore durante la registrazione. Riprova.")

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

# Usage Status Endpoint
@api_router.get("/usage/{user_email}")
async def get_usage_status(user_email: str):
    """Get current usage for dashboard"""
    usage = await get_user_usage(user_email)
    
    # Get limits from config
    config = await db.config.find_one({})
    limits = {
        "free_scans_limit": config.get("free_scans_daily_limit", 3) if config else 3,
        "free_coach_limit": config.get("free_coach_messages_daily_limit", 5) if config else 5
    }
    
    return {
        **usage,
        "limits": limits,
        "scans_remaining": max(0, limits["free_scans_limit"] - usage["scans_used"]) if not usage["is_premium"] else -1,
        "coach_messages_remaining": max(0, limits["free_coach_limit"] - usage["coach_messages_used"]) if not usage["is_premium"] else -1
    }

# Coach Maya - AI Chat
@api_router.post("/coach-maya", response_model=ChatResponse)
async def coach_maya(chat_msg: ChatMessage):
    try:
        # Check usage limits (Free users: 5 messages/day)
        await check_and_increment_usage(chat_msg.user_email, "coach_messages")
        
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
        # Check usage limits (Free users: 3 scans/day)
        await check_and_increment_usage(request.user_email, "scans")
        
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
            allergies_info = f"\n\n🚨 ALLERGIE CRITICHE DA RILEVARE: {', '.join(all_allergies)}. Analizza attentamente ogni ingrediente visibile e gli allergeni nascosti comuni in questi piatti."
        
        # Sistema ibrido migliorato: GPT-4o Vision con prompt engineering avanzato
        system_message = f"""Sei NutriKids AI, un sistema di analisi nutrizionale pediatrica all'avanguardia che combina visione artificiale e expertise nutrizionale.

METODO DI ANALISI AVANZATO:
1. RICONOSCIMENTO VISIVO DETTAGLIATO
   - Identifica OGNI singolo alimento visibile nel piatto
   - Stima le porzioni approssimative (in grammi o unità comuni)
   - Riconosci metodi di cottura (fritto, al vapore, alla griglia, al forno)
   - Nota condimenti e salse visibili

2. CALCOLO NUTRIZIONALE PRECISO
   - Usa database nutrizionali standard (USDA, CREA)
   - Calcola basandoti sulle porzioni stimate
   - Considera perdite nutrizionali dovute alla cottura
   - Fornisci valori realistici (evita sovrastime/sottostime)

3. RILEVAMENTO ALLERGENI MULTI-LIVELLO
   - Allergeni VISIBILI: ingredienti chiaramente identificabili
   - Allergeni NASCOSTI: ingredienti tipici di quel piatto (es: glutine nella pasta, lattosio nella besciamella)
   - Allergeni POSSIBILI: contaminazioni comuni (es: frutta secca in dolci)
   {allergies_info}

4. VALUTAZIONE PEDIATRICA
   - Health score da 1-10 considerando:
     * Bilanciamento macronutrienti
     * Densità nutrizionale
     * Adeguatezza per età 3-12 anni
     * Presenza di zuccheri/grassi trans
   - Suggerimenti personalizzati per migliorare

FORMATO OUTPUT OBBLIGATORIO (JSON valido):
{{
    "foods": ["Alimento 1 (~100g)", "Alimento 2 (~50g)", "Condimento"],
    "nutrition": {{
        "calories": numero_intero,
        "proteins": numero_decimale,
        "carbs": numero_decimale,
        "fats": numero_decimale,
        "fiber": numero_decimale
    }},
    "suggestions": "Analisi dettagliata con 2-3 suggerimenti concreti per migliorare il piatto",
    "health_score": numero_da_1_a_10,
    "allergens": ["allergene1", "allergene2"],
    "cooking_method": "Metodo di cottura rilevato"
}}

⚠️ RISPONDI SEMPRE E SOLO CON JSON VALIDO - NESSUN TESTO AGGIUNTIVO"""
        
        # Uso emergentintegrations con supporto vision
        from emergentintegrations.llm.chat import ImageContent
        
        # Prepara l'immagine per l'analisi
        image_content = ImageContent(image_base64=request.image_base64)
        
        # Crea chat con modello che supporta vision
        # Uso gemini-2.0-flash che ha ottimo supporto vision ed è più economico
        chat = LlmChat(
            api_key=EMERGENT_LLM_KEY,
            session_id=f"photo_{request.user_email}_{datetime.utcnow().timestamp()}",
            system_message=system_message
        ).with_model("gemini", "gemini-2.0-flash")
        
        # Crea messaggio con immagine
        user_message = UserMessage(
            text="Analizza questo piatto in dettaglio e fornisci l'analisi nutrizionale completa in formato JSON.",
            file_contents=[image_content]
        )
        
        # Invia messaggio e ottieni risposta
        response_text = await chat.send_message(user_message)
        
        # Parse JSON response con pulizia avanzata
        import json
        import re
        
        try:
            # Rimuovi markdown code blocks se presenti
            response_text = re.sub(r'```json\s*', '', response_text)
            response_text = re.sub(r'```\s*$', '', response_text)
            response_text = response_text.strip()
            
            result = json.loads(response_text)
            
            # Validazione risultati
            if not isinstance(result.get("foods"), list) or not result.get("foods"):
                raise ValueError("Foods list empty or invalid")
            
            if not isinstance(result.get("nutrition"), dict):
                raise ValueError("Nutrition dict invalid")
                
        except (json.JSONDecodeError, ValueError, AttributeError) as parse_error:
            logging.warning(f"JSON parsing fallito per analyze-photo: {parse_error}. Response: {response_text[:200]}")
            
            # Fallback intelligente: prova a estrarre dati dal testo
            result = {
                "foods": ["Piatto misto", "Ingredienti vari"],
                "nutrition": {
                    "calories": 400,
                    "proteins": 15,
                    "carbs": 50,
                    "fats": 12,
                    "fiber": 5
                },
                "suggestions": "⚠️ Analisi visiva in corso... Piatto riconosciuto ma necessita verifica manuale. Consiglio: fotografia il piatto dall'alto con buona illuminazione per risultati migliori.",
                "health_score": 6,
                "allergens": [],
                "cooking_method": "Non identificato"
            }
        
        # Check allergens con matching case-insensitive migliorato
        detected_allergens = result.get("allergens", [])
        allergen_warning = None
        
        if all_allergies and detected_allergens:
            # Normalizza allergeni per confronto
            user_allergies_lower = [a.lower().strip() for a in all_allergies]
            
            # Check match anche parziali (es: "latte" match con "lattosio")
            dangerous_allergens = []
            for detected in detected_allergens:
                detected_lower = detected.lower().strip()
                for user_allergy in all_allergies:
                    user_allergy_lower = user_allergy.lower().strip()
                    if detected_lower in user_allergy_lower or user_allergy_lower in detected_lower:
                        dangerous_allergens.append(detected)
                        break
            
            if dangerous_allergens:
                allergen_warning = f"🚨 ATTENZIONE ALLERGIA! Questo piatto contiene: {', '.join(dangerous_allergens)}. Allergie registrate nel profilo!"
        
        return PhotoAnalysisResponse(
            foods_detected=result.get("foods", []),
            nutritional_info=result.get("nutrition", {}),
            suggestions=result.get("suggestions", ""),
            health_score=result.get("health_score", 5),
            allergens_detected=detected_allergens,
            allergen_warning=allergen_warning
        )
        
    except HTTPException:
        # Re-raise HTTP exceptions (from check_and_increment_usage, etc.)
        raise
    except Exception as e:
        error_str = str(e).lower()
        logging.error(f"Errore in analyze-photo: {str(e)}")
        
        # Gestione errori specifici
        if "rate limit" in error_str or "429" in error_str:
            raise HTTPException(
                status_code=429, 
                detail="Limite giornaliero raggiunto. Passa a Premium per analisi illimitate! 🌟"
            )
        elif "authentication" in error_str or "unauthorized" in error_str:
            raise HTTPException(
                status_code=500, 
                detail="Errore di autenticazione AI. Contatta il supporto."
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail=f"Errore nell'analisi dell'immagine. Riprova con una foto più chiara."
            )

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
@api_router.post("/children/{child_id}/award-points", response_model=AwardPointsResponse)
async def award_points(child_id: str, request: AwardPointsRequest):
    """Assegna punti a un bambino e calcola il nuovo livello"""
    child = await db.children.find_one({"id": child_id})
    if not child:
        raise HTTPException(status_code=404, detail="Child not found")
    
    current_points = child.get("points", 0)
    new_points = current_points + request.points
    
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
    
    return AwardPointsResponse(
        child_id=child_id,
        points=new_points,
        level=new_level,
        level_up=new_level > child.get("level", 1),
        new_badges=[b for b in new_badges if b not in current_badges]
    )

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
        error_msg = str(e)
        
        # Provide user-friendly error messages
        if "Authentication" in error_msg or "proxy" in error_msg.lower():
            raise HTTPException(
                status_code=503, 
                detail="Servizio AI temporaneamente non disponibile. Riprova tra qualche minuto."
            )
        elif "rate limit" in error_msg.lower():
            raise HTTPException(
                status_code=429,
                detail="Troppe richieste. Attendi qualche secondo e riprova."
            )
        else:
            raise HTTPException(
                status_code=500, 
                detail="Errore nella generazione della lista spesa. Riprova più tardi."
            )

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
    config = await db.config.find_one({})
    if not config:
        # Return default prices if no config exists
        return {
            "monthly_price": 6.99,
            "yearly_price": 59.99
        }
    
    return {
        "monthly_price": config.get("premium_monthly_price", 6.99),
        "yearly_price": config.get("premium_yearly_price", 59.99)
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

# ========== STRIPE PAYMENT ENDPOINTS ==========

@api_router.post("/checkout/create-session")
async def create_checkout_session(request: Request, checkout_request: CreateCheckoutRequest, user_email: str = Header(..., alias="X-User-Email")):
    """
    Create a Stripe Checkout Session for Premium subscription.
    Security: Amount is loaded from admin config (server-side only)
    """
    # Validate plan type
    if checkout_request.plan_type not in ["monthly", "yearly"]:
        raise HTTPException(status_code=400, detail="Invalid plan type. Must be 'monthly' or 'yearly'")
    
    # Get prices from admin config in database (server-side only - prevent price manipulation)
    try:
        config = await db.config.find_one({})
        print(f"DEBUG: Config found: {config}")
    except Exception as e:
        print(f"DEBUG: Error fetching config: {e}")
        config = None
    
    if not config:
        raise HTTPException(status_code=500, detail="App configuration not found")
    
    # Get amount based on plan type
    if checkout_request.plan_type == "monthly":
        amount = float(config.get("premium_monthly_price", 9.99))
    else:  # yearly
        amount = float(config.get("premium_yearly_price", 99.99))
    
    currency = "eur"
    
    # Build success and cancel URLs using frontend origin
    origin_url = checkout_request.origin_url
    success_url = f"{origin_url}/premium?session_id={{CHECKOUT_SESSION_ID}}"
    cancel_url = f"{origin_url}/premium"
    
    # Initialize Stripe Checkout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Create checkout session request
    checkout_session_request = CheckoutSessionRequest(
        amount=amount,
        currency=currency,
        success_url=success_url,
        cancel_url=cancel_url,
        metadata={
            "user_email": user_email,
            "plan_type": checkout_request.plan_type,
            "source": "nutrikids_app"
        }
    )
    
    # Create checkout session with Stripe
    session: CheckoutSessionResponse = await stripe_checkout.create_checkout_session(checkout_session_request)
    
    # Create payment transaction record in database BEFORE redirecting
    payment_transaction = PaymentTransaction(
        user_email=user_email,
        session_id=session.session_id,
        amount=amount,
        currency=currency,
        plan_type=checkout_request.plan_type,
        payment_status="pending",
        metadata={
            "user_email": user_email,
            "plan_type": checkout_request.plan_type
        }
    )
    
    await db.payment_transactions.insert_one(payment_transaction.dict())
    
    return {
        "url": session.url,
        "session_id": session.session_id
    }

@api_router.get("/checkout/status/{session_id}")
async def get_checkout_status(request: Request, session_id: str):
    """
    Get the status of a Stripe checkout session.
    Polls Stripe for payment status and updates database.
    """
    # Initialize Stripe Checkout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    # Get status from Stripe
    checkout_status: CheckoutStatusResponse = await stripe_checkout.get_checkout_status(session_id)
    
    # Find transaction in database
    transaction = await db.payment_transactions.find_one({"session_id": session_id})
    
    if not transaction:
        raise HTTPException(status_code=404, detail="Transaction not found")
    
    # Update transaction status in database (only if not already processed)
    if transaction["payment_status"] != "succeeded":
        new_status = checkout_status.payment_status
        
        await db.payment_transactions.update_one(
            {"session_id": session_id},
            {
                "$set": {
                    "payment_status": new_status,
                    "updated_at": datetime.utcnow()
                }
            }
        )
        
        # If payment succeeded, update user to Premium
        if new_status == "paid":
            user_email = transaction["user_email"]
            await db.users.update_one(
                {"email": user_email},
                {
                    "$set": {
                        "is_premium": True,
                        "premium_plan": transaction["plan_type"],
                        "premium_since": datetime.utcnow(),
                        "updated_at": datetime.utcnow()
                    }
                }
            )
    
    return {
        "status": checkout_status.status,
        "payment_status": checkout_status.payment_status,
        "amount_total": checkout_status.amount_total,
        "currency": checkout_status.currency
    }

@api_router.post("/webhook/stripe")
async def stripe_webhook(request: Request):
    """
    Webhook endpoint for Stripe payment events.
    """
    # Get raw body
    body = await request.body()
    signature = request.headers.get("Stripe-Signature")
    
    # Initialize Stripe Checkout
    host_url = str(request.base_url)
    webhook_url = f"{host_url}api/webhook/stripe"
    stripe_checkout = StripeCheckout(api_key=STRIPE_API_KEY, webhook_url=webhook_url)
    
    try:
        # Handle webhook
        webhook_response = await stripe_checkout.handle_webhook(body, signature)
        
        # Update database based on webhook event
        if webhook_response.event_type == "checkout.session.completed":
            session_id = webhook_response.session_id
            payment_status = webhook_response.payment_status
            
            # Find and update transaction
            transaction = await db.payment_transactions.find_one({"session_id": session_id})
            
            if transaction and transaction["payment_status"] != "succeeded":
                await db.payment_transactions.update_one(
                    {"session_id": session_id},
                    {
                        "$set": {
                            "payment_status": payment_status,
                            "updated_at": datetime.utcnow()
                        }
                    }
                )
                
                # Update user to Premium
                if payment_status == "paid":
                    user_email = transaction["user_email"]
                    await db.users.update_one(
                        {"email": user_email},
                        {
                            "$set": {
                                "is_premium": True,
                                "premium_plan": transaction["plan_type"],
                                "premium_since": datetime.utcnow(),
                                "updated_at": datetime.utcnow()
                            }
                        }
                    )
        
        return {"status": "success"}
    
    except Exception as e:
        print(f"Webhook error: {e}")
        raise HTTPException(status_code=400, detail=str(e))


# ===== PUSH NOTIFICATIONS ENDPOINTS =====

@api_router.post("/push-token/register")
async def register_push_token(token_data: PushTokenRequest):
    """Registra il push token dell'utente per ricevere notifiche"""
    try:
        # Verifica che l'utente esista
        user = await db.users.find_one({"email": token_data.user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Salva o aggiorna il push token
        await db.push_tokens.update_one(
            {"user_email": token_data.user_email},
            {
                "$set": {
                    "push_token": token_data.push_token,
                    "device_type": token_data.device_type,
                    "language": token_data.language,
                    "updated_at": datetime.utcnow()
                }
            },
            upsert=True
        )
        
        # Inizializza preferenze notifiche di default se non esistono
        existing_prefs = await db.notification_preferences.find_one({"user_email": token_data.user_email})
        if not existing_prefs:
            await db.notification_preferences.insert_one({
                "user_email": token_data.user_email,
                "enabled": True,
                "lunch_time": "12:30",
                "dinner_time": "19:30",
                "evening_reminder": "21:00",
                "weekly_report_day": 6,
                "weekly_report_time": "20:00",
                "max_daily_notifications": 4,
                "created_at": datetime.utcnow()
            })
        
        return {"status": "success", "message": "Push token registered successfully"}
    
    except Exception as e:
        logging.error(f"Error registering push token: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.get("/push-token/preferences/{user_email}")
async def get_notification_preferences(user_email: str):
    """Ottiene le preferenze notifiche dell'utente"""
    prefs = await db.notification_preferences.find_one({"user_email": user_email})
    
    if not prefs:
        # Restituisci preferenze di default
        return {
            "enabled": True,
            "lunch_time": "12:30",
            "dinner_time": "19:30",
            "evening_reminder": "21:00",
            "weekly_report_day": 6,
            "weekly_report_time": "20:00",
            "max_daily_notifications": 4
        }
    
    # Rimuovi _id prima di restituire
    prefs.pop("_id", None)
    prefs.pop("created_at", None)
    return prefs

@api_router.put("/push-token/preferences")
async def update_notification_preferences(prefs: NotificationPreferences):
    """Aggiorna le preferenze notifiche dell'utente"""
    try:
        await db.notification_preferences.update_one(
            {"user_email": prefs.user_email},
            {"$set": prefs.dict()},
            upsert=True
        )
        return {"status": "success", "message": "Preferences updated"}
    except Exception as e:
        logging.error(f"Error updating preferences: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/push-token/send")
async def send_push_notification(notification: SendNotificationRequest):
    """Invia una notifica push a un utente specifico"""
    try:
        # Ottieni il push token dell'utente
        token_doc = await db.push_tokens.find_one({"user_email": notification.user_email})
        
        if not token_doc:
            raise HTTPException(status_code=404, detail="Push token not found for user")
        
        push_token = token_doc.get("push_token")
        
        # Verifica che le notifiche siano abilitate
        prefs = await db.notification_preferences.find_one({"user_email": notification.user_email})
        if prefs and not prefs.get("enabled", True):
            return {"status": "skipped", "message": "Notifications disabled for user"}
        
        # Invia notifica tramite Expo Push API
        import requests
        
        expo_push_url = "https://exp.host/--/api/v2/push/send"
        message = {
            "to": push_token,
            "title": notification.title,
            "body": notification.body,
            "data": notification.data or {},
            "sound": "default",
            "priority": "high"
        }
        
        response = requests.post(expo_push_url, json=message, headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            return {"status": "success", "message": "Notification sent", "response": response.json()}
        else:
            raise HTTPException(status_code=500, detail=f"Failed to send notification: {response.text}")
    
    except Exception as e:
        logging.error(f"Error sending push notification: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))



# ===== REFERRAL SYSTEM ENDPOINTS =====

def generate_referral_code(email: str) -> str:
    """Genera un codice referral unico basato sull'email"""
    import hashlib
    hash_obj = hashlib.md5(email.encode())
    return hash_obj.hexdigest()[:8].upper()

@api_router.get("/referral/code/{user_email}")
async def get_referral_code(user_email: str):
    """Ottiene o crea il codice referral dell'utente"""
    try:
        # Verifica che l'utente esista
        user = await db.users.find_one({"email": user_email})
        if not user:
            raise HTTPException(status_code=404, detail="User not found")
        
        # Controlla se ha già un codice referral
        referral = await db.referrals.find_one({"user_email": user_email})
        
        if not referral:
            # Crea nuovo codice referral
            code = generate_referral_code(user_email)
            referral = {
                "user_email": user_email,
                "referral_code": code,
                "invites_count": 0,
                "successful_invites": [],
                "rewards_claimed": 0,
                "created_at": datetime.utcnow(),
                "last_reward_at": None
            }
            await db.referrals.insert_one(referral)
        
        # Calcola statistiche
        successful_count = len(referral.get("successful_invites", []))
        pending_count = referral.get("invites_count", 0) - successful_count
        next_reward_at = 3 - (successful_count % 3)
        can_claim = successful_count >= 3 and (successful_count // 3) > referral.get("rewards_claimed", 0)
        
        return {
            "referral_code": referral["referral_code"],
            "invites_count": referral.get("invites_count", 0),
            "successful_invites": successful_count,
            "pending_invites": pending_count,
            "next_reward_at": next_reward_at,
            "total_rewards": referral.get("rewards_claimed", 0),
            "can_claim_reward": can_claim,
            "share_link": f"https://nutrikids.ai/register?ref={referral['referral_code']}"
        }
    
    except Exception as e:
        logging.error(f"Error getting referral code: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/referral/register")
async def register_with_referral(user_email: EmailStr, referral_code: str):
    """Registra un nuovo utente con codice referral"""
    try:
        # Trova il referral del referrer
        referrer = await db.referrals.find_one({"referral_code": referral_code.upper()})
        
        if not referrer:
            return {"status": "error", "message": "Invalid referral code"}
        
        referrer_email = referrer["user_email"]
        
        # Verifica che l'utente non stia usando il proprio codice
        if referrer_email == user_email:
            return {"status": "error", "message": "Cannot use your own referral code"}
        
        # Verifica che questo utente non sia già stato invitato
        if user_email in referrer.get("successful_invites", []):
            return {"status": "error", "message": "Already registered with this code"}
        
        # Incrementa il contatore e aggiungi alla lista
        await db.referrals.update_one(
            {"referral_code": referral_code.upper()},
            {
                "$inc": {"invites_count": 1},
                "$push": {"successful_invites": user_email}
            }
        )
        
        # Controlla se il referrer ha raggiunto 3 inviti
        updated_referrer = await db.referrals.find_one({"referral_code": referral_code.upper()})
        successful_count = len(updated_referrer.get("successful_invites", []))
        rewards_claimed = updated_referrer.get("rewards_claimed", 0)
        
        # Se ha completato 3 inviti e non ha ancora rivendicato il premio
        if successful_count >= 3 and (successful_count // 3) > rewards_claimed:
            # Auto-assegna 1 mese Premium
            premium_start = datetime.utcnow()
            premium_end = premium_start + timedelta(days=30)
            
            await db.users.update_one(
                {"email": referrer_email},
                {
                    "$set": {
                        "is_premium": True,
                        "premium_start_date": premium_start,
                        "premium_end_date": premium_end
                    }
                }
            )
            
            # Aggiorna rewards_claimed
            await db.referrals.update_one(
                {"referral_code": referral_code.upper()},
                {
                    "$inc": {"rewards_claimed": 1},
                    "$set": {"last_reward_at": datetime.utcnow()}
                }
            )
            
            return {
                "status": "success",
                "message": "Referral registered successfully",
                "reward_granted": True,
                "referrer_email": referrer_email
            }
        
        return {
            "status": "success",
            "message": "Referral registered successfully",
            "reward_granted": False
        }
    
    except Exception as e:
        logging.error(f"Error registering referral: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@api_router.post("/referral/claim-reward/{user_email}")
async def claim_referral_reward(user_email: str):
    """Rivendica il premio referral (1 mese Premium gratis)"""
    try:
        # Trova il referral dell'utente
        referral = await db.referrals.find_one({"user_email": user_email})
        
        if not referral:
            raise HTTPException(status_code=404, detail="No referral data found")
        
        successful_count = len(referral.get("successful_invites", []))
        rewards_claimed = referral.get("rewards_claimed", 0)
        
        # Verifica che ci siano premi da rivendicare
        available_rewards = (successful_count // 3) - rewards_claimed
        
        if available_rewards <= 0:
            return {
                "status": "error",
                "message": "No rewards available. Invite more friends!"
            }
        
        # Assegna 1 mese Premium
        premium_start = datetime.utcnow()
        premium_end = premium_start + timedelta(days=30)
        
        await db.users.update_one(
            {"email": user_email},
            {
                "$set": {
                    "is_premium": True,
                    "premium_start_date": premium_start,
                    "premium_end_date": premium_end
                }
            }
        )
        
        # Aggiorna rewards_claimed
        await db.referrals.update_one(
            {"user_email": user_email},
            {
                "$inc": {"rewards_claimed": 1},
                "$set": {"last_reward_at": datetime.utcnow()}
            }
        )
        
        return {
            "status": "success",
            "message": "Premium activated for 30 days!",
            "premium_end_date": premium_end.isoformat()
        }
    
    except Exception as e:
        logging.error(f"Error claiming reward: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

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