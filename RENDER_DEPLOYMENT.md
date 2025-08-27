# SBV Professional V2 - Render Deployment Guide

## Schritt-für-Schritt Anleitung für Render.com

### 1. Vorbereitung
Der Code ist bereits auf GitHub: https://github.com/Civandigi/sbv-professional-app-last

### 2. Render Dashboard
1. Gehen Sie zu https://dashboard.render.com
2. Loggen Sie sich mit Ihrem Account ein

### 3. PostgreSQL Datenbank erstellen
1. Klicken Sie auf **"New +"** → **"PostgreSQL"**
2. Konfigurieren Sie:
   - **Name**: `sbv-professional-db`
   - **Database**: `sbv_professional_v2`
   - **User**: `sbv_admin`
   - **Region**: Frankfurt (EU Central)
   - **PostgreSQL Version**: 16
   - **Plan**: Wählen Sie Ihren bezahlten Plan
3. Klicken Sie auf **"Create Database"**
4. Warten Sie bis die Datenbank bereit ist (ca. 2-3 Minuten)

### 4. Backend Service erstellen
1. Klicken Sie auf **"New +"** → **"Web Service"**
2. Verbinden Sie Ihr GitHub Repository
3. Wählen Sie: `Civandigi/sbv-professional-app-last`
4. Konfigurieren Sie:
   - **Name**: `sbv-professional-backend`
   - **Region**: Frankfurt (EU Central)
   - **Branch**: `main`
   - **Runtime**: `Node`
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
   - **Plan**: Wählen Sie Ihren bezahlten Plan

### 5. Environment Variables setzen
Im Backend Service, gehen Sie zu **"Environment"** und fügen Sie diese Variablen hinzu:

```
NODE_ENV = production
PORT = 10000

# Datenbank (Internal Database URL von Ihrer PostgreSQL)
DATABASE_URL = [Wird automatisch von Render gesetzt wenn Sie die DB verbinden]

# JWT Configuration
JWT_SECRET = [Generieren Sie einen 64-Zeichen String]
JWT_EXPIRES_IN = 8h
JWT_ISSUER = sbv-professional-v2
JWT_AUDIENCE = sbv-users

# Security
SESSION_SECRET = [Generieren Sie einen weiteren 64-Zeichen String]
BCRYPT_ROUNDS = 12
LOGIN_MAX_ATTEMPTS = 5
LOGIN_LOCKOUT_DURATION_MINUTES = 15

# Rate Limiting
RATE_LIMIT_WINDOW_MS = 900000
RATE_LIMIT_MAX_REQUESTS = 200

# File Upload
MAX_FILE_SIZE = 10485760
UPLOAD_DIR = ./uploads
ALLOWED_FILE_TYPES = pdf,doc,docx,xls,xlsx,png,jpg,jpeg

# Admin
ADMIN_EMAIL = admin@sbv.ch
ADMIN_PASSWORD = [Ihr sicheres Admin-Passwort]

# Features
ENABLE_REGISTRATION = false
ENABLE_PASSWORD_RESET = true
ENABLE_EMAIL_NOTIFICATIONS = true
ENABLE_API_DOCS = true

# Logging
LOG_LEVEL = info
LOG_FORMAT = json

# CORS (Frontend URL nach Deployment hinzufügen)
ALLOWED_ORIGINS = https://sbv-professional-frontend.onrender.com
```

### 6. Datenbank mit Backend verbinden
1. Im Backend Service, gehen Sie zu **"Environment"**
2. Klicken Sie auf **"Add Environment Variable"**
3. Wählen Sie **"Add from Database"**
4. Wählen Sie Ihre `sbv-professional-db`
5. Wählen Sie **"Internal Database URL"**
6. Name: `DATABASE_URL`

### 7. Frontend Service erstellen
1. Klicken Sie auf **"New +"** → **"Static Site"**
2. Verbinden Sie dasselbe GitHub Repository
3. Konfigurieren Sie:
   - **Name**: `sbv-professional-frontend`
   - **Branch**: `main`
   - **Root Directory**: `frontend`
   - **Build Command**: (leer lassen)
   - **Publish Directory**: `.`

### 8. Frontend konfigurieren
Nach dem Deployment:
1. Kopieren Sie die Backend-URL (z.B. `https://sbv-professional-backend.onrender.com`)
2. Gehen Sie zu GitHub
3. Editieren Sie `frontend/js/config.js`
4. Ersetzen Sie die Backend-URL mit Ihrer tatsächlichen URL

### 9. CORS Update
1. Gehen Sie zurück zum Backend Service
2. Aktualisieren Sie `ALLOWED_ORIGINS` mit Ihrer Frontend-URL

### 10. Finale Schritte
1. Beide Services sollten automatisch deployen
2. Warten Sie bis beide grün sind (deployed)
3. Öffnen Sie die Frontend-URL
4. Testen Sie den Login mit:
   - Admin: `admin@sbv-demo.ch` / `test123`
   - User: `user@sbv-demo.ch` / `test123`

## Wichtige URLs nach Deployment
- Frontend: `https://sbv-professional-frontend.onrender.com`
- Backend API: `https://sbv-professional-backend.onrender.com`
- Health Check: `https://sbv-professional-backend.onrender.com/health`

## JWT Secret generieren
Nutzen Sie diesen Befehl lokal:
```bash
node generate-jwt-secret.js
```

## Troubleshooting

**Problem: CORS Fehler**
- Stellen Sie sicher, dass ALLOWED_ORIGINS die korrekte Frontend-URL enthält
- Backend muss zuerst vollständig deployed sein

**Problem: Database Connection Failed**
- Überprüfen Sie, dass DATABASE_URL korrekt gesetzt ist
- Verwenden Sie die "Internal Database URL"

**Problem: Login funktioniert nicht**
- Prüfen Sie die Browser-Konsole für Fehler
- Stellen Sie sicher, dass die API erreichbar ist: `/health`
- Überprüfen Sie die Environment Variables