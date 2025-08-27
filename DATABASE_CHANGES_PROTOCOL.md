# 📋 Datenbank-Änderungsprotokoll
## Multi-User Teilprojekt-Zuweisung & Maßnahmen-Verwaltung

---

## 📅 Änderungsdatum: 2025-08-26
## 🔧 Implementiert von: System
## 📍 Betroffene Datenbank: SQLite (development) / PostgreSQL (production)

---

## 🎯 Änderungszweck

Implementierung einer erweiterten Zugriffskontrolle und Teilprojekt-Verwaltung:
- **Multi-User-Zuweisung**: Ein Teilprojekt kann mehreren Usern zugewiesen werden
- **Maßnahmen-Ebene**: Teilprojekte können in Maßnahmen unterteilt werden
- **Split/Merge**: Teilprojekte können geteilt und zusammengeführt werden
- **Audit-Trail**: Vollständige Historie aller Änderungen
- **Rollen-basierte Zugriffskontrolle**: Ausfüller, Prüfer, Freigeber

---

## 📊 Neue Tabellen

### 1. **teilprojekt_zuweisungen** (N:M Beziehung User ↔ Teilprojekt)
```sql
CREATE TABLE teilprojekt_zuweisungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teilprojekt_id INTEGER NOT NULL REFERENCES gesuch_teilprojekte(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rolle VARCHAR(50) NOT NULL CHECK (rolle IN ('ausfueller', 'pruefer', 'freigeber')),
    gueltig_von DATE DEFAULT CURRENT_DATE,
    gueltig_bis DATE,
    zugewiesen_von INTEGER REFERENCES users(id),
    bemerkung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teilprojekt_id, user_id, rolle)
);
```
**Frontend-Auswirkung**: User sehen nur noch zugewiesene Teilprojekte

### 2. **massnahmen** (Maßnahmen innerhalb von Teilprojekten)
```sql
CREATE TABLE massnahmen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teilprojekt_id INTEGER NOT NULL REFERENCES gesuch_teilprojekte(id) ON DELETE CASCADE,
    nummer VARCHAR(50) NOT NULL,
    titel VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    budget DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'geplant' CHECK (status IN ('geplant', 'in_arbeit', 'abgeschlossen', 'pausiert')),
    parent_massnahme_id INTEGER REFERENCES massnahmen(id),
    geplant_von DATE,
    geplant_bis DATE,
    tatsaechlich_von DATE,
    tatsaechlich_bis DATE,
    fortschritt INTEGER DEFAULT 0 CHECK (fortschritt >= 0 AND fortschritt <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Frontend-Auswirkung**: Neue Maßnahmen-Verwaltung pro Teilprojekt

### 3. **massnahmen_zuweisungen** (N:M Beziehung User ↔ Maßnahme)
```sql
CREATE TABLE massnahmen_zuweisungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    massnahme_id INTEGER NOT NULL REFERENCES massnahmen(id) ON DELETE CASCADE,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rolle VARCHAR(50) NOT NULL CHECK (rolle IN ('ausfueller', 'pruefer', 'freigeber')),
    gueltig_von DATE DEFAULT CURRENT_DATE,
    gueltig_bis DATE,
    zugewiesen_von INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(massnahme_id, user_id, rolle)
);
```
**Frontend-Auswirkung**: Granulare Zuweisung auf Maßnahmen-Ebene

### 4. **teilprojekt_historie** (Split/Merge Tracking)
```sql
CREATE TABLE teilprojekt_historie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teilprojekt_id INTEGER NOT NULL REFERENCES gesuch_teilprojekte(id),
    parent_teilprojekt_id INTEGER REFERENCES gesuch_teilprojekte(id),
    aktion VARCHAR(50) NOT NULL CHECK (aktion IN ('erstellt', 'split', 'merge', 'update', 'archiviert')),
    stammdaten_snapshot TEXT, -- JSON der grauen Felder
    aenderungen TEXT, -- JSON der Änderungen
    ausgefuehrt_von INTEGER NOT NULL REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Frontend-Auswirkung**: Historie-Ansicht für Teilprojekte

### 5. **rapport_audit_trail** (Umfassende Änderungsverfolgung)
```sql
CREATE TABLE rapport_audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('teilprojekt', 'massnahme', 'rapport', 'zuweisung')),
    entity_id INTEGER NOT NULL,
    aktion VARCHAR(100) NOT NULL,
    alte_werte TEXT, -- JSON
    neue_werte TEXT, -- JSON
    user_id INTEGER NOT NULL REFERENCES users(id),
    user_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Frontend-Auswirkung**: Audit-Log Ansicht für Admins

### 6. **rapport_felder** (Feld-Level Tracking)
```sql
CREATE TABLE rapport_felder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rapport_id INTEGER NOT NULL REFERENCES rapporte(id) ON DELETE CASCADE,
    feld_typ VARCHAR(50) NOT NULL CHECK (feld_typ IN ('grau', 'gelb')),
    feld_name VARCHAR(100) NOT NULL,
    feld_wert TEXT,
    quelle VARCHAR(100) CHECK (quelle IN ('gesuch', 'manuell', 'vererbt', 'automatisch')),
    ist_pflichtfeld BOOLEAN DEFAULT FALSE,
    geaendert_von INTEGER REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```
**Frontend-Auswirkung**: Farbcodierung der Felder (grau=automatisch, gelb=manuell)

---

## 🔄 Geänderte Tabellen

### **gesuch_teilprojekte** (Erweitert für Split/Merge)
```sql
ALTER TABLE gesuch_teilprojekte ADD COLUMN parent_teilprojekt_id INTEGER REFERENCES gesuch_teilprojekte(id);
ALTER TABLE gesuch_teilprojekte ADD COLUMN ebene INTEGER DEFAULT 1 CHECK (ebene IN (1, 2, 3));
ALTER TABLE gesuch_teilprojekte ADD COLUMN stammdaten TEXT; -- JSON graue Felder
ALTER TABLE gesuch_teilprojekte ADD COLUMN ist_geteilt BOOLEAN DEFAULT FALSE;
ALTER TABLE gesuch_teilprojekte ADD COLUMN ist_aktiv BOOLEAN DEFAULT TRUE;
ALTER TABLE gesuch_teilprojekte ADD COLUMN teilungs_datum TIMESTAMP;
ALTER TABLE gesuch_teilprojekte ADD COLUMN geteilt_von INTEGER REFERENCES users(id);
```
**Frontend-Auswirkung**: Hierarchische Darstellung von Teilprojekten

### **rapporte** (Erweitert für Maßnahmen-Verknüpfung)
```sql
ALTER TABLE rapporte ADD COLUMN massnahme_id INTEGER REFERENCES massnahmen(id);
ALTER TABLE rapporte ADD COLUMN ist_vorlage BOOLEAN DEFAULT FALSE;
ALTER TABLE rapporte ADD COLUMN vorlage_id INTEGER REFERENCES rapporte(id);
ALTER TABLE rapporte ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'entwurf';
ALTER TABLE rapporte ADD COLUMN geprueft_von INTEGER REFERENCES users(id);
ALTER TABLE rapporte ADD COLUMN geprueft_am TIMESTAMP;
ALTER TABLE rapporte ADD COLUMN freigegeben_von INTEGER REFERENCES users(id);
ALTER TABLE rapporte ADD COLUMN freigegeben_am TIMESTAMP;
```
**Frontend-Auswirkung**: Erweiterte Workflow-Stati und Maßnahmen-Zuordnung

---

## 🔍 Neue Indizes für Performance

```sql
-- Zuweisungen schnell finden
CREATE INDEX idx_tp_zuweisungen_user ON teilprojekt_zuweisungen(user_id);
CREATE INDEX idx_tp_zuweisungen_tp ON teilprojekt_zuweisungen(teilprojekt_id);
CREATE INDEX idx_tp_zuweisungen_gueltig ON teilprojekt_zuweisungen(gueltig_von, gueltig_bis);

CREATE INDEX idx_mn_zuweisungen_user ON massnahmen_zuweisungen(user_id);
CREATE INDEX idx_mn_zuweisungen_mn ON massnahmen_zuweisungen(massnahme_id);

-- Hierarchie-Navigation
CREATE INDEX idx_tp_parent ON gesuch_teilprojekte(parent_teilprojekt_id);
CREATE INDEX idx_mn_parent ON massnahmen(parent_massnahme_id);
CREATE INDEX idx_mn_tp ON massnahmen(teilprojekt_id);

-- Audit-Trail Suche
CREATE INDEX idx_audit_entity ON rapport_audit_trail(entity_type, entity_id);
CREATE INDEX idx_audit_user ON rapport_audit_trail(user_id);
CREATE INDEX idx_audit_date ON rapport_audit_trail(created_at);

-- Rapport-Felder
CREATE INDEX idx_rf_rapport ON rapport_felder(rapport_id);
CREATE INDEX idx_rf_typ ON rapport_felder(feld_typ);
```

---

## 🔐 Neue Sicherheits-Views

```sql
-- View: Nur zugewiesene Teilprojekte für User
CREATE VIEW v_user_teilprojekte AS
SELECT DISTINCT
    tp.*,
    tz.rolle,
    tz.gueltig_von,
    tz.gueltig_bis,
    u.name as zugewiesen_an
FROM gesuch_teilprojekte tp
JOIN teilprojekt_zuweisungen tz ON tp.id = tz.teilprojekt_id
JOIN users u ON tz.user_id = u.id
WHERE tz.gueltig_von <= CURRENT_DATE 
  AND (tz.gueltig_bis IS NULL OR tz.gueltig_bis >= CURRENT_DATE)
  AND tp.ist_aktiv = TRUE;

-- View: Nur zugewiesene Maßnahmen für User
CREATE VIEW v_user_massnahmen AS
SELECT DISTINCT
    m.*,
    mz.rolle,
    tp.name as teilprojekt_name
FROM massnahmen m
JOIN massnahmen_zuweisungen mz ON m.id = mz.massnahme_id
JOIN gesuch_teilprojekte tp ON m.teilprojekt_id = tp.id
WHERE mz.gueltig_von <= CURRENT_DATE 
  AND (mz.gueltig_bis IS NULL OR mz.gueltig_bis >= CURRENT_DATE);
```

---

## ⚠️ Breaking Changes für Frontend

1. **Zugriffslogik geändert**: 
   - ALT: Alle User sehen alle Teilprojekte
   - NEU: User sehen nur zugewiesene Teilprojekte/Maßnahmen

2. **Neue API-Endpunkte benötigt**:
   - `/api/users/:id/teilprojekte` (nur zugewiesene)
   - `/api/teilprojekte/:id/massnahmen`
   - `/api/teilprojekte/:id/split`
   - `/api/audit-trail/:type/:id`

3. **UI-Komponenten anzupassen**:
   - Teilprojekt-Liste (gefiltert)
   - Maßnahmen-Verwaltung (neu)
   - Zuweisungs-Dialog (neu)
   - Historie-Ansicht (neu)
   - Audit-Log (neu)

---

## 📈 Migration-Status

- [x] Migration-Datei erstellt: `010_multi_user_teilprojekt_system.sql`
- [ ] Test-Migration auf Entwicklungsumgebung
- [ ] Backup der Produktionsdatenbank
- [ ] Migration auf Staging
- [ ] Migration auf Produktion

---

## 🔄 Rollback-Plan

Falls Probleme auftreten:
```sql
-- Rollback-Script in: migrations/rollback_010.sql
DROP TABLE IF EXISTS rapport_audit_trail;
DROP TABLE IF EXISTS rapport_felder;
DROP TABLE IF EXISTS teilprojekt_historie;
DROP TABLE IF EXISTS massnahmen_zuweisungen;
DROP TABLE IF EXISTS massnahmen;
DROP TABLE IF EXISTS teilprojekt_zuweisungen;

-- Spalten entfernen
ALTER TABLE gesuch_teilprojekte DROP COLUMN parent_teilprojekt_id;
-- etc...
```

---

## 📝 Notizen

- **Datenbank-Typ**: Änderungen sind kompatibel mit SQLite (Dev) und PostgreSQL (Prod)
- **Frontend-Team informiert**: ⚠️ NOCH NICHT - Bitte informieren!
- **API-Dokumentation aktualisiert**: ⚠️ AUSSTEHEND
- **Testing erforderlich**: Neue Zuweisungslogik muss getestet werden

---

*Protokoll erstellt am: 2025-08-26 10:45*
*Nächster Review: Nach Frontend-Integration*