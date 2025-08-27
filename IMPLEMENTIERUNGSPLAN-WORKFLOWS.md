# 🚀 IMPLEMENTIERUNGSPLAN - END-TO-END WORKFLOWS
## SBV Professional V2
**Stand:** 6. August 2025

---

## 📊 AKTUELLE SITUATION

### ✅ Was funktioniert bereits:
- **Rapport-System** komplett (CRUD, Approval-Workflow)
- **Webhook-Service** implementiert (für n8n Integration)
- **User-Management** mit Rollen (user, admin, super_admin)
- **Datenbank-Verbindung** stabil

### ❌ Was fehlt:
- **Gesuch-System** (nur Konzept vorhanden, keine Implementierung)
- **Verbindung** zwischen Gesuch und Rapport
- **PDF/Google Doc Export** (n8n Workflow nicht konfiguriert)

---

## 🎯 WORKFLOW 1: GESUCH → RAPPORTE
**Ziel:** Admin lädt Gesuch hoch → System erstellt automatisch 6 Rapportblätter für Teilprojekte

### Phase 1A: Datenbank vorbereiten (2 Stunden)
```sql
-- 1. Gesuch-Tabellen erstellen
CREATE TABLE gesuche (
    id SERIAL PRIMARY KEY,
    jahr INTEGER NOT NULL,
    titel VARCHAR(255),
    status VARCHAR(50) DEFAULT 'entwurf',
    budget_total DECIMAL(12,2),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Rapport-Tabelle erweitern
ALTER TABLE rapporte 
ADD COLUMN gesuch_id INTEGER REFERENCES gesuche(id),
ADD COLUMN teilprojekt_nummer VARCHAR(10);
```

### Phase 1B: Backend implementieren (3 Stunden)
1. **gesuch.controller.js** erstellen
   - uploadGesuch() - Gesuch hochladen
   - createRapportsFromGesuch() - 6 Rapporte generieren
   - getGesuche() - Liste aller Gesuche

2. **gesuch.routes.js** erstellen
   - POST /api/gesuche/upload
   - GET /api/gesuche
   - POST /api/gesuche/:id/create-rapporte

### Phase 1C: Frontend erstellen (2 Stunden)
1. **gesuche.html** - Übersichtsseite
2. **gesuch-upload.html** - Upload-Formular
3. Integration in Navigation

### Phase 1D: Automatisierung (1 Stunde)
- Nach Gesuch-Upload → automatisch 6 Rapporte erstellen
- Teilprojekte: TP1-Leitmedien, TP2-Onlinemedien, etc.

---

## 🎯 WORKFLOW 2: GENEHMIGTE RAPPORTE → PDF/GOOGLE DOC
**Ziel:** Wenn alle 6 Rapporte eines Gesuchs genehmigt → Export als PDF/Google Doc

### Phase 2A: Export-Trigger implementieren (2 Stunden)
```javascript
// In rapport.controller.js erweitern
async function checkAllRapportsApproved(gesuchId) {
    // Prüfe ob alle 6 Rapporte genehmigt
    // Wenn ja → Trigger Webhook
}
```

### Phase 2B: n8n Workflow konfigurieren (3 Stunden)
1. **n8n Workflow erstellen:**
   - Webhook empfangen
   - Daten aus DB laden
   - Google Doc Template füllen
   - PDF generieren
   - In Google Drive speichern

2. **Google API Setup:**
   - Service Account erstellen
   - Drive API aktivieren
   - Docs API aktivieren

### Phase 2C: Export-Status anzeigen (1 Stunde)
- Status in UI anzeigen
- Download-Link bereitstellen
- Export-Historie

---

## 📅 ZEITPLAN

### WOCHE 1: Gesuch-System (8 Stunden)
**Tag 1-2:**
- [ ] Datenbank-Migration
- [ ] Backend Controller & Routes
- [ ] Frontend-Seiten

**Tag 3:**
- [ ] Automatische Rapport-Erstellung
- [ ] Testing & Bugfixes

### WOCHE 2: Export-System (6 Stunden)
**Tag 4:**
- [ ] Export-Trigger in Backend
- [ ] n8n Workflow Setup

**Tag 5:**
- [ ] Google API Integration
- [ ] UI für Export-Status

---

## 🛠️ IMPLEMENTIERUNGSREIHENFOLGE

### SOFORT STARTEN (Priorität 1):
1. **Datenbank-Migration** für Gesuch-Tabellen
2. **gesuch.controller.js** mit Upload-Funktion
3. **Simple Upload-Seite** für Tests

### DANACH (Priorität 2):
4. Automatische Rapport-Erstellung
5. Export-Trigger bei Genehmigung
6. n8n Integration

### OPTIONAL (Priorität 3):
7. Erweiterte UI-Features
8. Export-Historie
9. Batch-Operations

---

## ⚡ QUICK WIN STRATEGIE

### Minimal Viable Workflow (3 Tage):
1. **Tag 1:** Gesuch-Upload (nur Backend)
2. **Tag 2:** Auto-Create 6 Rapporte
3. **Tag 3:** Simple Export-Button

### Dann iterativ verbessern:
- Schönere UI
- Mehr Automatisierung
- Erweiterte Features

---

## 🔧 TECHNISCHE DETAILS

### Gesuch → Rapport Mapping:
```javascript
const TEILPROJEKTE = [
    { nummer: 'TP1', name: 'Leitmedien', budget: 1650000 },
    { nummer: 'TP2', name: 'Onlinemedien', budget: 920000 },
    { nummer: 'TP3', name: 'TV', budget: 410000 },
    { nummer: 'TP4', name: 'Radio', budget: 740000 },
    { nummer: 'TP5', name: 'Bevölkerung', budget: 450000 },
    { nummer: 'TP6', name: 'Weiterbildung', budget: 240000 }
];
```

### Webhook Payload für Export:
```json
{
    "gesuch_id": 1,
    "jahr": 2024,
    "rapporte": [...],
    "export_type": "google_doc",
    "template_id": "..."
}
```

---

## ✅ ERFOLGS-KRITERIEN

1. **Workflow 1 funktioniert wenn:**
   - Admin kann Gesuch hochladen
   - System erstellt automatisch 6 Rapporte
   - Rapporte sind den Teilprojekten zugeordnet

2. **Workflow 2 funktioniert wenn:**
   - Bei 6/6 genehmigten Rapporten → Export startet
   - Google Doc wird erstellt und in Drive gespeichert
   - User erhält Download-Link

---

## 🚦 NÄCHSTE SCHRITTE

**JETZT SOFORT:**
1. Entscheidung: Mit welchem Workflow starten?
2. Datenbank-Backup erstellen
3. Mit Phase 1A beginnen

**Diese Woche abschließbar:**
- Kompletter Workflow 1 (Gesuch → Rapporte)
- Basis für Workflow 2

**Realistische Fertigstellung:**
- Beide Workflows komplett: **2 Wochen**
- Mit Testing & Polish: **3 Wochen**