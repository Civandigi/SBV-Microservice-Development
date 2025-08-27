# SBV Gesuch- und Rapport-Management System - Implementierungskonzept

## Inhaltsverzeichnis
1. [Systemübersicht](#systemübersicht)
2. [Phase 1: Datenbank-Fundament](#phase-1-datenbank-fundament)
3. [Phase 2: Backend-API Entwicklung](#phase-2-backend-api-entwicklung)
4. [Phase 3: Frontend-Entwicklung](#phase-3-frontend-entwicklung)
5. [Phase 4: Integration und Validierung](#phase-4-integration-und-validierung)
6. [Phase 5: Testing und Deployment](#phase-5-testing-und-deployment)
7. [Implementierungs-Checkliste](#implementierungs-checkliste)

---

## Systemübersicht

### Ziel
Ein hierarchisches System zur Verwaltung von Jahresgesuchen mit 6 Teilprojekten (TP1-TP6), das die komplette Berichterstattung von der Erstellung bis zum finalen Erfolgsnachweis-Dokument über einen n8n-Webhook abdeckt.

### Kernfunktionen
- **Gesuch-Verwaltung**: Ein Gesuch pro Jahr mit 6 Teilprojekten
- **Rapport-System**: Detaillierte Berichte pro Teilprojekt
- **Workflow**: Von Erstellung bis Genehmigung
- **Webhook-Integration**: Automatische Dokumentenerstellung via n8n
- **Erfolgsnachweis**: Generierung des finalen Reports als Google Doc

### Datenfluss
```
Admin erstellt Gesuch (2024)
    ↓
User erstellen 6 Rapporte (TP1-TP6)
    ↓
Admin genehmigt alle Rapporte
    ↓
Admin füllt Zusatzdaten aus (K-Ziele, etc.)
    ↓
Admin reicht Gesuch ein → Webhook an n8n
    ↓
n8n generiert Google Doc
    ↓
Callback mit Document-URL
```

---

## Phase 1: Datenbank-Fundament

### 1.1 Core-Tabellen

#### Gesuche-Tabelle
```sql
-- Haupttabelle für Jahresgesuche
CREATE TABLE gesuche (
    id SERIAL PRIMARY KEY,
    gesuch_nummer VARCHAR(50) UNIQUE NOT NULL, -- z.B. "194.1999"
    jahr INTEGER NOT NULL,
    titel VARCHAR(255) DEFAULT 'Kommunikationsförderung Landwirtschaft',
    gesamtbudget DECIMAL(12,2) DEFAULT 4411920,
    finanzhilfe DECIMAL(12,2) DEFAULT 2205960,
    eigenmittel DECIMAL(12,2) DEFAULT 2260000,
    status VARCHAR(50) DEFAULT 'entwurf', 
    -- Status: entwurf, in_bearbeitung, vollstaendig, eingereicht, abgeschlossen
    anzahl_tp_total INTEGER DEFAULT 6,
    anzahl_tp_genehmigt INTEGER DEFAULT 0,
    webhook_status VARCHAR(50), -- pending, processing, completed, failed
    webhook_session_id VARCHAR(255),
    document_url TEXT,
    document_id VARCHAR(255),
    document_name VARCHAR(255),
    created_by INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT NOW(),
    submitted_at TIMESTAMP,
    completed_at TIMESTAMP,
    CONSTRAINT unique_gesuch_jahr UNIQUE(jahr)
);

-- Index für Performance
CREATE INDEX idx_gesuche_jahr ON gesuche(jahr);
CREATE INDEX idx_gesuche_status ON gesuche(status);
```

#### Erweiterte Rapporte-Tabelle
```sql
-- Rapporte mit Gesuch-Verknüpfung
ALTER TABLE rapporte 
ADD COLUMN gesuch_id INTEGER REFERENCES gesuche(id) ON DELETE CASCADE,
ADD COLUMN teilprojekt_nummer VARCHAR(10), -- TP1, TP2, etc.
ADD COLUMN teilprojekt_name VARCHAR(255),
ADD COLUMN abweichung_kommentar TEXT,
ADD COLUMN effizienz_prozent DECIMAL(5,2),
ADD CONSTRAINT unique_gesuch_tp UNIQUE(gesuch_id, teilprojekt_nummer);

-- Index für Performance
CREATE INDEX idx_rapporte_gesuch ON rapporte(gesuch_id);
```

### 1.2 Massnahmen-Struktur

```sql
-- Detaillierte Massnahmen pro Rapport (max 5 pro Rapport)
CREATE TABLE massnahmen (
    id SERIAL PRIMARY KEY,
    rapport_id INTEGER REFERENCES rapporte(id) ON DELETE CASCADE,
    nr INTEGER NOT NULL CHECK (nr BETWEEN 1 AND 5),
    massnahme VARCHAR(255) NOT NULL,
    kanal VARCHAR(255),
    budget_brutto DECIMAL(12,2) DEFAULT 0,
    ist_brutto DECIMAL(12,2) DEFAULT 0,
    aufwandsminderung DECIMAL(12,2) DEFAULT 0,
    kosten_netto DECIMAL(12,2) GENERATED ALWAYS AS (ist_brutto - aufwandsminderung) STORED,
    bemerkung TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_rapport_massnahme UNIQUE(rapport_id, nr)
);

-- Index für Performance
CREATE INDEX idx_massnahmen_rapport ON massnahmen(rapport_id);
```

### 1.3 K-Ziele und Kennzahlen

```sql
-- K-Ziele Matrix (genau 5 pro Gesuch)
CREATE TABLE k_ziele (
    id SERIAL PRIMARY KEY,
    gesuch_id INTEGER REFERENCES gesuche(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
    name VARCHAR(255) NOT NULL,
    indikator VARCHAR(255),
    ziel VARCHAR(100),
    ist VARCHAR(100),
    status VARCHAR(10) DEFAULT '✓',
    beitragende_tp TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_gesuch_kziel UNIQUE(gesuch_id, position)
);

-- Jahresvergleich (genau 5 Kennzahlen)
CREATE TABLE jahresvergleich (
    id SERIAL PRIMARY KEY,
    gesuch_id INTEGER REFERENCES gesuche(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
    kennzahl VARCHAR(255) NOT NULL,
    vorjahr_ist VARCHAR(100),
    jahr_ist VARCHAR(100),
    delta_effektiv VARCHAR(100),
    delta_prozent VARCHAR(100),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_gesuch_jv UNIQUE(gesuch_id, position)
);

-- Messmethodik (genau 5 Einträge)
CREATE TABLE messmethodik (
    id SERIAL PRIMARY KEY,
    gesuch_id INTEGER REFERENCES gesuche(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 5),
    quelle VARCHAR(255),
    methode TEXT,
    zeitraum VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_gesuch_mm UNIQUE(gesuch_id, position)
);

-- Lessons Learned (genau 4 Punkte)
CREATE TABLE lessons_learned (
    id SERIAL PRIMARY KEY,
    gesuch_id INTEGER REFERENCES gesuche(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 4),
    lesson TEXT,
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_gesuch_lesson UNIQUE(gesuch_id, position)
);

-- Partner-Eigenleistungen (max 3 Einträge)
CREATE TABLE partner_eigenleistungen (
    id SERIAL PRIMARY KEY,
    gesuch_id INTEGER REFERENCES gesuche(id) ON DELETE CASCADE,
    position INTEGER NOT NULL CHECK (position BETWEEN 1 AND 3),
    teilprojekt VARCHAR(50),
    leistung VARCHAR(255),
    menge VARCHAR(100),
    chf_aequivalent DECIMAL(12,2),
    created_at TIMESTAMP DEFAULT NOW(),
    CONSTRAINT unique_gesuch_pe UNIQUE(gesuch_id, position)
);
```

### 1.4 Trigger und Funktionen

```sql
-- Automatische Zeitstempel-Updates
CREATE OR REPLACE FUNCTION update_timestamp()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_massnahmen_timestamp
BEFORE UPDATE ON massnahmen
FOR EACH ROW
EXECUTE FUNCTION update_timestamp();

-- Status-Update für Gesuche bei Rapport-Änderungen
CREATE OR REPLACE FUNCTION update_gesuch_status()
RETURNS TRIGGER AS $$
DECLARE
    v_genehmigt_count INTEGER;
    v_total_count INTEGER;
BEGIN
    -- Nur bei Rapport-Status-Änderungen
    IF (TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status) OR TG_OP = 'INSERT' THEN
        -- Zähle genehmigte Rapporte
        SELECT COUNT(*) INTO v_genehmigt_count
        FROM rapporte 
        WHERE gesuch_id = NEW.gesuch_id 
        AND status = 'genehmigt';
        
        -- Zähle alle Rapporte
        SELECT COUNT(*) INTO v_total_count
        FROM rapporte 
        WHERE gesuch_id = NEW.gesuch_id;
        
        -- Update Gesuch
        UPDATE gesuche 
        SET 
            anzahl_tp_genehmigt = v_genehmigt_count,
            status = CASE 
                WHEN v_genehmigt_count = 6 THEN 'vollstaendig'
                WHEN v_genehmigt_count > 0 THEN 'in_bearbeitung'
                ELSE 'entwurf'
            END,
            updated_at = NOW()
        WHERE id = NEW.gesuch_id;
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_gesuch_status
AFTER INSERT OR UPDATE OF status ON rapporte
FOR EACH ROW
EXECUTE FUNCTION update_gesuch_status();

-- Automatische Effizienz-Berechnung
CREATE OR REPLACE FUNCTION calculate_rapport_efficiency()
RETURNS TRIGGER AS $$
DECLARE
    v_total_budget DECIMAL(12,2);
    v_total_kosten DECIMAL(12,2);
    v_efficiency DECIMAL(5,2);
BEGIN
    -- Summiere Budget und Kosten aus Massnahmen
    SELECT 
        COALESCE(SUM(budget_brutto), 0),
        COALESCE(SUM(kosten_netto), 0)
    INTO v_total_budget, v_total_kosten
    FROM massnahmen
    WHERE rapport_id = NEW.rapport_id;
    
    -- Berechne Effizienz
    IF v_total_budget > 0 THEN
        v_efficiency = (v_total_kosten / v_total_budget * 100);
    ELSE
        v_efficiency = 0;
    END IF;
    
    -- Update Rapport
    UPDATE rapporte 
    SET effizienz_prozent = v_efficiency
    WHERE id = NEW.rapport_id;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_calculate_efficiency
AFTER INSERT OR UPDATE OR DELETE ON massnahmen
FOR EACH ROW
EXECUTE FUNCTION calculate_rapport_efficiency();
```

---

## Phase 2: Backend-API Entwicklung

### 2.1 Gesuch-Management Routes

```javascript
// backend/src/routes/gesuch.routes.js

const express = require('express');
const router = express.Router();
const { authenticateToken, requireAdmin } = require('../middleware/auth.middleware');
const GesuchService = require('../services/gesuch.service');

// GET /api/gesuche - Alle Gesuche abrufen
router.get('/', authenticateToken, async (req, res) => {
    // Admin: Alle Gesuche
    // User: Nur Gesuche mit eigenen Rapporten
});

// GET /api/gesuche/:id/complete - Gesuch mit allen Details
router.get('/:id/complete', authenticateToken, async (req, res) => {
    // Gesuch + alle Rapporte + alle Zusatzdaten
});

// POST /api/gesuche - Neues Gesuch erstellen (Admin only)
router.post('/', authenticateToken, requireAdmin, async (req, res) => {
    // Gesuch erstellen
    // 6 leere Teilprojekt-Platzhalter anlegen
});

// PATCH /api/gesuche/:id/status - Status aktualisieren
router.patch('/:id/status', authenticateToken, requireAdmin, async (req, res) => {
    // Status-Validierung
    // Nur bestimmte Übergänge erlaubt
});

// POST /api/gesuche/:id/submit - Gesuch einreichen (Webhook)
router.post('/:id/submit', authenticateToken, requireAdmin, async (req, res) => {
    // Validierung: Alle 6 TPs genehmigt?
    // Daten für Webhook sammeln
    // An n8n senden
});

// POST /api/gesuche/:id/webhook-callback - Webhook-Callback von n8n
router.post('/:id/webhook-callback', async (req, res) => {
    // Document-URL speichern
    // Status aktualisieren
});
```

### 2.2 Service Layer

```javascript
// backend/src/services/gesuch.service.js

class GesuchService {
    // Gesuch mit Defaults erstellen
    async createGesuch(jahr, userId) {
        const gesuchNummer = `194.${jahr}`;
        
        // Transaction starten
        await db.transaction(async (trx) => {
            // 1. Gesuch erstellen
            const gesuch = await trx('gesuche').insert({
                gesuch_nummer: gesuchNummer,
                jahr,
                created_by: userId
            }).returning('*');
            
            // 2. Standard K-Ziele erstellen
            const kZieleDefaults = [
                { position: 1, name: 'Wissen', indikator: 'Recall landw. Leistungen' },
                { position: 2, name: 'Sympathie', indikator: 'Positiver Gesamteindruck' },
                { position: 3, name: 'Präferenz', indikator: 'Kaufbereitschaft CH-Produkte' },
                { position: 4, name: 'Nachhaltigkeit', indikator: 'Wahrnehmung Biodiversität' },
                { position: 5, name: 'Zusammenarbeit', indikator: 'Aktive Partnerprojekte' }
            ];
            
            await trx('k_ziele').insert(
                kZieleDefaults.map(kz => ({ ...kz, gesuch_id: gesuch.id }))
            );
            
            // 3. Leere Platzhalter für andere Tabellen
            // ...
        });
    }
    
    // Alle Daten für Webhook sammeln
    async collectCompleteGesuchData(gesuchId) {
        const gesuch = await db('gesuche').where({ id: gesuchId }).first();
        
        // Alle Rapporte mit Massnahmen
        const rapporte = await db('rapporte')
            .where({ gesuch_id: gesuchId })
            .orderBy('teilprojekt_nummer');
            
        // Massnahmen pro Rapport laden
        for (const rapport of rapporte) {
            rapport.massnahmen = await db('massnahmen')
                .where({ rapport_id: rapport.id })
                .orderBy('nr');
        }
        
        // K-Ziele laden
        const kZiele = await db('k_ziele')
            .where({ gesuch_id: gesuchId })
            .orderBy('position');
            
        // Weitere Daten laden...
        
        return {
            jahr: gesuch.jahr,
            gesuchId: gesuch.gesuch_nummer,
            teilprojekte: rapporte.map(this.formatTeilprojektForWebhook),
            kZielMatrix: kZiele,
            // ...
        };
    }
    
    // Webhook an n8n senden
    async submitToWebhook(gesuchData, userId) {
        const sessionId = `session_${Date.now()}_${gesuchId}`;
        
        const webhookData = {
            ...gesuchData,
            callbackUrl: `${process.env.API_URL}/api/gesuche/${gesuchData.id}/webhook-callback`,
            sessionId,
            userId,
            targetFolderId: process.env.GOOGLE_DRIVE_FOLDER_ID
        };
        
        const response = await fetch(process.env.N8N_WEBHOOK_URL, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(webhookData)
        });
        
        if (!response.ok) {
            throw new Error('Webhook failed');
        }
        
        // Session speichern
        await db('gesuche').where({ id: gesuchId }).update({
            webhook_status: 'processing',
            webhook_session_id: sessionId,
            submitted_at: new Date()
        });
        
        return response.json();
    }
}
```

### 2.3 Zusatzdaten-Routes

```javascript
// backend/src/routes/gesuch-data.routes.js

// K-Ziele Management
router.get('/:gesuchId/k-ziele', authenticateToken, async (req, res) => {
    const kZiele = await db('k_ziele')
        .where({ gesuch_id: req.params.gesuchId })
        .orderBy('position');
    res.json({ kZiele });
});

router.put('/:gesuchId/k-ziele/:position', authenticateToken, requireAdmin, async (req, res) => {
    // Update einzelnes K-Ziel
});

// Batch-Update für alle K-Ziele
router.post('/:gesuchId/k-ziele/batch', authenticateToken, requireAdmin, async (req, res) => {
    const { kZiele } = req.body; // Array mit 5 Einträgen
    
    await db.transaction(async (trx) => {
        for (const kz of kZiele) {
            await trx('k_ziele')
                .where({ gesuch_id: req.params.gesuchId, position: kz.position })
                .update(kz);
        }
    });
});

// Ähnliche Routes für:
// - Jahresvergleich
// - Messmethodik
// - Lessons Learned
// - Partner-Eigenleistungen
```

---

## Phase 3: Frontend-Entwicklung

### 3.1 Neue Seiten

#### A. Gesuch-Verwaltung (/pages/gesuche.html)
```html
<!-- Hauptstruktur -->
<div class="container">
    <!-- Header mit Aktionen -->
    <div class="page-header">
        <h1>Gesuch-Verwaltung</h1>
        <button onclick="createNewGesuch()" class="btn-primary">
            Neues Gesuch erstellen
        </button>
    </div>
    
    <!-- Gesuch-Karten -->
    <div class="gesuch-grid">
        <!-- Für jedes Gesuch -->
        <div class="gesuch-card">
            <div class="gesuch-header">
                <h3>Gesuch 2024</h3>
                <span class="status-badge">4/6 Teilprojekte genehmigt</span>
            </div>
            
            <!-- Fortschrittsbalken -->
            <div class="progress-bar">
                <div class="progress-fill" style="width: 67%"></div>
            </div>
            
            <!-- TP-Status-Übersicht -->
            <div class="tp-status-grid">
                <div class="tp-indicator approved">TP1 ✓</div>
                <div class="tp-indicator approved">TP2 ✓</div>
                <div class="tp-indicator pending">TP3</div>
                <div class="tp-indicator approved">TP4 ✓</div>
                <div class="tp-indicator draft">TP5</div>
                <div class="tp-indicator approved">TP6 ✓</div>
            </div>
            
            <!-- Aktionen -->
            <div class="card-actions">
                <button onclick="viewGesuchDetail(2024)">Details</button>
                <button onclick="manageGesuch(2024)" class="btn-secondary">
                    Verwalten
                </button>
            </div>
        </div>
    </div>
</div>
```

#### B. Gesuch-Detail (/pages/gesuch-detail.html)
```html
<!-- Tab-Navigation -->
<div class="tabs">
    <button class="tab active" onclick="showTab('overview')">Übersicht</button>
    <button class="tab" onclick="showTab('teilprojekte')">Teilprojekte</button>
    <button class="tab" onclick="showTab('kziele')">K-Ziele</button>
    <button class="tab" onclick="showTab('jahresvergleich')">Jahresvergleich</button>
    <button class="tab" onclick="showTab('methodik')">Messmethodik</button>
    <button class="tab" onclick="showTab('lessons')">Lessons Learned</button>
    <button class="tab" onclick="showTab('eigenleistungen')">Partner-Eigenleistungen</button>
</div>

<!-- Tab-Inhalte -->
<div id="overview-tab" class="tab-content">
    <!-- Gesamt-Übersicht mit Submit-Button -->
    <div class="submit-section">
        <h3>Gesuch-Status</h3>
        <p>Alle 6 Teilprojekte sind genehmigt</p>
        <button onclick="submitGesuch()" class="btn-success btn-large">
            Gesuch einreichen und Erfolgsnachweis generieren
        </button>
    </div>
</div>

<div id="kziele-tab" class="tab-content hidden">
    <!-- K-Ziele Matrix Editor -->
    <table class="k-ziele-matrix">
        <thead>
            <tr>
                <th>K-Ziel</th>
                <th>Indikator</th>
                <th>Ziel 2024</th>
                <th>Ist 2024</th>
                <th>Status</th>
                <th>Beitragende TP</th>
            </tr>
        </thead>
        <tbody id="kZieleTableBody">
            <!-- 5 Zeilen werden dynamisch geladen -->
        </tbody>
    </table>
    <button onclick="saveKZiele()" class="btn-primary">K-Ziele speichern</button>
</div>
```

### 3.2 JavaScript-Module

#### gesuch.service.js
```javascript
class GesuchService {
    constructor() {
        this.apiBase = `${API_BASE_URL}/api/gesuche`;
    }
    
    async createGesuch(jahr) {
        const response = await fetch(this.apiBase, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ jahr })
        });
        
        if (!response.ok) {
            throw new Error('Gesuch konnte nicht erstellt werden');
        }
        
        return response.json();
    }
    
    async loadCompleteGesuch(gesuchId) {
        const response = await fetch(`${this.apiBase}/${gesuchId}/complete`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        return response.json();
    }
    
    async submitGesuch(gesuchId) {
        // Validierung
        const gesuch = await this.loadCompleteGesuch(gesuchId);
        
        if (gesuch.anzahl_tp_genehmigt < 6) {
            throw new Error('Nicht alle Teilprojekte sind genehmigt');
        }
        
        // Zusatzdaten validieren
        if (!gesuch.kZiele || gesuch.kZiele.length < 5) {
            throw new Error('K-Ziele sind unvollständig');
        }
        
        // Submit
        const response = await fetch(`${this.apiBase}/${gesuchId}/submit`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            }
        });
        
        return response.json();
    }
}
```

#### gesuch-ui.components.js
```javascript
// Komponente für TP-Status-Anzeige
class TeilprojektStatusGrid {
    constructor(containerId) {
        this.container = document.getElementById(containerId);
    }
    
    render(rapporte) {
        const tpNumbers = ['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6'];
        
        this.container.innerHTML = tpNumbers.map(tp => {
            const rapport = rapporte.find(r => r.teilprojekt_nummer === tp);
            const status = rapport?.status || 'missing';
            const cssClass = this.getStatusClass(status);
            
            return `
                <div class="tp-card ${cssClass}">
                    <h4>${tp}</h4>
                    <p>${rapport?.teilprojekt_name || 'Nicht erstellt'}</p>
                    <span class="status">${this.getStatusText(status)}</span>
                </div>
            `;
        }).join('');
    }
    
    getStatusClass(status) {
        const map = {
            'genehmigt': 'approved',
            'eingereicht': 'submitted',
            'entwurf': 'draft',
            'missing': 'missing'
        };
        return map[status] || 'unknown';
    }
}

// Komponente für K-Ziele-Editor
class KZieleEditor {
    constructor(gesuchId) {
        this.gesuchId = gesuchId;
        this.data = [];
    }
    
    async load() {
        const response = await fetch(`/api/gesuche/${this.gesuchId}/k-ziele`, {
            headers: { 'Authorization': `Bearer ${getToken()}` }
        });
        
        this.data = await response.json();
        this.render();
    }
    
    render() {
        const tbody = document.getElementById('kZieleTableBody');
        
        tbody.innerHTML = this.data.map((kz, index) => `
            <tr>
                <td>
                    <input type="text" value="${kz.name}" 
                           data-field="name" data-position="${kz.position}"
                           class="form-control">
                </td>
                <td>
                    <input type="text" value="${kz.indikator}" 
                           data-field="indikator" data-position="${kz.position}"
                           class="form-control">
                </td>
                <td>
                    <input type="text" value="${kz.ziel}" 
                           data-field="ziel" data-position="${kz.position}"
                           class="form-control">
                </td>
                <td>
                    <input type="text" value="${kz.ist}" 
                           data-field="ist" data-position="${kz.position}"
                           class="form-control">
                </td>
                <td>
                    <select data-field="status" data-position="${kz.position}"
                            class="form-control">
                        <option value="✓" ${kz.status === '✓' ? 'selected' : ''}>✓</option>
                        <option value="✗" ${kz.status === '✗' ? 'selected' : ''}>✗</option>
                        <option value="~" ${kz.status === '~' ? 'selected' : ''}>~</option>
                    </select>
                </td>
                <td>
                    <input type="text" value="${kz.beitragende_tp}" 
                           data-field="beitragende_tp" data-position="${kz.position}"
                           class="form-control">
                </td>
            </tr>
        `).join('');
    }
    
    async save() {
        // Sammle alle Änderungen
        const updates = [];
        document.querySelectorAll('#kZieleTableBody input, #kZieleTableBody select').forEach(input => {
            const position = parseInt(input.dataset.position);
            const field = input.dataset.field;
            const value = input.value;
            
            // Finde das entsprechende K-Ziel
            let kziel = updates.find(k => k.position === position);
            if (!kziel) {
                kziel = { position };
                updates.push(kziel);
            }
            
            kziel[field] = value;
        });
        
        // Speichern via API
        await fetch(`/api/gesuche/${this.gesuchId}/k-ziele/batch`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${getToken()}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ kZiele: updates })
        });
    }
}
```

### 3.3 Erweiterte Rapport-Erstellung

#### Neues Massnahmen-Formular
```javascript
// In rapport.html erweitern
class MassnahmenTable {
    constructor(rapportId) {
        this.rapportId = rapportId;
        this.massnahmen = [];
        this.maxMassnahmen = 5;
    }
    
    render() {
        const container = document.getElementById('massnahmenContainer');
        
        container.innerHTML = `
            <table class="massnahmen-table">
                <thead>
                    <tr>
                        <th>Nr.</th>
                        <th>Massnahme</th>
                        <th>Kanal</th>
                        <th>Budget Brutto</th>
                        <th>IST Brutto</th>
                        <th>Aufwandsminderung</th>
                        <th>Kosten Netto</th>
                        <th>Bemerkung</th>
                        <th></th>
                    </tr>
                </thead>
                <tbody id="massnahmenRows">
                    ${this.renderRows()}
                </tbody>
                <tfoot>
                    <tr>
                        <td colspan="3">Summe</td>
                        <td id="sumBudget">0</td>
                        <td id="sumIst">0</td>
                        <td id="sumAufwand">0</td>
                        <td id="sumNetto">0</td>
                        <td colspan="2"></td>
                    </tr>
                    <tr>
                        <td colspan="7">Effizienz:</td>
                        <td id="effizienz" colspan="2">0%</td>
                    </tr>
                </tfoot>
            </table>
            
            <button onclick="massnahmenTable.addRow()" 
                    class="btn-secondary" 
                    ${this.massnahmen.length >= this.maxMassnahmen ? 'disabled' : ''}>
                + Massnahme hinzufügen
            </button>
            
            <div id="abweichungSection" class="hidden">
                <label>Abweichungskommentar (Effizienz ${this.effizienz}%)</label>
                <textarea id="abweichungKommentar" rows="2" required></textarea>
            </div>
        `;
        
        this.updateCalculations();
    }
    
    addRow() {
        if (this.massnahmen.length >= this.maxMassnahmen) return;
        
        const nr = this.massnahmen.length + 1;
        this.massnahmen.push({
            nr,
            massnahme: '',
            kanal: '',
            budgetBrutto: 0,
            istBrutto: 0,
            aufwandsminderung: 0,
            kostenNetto: 0,
            bemerkung: ''
        });
        
        this.render();
    }
    
    updateCalculations() {
        let sumBudget = 0;
        let sumIst = 0;
        let sumAufwand = 0;
        let sumNetto = 0;
        
        this.massnahmen.forEach(m => {
            m.kostenNetto = m.istBrutto - m.aufwandsminderung;
            sumBudget += m.budgetBrutto;
            sumIst += m.istBrutto;
            sumAufwand += m.aufwandsminderung;
            sumNetto += m.kostenNetto;
        });
        
        // Update Summen
        document.getElementById('sumBudget').textContent = formatCHF(sumBudget);
        document.getElementById('sumIst').textContent = formatCHF(sumIst);
        document.getElementById('sumAufwand').textContent = formatCHF(sumAufwand);
        document.getElementById('sumNetto').textContent = formatCHF(sumNetto);
        
        // Effizienz berechnen
        const effizienz = sumBudget > 0 ? (sumNetto / sumBudget * 100) : 0;
        document.getElementById('effizienz').textContent = effizienz.toFixed(1) + '%';
        
        // Abweichungskommentar anzeigen wenn nötig
        const abweichungSection = document.getElementById('abweichungSection');
        if (effizienz < 90 || effizienz > 110) {
            abweichungSection.classList.remove('hidden');
        } else {
            abweichungSection.classList.add('hidden');
        }
        
        this.effizienz = effizienz;
    }
}
```

---

## Phase 4: Integration und Validierung

### 4.1 Validierungsregeln

```javascript
// backend/src/validators/gesuch.validator.js

const validateGesuchSubmission = async (gesuchId) => {
    const errors = [];
    
    // 1. Alle 6 Teilprojekte vorhanden und genehmigt?
    const rapporte = await db('rapporte').where({ gesuch_id: gesuchId });
    const tpNumbers = ['TP1', 'TP2', 'TP3', 'TP4', 'TP5', 'TP6'];
    
    for (const tp of tpNumbers) {
        const rapport = rapporte.find(r => r.teilprojekt_nummer === tp);
        if (!rapport) {
            errors.push(`Teilprojekt ${tp} fehlt`);
        } else if (rapport.status !== 'genehmigt') {
            errors.push(`Teilprojekt ${tp} ist nicht genehmigt`);
        }
    }
    
    // 2. K-Ziele vollständig (5 Stück)?
    const kZiele = await db('k_ziele').where({ gesuch_id: gesuchId });
    if (kZiele.length < 5) {
        errors.push('K-Ziele sind unvollständig');
    }
    
    // 3. Jahresvergleich vollständig?
    const jahresvergleich = await db('jahresvergleich').where({ gesuch_id: gesuchId });
    if (jahresvergleich.length < 5) {
        errors.push('Jahresvergleich ist unvollständig');
    }
    
    // 4. Weitere Validierungen...
    
    return {
        valid: errors.length === 0,
        errors
    };
};
```

### 4.2 Berechtigungsmatrix

```javascript
// backend/src/middleware/gesuch.middleware.js

const gesuchPermissions = {
    // User
    'user': {
        canView: true,           // Eigene Rapporte
        canCreateRapport: true,  // Für zugewiesene TPs
        canEditRapport: true,    // Eigene, nur Entwurf
        canDeleteRapport: false,
        canCreateGesuch: false,
        canSubmitGesuch: false,
        canEditZusatzdaten: false
    },
    
    // Admin
    'admin': {
        canView: true,           // Alle
        canCreateRapport: true,  // Alle TPs
        canEditRapport: true,    // Alle
        canDeleteRapport: true,
        canCreateGesuch: true,
        canSubmitGesuch: true,
        canEditZusatzdaten: true
    },
    
    // Super Admin
    'super_admin': {
        // Alle Admin-Rechte plus:
        canConfigureWebhook: true,
        canDeleteGesuch: true,
        canExportData: true
    }
};
```

### 4.3 Webhook-Flow

```javascript
// backend/src/services/webhook.service.js

class WebhookService {
    async handleGesuchSubmission(gesuchId, userId) {
        try {
            // 1. Status auf 'processing' setzen
            await db('gesuche').where({ id: gesuchId }).update({
                webhook_status: 'processing',
                submitted_at: new Date()
            });
            
            // 2. Daten sammeln
            const gesuchData = await GesuchService.collectCompleteGesuchData(gesuchId);
            
            // 3. An n8n senden
            const webhookResponse = await this.sendToN8n(gesuchData, userId);
            
            // 4. Auf Callback warten (Timeout: 5 Minuten)
            // Der Callback wird asynchron kommen
            
            return {
                success: true,
                sessionId: webhookResponse.sessionId,
                message: 'Gesuch wird verarbeitet. Sie erhalten eine Benachrichtigung, wenn das Dokument fertig ist.'
            };
            
        } catch (error) {
            // Fehler loggen und Status zurücksetzen
            await db('gesuche').where({ id: gesuchId }).update({
                webhook_status: 'failed',
                webhook_error: error.message
            });
            
            throw error;
        }
    }
    
    async handleWebhookCallback(gesuchId, callbackData) {
        const { sessionId, documentUrl, documentId, documentName, status } = callbackData;
        
        // Validiere Session
        const gesuch = await db('gesuche').where({ 
            id: gesuchId, 
            webhook_session_id: sessionId 
        }).first();
        
        if (!gesuch) {
            throw new Error('Invalid session');
        }
        
        // Update Gesuch
        await db('gesuche').where({ id: gesuchId }).update({
            webhook_status: status,
            document_url: documentUrl,
            document_id: documentId,
            document_name: documentName,
            completed_at: new Date(),
            status: 'abgeschlossen'
        });
        
        // Benachrichtigung an User senden (Email/In-App)
        await NotificationService.notifyDocumentReady(gesuch.created_by, {
            gesuchJahr: gesuch.jahr,
            documentUrl
        });
    }
}
```

---

## Phase 5: Testing und Deployment

### 5.1 Test-Szenarien

#### Szenario 1: Kompletter Workflow
```javascript
// tests/gesuch-workflow.test.js

describe('Gesuch Workflow', () => {
    test('Kompletter Durchlauf von Erstellung bis Dokument', async () => {
        // 1. Als Admin einloggen
        const admin = await loginAsAdmin();
        
        // 2. Gesuch für 2025 erstellen
        const gesuch = await createGesuch(2025);
        expect(gesuch.status).toBe('entwurf');
        
        // 3. Als User einloggen und 6 Rapporte erstellen
        const user = await loginAsUser();
        for (let i = 1; i <= 6; i++) {
            const rapport = await createRapport({
                gesuch_id: gesuch.id,
                teilprojekt_nummer: `TP${i}`,
                // ... weitere Daten
            });
            
            // Massnahmen hinzufügen
            await addMassnahmen(rapport.id, generateMassnahmen(i));
        }
        
        // 4. Als Admin alle Rapporte genehmigen
        await loginAsAdmin();
        for (let i = 1; i <= 6; i++) {
            await approveRapport(gesuch.id, `TP${i}`);
        }
        
        // 5. Zusatzdaten ausfüllen
        await fillKZiele(gesuch.id);
        await fillJahresvergleich(gesuch.id);
        // ...
        
        // 6. Gesuch einreichen
        const submission = await submitGesuch(gesuch.id);
        expect(submission.success).toBe(true);
        
        // 7. Webhook-Callback simulieren
        await simulateWebhookCallback(gesuch.id, {
            status: 'success',
            documentUrl: 'https://docs.google.com/...'
        });
        
        // 8. Überprüfen
        const finalGesuch = await getGesuch(gesuch.id);
        expect(finalGesuch.status).toBe('abgeschlossen');
        expect(finalGesuch.document_url).toBeTruthy();
    });
});
```

### 5.2 Migrations-Script

```sql
-- migrations/add_gesuch_system.sql

-- 1. Backup erstehende Daten
CREATE TABLE rapporte_backup AS SELECT * FROM rapporte;

-- 2. Neue Tabellen erstellen (siehe Phase 1)

-- 3. Default-Gesuch für 2024 erstellen
INSERT INTO gesuche (gesuch_nummer, jahr, titel, created_by)
VALUES ('194.2024', 2024, 'Kommunikationsförderung Landwirtschaft', 1)
RETURNING id;

-- 4. Bestehende Rapporte zuordnen
UPDATE rapporte 
SET gesuch_id = (SELECT id FROM gesuche WHERE jahr = 2024),
    teilprojekt_nummer = 'TP' || SUBSTRING(category FROM 3, 1)
WHERE category LIKE 'tp%';

-- 5. Trigger aktivieren
-- (siehe Phase 1.4)

-- 6. Rollback-Script erstellen
-- CREATE SCRIPT rollback_gesuch_system.sql
```

### 5.3 Deployment-Checkliste

```yaml
# deployment-checklist.yml

pre-deployment:
  - [ ] Backup der Produktionsdatenbank
  - [ ] n8n Webhook-URL konfiguriert
  - [ ] Google Drive Folder ID gesetzt
  - [ ] Environment-Variablen geprüft

database:
  - [ ] Migrations-Script getestet
  - [ ] Rollback-Script bereit
  - [ ] Indexes erstellt
  - [ ] Trigger aktiviert

backend:
  - [ ] API-Tests grün
  - [ ] Permissions getestet
  - [ ] Webhook-Verbindung geprüft
  - [ ] Error-Handling komplett

frontend:
  - [ ] Alle neuen Seiten deployed
  - [ ] JavaScript-Module geladen
  - [ ] CSS angepasst
  - [ ] Browser-Kompatibilität

post-deployment:
  - [ ] Smoke-Tests durchführen
  - [ ] Admin-User instruiert
  - [ ] Monitoring aktiviert
  - [ ] Backup-Verifizierung
```

---

## Implementierungs-Checkliste

### Phase 1: Datenbank ✓ Wenn fertig
- [ ] Gesuche-Tabelle erstellen
- [ ] Rapporte-Tabelle erweitern
- [ ] Massnahmen-Tabelle erstellen
- [ ] K-Ziele Tabelle erstellen
- [ ] Jahresvergleich-Tabelle erstellen
- [ ] Messmethodik-Tabelle erstellen
- [ ] Lessons Learned-Tabelle erstellen
- [ ] Partner-Eigenleistungen-Tabelle erstellen
- [ ] Alle Trigger implementieren
- [ ] Indexes erstellen
- [ ] Test-Daten einfügen

### Phase 2: Backend-API ✓ Wenn fertig
- [ ] Gesuch-Routes implementieren
- [ ] Gesuch-Service erstellen
- [ ] Massnahmen-Management
- [ ] K-Ziele API
- [ ] Jahresvergleich API
- [ ] Weitere Zusatzdaten APIs
- [ ] Webhook-Integration
- [ ] Callback-Handler
- [ ] Validierung komplett
- [ ] Error-Handling

### Phase 3: Frontend ✓ Wenn fertig
- [ ] Gesuch-Verwaltungsseite
- [ ] Gesuch-Detail-Seite
- [ ] Rapport-Formular erweitern
- [ ] Massnahmen-Tabelle Component
- [ ] K-Ziele Editor Component
- [ ] Jahresvergleich-Editor
- [ ] Weitere Editoren
- [ ] Status-Visualisierungen
- [ ] Submit-Workflow
- [ ] Erfolgs-Feedback

### Phase 4: Integration ✓ Wenn fertig
- [ ] Validierungsregeln komplett
- [ ] Berechtigungen implementiert
- [ ] Webhook-Flow getestet
- [ ] End-to-End Test
- [ ] Error-Szenarien getestet

### Phase 5: Deployment ✓ Wenn fertig
- [ ] Test-Suite grün
- [ ] Migration vorbereitet
- [ ] Rollback-Plan
- [ ] Dokumentation komplett
- [ ] Admin-Schulung
- [ ] Go-Live

---

## Anhang: Wichtige Dateien

### Environment-Variablen (.env)
```env
# n8n Webhook
N8N_WEBHOOK_URL=https://n8n.example.com/webhook/sbv-endrapport

# Google Drive
GOOGLE_DRIVE_FOLDER_ID=your-folder-id

# API URLs
API_URL=https://api.sbv.ch
FRONTEND_URL=https://app.sbv.ch

# Email
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=noreply@sbv.ch
SMTP_PASS=xxx
```

### API-Dokumentation
Vollständige API-Dokumentation unter: `/docs/api/gesuch-system.md`

### Troubleshooting-Guide
Häufige Probleme und Lösungen: `/docs/troubleshooting.md`

---

**Dokument-Version:** 1.0.0  
**Erstellt:** 29.07.2025  
**Letzte Aktualisierung:** 29.07.2025