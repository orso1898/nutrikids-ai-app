# 🥗 NutriKids AI

**L'assistente nutrizionale intelligente per i tuoi bambini**

NutriKids AI è un'app mobile che aiuta i genitori a monitorare e migliorare l'alimentazione dei propri figli attraverso l'intelligenza artificiale.

---

## ✨ Funzionalità Principali

### 📸 Scanner AI
Scatta una foto del piatto e l'AI analizza automaticamente:
- Alimenti riconosciuti
- Valori nutrizionali (calorie, proteine, carboidrati, grassi, fibre)
- Punteggio salute (1-10)
- Avvisi allergie personalizzati
- Suggerimenti nutrizionali

### 🤖 Coach Maya
Assistente AI nutrizionale disponibile 24/7:
- Risposte personalizzate sull'alimentazione infantile
- Consigli basati sull'età dei bambini
- Suggerimenti per pasti equilibrati

### 📅 Piano Settimanale
- Pianifica i pasti della settimana
- Vista giornaliera e settimanale
- Generazione automatica lista della spesa con AI
- Porzioni calcolate in base ai bambini registrati

### 📝 Diario Alimentare
- Registra i pasti giornalieri
- Storico completo dell'alimentazione
- Statistiche e progressi

### 📊 Dashboard
- Statistiche ultimi 7 giorni
- Pasti registrati, scansioni AI, chat coach
- Punteggio medio salute
- Distribuzione pasti

### 🎮 Gamification
- Sistema di punti e livelli per i bambini
- Badge e achievement
- Avatar personalizzabili
- Motivazione al mangiar sano

### 👑 Premium
- Scansioni illimitate
- Coach Maya illimitato
- Piani personalizzati
- Nessuna pubblicità
- Supporto prioritario

---

## 🛠️ Tech Stack

| Componente | Tecnologia |
|------------|------------|
| **Frontend** | React Native + Expo |
| **Backend** | FastAPI (Python) |
| **Database** | MongoDB |
| **AI** | Google Gemini / OpenAI GPT-4 |
| **Pagamenti** | Stripe |
| **Email** | Brevo |
| **Auth** | JWT + bcrypt |

---

## 🌍 Lingue Supportate

- 🇮🇹 Italiano
- 🇬🇧 English
- 🇪🇸 Español

---

## 📱 Screenshot

> *Aggiungi qui gli screenshot dell'app*

| Home | Scanner | Coach Maya |
|------|---------|------------|
| ![Home](screenshots/home.png) | ![Scanner](screenshots/scanner.png) | ![Coach](screenshots/coach.png) |

---

## 🚀 Installazione

### Prerequisiti
- Node.js 18+
- Python 3.10+
- MongoDB
- Expo CLI

### Frontend

```bash
cd frontend
yarn install
npx expo start
```

### Backend

```bash
cd backend
pip install -r requirements.txt
python server.py
```

### Variabili d'Ambiente

**Frontend** (`frontend/.env`):
```
EXPO_PUBLIC_BACKEND_URL=http://localhost:8001
```

**Backend** (`backend/.env`):
```
MONGO_URL=mongodb://localhost:27017
```

---

## 📂 Struttura Progetto

```
nutrikids-ai/
├── frontend/               # App Expo/React Native
│   ├── app/               # Schermate (expo-router)
│   ├── contexts/          # React Context (Auth, Language, Offline)
│   ├── locales/           # Traduzioni
│   └── utils/             # Utility functions
│
├── backend/               # API FastAPI
│   ├── server.py         # Server principale
│   └── requirements.txt  # Dipendenze Python
│
└── README.md
```

---

## 🔐 Sicurezza

- Password criptate con bcrypt
- Autenticazione JWT
- Connessioni HTTPS
- Dati bambini gestiti solo dai genitori
- Conforme GDPR

---

## 📄 Licenza

Questo progetto è privato e proprietario.

---

## 👨‍💻 Autore

Sviluppato con ❤️ per aiutare i genitori a crescere bambini sani.

---

## 📞 Contatti

- 📧 Email: support@nutrikids.ai
- 🔒 Privacy: privacy@nutrikids.ai
