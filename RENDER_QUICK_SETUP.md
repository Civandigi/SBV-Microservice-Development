# SBV Professional V2 - Render Quick Setup

## Was Sie machen müssen (5 Minuten):

### 1. Backend Service aktualisieren
In Ihrem bestehenden Render Web Service:

1. **Settings → Build & Deploy**
   - GitHub Repository: `Civandigi/sbv-professional-app-last`
   - Branch: `main`
   - Build Command: `npm install`
   - Start Command: `npm start`

2. **Environment → Bulk Edit**
   - Löschen Sie alle alten Variablen
   - Kopieren Sie den KOMPLETTEN Inhalt aus `.env.render`
   - Fügen Sie alles ein und speichern

3. **Environment → Add from Database**
   - Click "Add Environment Variable"
   - Choose "Add from Database"
   - Select your PostgreSQL database
   - Variable name: `DATABASE_URL`
   - Value: Internal Database URL

4. **Manual Deploy → Deploy latest commit**

### 2. Frontend als Static Site
Falls Sie noch keine Static Site haben:

1. **New + → Static Site**
   - GitHub: `Civandigi/sbv-professional-app-last`
   - Name: `sbv-professional-frontend`
   - Branch: `main`
   - Root Directory: `frontend`
   - Build Command: (leer lassen)
   - Publish Directory: `.`

### 3. Nach dem Deployment

1. **Backend URL kopieren** (z.B. `https://xxx.onrender.com`)
2. **Frontend URL kopieren** (z.B. `https://sbv-professional-frontend.onrender.com`)
3. **Im Backend Service**: Environment → ALLOWED_ORIGINS anpassen mit Ihrer Frontend URL

## Test-Logins:
- Admin: `admin@sbv-demo.ch` / `test123`
- User: `user@sbv-demo.ch` / `test123`

## Das macht Render automatisch:
- ✅ Datenbank verbinden (wenn DATABASE_URL gesetzt)
- ✅ Tabellen erstellen beim ersten Start
- ✅ Demo-User anlegen
- ✅ SSL-Zertifikate
- ✅ Automatische Deploys bei GitHub Updates

## Fertig! 🎉