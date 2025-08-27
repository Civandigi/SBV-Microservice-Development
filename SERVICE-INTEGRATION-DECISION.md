# Service Integration Entscheidung: EXTERN via API

> Erstellt: 2025-08-27
> Entscheidung: **EXTERNER SERVICE via API Calls**
> Empfehlung: **DEFINITIV EXTERN LASSEN**

## 1. VERGLEICH: Extern vs. Eingebaut

### Option A: EXTERNER SERVICE (via API) ✅ EMPFOHLEN

**Vorteile:**
- ✅ **Klare Trennung**: Service kann unabhängig entwickelt/deployed werden
- ✅ **Skalierbarkeit**: Service kann auf separatem Server laufen
- ✅ **Wiederverwendbarkeit**: Service kann von anderen Apps genutzt werden
- ✅ **Technologie-Freiheit**: Service kann in anderer Sprache sein (Python für PDF?)
- ✅ **Keine Konflikte**: Keine Dependency-Konflikte mit Hauptapp
- ✅ **Einfaches Update**: Service updaten ohne Hauptapp zu touchen
- ✅ **Load Balancing**: Schwere Operationen auslagern
- ✅ **Fehler-Isolation**: Service-Crash beeinflusst Hauptapp nicht

**Nachteile:**
- ❌ Netzwerk-Latenz (minimal bei lokalem Service)
- ❌ API-Versionierung nötig
- ❌ Authentication zwischen Services

### Option B: EINGEBAUTER SERVICE ❌ NICHT EMPFOHLEN

**Vorteile:**
- ✅ Keine Netzwerk-Calls
- ✅ Einfacheres Deployment (alles in einem)
- ✅ Gemeinsame Datenbank direkt

**Nachteile:**
- ❌ **Dependency Hell**: PDF-Libraries könnten konfliktieren
- ❌ **Monolith wird größer**: Schwerer zu warten
- ❌ **Performance**: Heavy Processing blockiert Hauptapp
- ❌ **Kein unabhängiges Scaling**
- ❌ **Technologie-Lock**: Alles muss Node.js sein
- ❌ **Schwieriger zu testen**

## 2. KONKRETE IMPLEMENTATION (Extern via API)

### 2.1 Architektur
```
┌─────────────────────────┐         ┌──────────────────────┐
│   SBV Professional      │         │  Gesuch Service      │
│   (Node.js/Express)     │ <-----> │  (Python/Node/etc)   │
│                         │  HTTP    │                      │
│  - Frontend             │  API     │  - PDF Extraction   │
│  - Backend API          │         │  - Word Generation  │
│  - Database             │         │  - Text Analysis    │
└─────────────────────────┘         └──────────────────────┘
```

### 2.2 API Endpoints Design

#### Von Hauptapp → Service
```javascript
// POST /api/external/gesuch/process
{
    "fileUrl": "https://storage.example.com/gesuch123.pdf",
    "gesuchId": 123,
    "callbackUrl": "https://sbv-app.com/api/webhook/gesuch-processed"
}

// Response
{
    "jobId": "abc-123",
    "status": "processing",
    "estimatedTime": 30
}
```

#### Von Service → Hauptapp (Webhook)
```javascript
// POST /api/webhook/gesuch-processed
{
    "jobId": "abc-123",
    "gesuchId": 123,
    "status": "completed",
    "teilprojekte": [
        {
            "nummer": "TP1",
            "name": "Teilprojekt 1",
            "budget": 50000,
            "massnahmen": [...]
        }
    ]
}
```

### 2.3 Integration in unseren Code

```javascript
// backend/src/services/external-gesuch.service.js

class ExternalGesuchService {
    constructor() {
        this.serviceUrl = process.env.GESUCH_SERVICE_URL || 'http://localhost:3001';
        this.apiKey = process.env.GESUCH_SERVICE_API_KEY;
    }
    
    async processGesuch(fileBuffer, metadata) {
        try {
            // 1. Upload file to service
            const formData = new FormData();
            formData.append('file', fileBuffer);
            formData.append('metadata', JSON.stringify(metadata));
            
            const response = await fetch(`${this.serviceUrl}/api/process`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey
                },
                body: formData
            });
            
            const result = await response.json();
            
            // 2. Store job ID for tracking
            await this.storeJobStatus(result.jobId, 'processing');
            
            return result;
            
        } catch (error) {
            console.error('External service error:', error);
            throw new Error('Gesuch-Service nicht erreichbar');
        }
    }
    
    async handleWebhook(payload) {
        // Process webhook from external service
        const { jobId, gesuchId, teilprojekte } = payload;
        
        // Update database with results
        for (const tp of teilprojekte) {
            await this.createTeilprojekt(gesuchId, tp);
        }
        
        // Update job status
        await this.updateJobStatus(jobId, 'completed');
    }
}
```

## 3. ENVIRONMENT CONFIGURATION

```env
# .env
# External Gesuch Service
GESUCH_SERVICE_URL=http://localhost:3001
GESUCH_SERVICE_API_KEY=your-secure-api-key
GESUCH_SERVICE_TIMEOUT=30000

# Webhook Security
WEBHOOK_SECRET=shared-secret-for-validation
```

## 4. SECURITY CONSIDERATIONS

### API Authentication
```javascript
// Shared API Key
headers: {
    'X-API-Key': process.env.GESUCH_SERVICE_API_KEY
}

// Or JWT if needed
headers: {
    'Authorization': `Bearer ${serviceToken}`
}
```

### Webhook Validation
```javascript
// Validate webhook signature
const crypto = require('crypto');

function validateWebhook(payload, signature) {
    const hash = crypto
        .createHmac('sha256', process.env.WEBHOOK_SECRET)
        .update(JSON.stringify(payload))
        .digest('hex');
    
    return hash === signature;
}
```

## 5. FALLBACK STRATEGY

```javascript
// Falls Service nicht verfügbar
class GesuchFallbackService {
    async processManually(gesuchData) {
        // Manuelle Eingabe ermöglichen
        return {
            mode: 'manual',
            message: 'Automatische Verarbeitung nicht verfügbar'
        };
    }
}
```

## 6. DEVELOPMENT SETUP

### Docker Compose für Development
```yaml
# docker-compose.yml
version: '3.8'
services:
  main-app:
    build: .
    ports:
      - "8081:8081"
    environment:
      - GESUCH_SERVICE_URL=http://gesuch-service:3001
    
  gesuch-service:
    image: gesuch-service:latest
    ports:
      - "3001:3001"
    environment:
      - CALLBACK_URL=http://main-app:8081/api/webhook
```

## 7. IMPLEMENTIERUNGS-SCHRITTE

### Phase 1: Vorbereitung (Tag 1)
1. [ ] API Spezifikation definieren
2. [ ] Webhook Endpoints erstellen
3. [ ] Environment Variables setup
4. [ ] Service Client Klasse

### Phase 2: Integration (Tag 2-3)
1. [ ] File Upload zum Service
2. [ ] Webhook Handler
3. [ ] Status Tracking
4. [ ] Error Handling

### Phase 3: Testing (Tag 4)
1. [ ] Mock Service für Tests
2. [ ] Integration Tests
3. [ ] Fallback Tests
4. [ ] Load Tests

## 8. MONITORING & LOGGING

```javascript
// Logging für Service Calls
class ServiceLogger {
    logRequest(endpoint, payload) {
        console.log(`[EXTERNAL] → ${endpoint}`, {
            timestamp: new Date(),
            size: JSON.stringify(payload).length
        });
    }
    
    logResponse(endpoint, status, duration) {
        console.log(`[EXTERNAL] ← ${endpoint}`, {
            status,
            duration: `${duration}ms`
        });
    }
}
```

## FAZIT

### KLARE EMPFEHLUNG: EXTERN via API

**Warum:**
1. **Separation of Concerns**: Jeder Service macht eine Sache gut
2. **Skalierbarkeit**: Services können unabhängig skalieren
3. **Flexibilität**: Service kann in optimaler Technologie geschrieben sein
4. **Wartbarkeit**: Einfacher zu verstehen und zu warten
5. **Zukunftssicher**: Weitere Services können leicht hinzugefügt werden

**Implementierung:**
- REST API mit JSON
- Webhook für Async-Processing
- API Key Authentication
- Fallback für Ausfälle

**Zeitaufwand:**
- 4 Tage für komplette Integration
- 1 Tag zusätzlich für Testing

---

**ENTSCHEIDUNG: Definitiv EXTERN lassen und via API verbinden!**