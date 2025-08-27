# SBV Professional V2 - Deployment Guide

## Deployment zu Railway.app

Railway bietet kostenloses Hosting ohne Sleep-Mode im Free Tier (im Gegensatz zu Render).

### Vorbereitung

1. **GitHub Repository erstellen**
   ```bash
   git init
   git add .
   git commit -m "Initial commit - SBV Professional V2"
   git branch -M main
   git remote add origin https://github.com/your-username/sbv-professional-v2.git
   git push -u origin main
   ```

2. **Environment Variables vorbereiten**
   - Kopieren Sie `.env.example` zu `.env`
   - Generieren Sie ein sicheres JWT_SECRET (mindestens 32 Zeichen)
   - Passen Sie die Werte für Production an

### Railway Deployment

1. **Railway Account erstellen**
   - Gehen Sie zu https://railway.app
   - Registrieren Sie sich mit GitHub

2. **Neues Projekt erstellen**
   - Klicken Sie auf "New Project"
   - Wählen Sie "Deploy from GitHub repo"
   - Wählen Sie Ihr Repository

3. **PostgreSQL hinzufügen**
   - Klicken Sie auf "+ New" im Railway Dashboard
   - Wählen Sie "Database" → "PostgreSQL"
   - Railway erstellt automatisch die DATABASE_URL Variable

4. **Environment Variables konfigurieren**
   - Gehen Sie zu "Variables"
   - Fügen Sie alle erforderlichen Variablen hinzu:

   ```
   NODE_ENV=production
   PORT=3001
   JWT_SECRET=ihr-super-geheimer-jwt-schluessel-mindestens-32-zeichen
   JWT_EXPIRES_IN=8h
   SESSION_SECRET=ihr-session-secret
   BCRYPT_ROUNDS=12
   LOGIN_MAX_ATTEMPTS=5
   LOGIN_LOCKOUT_DURATION_MINUTES=15
   RATE_LIMIT_WINDOW_MS=900000
   RATE_LIMIT_MAX_REQUESTS=200
   MAX_FILE_SIZE=10485760
   UPLOAD_DIR=./uploads
   ALLOWED_FILE_TYPES=pdf,doc,docx,xls,xlsx,png,jpg,jpeg
   ADMIN_EMAIL=admin@sbv.ch
   ADMIN_PASSWORD=SBV2024Admin!
   ENABLE_REGISTRATION=false
   ENABLE_PASSWORD_RESET=true
   ENABLE_EMAIL_NOTIFICATIONS=true
   ENABLE_API_DOCS=true
   LOG_LEVEL=info
   LOG_FORMAT=json
   ```

5. **Domain konfigurieren (optional)**
   - Railway generiert automatisch eine Domain: `your-app.up.railway.app`
   - Sie können auch eine Custom Domain hinzufügen

6. **Deployment starten**
   - Railway deployed automatisch bei jedem Push zu GitHub
   - Der erste Deploy startet automatisch nach der Konfiguration

### Frontend Deployment

Das Frontend (HTML/CSS/JS) muss separat gehostet werden:

1. **Netlify (empfohlen für Frontend)**
   - Erstellen Sie einen Account bei https://netlify.com
   - Drag & Drop des `frontend` Ordners
   - Oder verbinden Sie GitHub für automatische Deployments

2. **Frontend Konfiguration anpassen**
   - Erstellen Sie `frontend/config.js`:
   ```javascript
   window.API_BASE_URL = 'https://your-backend.up.railway.app';
   ```
   - Aktualisieren Sie alle API-Aufrufe um diese Variable zu nutzen

### Wichtige Hinweise

1. **CORS Configuration**
   - Fügen Sie Ihre Frontend-Domain zu ALLOWED_ORIGINS hinzu
   - Format: `ALLOWED_ORIGINS=https://your-frontend.netlify.app,https://your-custom-domain.com`

2. **Datenbank-Migration**
   - Das Setup-Script läuft automatisch beim ersten Start
   - Überprüfen Sie die Logs für etwaige Fehler

3. **Monitoring**
   - Railway bietet eingebaute Logs und Metriken
   - Überwachen Sie CPU und Memory Usage

4. **Backup**
   - Erstellen Sie regelmäßige Datenbank-Backups
   - Railway bietet keine automatischen Backups im Free Tier

### Troubleshooting

**Problem: Backend startet nicht**
- Überprüfen Sie die Logs in Railway
- Stellen Sie sicher, dass alle Environment Variables gesetzt sind
- Verifizieren Sie die DATABASE_URL

**Problem: CORS Fehler**
- Überprüfen Sie ALLOWED_ORIGINS
- Stellen Sie sicher, dass die Frontend-URL korrekt ist

**Problem: Datei-Uploads funktionieren nicht**
- Railway hat ephemeral storage - Dateien gehen beim Neustart verloren
- Für Production: Verwenden Sie einen Cloud Storage Service (S3, etc.)

### Lokale Entwicklung

Für lokale Tests mit Production-ähnlicher Umgebung:

```bash
# .env Datei mit Production-Werten erstellen
cp .env.example .env.production

# Mit Production-Umgebung starten
NODE_ENV=production npm start
```

### Support

Bei Problemen:
- Railway Documentation: https://docs.railway.app
- Railway Discord: https://discord.gg/railway
- GitHub Issues: https://github.com/your-username/sbv-professional-v2/issues