# SBV Professional - Implementierungsplan mit Microservice-Architektur

> Version: 3.0 - Mit externem Gesuch-Service Integration
> Erstellt: 2025-08-27
> Architektur: Hauptapp + Gesuch-Microservice
> Ziel: 100% Produktionsreife MIT Microservice-Integration

## ARCHITEKTUR-ÜBERSICHT

```
┌────────────────────────────────────────┐       ┌──────────────────────────────────────┐
│         SBV PROFESSIONAL (MAIN)         │       │      GESUCH-MICROSERVICE             │
├────────────────────────────────────────┤       ├──────────────────────────────────────┤
│                                        │       │                                      │
│  Frontend:                             │       │  Funktionen:                         │
│  - Dashboard                           │       │  - PDF/Word Upload & Parsing         │
│  - Rapport-Verwaltung                 │ API   │  - Teilprojekt-Extraktion           │
│  - User-Management                    │ <---> │  - Rapport-Template Generation      │
│  - Gesuch-UI (zeigt Status)           │       │  - Word-Export (am Ende)            │
│                                        │       │                                      │
│  Backend:                              │       │  Endpoints:                          │
│  - Authentication                     │       │  POST /process-gesuch                │
│  - Rapport CRUD                       │       │  POST /generate-rapporte             │
│  - User Assignment                    │       │  POST /export-word                   │
│  - Webhooks empfangen                 │       │  GET  /status/{jobId}               │
│                                        │       │                                      │
│  Database:                             │       │  Webhooks zu Main:                   │
│  - users, rapporte                    │       │  POST /webhook/gesuch-processed     │
│  - gesuche (Metadaten)                │       │  POST /webhook/rapporte-ready       │
│  - teilprojekte, massnahmen           │       │  POST /webhook/word-ready           │
└────────────────────────────────────────┘       └──────────────────────────────────────┘
```

## WORKFLOW-ÜBERSICHT

```mermaid
1. Admin uploadet Gesuch (PDF/Word) → Main App
2. Main App sendet File → Microservice
3. Microservice extrahiert Teilprojekte
4. Microservice sendet Struktur zurück → Main App (Webhook)
5. Main App speichert in DB
6. Admin weist Teilprojekte zu Usern zu
7. User füllen Rapporte aus (in Main App)
8. Admin genehmigt Rapporte
9. Admin triggert Word-Export → Microservice
10. Microservice generiert Word → sendet Link zurück
```

## DETAILLIERTER UMSETZUNGSPLAN (0-100%)

### PHASE 0: Bereinigung & Microservice-Vorbereitung (0-10%) ✅ ABGESCHLOSSEN
**Dauer: 2 Tage**
**Status: FERTIG (27.08.2025)**
**Fokus: Cleanup + API Design + Webhook Infrastructure**

#### Tag 1: File Cleanup & API Specification (0-5%) ✅ DONE

**Durchgeführte Aktionen:**
1. **File Cleanup:** ✅
   - Gelöscht: sidebar-debug.js, mobile-menu-fix.js, smooth-navigation.js
   - Gelöscht: fix-user-consistency.js, sidebar-preload.css
   - Gelöscht: typografie-audit.md, RESPONSIVE-DESIGN-AUDIT-UND-PLAN.md, test.txt
   
2. **API Specification erstellt:** ✅
   - Datei: `api-specification.yaml`
   - Vollständige OpenAPI 3.0 Spec mit allen Endpoints
   - Webhook-Definitionen dokumentiert
   
3. **Umfangreiche Dokumentation:** ✅
   - `DETAILED-PRODUCTION-ANALYSIS.md` - 68.5% Produktionsreife-Analyse
   - `FILE-MERGE-DECISION-AND-IMPLEMENTATION-PLAN.md` - Merge-Strategie
   - `SERVICE-INTEGRATION-DECISION.md` - Microservice-Architektur-Entscheidung
   - `PRODUCTION-READINESS-ANALYSIS.md` - Gap-Analyse
   
4. **Git Commit:** ✅
   ```bash
   git commit -m "docs: Add comprehensive project documentation and microservice architecture"

paths:
  /process-gesuch:
    post:
      summary: Process uploaded Gesuch file
      requestBody:
        content:
          multipart/form-data:
            schema:
              type: object
              properties:
                file:
                  type: string
                  format: binary
                metadata:
                  type: object
                  properties:
                    gesuchId: integer
                    jahr: integer
                    titel: string
      responses:
        202:
          content:
            application/json:
              schema:
                type: object
                properties:
                  jobId: string
                  status: string
                  message: string

  /generate-rapporte:
    post:
      summary: Generate Rapport templates from Gesuch
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                gesuchId: integer
                teilprojekte: array
                templateSettings: object
      responses:
        200:
          content:
            application/json:
              schema:
                type: object
                properties:
                  rapporte: array
                  count: integer

  /export-word:
    post:
      summary: Export approved Rapporte to Word
      requestBody:
        content:
          application/json:
            schema:
              type: object
              properties:
                rapportIds: array
                gesuchId: integer
                format: string
      responses:
        202:
          content:
            application/json:
              schema:
                type: object
                properties:
                  jobId: string
                  estimatedTime: integer
```

#### Tag 2: Webhook Infrastructure Setup (5-10%) ✅ DONE

**Durchgeführte Aktionen:**

1. **Webhook Controller erstellt:** ✅
   - Datei: `backend/src/controllers/webhook.controller.js`
   - Implementierte Handler:
     - `handleGesuchProcessed()` - Verarbeitet extrahierte Teilprojekte
     - `handleRapporteReady()` - Empfängt generierte Rapport-Templates
     - `handleWordReady()` - Download-Link für Word-Export
   - Webhook-Signatur-Validierung implementiert
   - Webhook-Logging in Datenbank

2. **Webhook Routes erweitert:** ✅
   - Datei: `backend/src/routes/webhook.routes.js`
   - Neue Endpoints:
     ```javascript
     POST /api/webhooks/gesuch-processed
     POST /api/webhooks/rapporte-ready
     POST /api/webhooks/word-ready
     POST /api/webhooks/test-microservice
     ```

3. **Environment Configuration:** ✅
   - Datei: `.env.example` erstellt mit Microservice-Variablen:
     ```env
     GESUCH_SERVICE_URL=http://localhost:3001
     GESUCH_SERVICE_API_KEY=your-api-key
     WEBHOOK_SECRET=shared-webhook-secret
     ENABLE_WEBHOOKS=true
     ```

4. **Database Configuration angepasst:** ✅
   - Datei: `backend/src/config/database.js`
   - SQLite für Development ermöglicht
   - Environment validation angepasst

5. **Git Commit:** ✅
   ```bash
   git commit -m "feat: Add webhook infrastructure for microservice integration"
   ```

**Deliverables Phase 0:**
- ✅ Saubere Codebasis ohne Debug-Files
- ✅ Alle Dokumentation committed (8 Dateien)
- ✅ API-Spezifikation komplett definiert
- ✅ Webhook-Infrastruktur implementiert
- ✅ Environment-Template erstellt
- ✅ System läuft stabil und vollständig funktionsfähig

**Gelöste Probleme:** ✅
1. **Database Safety Check:** ✅ BEHOBEN - dotenv-Pfade korrigiert
2. **Environment Loading:** ✅ BEHOBEN - Alle Config-Dateien auf korrekten Pfad gesetzt  
3. **PostgreSQL Fallback:** ✅ BEHOBEN - SQLite läuft korrekt für Development
4. **Webhook Authentication:** ✅ BEHOBEN - Authentifizierung-Middleware von Webhooks entfernt

**Final Git Commit:** ✅
```bash
git commit -m "fix: Database configuration and webhook authentication issues"
```

**Phase 0 Status:** ✅ **VOLLSTÄNDIG ABGESCHLOSSEN** (27.08.2025)

**System Status:**
- ✅ Server läuft stabil mit SQLite  
- ✅ Alle Webhook-Endpoints getestet und funktionsfähig
- ✅ Database-Verbindung erfolgreich
- ✅ Alle Commits erfolgreich

**Bereit für:** Phase 1 kann sofort beginnen
            
            if (status === 'completed') {
                // Speichere extrahierte Teilprojekte
                for (const tp of teilprojekte) {
                    await query(`
                        INSERT INTO teilprojekte 
                        (gesuch_id, nummer, name, beschreibung, budget)
                        VALUES (?, ?, ?, ?, ?)
                    `, [gesuchId, tp.nummer, tp.name, tp.beschreibung, tp.budget]);
                }
                
                // Update Gesuch status
                await query(
                    'UPDATE gesuche SET status = ? WHERE id = ?',
                    ['verarbeitet', gesuchId]
                );
                
                // Notify frontend via WebSocket
                io.emit('gesuch-processed', { gesuchId, teilprojekte });
            }
            
            res.json({ received: true });
        } catch (error) {
            console.error('Webhook error:', error);
            res.status(500).json({ error: 'Processing failed' });
        }
    }
    
    static async handleRapporteReady(req, res) {
        const { gesuchId, rapporte } = req.body;
        
        // Rapporte in DB speichern
        for (const rapport of rapporte) {
            const result = await query(`
                INSERT INTO rapporte 
                (titel, beschreibung, gesuch_id, teilprojekt_id, status, is_template)
                VALUES (?, ?, ?, ?, 'entwurf', 1)
            `, [rapport.titel, rapport.beschreibung, gesuchId, rapport.teilprojektId]);
            
            // Link in Verknüpfungstabelle
            await query(`
                INSERT INTO gesuch_rapporte 
                (gesuch_id, rapport_id, teilprojekt_id)
                VALUES (?, ?, ?)
            `, [gesuchId, result.lastID, rapport.teilprojektId]);
        }
        
        res.json({ received: true });
    }
    
    static async handleWordReady(req, res) {
        const { jobId, gesuchId, downloadUrl, expiresAt } = req.body;
        
        // Speichere Download-Link
        await query(`
            INSERT INTO document_exports 
            (gesuch_id, job_id, download_url, expires_at, created_at)
            VALUES (?, ?, ?, ?, CURRENT_TIMESTAMP)
        `, [gesuchId, jobId, downloadUrl, expiresAt]);
        
        // Notify admin
        io.emit('export-ready', { gesuchId, downloadUrl });
        
        res.json({ received: true });
    }
    
    static validateSignature(payload, signature) {
        const crypto = require('crypto');
        const expectedSignature = crypto
            .createHmac('sha256', process.env.WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        return signature === expectedSignature;
    }
}
```

### PHASE 1: Datenbank-Fundament mit Microservice-Support (10-25%)
**Dauer: 3 Tage**
**Status: BEREIT**
**Fokus: Schema für Microservice-Integration**
**Voraussetzung: Database-Konfigurationsproblem lösen**

#### Tag 1: Erweiterte Schema für Microservice (10-15%)
```sql
-- backend/migrations/013_microservice_integration.sql

-- Job tracking für async operations
CREATE TABLE IF NOT EXISTS service_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payload TEXT, -- JSON
    result TEXT, -- JSON
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    completed_at DATETIME
);

-- Document exports tracking
CREATE TABLE IF NOT EXISTS document_exports (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gesuch_id INTEGER REFERENCES gesuche(id),
    job_id VARCHAR(255),
    download_url VARCHAR(500),
    expires_at DATETIME,
    downloaded_at DATETIME,
    downloaded_by INTEGER REFERENCES users(id),
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Service webhook logs
CREATE TABLE IF NOT EXISTS webhook_logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    endpoint VARCHAR(255),
    payload TEXT,
    signature VARCHAR(255),
    valid_signature BOOLEAN,
    processed BOOLEAN DEFAULT 0,
    error_message TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
);

-- Erweitere gesuche für Service-Integration
ALTER TABLE gesuche ADD COLUMN service_job_id VARCHAR(255);
ALTER TABLE gesuche ADD COLUMN processing_started_at DATETIME;
ALTER TABLE gesuche ADD COLUMN processing_completed_at DATETIME;
ALTER TABLE gesuche ADD COLUMN service_error TEXT;
```

#### Tag 2: Service Client Implementation (15-20%)
```javascript
// backend/src/services/gesuch-microservice.client.js

class GesuchMicroserviceClient {
    constructor() {
        this.baseUrl = process.env.GESUCH_SERVICE_URL || 'http://localhost:3001';
        this.apiKey = process.env.GESUCH_SERVICE_API_KEY;
        this.timeout = parseInt(process.env.GESUCH_SERVICE_TIMEOUT || '30000');
    }
    
    async processGesuch(fileBuffer, filename, metadata) {
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), filename);
        formData.append('metadata', JSON.stringify({
            gesuchId: metadata.gesuchId,
            jahr: metadata.jahr,
            titel: metadata.titel,
            callbackUrl: `${process.env.APP_URL}/api/webhooks/gesuch-processed`
        }));
        
        try {
            const response = await fetch(`${this.baseUrl}/process-gesuch`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey
                },
                body: formData,
                signal: AbortSignal.timeout(this.timeout)
            });
            
            if (!response.ok) {
                throw new Error(`Service returned ${response.status}`);
            }
            
            const result = await response.json();
            
            // Track job
            await this.trackJob(result.jobId, 'process-gesuch', metadata);
            
            return result;
            
        } catch (error) {
            console.error('Microservice call failed:', error);
            
            // Fallback to manual mode
            return {
                jobId: null,
                status: 'manual',
                message: 'Automatische Verarbeitung nicht verfügbar'
            };
        }
    }
    
    async generateRapporte(gesuchId, teilprojekte, settings = {}) {
        const payload = {
            gesuchId,
            teilprojekte,
            templateSettings: settings,
            callbackUrl: `${process.env.APP_URL}/api/webhooks/rapporte-ready`
        };
        
        const response = await fetch(`${this.baseUrl}/generate-rapporte`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey
            },
            body: JSON.stringify(payload)
        });
        
        return await response.json();
    }
    
    async exportWord(rapportIds, gesuchId, format = 'docx') {
        const payload = {
            rapportIds,
            gesuchId,
            format,
            callbackUrl: `${process.env.APP_URL}/api/webhooks/word-ready`
        };
        
        const response = await fetch(`${this.baseUrl}/export-word`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'X-API-Key': this.apiKey
            },
            body: JSON.stringify(payload)
        });
        
        const result = await response.json();
        
        // Track job
        await this.trackJob(result.jobId, 'export-word', payload);
        
        return result;
    }
    
    async getJobStatus(jobId) {
        const response = await fetch(`${this.baseUrl}/status/${jobId}`, {
            headers: {
                'X-API-Key': this.apiKey
            }
        });
        
        return await response.json();
    }
    
    async trackJob(jobId, operation, payload) {
        await query(`
            INSERT INTO service_jobs (job_id, service_name, operation, payload, status)
            VALUES (?, 'gesuch-microservice', ?, ?, 'pending')
        `, [jobId, operation, JSON.stringify(payload)]);
    }
}

module.exports = new GesuchMicroserviceClient();
```

#### Tag 3: Fallback & Error Handling (20-25%)
```javascript
// backend/src/services/gesuch-fallback.service.js

class GesuchFallbackService {
    // Wenn Microservice nicht verfügbar
    async createManualGesuch(data) {
        // Erstelle Gesuch ohne automatische Verarbeitung
        const result = await query(`
            INSERT INTO gesuche 
            (jahr, titel, beschreibung, status, bearbeitet_von)
            VALUES (?, ?, ?, 'manuell', ?)
        `, [data.jahr, data.titel, data.beschreibung, data.userId]);
        
        return {
            gesuchId: result.lastID,
            mode: 'manual',
            message: 'Bitte Teilprojekte manuell erfassen'
        };
    }
    
    async createManualTeilprojekte(gesuchId, teilprojekte) {
        for (const tp of teilprojekte) {
            await query(`
                INSERT INTO teilprojekte 
                (gesuch_id, nummer, name, budget, status)
                VALUES (?, ?, ?, ?, 'manuell')
            `, [gesuchId, tp.nummer, tp.name, tp.budget]);
        }
    }
    
    async generateBasicRapportTemplate(teilprojekt) {
        // Einfaches Template ohne Service
        return {
            titel: `Rapport für ${teilprojekt.name}`,
            beschreibung: `Bitte ausfüllen für Teilprojekt ${teilprojekt.nummer}`,
            felder: this.getDefaultFields()
        };
    }
    
    getDefaultFields() {
        return [
            { key: 'ziele', label: 'Projektziele', type: 'textarea' },
            { key: 'massnahmen', label: 'Durchgeführte Maßnahmen', type: 'textarea' },
            { key: 'ergebnisse', label: 'Ergebnisse', type: 'textarea' },
            { key: 'budget', label: 'Budgetverwendung', type: 'number' }
        ];
    }
}
```

### PHASE 2: Backend API mit Microservice-Integration (25-45%)
**Dauer: 4 Tage**
**Fokus: Vollständige Service-Integration**

#### Tag 1: Gesuch Upload Flow (25-30%)
```javascript
// backend/src/controllers/gesuch.controller.js

const microserviceClient = require('../services/gesuch-microservice.client');
const fallbackService = require('../services/gesuch-fallback.service');

class GesuchController {
    static async upload(req, res) {
        try {
            const { jahr, titel, beschreibung } = req.body;
            const file = req.file;
            
            // 1. Speichere Gesuch-Metadaten
            const gesuchResult = await query(`
                INSERT INTO gesuche 
                (jahr, titel, beschreibung, datei_name, datei_groesse, status, bearbeitet_von)
                VALUES (?, ?, ?, ?, ?, 'hochgeladen', ?)
            `, [jahr, titel, beschreibung, file.originalname, file.size, req.user.id]);
            
            const gesuchId = gesuchResult.lastID;
            
            // 2. Sende an Microservice
            const serviceResult = await microserviceClient.processGesuch(
                file.buffer,
                file.originalname,
                { gesuchId, jahr, titel }
            );
            
            if (serviceResult.jobId) {
                // 3. Update mit Job ID
                await query(
                    'UPDATE gesuche SET service_job_id = ?, status = ? WHERE id = ?',
                    [serviceResult.jobId, 'verarbeitung', gesuchId]
                );
                
                res.json({
                    success: true,
                    gesuchId,
                    jobId: serviceResult.jobId,
                    status: 'processing',
                    message: 'Gesuch wird verarbeitet'
                });
            } else {
                // 4. Fallback zu manuell
                res.json({
                    success: true,
                    gesuchId,
                    status: 'manual',
                    message: 'Bitte Teilprojekte manuell erfassen'
                });
            }
            
        } catch (error) {
            console.error('Upload error:', error);
            res.status(500).json({
                success: false,
                message: 'Upload fehlgeschlagen'
            });
        }
    }
    
    static async checkStatus(req, res) {
        const { gesuchId } = req.params;
        
        const gesuch = await query(
            'SELECT * FROM gesuche WHERE id = ?',
            [gesuchId]
        );
        
        if (gesuch.rows[0].service_job_id) {
            // Check with microservice
            const status = await microserviceClient.getJobStatus(
                gesuch.rows[0].service_job_id
            );
            
            res.json({
                success: true,
                status: status.status,
                progress: status.progress,
                message: status.message
            });
        } else {
            res.json({
                success: true,
                status: gesuch.rows[0].status
            });
        }
    }
}
```

#### Tag 2: Rapport Generation Flow (30-35%)
```javascript
// backend/src/controllers/rapport.controller.js

class RapportController {
    static async generateFromGesuch(req, res) {
        const { gesuchId } = req.params;
        const { selectedTeilprojekte, settings } = req.body;
        
        try {
            // 1. Hole Teilprojekte aus DB
            const teilprojekte = await query(
                'SELECT * FROM teilprojekte WHERE gesuch_id = ? AND id IN (?)',
                [gesuchId, selectedTeilprojekte]
            );
            
            // 2. Sende an Microservice für Template-Generation
            const result = await microserviceClient.generateRapporte(
                gesuchId,
                teilprojekte.rows,
                settings
            );
            
            if (result.immediate) {
                // Synchrone Antwort
                for (const rapport of result.rapporte) {
                    await this.createRapportFromTemplate(rapport, gesuchId);
                }
                
                res.json({
                    success: true,
                    message: `${result.rapporte.length} Rapporte erstellt`,
                    rapportIds: result.rapportIds
                });
            } else {
                // Asynchron via Webhook
                res.json({
                    success: true,
                    jobId: result.jobId,
                    message: 'Rapporte werden generiert'
                });
            }
            
        } catch (error) {
            // Fallback: Einfache Templates
            const rapporte = await this.generateSimpleTemplates(
                gesuchId, 
                selectedTeilprojekte
            );
            
            res.json({
                success: true,
                message: 'Einfache Rapporte erstellt',
                rapporte
            });
        }
    }
    
    static async createRapportFromTemplate(template, gesuchId) {
        const result = await query(`
            INSERT INTO rapporte 
            (titel, beschreibung, gesuch_id, teilprojekt_id, 
             massnahme_id, status, is_template, author_id)
            VALUES (?, ?, ?, ?, ?, 'entwurf', 1, ?)
        `, [
            template.titel,
            template.beschreibung,
            gesuchId,
            template.teilprojektId,
            template.massnahmeId,
            template.assignedTo || null
        ]);
        
        return result.lastID;
    }
}
```

#### Tag 3: Word Export Integration (35-40%)
```javascript
// backend/src/controllers/export.controller.js

class ExportController {
    static async exportToWord(req, res) {
        const { rapportIds, format = 'docx' } = req.body;
        
        try {
            // 1. Hole alle Rapport-Daten
            const rapporte = await query(
                `SELECT r.*, g.titel as gesuch_titel, t.name as teilprojekt_name
                 FROM rapporte r
                 LEFT JOIN gesuche g ON r.gesuch_id = g.id
                 LEFT JOIN teilprojekte t ON r.teilprojekt_id = t.id
                 WHERE r.id IN (?)`,
                [rapportIds]
            );
            
            // 2. Sende an Microservice
            const result = await microserviceClient.exportWord(
                rapportIds,
                rapporte.rows[0].gesuch_id,
                format
            );
            
            if (result.jobId) {
                res.json({
                    success: true,
                    jobId: result.jobId,
                    message: 'Export wird erstellt',
                    estimatedTime: result.estimatedTime
                });
            } else if (result.downloadUrl) {
                // Direkter Download
                res.json({
                    success: true,
                    downloadUrl: result.downloadUrl,
                    expiresAt: result.expiresAt
                });
            }
            
        } catch (error) {
            // Fallback: CSV Export
            const csv = await this.generateCSV(rapportIds);
            res.setHeader('Content-Type', 'text/csv');
            res.setHeader('Content-Disposition', 'attachment; filename=rapporte.csv');
            res.send(csv);
        }
    }
    
    static async checkExportStatus(req, res) {
        const { jobId } = req.params;
        
        const job = await query(
            'SELECT * FROM service_jobs WHERE job_id = ?',
            [jobId]
        );
        
        if (job.rows[0].status === 'completed') {
            const export = await query(
                'SELECT * FROM document_exports WHERE job_id = ?',
                [jobId]
            );
            
            res.json({
                success: true,
                status: 'completed',
                downloadUrl: export.rows[0].download_url,
                expiresAt: export.rows[0].expires_at
            });
        } else {
            res.json({
                success: true,
                status: job.rows[0].status,
                error: job.rows[0].error_message
            });
        }
    }
}
```

#### Tag 4: Testing der Integration (40-45%)
```javascript
// backend/tests/integration/microservice.test.js

describe('Microservice Integration', () => {
    let mockService;
    
    beforeEach(() => {
        // Mock Microservice
        mockService = new MockMicroservice();
        mockService.start(3001);
    });
    
    test('Gesuch upload triggers microservice', async () => {
        const response = await request(app)
            .post('/api/gesuch/upload')
            .attach('file', 'test-gesuch.pdf')
            .field('jahr', 2025)
            .field('titel', 'Test Gesuch');
        
        expect(response.body.jobId).toBeDefined();
        expect(mockService.receivedCalls).toContain('/process-gesuch');
    });
    
    test('Webhook updates database correctly', async () => {
        const webhookPayload = {
            jobId: 'test-123',
            gesuchId: 1,
            status: 'completed',
            teilprojekte: [
                { nummer: 'TP1', name: 'Test', budget: 10000 }
            ]
        };
        
        const response = await request(app)
            .post('/api/webhooks/gesuch-processed')
            .set('X-Webhook-Signature', generateSignature(webhookPayload))
            .send(webhookPayload);
        
        expect(response.status).toBe(200);
        
        const tp = await query('SELECT * FROM teilprojekte WHERE gesuch_id = 1');
        expect(tp.rows).toHaveLength(1);
    });
});
```

### PHASE 3: Frontend mit Service-Status (45-70%)
**Dauer: 5 Tage**
**Fokus: UI für Microservice-Workflow**

#### Tag 1-2: Gesuch Upload mit Progress (45-55%)
```javascript
// frontend/assets/js/gesuch-enhanced.js

class GesuchManagerWithService {
    constructor() {
        this.initWebSocket();
    }
    
    initWebSocket() {
        this.socket = io();
        
        this.socket.on('gesuch-processed', (data) => {
            this.handleProcessingComplete(data);
        });
        
        this.socket.on('export-ready', (data) => {
            this.handleExportReady(data);
        });
    }
    
    async uploadGesuch(formData) {
        const uploadUI = this.createUploadUI();
        
        try {
            // 1. Upload mit Progress
            const response = await this.uploadWithProgress(formData, (progress) => {
                uploadUI.updateProgress(progress);
            });
            
            const result = await response.json();
            
            if (result.jobId) {
                // 2. Poll für Status
                uploadUI.showProcessing();
                this.pollJobStatus(result.jobId, uploadUI);
            } else if (result.status === 'manual') {
                // 3. Zeige manuelle Eingabe
                uploadUI.showManualMode();
                this.openManualEntry(result.gesuchId);
            }
            
        } catch (error) {
            uploadUI.showError(error.message);
        }
    }
    
    async pollJobStatus(jobId, ui) {
        const checkStatus = async () => {
            const response = await fetch(`/api/jobs/${jobId}/status`);
            const status = await response.json();
            
            ui.updateStatus(status);
            
            if (status.status === 'processing') {
                setTimeout(checkStatus, 2000);
            } else if (status.status === 'completed') {
                ui.showSuccess();
                this.loadGesuche();
            } else if (status.status === 'failed') {
                ui.showError(status.error);
            }
        };
        
        checkStatus();
    }
    
    createUploadUI() {
        return {
            element: document.createElement('div'),
            updateProgress(percent) {
                this.element.querySelector('.progress-bar').style.width = `${percent}%`;
            },
            showProcessing() {
                this.element.innerHTML = `
                    <div class="processing-indicator">
                        <div class="spinner"></div>
                        <p>Gesuch wird verarbeitet...</p>
                        <p class="status-text">Extrahiere Teilprojekte...</p>
                    </div>
                `;
            },
            updateStatus(status) {
                this.element.querySelector('.status-text').textContent = 
                    status.message || `${status.progress}% verarbeitet`;
            },
            showSuccess() {
                this.element.innerHTML = `
                    <div class="success-message">
                        <svg class="checkmark">...</svg>
                        <p>Gesuch erfolgreich verarbeitet!</p>
                    </div>
                `;
            },
            showError(message) {
                this.element.innerHTML = `
                    <div class="error-message">
                        <p>Fehler: ${message}</p>
                        <button onclick="gesuchManager.retryUpload()">Erneut versuchen</button>
                    </div>
                `;
            },
            showManualMode() {
                this.element.innerHTML = `
                    <div class="manual-mode">
                        <p>Automatische Verarbeitung nicht verfügbar</p>
                        <button onclick="gesuchManager.openManualEntry()">
                            Teilprojekte manuell erfassen
                        </button>
                    </div>
                `;
            }
        };
    }
}
```

#### Tag 3: Teilprojekt-Management mit Service-Status (55-60%)
```html
<!-- frontend/pages/teilprojekte-enhanced.html -->
<div class="teilprojekt-manager">
    <div class="service-status">
        <span class="status-indicator" id="serviceStatus"></span>
        <span class="status-text">Service Status</span>
    </div>
    
    <div class="teilprojekte-list">
        <!-- Automatisch extrahierte TPs -->
        <div class="tp-section">
            <h3>Automatisch erkannt</h3>
            <div id="autoTeilprojekte"></div>
        </div>
        
        <!-- Manuell hinzugefügte TPs -->
        <div class="tp-section">
            <h3>Manuell hinzugefügt</h3>
            <div id="manualTeilprojekte"></div>
            <button onclick="addManualTP()">+ Teilprojekt hinzufügen</button>
        </div>
    </div>
    
    <div class="actions">
        <button onclick="generateRapporte()" class="btn-primary">
            Rapporte generieren
        </button>
        <span class="hint">Via Microservice</span>
    </div>
</div>
```

#### Tag 4-5: Word Export UI (60-70%)
```javascript
// frontend/assets/js/export-manager.js

class ExportManager {
    async exportToWord(rapportIds) {
        const modal = this.showExportModal();
        
        try {
            const response = await fetch('/api/export/word', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${this.token}`
                },
                body: JSON.stringify({ rapportIds })
            });
            
            const result = await response.json();
            
            if (result.jobId) {
                // Async export
                modal.showProcessing();
                this.pollExportStatus(result.jobId, modal);
            } else if (result.downloadUrl) {
                // Direct download
                modal.showDownloadReady(result.downloadUrl);
            }
            
        } catch (error) {
            modal.showError(error.message);
        }
    }
    
    async pollExportStatus(jobId, modal) {
        const checkStatus = async () => {
            const response = await fetch(`/api/export/${jobId}/status`);
            const status = await response.json();
            
            if (status.status === 'completed') {
                modal.showDownloadReady(status.downloadUrl);
            } else if (status.status === 'processing') {
                setTimeout(checkStatus, 3000);
            } else if (status.status === 'failed') {
                modal.showError(status.error);
            }
        };
        
        checkStatus();
    }
    
    showExportModal() {
        const modal = document.createElement('div');
        modal.className = 'export-modal';
        modal.innerHTML = `
            <div class="modal-content">
                <h2>Word-Export wird vorbereitet...</h2>
                <div class="export-progress">
                    <div class="spinner"></div>
                </div>
            </div>
        `;
        
        document.body.appendChild(modal);
        
        return {
            showProcessing() {
                modal.querySelector('.modal-content').innerHTML = `
                    <h2>Dokument wird generiert...</h2>
                    <div class="progress-bar-container">
                        <div class="progress-bar animated"></div>
                    </div>
                    <p>Dies kann einige Minuten dauern</p>
                `;
            },
            showDownloadReady(url) {
                modal.querySelector('.modal-content').innerHTML = `
                    <h2>✓ Export bereit!</h2>
                    <a href="${url}" class="btn-download" download>
                        Word-Dokument herunterladen
                    </a>
                    <p class="expires">Link gültig für 24 Stunden</p>
                `;
            },
            showError(message) {
                modal.querySelector('.modal-content').innerHTML = `
                    <h2>❌ Export fehlgeschlagen</h2>
                    <p>${message}</p>
                    <button onclick="exportManager.retry()">Erneut versuchen</button>
                `;
            }
        };
    }
}
```

### PHASE 4: Admin Features mit Service-Monitoring (70-85%)
**Dauer: 3 Tage**

#### Tag 1: Service Health Monitoring (70-75%)
```javascript
// backend/src/controllers/health.controller.js

class HealthController {
    static async checkServices(req, res) {
        const services = {
            database: await this.checkDatabase(),
            microservice: await this.checkMicroservice(),
            storage: await this.checkStorage()
        };
        
        const overall = Object.values(services).every(s => s.status === 'healthy');
        
        res.json({
            status: overall ? 'healthy' : 'degraded',
            services,
            timestamp: new Date()
        });
    }
    
    static async checkMicroservice() {
        try {
            const response = await fetch(
                `${process.env.GESUCH_SERVICE_URL}/health`,
                { signal: AbortSignal.timeout(5000) }
            );
            
            return {
                status: response.ok ? 'healthy' : 'unhealthy',
                responseTime: response.headers.get('X-Response-Time'),
                version: response.headers.get('X-Service-Version')
            };
        } catch (error) {
            return {
                status: 'offline',
                error: error.message
            };
        }
    }
}
```

#### Tag 2-3: Admin Dashboard für Service-Überwachung (75-85%)
```javascript
// frontend/assets/js/admin-service-dashboard.js

class ServiceDashboard {
    constructor() {
        this.initServiceMonitoring();
        this.loadServiceStats();
    }
    
    initServiceMonitoring() {
        // Real-time service status
        setInterval(() => this.checkServiceHealth(), 30000);
        
        // WebSocket for live updates
        this.socket.on('service-status', (status) => {
            this.updateServiceIndicator(status);
        });
    }
    
    async loadServiceStats() {
        const stats = await fetch('/api/admin/service-stats').then(r => r.json());
        
        this.renderStats({
            totalJobs: stats.totalJobs,
            successRate: stats.successRate,
            avgProcessingTime: stats.avgProcessingTime,
            failedJobs: stats.failedJobs,
            pendingJobs: stats.pendingJobs
        });
    }
    
    renderStats(stats) {
        document.getElementById('serviceStats').innerHTML = `
            <div class="stats-grid">
                <div class="stat-card">
                    <h3>Total Jobs</h3>
                    <p class="stat-value">${stats.totalJobs}</p>
                </div>
                <div class="stat-card">
                    <h3>Success Rate</h3>
                    <p class="stat-value">${stats.successRate}%</p>
                </div>
                <div class="stat-card">
                    <h3>Avg Processing</h3>
                    <p class="stat-value">${stats.avgProcessingTime}s</p>
                </div>
                <div class="stat-card ${stats.failedJobs > 0 ? 'alert' : ''}">
                    <h3>Failed Jobs</h3>
                    <p class="stat-value">${stats.failedJobs}</p>
                </div>
            </div>
        `;
    }
}
```

### PHASE 5: Testing & Optimierung (85-95%)
**Dauer: 3 Tage**

#### Tag 1: Integration Tests (85-88%)
```javascript
// Mock Service für Tests
class MockMicroservice {
    constructor() {
        this.app = express();
        this.setupRoutes();
    }
    
    setupRoutes() {
        this.app.post('/process-gesuch', (req, res) => {
            res.json({
                jobId: 'mock-job-123',
                status: 'processing'
            });
            
            // Simulate async processing
            setTimeout(() => {
                this.sendWebhook({
                    jobId: 'mock-job-123',
                    status: 'completed',
                    teilprojekte: this.generateMockTeilprojekte()
                });
            }, 1000);
        });
    }
}
```

#### Tag 2: Performance & Caching (88-92%)
```javascript
// Caching für Service-Responses
const cache = new Map();

async function cachedServiceCall(key, fn, ttl = 300000) {
    if (cache.has(key)) {
        const cached = cache.get(key);
        if (Date.now() - cached.time < ttl) {
            return cached.data;
        }
    }
    
    const data = await fn();
    cache.set(key, { data, time: Date.now() });
    return data;
}
```

#### Tag 3: Security Hardening (92-95%)
```javascript
// Rate limiting für Service calls
const rateLimiter = rateLimit({
    windowMs: 60000,
    max: 10,
    message: 'Zu viele Service-Anfragen'
});

app.use('/api/gesuch/upload', rateLimiter);
app.use('/api/export', rateLimiter);
```

### PHASE 6: Final Polish (95-100%)
**Dauer: 2 Tage**

#### Tag 1: Error Recovery (95-98%)
- Retry-Mechanismen
- Fallback für alle Service-Calls
- User-Feedback bei Fehlern

#### Tag 2: Documentation (98-100%)
- API Documentation
- Service Integration Guide
- Deployment Instructions

## ZUSAMMENFASSUNG

### Architektur-Entscheidungen
✅ **Microservice für**:
- Gesuch-Processing (PDF/Word → Teilprojekte)
- Rapport-Template Generation
- Word-Export

✅ **Hauptapp behält**:
- User Management
- Rapport CRUD
- Zuweisung & Workflows
- Frontend

### Kritische Integration Points
1. **Upload** → Service → **Webhook**
2. **Generate** → Service → **Webhook**
3. **Export** → Service → **Download**

### Fallback für alles
- Manuelle Eingabe wenn Service down
- CSV Export statt Word
- Simple Templates statt AI-Generated

### Timeline
- **22 Arbeitstage** total
- **4 Tage zusätzlich** für Service-Integration
- **Parallel möglich**: Service-Entwicklung während Phase 1-2

### Definition of Done (100%)
- [ ] Gesuch Upload mit Service funktioniert
- [ ] Fallback für Service-Ausfall implementiert
- [ ] Webhooks empfangen und verarbeiten
- [ ] Word-Export via Service möglich
- [ ] Admin kann Service überwachen
- [ ] 60% Test Coverage inkl. Service-Mocks
- [ ] Performance < 3s für alle Operations
- [ ] Security-Audit bestanden
- [ ] Dokumentation komplett

---

**Der Service wird als BLACK BOX behandelt - wir definieren nur die Schnittstellen!**