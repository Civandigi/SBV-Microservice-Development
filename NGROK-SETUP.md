# 🌐 NGROK SETUP - Backend öffentlich machen

## Schnellste Lösung für n8n Integration

### 1. Ngrok installieren (Windows)

```powershell
# Option A: Mit Chocolatey
choco install ngrok

# Option B: Direkt Download
# Gehe zu: https://ngrok.com/download
# Lade Windows Version herunter
```

### 2. Ngrok starten

```bash
# In neuem Terminal/PowerShell:
ngrok http 8080
```

### 3. Du bekommst eine URL wie:

```
Forwarding: https://abc123xyz.ngrok-free.app -> http://localhost:8080
```

### 4. Diese URL in n8n verwenden:

Ersetze in deinem n8n Workflow:
- `http://localhost:8080/api/gesuch/teilprojekt`
- wird zu: `https://abc123xyz.ngrok-free.app/api/gesuch/teilprojekt`

### 5. Wichtige URLs für n8n:

```javascript
// In n8n Webhook Node eingeben:
{
  "fileUrl": "GOOGLE_DOCS_EXPORT_URL",
  "gesuchId": "gesuch-2024",
  "apiEndpoint": "https://DEINE-NGROK-URL.ngrok-free.app/api/gesuch/teilprojekt",
  "summaryEndpoint": "https://DEINE-NGROK-URL.ngrok-free.app/api/gesuch/summary"
}
```

## ⚠️ WICHTIG:

- Ngrok URL ändert sich bei jedem Neustart
- Kostenlose Version hat Limits (40 requests/minute)
- Für Produktion: Feste Domain nötig

## Alternative: Render.com Deploy

Wenn du eine permanente Lösung willst:
1. Push Code zu GitHub
2. Deploy auf Render.com (kostenlos)
3. Bekommst feste URL wie: `https://sbv-app.onrender.com`