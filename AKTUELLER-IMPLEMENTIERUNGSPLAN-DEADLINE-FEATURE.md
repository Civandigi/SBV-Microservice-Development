# 🚨 AKTUELLER IMPLEMENTIERUNGSPLAN - DEADLINE FEATURE 🚨

> **STATUS:** BEREIT ZUR IMPLEMENTIERUNG  
> **DATUM:** 2025-08-06  
> **PRIORITÄT:** HOCH  
> **GESCHÄTZTER AUFWAND:** 11-16 Stunden (1.5-2 Tage)

---

## ⚠️ WICHTIG: DIES IST DER AKTUELLE PLAN ⚠️

**Dieser Plan wurde am 2025-08-06 besprochen und genehmigt. Bei Fortsetzung der Arbeit DIESEM PLAN FOLGEN!**

---

## 📋 ZUSAMMENFASSUNG DER ANFORDERUNG

Der Admin soll die Möglichkeit haben, von einem User einen Rapport für ein bestimmtes Teilprojekt mit einer Deadline anzufordern. Der User sieht diese Anforderung in seinem Dashboard und wird an die Deadline erinnert.

---

## 🎯 GEWÄHLTE LÖSUNG: OPTION 2 - INTEGRIERTE LÖSUNG

### Warum Option 2?
- ✅ Nahtlose Integration in bestehendes System
- ✅ Direkte Verknüpfung Anforderung ↔ Erstellter Rapport  
- ✅ Bessere Nachverfolgbarkeit
- ✅ Keine zusätzlichen Tabellen nötig
- ✅ Langfristig wartbarer

---

## 🛠️ IMPLEMENTIERUNGSSCHRITTE

### SCHRITT 1: DATENBANK-MIGRATION (2-3 Stunden)

**Datei:** `backend/migrations/008_add_deadline_feature.sql`

```sql
-- Neue Felder für Rapport-Anforderungen
ALTER TABLE rapporte ADD COLUMN requested_by INTEGER REFERENCES users(id);
ALTER TABLE rapporte ADD COLUMN deadline DATE;
ALTER TABLE rapporte ADD COLUMN request_description TEXT;
ALTER TABLE rapporte ADD COLUMN is_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE rapporte ADD COLUMN request_created_at TIMESTAMP;
ALTER TABLE rapporte ADD COLUMN reminder_sent BOOLEAN DEFAULT FALSE;

-- Index für Performance
CREATE INDEX idx_rapporte_deadline ON rapporte(deadline) WHERE is_requested = true;
CREATE INDEX idx_rapporte_requested_user ON rapporte(author_id, is_requested) WHERE is_requested = true;
```

**Aufgaben:**
- [ ] Migration-Datei erstellen
- [ ] Migration ausführen
- [ ] Datenbank-Verbindung testen

---

### SCHRITT 2: BACKEND API ENDPOINTS (4-5 Stunden)

**Neue Controller:** `backend/src/controllers/rapportRequest.controller.js`

#### 2.1 Endpoint: Rapport anfordern
```javascript
POST /api/rapporte/request
Body: {
  user_id: 123,
  teilprojekt: "TP1",
  deadline: "2024-12-31",
  description: "Bitte Jahresabschluss für TP1"
}
```

#### 2.2 Endpoint: Angeforderte Rapporte für User
```javascript
GET /api/rapporte/requested
Response: Liste aller angeforderten Rapporte für eingeloggten User
```

#### 2.3 Endpoint: Alle Anforderungen (Admin)
```javascript
GET /api/rapporte/all-requests
Response: Übersicht aller Anforderungen mit Status
```

#### 2.4 Endpoint: Anforderung erfüllen
```javascript
POST /api/rapporte/fulfill-request/:requestId
Body: { rapport_id: 456 }
```

**Aufgaben:**
- [ ] Controller erstellen
- [ ] Routes hinzufügen
- [ ] Validierung implementieren
- [ ] Email-Benachrichtigung bei Anforderung
- [ ] Tests schreiben

---

### SCHRITT 3: FRONTEND - ADMIN INTERFACE (3-4 Stunden)

**Datei:** `frontend/pages/admin.html`

#### 3.1 Neuer Tab: "Rapport-Anforderungen"
- Button: "Neuen Rapport anfordern"
- Tabelle: Übersicht aller Anforderungen
  - User
  - Teilprojekt
  - Deadline
  - Status (Offen/Erfüllt/Überfällig)
  - Aktionen

#### 3.2 Modal: Rapport anfordern
```html
<div id="requestRapportModal">
  - Dropdown: User auswählen
  - Dropdown: Teilprojekt
  - Datepicker: Deadline
  - Textarea: Beschreibung/Anweisungen
  - Button: "Anforderung senden"
</div>
```

**Aufgaben:**
- [ ] UI-Komponenten erstellen
- [ ] API-Integration
- [ ] Validierung
- [ ] Success/Error Handling

---

### SCHRITT 4: FRONTEND - USER DASHBOARD (3-4 Stunden)

**Datei:** `frontend/pages/dashboard.html`

#### 4.1 Dashboard-Widget: Angeforderte Rapporte
```html
<div class="requested-rapports-widget">
  <!-- Rote Badge mit Anzahl -->
  <span class="badge-urgent">3 Angefordert</span>
  
  <!-- Liste der Anforderungen -->
  <div class="request-item">
    <h4>TP1 - Jahresabschluss</h4>
    <p>Deadline: 31.12.2024 (in 5 Tagen)</p>
    <button>Rapport erstellen</button>
  </div>
</div>
```

#### 4.2 Deadline-Warnung
- Bei < 3 Tagen: Gelbe Warnung
- Bei < 1 Tag: Rote Warnung
- Überfällig: Rote Markierung + Email

**Aufgaben:**
- [ ] Dashboard-Widget implementieren
- [ ] Countdown-Logik
- [ ] Quick-Action Buttons
- [ ] Visual Indicators (Farben)

---

### SCHRITT 5: EMAIL-BENACHRICHTIGUNGEN (2 Stunden)

**Datei:** `backend/src/services/email.service.js`

#### 5.1 Email-Templates
1. **Anforderung erstellt:** "Sie haben eine neue Rapport-Anforderung"
2. **Erinnerung:** "Rapport-Deadline in 3 Tagen"
3. **Überfällig:** "Rapport-Deadline überschritten"

#### 5.2 Cron-Job für tägliche Prüfung
```javascript
// Täglich um 9:00 Uhr
cron.schedule('0 9 * * *', checkDeadlines);
```

**Aufgaben:**
- [ ] Email-Templates erstellen
- [ ] Cron-Job implementieren
- [ ] Test-Emails senden

---

### SCHRITT 6: TESTING & FINALISIERUNG (2 Stunden)

**Tests:**
- [ ] Datenbank-Migration testen
- [ ] API-Endpoints testen
- [ ] Admin kann Rapport anfordern
- [ ] User sieht Anforderung
- [ ] Deadline-Countdown funktioniert
- [ ] Email-Benachrichtigungen kommen an
- [ ] Rapport-Erstellung erfüllt Anforderung
- [ ] Edge Cases (keine Deadline, User gelöscht, etc.)

---

## 📊 DATENFLUSS

```
1. Admin fordert Rapport an
   ↓
2. Neuer Eintrag in rapporte-Tabelle (is_requested=true)
   ↓
3. Email an User
   ↓
4. User sieht Anforderung im Dashboard
   ↓
5. User erstellt Rapport (verknüpft mit Anforderung)
   ↓
6. Anforderung wird als "erfüllt" markiert
   ↓
7. Admin sieht Status-Update
```

---

## 🚦 ERFOLGS-KRITERIEN

- ✅ Admin kann Rapport mit Deadline anfordern
- ✅ User erhält Email-Benachrichtigung
- ✅ Dashboard zeigt angeforderte Rapporte prominent
- ✅ Deadline-Countdown ist sichtbar
- ✅ Erinnerungen werden automatisch versendet
- ✅ Erfüllte Anforderungen werden korrekt verknüpft
- ✅ Übersicht für Admin zeigt alle Anforderungen

---

## ⚠️ WICHTIGE HINWEISE

1. **PostgreSQL Kompatibilität:** Alle SQL-Statements müssen PostgreSQL-kompatibel sein
2. **Keine Breaking Changes:** Bestehende Funktionalität darf nicht beeinträchtigt werden
3. **Rückwärtskompatibilität:** Alte Rapporte ohne deadline-Felder müssen weiter funktionieren
4. **Performance:** Indices für deadline-Queries sind wichtig
5. **Sicherheit:** Nur Admins dürfen Anforderungen erstellen

---

## 🎯 NÄCHSTER SCHRITT

**BEGINNE MIT SCHRITT 1: DATENBANK-MIGRATION**

```bash
# 1. Migration-Datei erstellen
# 2. Migration ausführen
# 3. Testen
```

---

## 📝 NOTIZEN FÜR FORTSETZUNG

- Dieser Plan ist vollständig und ready-to-implement
- Bei Unterbrechung: Mit diesem Dokument fortfahren
- Alle Dateipfade und Code-Snippets sind bereit zur Verwendung
- Geschätzter Zeitaufwand ist realistisch kalkuliert

---

**ENDE DES IMPLEMENTIERUNGSPLANS**

_Erstellt am: 2025-08-06_  
_Status: BEREIT ZUR UMSETZUNG_  
_Nächste Aktion: DATENBANK-MIGRATION ERSTELLEN_