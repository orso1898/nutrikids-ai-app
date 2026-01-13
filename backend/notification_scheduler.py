"""
Sistema di Scheduling Notifiche Push Automatiche
Invia notifiche intelligenti agli utenti nei momenti giusti
"""

from apscheduler.schedulers.background import BackgroundScheduler
from datetime import datetime, timedelta
import logging
import requests
from motor.motor_asyncio import AsyncIOMotorClient
import os
import asyncio

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# MongoDB connection
MONGO_URL = os.getenv("MONGO_URL", "mongodb://localhost:27017/")
DB_NAME = os.getenv("DB_NAME", "nutrikids_db")

# Scheduler globale
scheduler = BackgroundScheduler()

async def get_db():
    """Ottiene connessione database"""
    client = AsyncIOMotorClient(MONGO_URL)
    return client[DB_NAME]

async def send_push_to_user(user_email: str, title: str, body: str, data: dict = None):
    """Invia notifica push a un utente specifico"""
    try:
        db = await get_db()
        
        # Verifica preferenze
        prefs = await db.notification_preferences.find_one({"user_email": user_email})
        if prefs and not prefs.get("enabled", True):
            logger.info(f"Notifiche disabilitate per {user_email}")
            return False
        
        # Ottieni token
        token_doc = await db.push_tokens.find_one({"user_email": user_email})
        if not token_doc:
            logger.warning(f"Token push non trovato per {user_email}")
            return False
        
        push_token = token_doc.get("push_token")
        language = token_doc.get("language", "it")
        
        # Invia tramite Expo Push API
        expo_push_url = "https://exp.host/--/api/v2/push/send"
        message = {
            "to": push_token,
            "title": title,
            "body": body,
            "data": data or {},
            "sound": "default",
            "priority": "high",
            "channelId": "default"
        }
        
        response = requests.post(expo_push_url, json=message, headers={"Content-Type": "application/json"})
        
        if response.status_code == 200:
            logger.info(f"Notifica inviata con successo a {user_email}")
            return True
        else:
            logger.error(f"Errore invio notifica a {user_email}: {response.text}")
            return False
            
    except Exception as e:
        logger.error(f"Errore send_push_to_user: {str(e)}")
        return False

# Traduzioni notifiche
NOTIFICATIONS = {
    "it": {
        "lunch_reminder": {
            "title": "🍽️ È ora di pranzo!",
            "body": "Scansiona il pasto di {child_name} per guadagnare punti! 📸"
        },
        "dinner_reminder": {
            "title": "🍽️ È ora di cena!",
            "body": "Non dimenticare di registrare la cena di {child_name}! ⭐"
        },
        "evening_recap": {
            "title": "🌟 Ottimo lavoro oggi!",
            "body": "{child_name} ha guadagnato {points} punti oggi! Continua così! 🎉"
        },
        "streak_reminder": {
            "title": "🔥 Non perdere la serie!",
            "body": "Hai una serie di {days} giorni! Scansiona un pasto oggi per continuare! 💪"
        },
        "weekly_report": {
            "title": "📊 Report Settimanale Pronto!",
            "body": "Guarda i progressi di {child_name} questa settimana! 🌟"
        }
    },
    "en": {
        "lunch_reminder": {
            "title": "🍽️ Lunch time!",
            "body": "Scan {child_name}'s meal to earn points! 📸"
        },
        "dinner_reminder": {
            "title": "🍽️ Dinner time!",
            "body": "Don't forget to log {child_name}'s dinner! ⭐"
        },
        "evening_recap": {
            "title": "🌟 Great job today!",
            "body": "{child_name} earned {points} points today! Keep it up! 🎉"
        },
        "streak_reminder": {
            "title": "🔥 Don't break your streak!",
            "body": "You have a {days}-day streak! Scan a meal today to continue! 💪"
        },
        "weekly_report": {
            "title": "📊 Weekly Report Ready!",
            "body": "Check {child_name}'s progress this week! 🌟"
        }
    },
    "es": {
        "lunch_reminder": {
            "title": "🍽️ ¡Hora del almuerzo!",
            "body": "¡Escanea la comida de {child_name} para ganar puntos! 📸"
        },
        "dinner_reminder": {
            "title": "🍽️ ¡Hora de la cena!",
            "body": "¡No olvides registrar la cena de {child_name}! ⭐"
        },
        "evening_recap": {
            "title": "🌟 ¡Excelente trabajo hoy!",
            "body": "¡{child_name} ganó {points} puntos hoy! ¡Sigue así! 🎉"
        },
        "streak_reminder": {
            "title": "🔥 ¡No rompas tu racha!",
            "body": "¡Tienes una racha de {days} días! ¡Escanea una comida hoy para continuar! 💪"
        },
        "weekly_report": {
            "title": "📊 ¡Informe Semanal Listo!",
            "body": "¡Mira el progreso de {child_name} esta semana! 🌟"
        }
    }
}

async def send_lunch_reminders():
    """Invia promemoria pranzo a tutti gli utenti alle 12:30"""
    logger.info("Invio promemoria pranzo...")
    
    try:
        db = await get_db()
        
        # Ottieni tutti gli utenti con token
        async for token_doc in db.push_tokens.find({}):
            user_email = token_doc.get("user_email")
            language = token_doc.get("language", "it")
            
            # Ottieni primo bambino
            child = await db.children.find_one({"parent_email": user_email})
            child_name = child.get("name", "tuo figlio") if child else "tuo figlio"
            
            # Prepara messaggio
            notif = NOTIFICATIONS[language]["lunch_reminder"]
            title = notif["title"]
            body = notif["body"].replace("{child_name}", child_name)
            
            # Invia
            await send_push_to_user(user_email, title, body, {"type": "lunch_reminder"})
            
    except Exception as e:
        logger.error(f"Errore send_lunch_reminders: {str(e)}")

async def send_dinner_reminders():
    """Invia promemoria cena a tutti gli utenti alle 19:30"""
    logger.info("Invio promemoria cena...")
    
    try:
        db = await get_db()
        
        async for token_doc in db.push_tokens.find({}):
            user_email = token_doc.get("user_email")
            language = token_doc.get("language", "it")
            
            child = await db.children.find_one({"parent_email": user_email})
            child_name = child.get("name", "tuo figlio") if child else "tuo figlio"
            
            notif = NOTIFICATIONS[language]["dinner_reminder"]
            title = notif["title"]
            body = notif["body"].replace("{child_name}", child_name)
            
            await send_push_to_user(user_email, title, body, {"type": "dinner_reminder"})
            
    except Exception as e:
        logger.error(f"Errore send_dinner_reminders: {str(e)}")

async def send_evening_recaps():
    """Invia recap serale alle 21:00"""
    logger.info("Invio recap serale...")
    
    try:
        db = await get_db()
        
        async for token_doc in db.push_tokens.find({}):
            user_email = token_doc.get("user_email")
            language = token_doc.get("language", "it")
            
            # Calcola punti guadagnati oggi
            child = await db.children.find_one({"parent_email": user_email})
            if not child:
                continue
            
            child_name = child.get("name", "tuo figlio")
            points_today = 15  # Placeholder - calcolare i punti reali dal diario
            
            notif = NOTIFICATIONS[language]["evening_recap"]
            title = notif["title"]
            body = notif["body"].replace("{child_name}", child_name).replace("{points}", str(points_today))
            
            await send_push_to_user(user_email, title, body, {"type": "evening_recap"})
            
    except Exception as e:
        logger.error(f"Errore send_evening_recaps: {str(e)}")

async def send_weekly_reports():
    """Invia report settimanale ogni domenica alle 20:00"""
    logger.info("Invio report settimanale...")
    
    try:
        db = await get_db()
        
        async for token_doc in db.push_tokens.find({}):
            user_email = token_doc.get("user_email")
            language = token_doc.get("language", "it")
            
            child = await db.children.find_one({"parent_email": user_email})
            child_name = child.get("name", "tuo figlio") if child else "tuo figlio"
            
            notif = NOTIFICATIONS[language]["weekly_report"]
            title = notif["title"]
            body = notif["body"].replace("{child_name}", child_name)
            
            await send_push_to_user(user_email, title, body, {"type": "weekly_report"})
            
    except Exception as e:
        logger.error(f"Errore send_weekly_reports: {str(e)}")

# Wrapper sincroni per scheduler
def lunch_job():
    asyncio.run(send_lunch_reminders())

def dinner_job():
    asyncio.run(send_dinner_reminders())

def evening_job():
    asyncio.run(send_evening_recaps())

def weekly_job():
    asyncio.run(send_weekly_reports())

async def check_trial_expiring_soon():
    """Controlla trial che scadono tra 24 ore e invia notifica"""
    logger.info("Controllo trial in scadenza...")
    
    try:
        db = await get_db()
        
        # Calcola il range: tra 23 e 25 ore da ora
        now = datetime.utcnow()
        tomorrow_start = now + timedelta(hours=23)
        tomorrow_end = now + timedelta(hours=25)
        
        # Trova utenti con trial in scadenza domani
        async for user in db.users.find({
            "is_trial": True,
            "is_premium": True,
            "premium_end_date": {
                "$gte": tomorrow_start,
                "$lte": tomorrow_end
            }
        }):
            user_email = user.get("email")
            premium_end = user.get("premium_end_date")
            
            # Ottieni token e lingua
            token_doc = await db.push_tokens.find_one({"user_email": user_email})
            if not token_doc:
                continue
            
            language = token_doc.get("language", "it")
            
            # Messaggio basato su lingua
            messages = {
                "it": {
                    "title": "⏰ Prova gratuita in scadenza!",
                    "body": f"La tua prova Premium scade domani! Abbonati ora per continuare a godere di tutte le funzionalità illimitate. 🌟"
                },
                "en": {
                    "title": "⏰ Free trial expiring soon!",
                    "body": f"Your Premium trial expires tomorrow! Subscribe now to keep enjoying unlimited features. 🌟"
                },
                "es": {
                    "title": "⏰ ¡Prueba gratuita por vencer!",
                    "body": f"¡Tu prueba Premium vence mañana! Suscríbete ahora para seguir disfrutando de funciones ilimitadas. 🌟"
                }
            }
            
            msg = messages.get(language, messages["it"])
            await send_push_to_user(user_email, msg["title"], msg["body"], {"type": "trial_expiring"})
            
            logger.info(f"Notifica trial expiring inviata a {user_email}")
            
    except Exception as e:
        logger.error(f"Errore check_trial_expiring_soon: {str(e)}")

async def check_trial_expired():
    """Controlla trial scaduti e torna gli utenti a Free"""
    logger.info("Controllo trial scaduti...")
    
    try:
        db = await get_db()
        
        now = datetime.utcnow()
        
        # Trova utenti con trial scaduto
        async for user in db.users.find({
            "is_trial": True,
            "is_premium": True,
            "premium_end_date": {"$lte": now}
        }):
            user_email = user.get("email")
            
            # Torna l'utente a Free
            await db.users.update_one(
                {"email": user_email},
                {
                    "$set": {
                        "is_premium": False,
                        "is_trial": False
                    }
                }
            )
            
            # Ottieni token e lingua
            token_doc = await db.push_tokens.find_one({"user_email": user_email})
            if not token_doc:
                logger.info(f"Trial scaduto per {user_email} (nessun push token)")
                continue
            
            language = token_doc.get("language", "it")
            
            # Messaggio basato su lingua
            messages = {
                "it": {
                    "title": "😢 Prova gratuita terminata",
                    "body": "La tua prova Premium è scaduta. Abbonati ora per continuare con scansioni e messaggi illimitati! 🚀"
                },
                "en": {
                    "title": "😢 Free trial ended",
                    "body": "Your Premium trial has expired. Subscribe now to continue with unlimited scans and messages! 🚀"
                },
                "es": {
                    "title": "😢 Prueba gratuita terminada",
                    "body": "Tu prueba Premium ha expirado. ¡Suscríbete ahora para continuar con escaneos y mensajes ilimitados! 🚀"
                }
            }
            
            msg = messages.get(language, messages["it"])
            await send_push_to_user(user_email, msg["title"], msg["body"], {"type": "trial_expired"})
            
            logger.info(f"Trial scaduto per {user_email} - tornato a Free")
            
    except Exception as e:
        logger.error(f"Errore check_trial_expired: {str(e)}")

# Wrapper sincroni per trial jobs
def trial_expiring_job():
    asyncio.run(check_trial_expiring_soon())

def trial_expired_job():
    asyncio.run(check_trial_expired())

    asyncio.run(send_dinner_reminders())

def evening_job():
    asyncio.run(send_evening_recaps())

def weekly_job():
    asyncio.run(send_weekly_reports())

def start_scheduler():
    """Avvia lo scheduler delle notifiche"""
    
    # Promemoria pranzo - ogni giorno alle 12:30
    scheduler.add_job(lunch_job, 'cron', hour=12, minute=30, id='lunch_reminder')
    
    # Promemoria cena - ogni giorno alle 19:30
    scheduler.add_job(dinner_job, 'cron', hour=19, minute=30, id='dinner_reminder')
    
    # Recap serale - ogni giorno alle 21:00
    scheduler.add_job(evening_job, 'cron', hour=21, minute=0, id='evening_recap')
    
    # Report settimanale - ogni domenica alle 20:00
    scheduler.add_job(weekly_job, 'cron', day_of_week='sun', hour=20, minute=0, id='weekly_report')
    
    # Controllo trial in scadenza - ogni giorno alle 10:00
    scheduler.add_job(trial_expiring_job, 'cron', hour=10, minute=0, id='trial_expiring_check')
    
    # Controllo trial scaduti - ogni giorno alle 0:00 e 12:00
    scheduler.add_job(trial_expired_job, 'cron', hour='0,12', minute=0, id='trial_expired_check')
    
    scheduler.start()
    logger.info("✅ Scheduler notifiche avviato con successo!")
    logger.info("📅 Notifiche programmate:")
    logger.info("   - Pranzo: ogni giorno 12:30")
    logger.info("   - Cena: ogni giorno 19:30")
    logger.info("   - Recap: ogni giorno 21:00")
    logger.info("   - Report: ogni domenica 20:00")
    logger.info("   - Trial expiring: ogni giorno 10:00")
    logger.info("   - Trial expired: ogni giorno 0:00 e 12:00")

def stop_scheduler():
    """Ferma lo scheduler"""
    scheduler.shutdown()
    logger.info("⛔ Scheduler notifiche fermato")
