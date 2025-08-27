# 🚀 SBV Professional V2 - Anleitung zum Testen

## Server starten (falls noch nicht gestartet)
```bash
cd "C:\Users\Ivan\Desktop\SBV APP Definitiv\SBV-app-definitiv-neu"
npm start
```

## Im Browser öffnen

### 1. Hauptseite
**URL:** http://localhost:3001

### 2. Login
- **URL:** http://localhost:3001/frontend/login.html
- **Admin Login:**
  - Email: `admin@sbv-demo.ch`
  - Passwort: `test123`
- **Super Admin Login:**
  - Email: `superadmin@sbv-demo.ch`
  - Passwort: `test123`
- **User Login:**
  - Email: `user@sbv-demo.ch`
  - Passwort: `test123`

### 3. Nach dem Login
Sie werden automatisch zum Dashboard weitergeleitet:
- **Dashboard:** http://localhost:3001/frontend/dashboard.html
- Im linken Menü finden Sie "Rapport-Verwaltung"

### 4. Rapport-Seite
- Klicken Sie im Menü auf "Rapport-Verwaltung"
- Sie sehen die Liste der Rapporte aus der Datenbank
- Als Admin können Sie Rapporte bearbeiten
- Als Super Admin können Sie zusätzlich genehmigen

## Was funktioniert jetzt?
✅ Login mit JWT-Token
✅ Rollenbasierte Berechtigungen
✅ Rapport-Liste wird vom Backend geladen
✅ Rapport erstellen/bearbeiten
✅ Swiss Corporate Design

## Test-API direkt
Öffnen Sie: http://localhost:3001/test-rapport-api.html
1. Klicken Sie "1. Login"
2. Dann "2. Lade Rapporte"