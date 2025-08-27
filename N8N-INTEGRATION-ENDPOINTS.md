# 🔗 N8N INTEGRATION - API ENDPOINTS

## Für deinen n8n Workflow brauchst du diese Endpoints:

### 1️⃣ TEILPROJEKT ENDPOINT (HTTP Request Node)
```
URL: http://localhost:8080/api/gesuch/teilprojekt
Method: POST
Headers: Content-Type: application/json
```

**Dieser Endpoint:**
- Erstellt automatisch einen Rapport aus jedem Teilprojekt
- Speichert alle Daten strukturiert in der Datenbank
- Keine Authentifizierung nötig (für n8n optimiert)

### 2️⃣ SUMMARY ENDPOINT (HTTP Request Node am Ende)
```
URL: http://localhost:8080/api/gesuch/summary
Method: POST
Headers: Content-Type: application/json
```

**Dieser Endpoint:**
- Speichert die Zusammenfassung aller verarbeiteten Teilprojekte
- Aktualisiert das Gesuch mit Gesamtbudget und Status
- Keine Authentifizierung nötig (für n8n optimiert)

## 📝 WAS DU IN N8N KONFIGURIEREN MUSST:

### Im ersten HTTP Request Node (für jedes Teilprojekt):
```javascript
// URL eintragen:
http://localhost:8080/api/gesuch/teilprojekt

// Body bleibt wie es ist - der Workflow sendet bereits die richtigen Felder:
{
  "gesuchId": "...",
  "jahr": 2024,
  "teilprojektId": "TP1",
  "teilprojektName": "...",
  "beschreibung": "...",
  // ... alle anderen Felder
}
```

### Im letzten HTTP Request Node (Summary):
```javascript
// URL eintragen:
http://localhost:8080/api/gesuch/summary

// Body bleibt wie es ist
```

## ✅ WAS BEREITS FUNKTIONIERT:

- ✓ Datenbank-Tabellen erstellt (gesuche, rapporte erweitert)
- ✓ API-Endpoints implementiert und online
- ✓ Server läuft auf Port 8080
- ✓ Keine Authentifizierung für n8n Endpoints (wie gewünscht)

## 🧪 TEST-KOMMANDO:

Du kannst die Endpoints sofort testen:

```bash
# Test Teilprojekt Endpoint
curl -X POST http://localhost:8080/api/gesuch/teilprojekt \
  -H "Content-Type: application/json" \
  -d '{
    "gesuchId": "test-2024",
    "jahr": 2024,
    "teilprojektId": "TP1",
    "teilprojektName": "Test Teilprojekt",
    "beschreibung": "Test Beschreibung",
    "budget": {"total": 50000}
  }'
```

## 🚨 WICHTIG FÜR PRODUKTION:

Später musst du die URLs anpassen:
- Entwicklung: http://localhost:8080/api/gesuch/...
- Produktion: https://deine-domain.com/api/gesuch/...

## 📊 MASTER LOG UPDATE:

Diese Endpoints sind dokumentiert in:
- MASTER-IMPLEMENTATION-LOG.md
- N8N-VS-INAPP-ANALYSE.md

---

**STATUS:** ✅ BEREIT FÜR N8N INTEGRATION