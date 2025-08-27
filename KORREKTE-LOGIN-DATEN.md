# 🔐 KORREKTE LOGIN-DATEN FÜR SBV PROFESSIONAL APP

## ✅ FUNKTIONIERENDE ZUGANGSDATEN

### Hauptbenutzer:

#### 1. **Admin**
- **Email:** `admin@sbv.ch`
- **Passwort:** `admin123`
- **Rolle:** Admin
- **Name:** Admin User

#### 2. **User** 
- **Email:** `user@sbv.ch`
- **Passwort:** `user123`
- **Rolle:** User
- **Name:** Test User

### Demo-Benutzer:

#### 3. **Super Admin**
- **Email:** `superadmin@sbv-demo.ch`
- **Passwort:** `test123`
- **Rolle:** Super Admin
- **Name:** Super Administrator

#### 4. **Demo Admin**
- **Email:** `admin@sbv-demo.ch`
- **Passwort:** `test123`
- **Rolle:** Admin
- **Name:** Admin User

#### 5. **Demo User**
- **Email:** `user@sbv-demo.ch`
- **Passwort:** `test123`
- **Rolle:** User
- **Name:** Max Mustermann

---

## ❌ FALSCHE ANGABEN (die NICHT funktionieren)

Die folgenden Angaben waren im Frontend falsch und wurden korrigiert:
- ~~admin@sbv.ch (Test1234!)~~ → **admin123**
- ~~user@sbv.ch (Test1234!)~~ → **user123**
- ~~super@sbv.ch (Test1234!)~~ → Existiert nicht, verwende **superadmin@sbv-demo.ch**

---

## 📝 STATUS DER KORREKTUR

✅ **Frontend wurde aktualisiert:**
- `login.html` zeigt jetzt die korrekten Demo-Zugangsdaten
- API-URL wurde von Port 8080 auf 8081 korrigiert

✅ **Server läuft auf:** http://localhost:8081

✅ **Getestete Funktionen:**
- Login-API funktioniert mit korrekten Daten
- Frontend kann sich mit Backend verbinden
- JWT-Token werden korrekt generiert

---

## 🎯 SCHNELLZUGRIFF

Für schnelles Testen, kopiere diese Befehle:

### Admin Login testen:
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@sbv.ch","password":"admin123"}'
```

### User Login testen:
```bash
curl -X POST http://localhost:8081/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"email":"user@sbv.ch","password":"user123"}'
```

---

*Stand: 26. August 2025*
*Verifiziert durch Datenbankaudit*