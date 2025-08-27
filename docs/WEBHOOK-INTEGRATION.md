# 🔗 Webhook-Integration mit n8n

## Übersicht

Die SBV Professional V2 Anwendung unterstützt Webhook-Integration mit n8n für die automatisierte Verarbeitung von Geschäftsereignissen. Dies ermöglicht die nahtlose Integration mit externen Systemen wie Google Docs für die automatische Dokumentenerstellung.

## Unterstützte Events

### 1. `gesuch.submitted` - Gesuch eingereicht
Wird ausgelöst, wenn ein Gesuch vom Status "Entwurf" auf "Eingereicht" wechselt.

**Payload-Struktur:**
```json
{
  "event": "gesuch.submitted",
  "timestamp": "2025-07-30T20:30:00.000Z",
  "data": {
    "gesuch": {
      "id": 1,
      "jahr": 2025,
      "titel": "Marketing-Kampagne 2025",
      "status": "eingereicht",
      "erstellt_von": 1,
      "eingereicht_am": "2025-07-30T20:30:00.000Z"
    },
    "teilprojekte": [
      {
        "id": 1,
        "nummer": 1,
        "name": "Digitale Kampagnen",
        "budget": 150000.00,
        "status": "genehmigt",
        "anzahl_rapporte": 5
      }
    ],
    "k_ziele": [...],
    "jahresvergleich": [...],
    "user": {
      "id": 1,
      "username": "admin",
      "email": "admin@sbv.ch",
      "role": "admin"
    }
  },
  "metadata": {
    "webhook_version": "1.0",
    "system": "sbv-professional-v2"
  }
}
```

### 2. `teilprojekt.approved` - Teilprojekt genehmigt
Wird ausgelöst, wenn ein Teilprojekt genehmigt wird.

**Payload-Struktur:**
```json
{
  "event": "teilprojekt.approved",
  "timestamp": "2025-07-30T20:35:00.000Z",
  "data": {
    "teilprojekt": {
      "id": 1,
      "gesuch_id": 1,
      "nummer": 1,
      "name": "Digitale Kampagnen",
      "status": "genehmigt",
      "gesuch_jahr": 2025,
      "gesuch_titel": "Marketing-Kampagne 2025"
    },
    "approved_by": 1
  }
}
```

## Konfiguration

### 1. Environment-Variablen

Fügen Sie folgende Variablen zu Ihrer `.env` Datei hinzu:

```bash
# Webhook aktivieren/deaktivieren
ENABLE_WEBHOOKS=true

# n8n Webhook URL
N8N_WEBHOOK_URL=https://your-n8n-instance.com/webhook/sbv-professional

# Optional: Secret für HMAC-Signatur-Verifizierung
N8N_WEBHOOK_SECRET=your-webhook-secret
```

### 2. n8n Workflow Setup

1. **Webhook-Node erstellen:**
   - Type: Webhook
   - HTTP Method: POST
   - Path: `/webhook/sbv-professional`
   - Response Mode: Immediately
   - Response Data: Success Message

2. **Event-Router hinzufügen:**
   ```javascript
   // Switch Node Expression
   {{ $json.event }}
   ```

3. **Google Docs Integration:**
   - Für `gesuch.submitted`: Erstelle Gesuch-Dokument
   - Für `teilprojekt.approved`: Update Status im Dokument

## Sicherheit

### HMAC-Signatur-Verifizierung

Wenn `N8N_WEBHOOK_SECRET` konfiguriert ist, wird jeder Webhook mit einer HMAC-SHA256-Signatur versehen:

```javascript
// n8n Code zur Verifizierung
const crypto = require('crypto');

const signature = crypto
  .createHmac('sha256', process.env.WEBHOOK_SECRET)
  .update(JSON.stringify($input.json))
  .digest('hex');

if (signature !== $input.headers['x-webhook-signature']) {
  throw new Error('Invalid webhook signature');
}
```

### Headers

Jeder Webhook enthält folgende Header:
- `Content-Type: application/json`
- `X-Webhook-Event: <event-name>`
- `X-Webhook-Timestamp: <ISO-8601-timestamp>`
- `X-Webhook-Signature: <hmac-signature>` (wenn Secret konfiguriert)

## Admin-Interface

Die Webhook-Verwaltung ist über das Admin-Interface verfügbar:

1. **Navigation:** Admin-Bereich → Webhook-Verwaltung
2. **Funktionen:**
   - Webhook-Status einsehen
   - Test-Webhook senden
   - Webhook-Logs durchsuchen
   - Fehlgeschlagene Webhooks erneut versuchen
   - Statistiken und Erfolgsraten

## Fehlerbehandlung

### Retry-Mechanismus

- Fehlgeschlagene Webhooks werden bis zu 3 Mal wiederholt
- Wartezeit zwischen Versuchen: 5 Minuten
- Manuelle Wiederholung über Admin-Interface möglich

### Logging

Alle Webhook-Events werden in der Datenbank protokolliert:
- Erfolgreiche Zustellungen
- Fehlgeschlagene Versuche mit Fehlerdetails
- Response-Daten von n8n

## Testing

### 1. Test-Webhook senden

```bash
# Via Admin-Interface
Admin → Webhook-Verwaltung → "Webhook testen"

# Via API
curl -X POST http://localhost:3000/api/webhooks/test \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Lokale Entwicklung mit ngrok

Für lokale Tests mit n8n Cloud:

```bash
# ngrok installieren
npm install -g ngrok

# Lokalen Server exponieren
ngrok http 3000

# n8n Webhook URL anpassen
N8N_WEBHOOK_URL=https://your-ngrok-url.ngrok.io/webhook-endpoint
```

## Troubleshooting

### Webhook wird nicht gesendet
1. Prüfen Sie `ENABLE_WEBHOOKS=true` in `.env`
2. Verifizieren Sie die `N8N_WEBHOOK_URL`
3. Checken Sie die Logs: `SELECT * FROM webhook_logs ORDER BY created_at DESC`

### Webhook schlägt fehl
1. Prüfen Sie die n8n Workflow-Aktivierung
2. Verifizieren Sie die URL-Erreichbarkeit
3. Checken Sie die Response im Admin-Interface

### HMAC-Fehler
1. Stellen Sie sicher, dass beide Seiten dasselbe Secret verwenden
2. Prüfen Sie die Groß-/Kleinschreibung des Secrets
3. Verifizieren Sie die Payload-Serialisierung

## Best Practices

1. **Idempotenz:** Stellen Sie sicher, dass Ihr n8n Workflow idempotent ist
2. **Timeout:** Setzen Sie ein angemessenes Timeout (30 Sekunden)
3. **Fehlerbehandlung:** Implementieren Sie robuste Fehlerbehandlung in n8n
4. **Monitoring:** Überwachen Sie die Webhook-Statistiken regelmäßig
5. **Sicherheit:** Verwenden Sie immer HTTPS und HMAC-Signaturen in Produktion