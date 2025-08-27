-- ============================================================================
-- Migration: 010_multi_user_teilprojekt_system.sql
-- Datum: 2025-08-26
-- Beschreibung: Multi-User Teilprojekt-Zuweisung & Maßnahmen-Verwaltung
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. NEUE TABELLE: teilprojekt_zuweisungen
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teilprojekt_zuweisungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teilprojekt_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rolle VARCHAR(50) NOT NULL CHECK (rolle IN ('ausfueller', 'pruefer', 'freigeber')),
    gueltig_von DATE DEFAULT CURRENT_DATE,
    gueltig_bis DATE,
    zugewiesen_von INTEGER,
    bemerkung TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teilprojekt_id) REFERENCES teilprojekte(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zugewiesen_von) REFERENCES users(id),
    UNIQUE(teilprojekt_id, user_id, rolle)
);

-- -----------------------------------------------------------------------------
-- 2. NEUE TABELLE: massnahmen
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS massnahmen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teilprojekt_id INTEGER NOT NULL,
    nummer VARCHAR(50) NOT NULL,
    titel VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    budget DECIMAL(12,2),
    status VARCHAR(50) DEFAULT 'geplant' CHECK (status IN ('geplant', 'in_arbeit', 'abgeschlossen', 'pausiert')),
    parent_massnahme_id INTEGER,
    geplant_von DATE,
    geplant_bis DATE,
    tatsaechlich_von DATE,
    tatsaechlich_bis DATE,
    fortschritt INTEGER DEFAULT 0 CHECK (fortschritt >= 0 AND fortschritt <= 100),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teilprojekt_id) REFERENCES teilprojekte(id) ON DELETE CASCADE,
    FOREIGN KEY (parent_massnahme_id) REFERENCES massnahmen(id)
);

-- -----------------------------------------------------------------------------
-- 3. NEUE TABELLE: massnahmen_zuweisungen
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS massnahmen_zuweisungen (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    massnahme_id INTEGER NOT NULL,
    user_id INTEGER NOT NULL,
    rolle VARCHAR(50) NOT NULL CHECK (rolle IN ('ausfueller', 'pruefer', 'freigeber')),
    gueltig_von DATE DEFAULT CURRENT_DATE,
    gueltig_bis DATE,
    zugewiesen_von INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (massnahme_id) REFERENCES massnahmen(id) ON DELETE CASCADE,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (zugewiesen_von) REFERENCES users(id),
    UNIQUE(massnahme_id, user_id, rolle)
);

-- -----------------------------------------------------------------------------
-- 4. NEUE TABELLE: teilprojekt_historie
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS teilprojekt_historie (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teilprojekt_id INTEGER NOT NULL,
    parent_teilprojekt_id INTEGER,
    aktion VARCHAR(50) NOT NULL CHECK (aktion IN ('erstellt', 'split', 'merge', 'update', 'archiviert')),
    stammdaten_snapshot TEXT, -- JSON der grauen Felder
    aenderungen TEXT, -- JSON der Änderungen
    ausgefuehrt_von INTEGER NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (teilprojekt_id) REFERENCES teilprojekte(id),
    FOREIGN KEY (parent_teilprojekt_id) REFERENCES teilprojekte(id),
    FOREIGN KEY (ausgefuehrt_von) REFERENCES users(id)
);

-- -----------------------------------------------------------------------------
-- 5. NEUE TABELLE: rapport_audit_trail
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rapport_audit_trail (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    entity_type VARCHAR(50) NOT NULL CHECK (entity_type IN ('teilprojekt', 'massnahme', 'rapport', 'zuweisung')),
    entity_id INTEGER NOT NULL,
    aktion VARCHAR(100) NOT NULL,
    alte_werte TEXT, -- JSON
    neue_werte TEXT, -- JSON
    user_id INTEGER NOT NULL,
    user_name VARCHAR(255),
    ip_address VARCHAR(45),
    user_agent TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id)
);

-- -----------------------------------------------------------------------------
-- 6. NEUE TABELLE: rapport_felder
-- -----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS rapport_felder (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    rapport_id INTEGER NOT NULL,
    feld_typ VARCHAR(50) NOT NULL CHECK (feld_typ IN ('grau', 'gelb')),
    feld_name VARCHAR(100) NOT NULL,
    feld_wert TEXT,
    quelle VARCHAR(100) CHECK (quelle IN ('gesuch', 'manuell', 'vererbt', 'automatisch')),
    ist_pflichtfeld BOOLEAN DEFAULT 0,
    geaendert_von INTEGER,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (rapport_id) REFERENCES rapporte(id) ON DELETE CASCADE,
    FOREIGN KEY (geaendert_von) REFERENCES users(id)
);

-- -----------------------------------------------------------------------------
-- 7. ERWEITERE TABELLE: teilprojekte
-- -----------------------------------------------------------------------------
-- Neue Spalten für Split/Merge Funktionalität
ALTER TABLE teilprojekte ADD COLUMN parent_teilprojekt_id INTEGER REFERENCES teilprojekte(id);
ALTER TABLE teilprojekte ADD COLUMN ebene INTEGER DEFAULT 1 CHECK (ebene IN (1, 2, 3));
ALTER TABLE teilprojekte ADD COLUMN stammdaten TEXT; -- JSON graue Felder
ALTER TABLE teilprojekte ADD COLUMN ist_geteilt BOOLEAN DEFAULT 0;
ALTER TABLE teilprojekte ADD COLUMN ist_aktiv BOOLEAN DEFAULT 1;
ALTER TABLE teilprojekte ADD COLUMN teilungs_datum TIMESTAMP;
ALTER TABLE teilprojekte ADD COLUMN geteilt_von INTEGER REFERENCES users(id);

-- -----------------------------------------------------------------------------
-- 8. ERWEITERE TABELLE: rapporte
-- -----------------------------------------------------------------------------
-- Neue Spalten für Maßnahmen und Workflow
ALTER TABLE rapporte ADD COLUMN massnahme_id INTEGER REFERENCES massnahmen(id);
ALTER TABLE rapporte ADD COLUMN ist_vorlage BOOLEAN DEFAULT 0;
ALTER TABLE rapporte ADD COLUMN vorlage_id INTEGER REFERENCES rapporte(id);
ALTER TABLE rapporte ADD COLUMN workflow_status VARCHAR(50) DEFAULT 'entwurf' 
    CHECK (workflow_status IN ('entwurf', 'in_bearbeitung', 'zur_pruefung', 'geprueft', 'freigegeben', 'abgelehnt'));
ALTER TABLE rapporte ADD COLUMN geprueft_von INTEGER REFERENCES users(id);
ALTER TABLE rapporte ADD COLUMN geprueft_am TIMESTAMP;
ALTER TABLE rapporte ADD COLUMN freigegeben_von INTEGER REFERENCES users(id);
ALTER TABLE rapporte ADD COLUMN freigegeben_am TIMESTAMP;
ALTER TABLE rapporte ADD COLUMN ablehnungsgrund TEXT;

-- -----------------------------------------------------------------------------
-- 9. ERSTELLE INDIZES für Performance
-- -----------------------------------------------------------------------------
-- Zuweisungen schnell finden
CREATE INDEX IF NOT EXISTS idx_tp_zuweisungen_user ON teilprojekt_zuweisungen(user_id);
CREATE INDEX IF NOT EXISTS idx_tp_zuweisungen_tp ON teilprojekt_zuweisungen(teilprojekt_id);
CREATE INDEX IF NOT EXISTS idx_tp_zuweisungen_gueltig ON teilprojekt_zuweisungen(gueltig_von, gueltig_bis);
CREATE INDEX IF NOT EXISTS idx_tp_zuweisungen_rolle ON teilprojekt_zuweisungen(rolle);

CREATE INDEX IF NOT EXISTS idx_mn_zuweisungen_user ON massnahmen_zuweisungen(user_id);
CREATE INDEX IF NOT EXISTS idx_mn_zuweisungen_mn ON massnahmen_zuweisungen(massnahme_id);
CREATE INDEX IF NOT EXISTS idx_mn_zuweisungen_rolle ON massnahmen_zuweisungen(rolle);

-- Hierarchie-Navigation
CREATE INDEX IF NOT EXISTS idx_tp_parent ON teilprojekte(parent_teilprojekt_id);
CREATE INDEX IF NOT EXISTS idx_tp_ebene ON teilprojekte(ebene);
CREATE INDEX IF NOT EXISTS idx_tp_aktiv ON teilprojekte(ist_aktiv);

CREATE INDEX IF NOT EXISTS idx_mn_parent ON massnahmen(parent_massnahme_id);
CREATE INDEX IF NOT EXISTS idx_mn_tp ON massnahmen(teilprojekt_id);
CREATE INDEX IF NOT EXISTS idx_mn_status ON massnahmen(status);

-- Audit-Trail Suche
CREATE INDEX IF NOT EXISTS idx_audit_entity ON rapport_audit_trail(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_audit_user ON rapport_audit_trail(user_id);
CREATE INDEX IF NOT EXISTS idx_audit_date ON rapport_audit_trail(created_at DESC);

-- Rapport-Felder
CREATE INDEX IF NOT EXISTS idx_rf_rapport ON rapport_felder(rapport_id);
CREATE INDEX IF NOT EXISTS idx_rf_typ ON rapport_felder(feld_typ);
CREATE INDEX IF NOT EXISTS idx_rf_quelle ON rapport_felder(quelle);

-- Workflow
CREATE INDEX IF NOT EXISTS idx_rapport_workflow ON rapporte(workflow_status);
CREATE INDEX IF NOT EXISTS idx_rapport_massnahme ON rapporte(massnahme_id);

-- Historie
CREATE INDEX IF NOT EXISTS idx_historie_tp ON teilprojekt_historie(teilprojekt_id);
CREATE INDEX IF NOT EXISTS idx_historie_aktion ON teilprojekt_historie(aktion);
CREATE INDEX IF NOT EXISTS idx_historie_date ON teilprojekt_historie(created_at DESC);

-- -----------------------------------------------------------------------------
-- 10. ERSTELLE VIEWS für Zugriffskontrolle
-- -----------------------------------------------------------------------------
-- View: Nur zugewiesene Teilprojekte für User (mit aktuellem Datum)
CREATE VIEW IF NOT EXISTS v_user_teilprojekte AS
SELECT DISTINCT
    tp.id,
    tp.gesuch_id,
    tp.nummer,
    tp.name,
    tp.beschreibung,
    tp.budget,
    tp.parent_teilprojekt_id,
    tp.ebene,
    tp.ist_geteilt,
    tp.ist_aktiv,
    tz.user_id,
    tz.rolle,
    tz.gueltig_von,
    tz.gueltig_bis,
    u.name as zugewiesen_an,
    u.email as user_email
FROM teilprojekte tp
JOIN teilprojekt_zuweisungen tz ON tp.id = tz.teilprojekt_id
JOIN users u ON tz.user_id = u.id
WHERE date('now') >= tz.gueltig_von 
  AND (tz.gueltig_bis IS NULL OR date('now') <= tz.gueltig_bis)
  AND tp.ist_aktiv = 1;

-- View: Nur zugewiesene Maßnahmen für User
CREATE VIEW IF NOT EXISTS v_user_massnahmen AS
SELECT DISTINCT
    m.id,
    m.teilprojekt_id,
    m.nummer,
    m.titel,
    m.beschreibung,
    m.budget,
    m.status,
    m.fortschritt,
    mz.user_id,
    mz.rolle,
    tp.name as teilprojekt_name,
    tp.nummer as teilprojekt_nummer,
    u.name as zugewiesen_an
FROM massnahmen m
JOIN massnahmen_zuweisungen mz ON m.id = mz.massnahme_id
JOIN teilprojekte tp ON m.teilprojekt_id = tp.id
JOIN users u ON mz.user_id = u.id
WHERE date('now') >= mz.gueltig_von 
  AND (mz.gueltig_bis IS NULL OR date('now') <= mz.gueltig_bis);

-- View: Hierarchische Teilprojekt-Struktur
CREATE VIEW IF NOT EXISTS v_teilprojekt_hierarchie AS
WITH RECURSIVE tp_tree AS (
    -- Basis: Haupt-Teilprojekte (Ebene 1)
    SELECT 
        id,
        gesuch_id,
        nummer,
        name,
        budget,
        parent_teilprojekt_id,
        ebene,
        ist_geteilt,
        ist_aktiv,
        nummer as pfad
    FROM teilprojekte
    WHERE parent_teilprojekt_id IS NULL
    
    UNION ALL
    
    -- Rekursiv: Unter-Teilprojekte
    SELECT 
        t.id,
        t.gesuch_id,
        t.nummer,
        t.name,
        t.budget,
        t.parent_teilprojekt_id,
        t.ebene,
        t.ist_geteilt,
        t.ist_aktiv,
        p.pfad || '.' || t.nummer as pfad
    FROM teilprojekte t
    JOIN tp_tree p ON t.parent_teilprojekt_id = p.id
)
SELECT * FROM tp_tree ORDER BY pfad;

-- -----------------------------------------------------------------------------
-- 11. TRIGGER für Audit-Trail (SQLite-kompatibel)
-- -----------------------------------------------------------------------------
-- Trigger für Teilprojekt-Änderungen
CREATE TRIGGER IF NOT EXISTS tr_teilprojekt_audit
AFTER UPDATE ON teilprojekte
BEGIN
    INSERT INTO rapport_audit_trail (
        entity_type, entity_id, aktion, 
        alte_werte, neue_werte, 
        user_id, created_at
    ) VALUES (
        'teilprojekt', NEW.id, 'update',
        json_object('budget', OLD.budget, 'name', OLD.name, 'ist_aktiv', OLD.ist_aktiv),
        json_object('budget', NEW.budget, 'name', NEW.name, 'ist_aktiv', NEW.ist_aktiv),
        1, -- TODO: User aus Session
        CURRENT_TIMESTAMP
    );
END;

-- Trigger für Zuweisung-Erstellung
CREATE TRIGGER IF NOT EXISTS tr_zuweisung_create_audit
AFTER INSERT ON teilprojekt_zuweisungen
BEGIN
    INSERT INTO rapport_audit_trail (
        entity_type, entity_id, aktion,
        neue_werte,
        user_id, created_at
    ) VALUES (
        'zuweisung', NEW.id, 'create',
        json_object('teilprojekt_id', NEW.teilprojekt_id, 'user_id', NEW.user_id, 'rolle', NEW.rolle),
        COALESCE(NEW.zugewiesen_von, 1),
        CURRENT_TIMESTAMP
    );
END;

-- -----------------------------------------------------------------------------
-- 12. INITIAL-DATEN für Migration
-- -----------------------------------------------------------------------------
-- Erstelle Audit-Eintrag für Migration
INSERT INTO rapport_audit_trail (
    entity_type, entity_id, aktion, 
    neue_werte, 
    user_id, user_name, created_at
) VALUES (
    'migration', 10, 'execute',
    json_object('migration', '010_multi_user_teilprojekt_system', 'version', '1.0'),
    1, 'System', CURRENT_TIMESTAMP
);

-- -----------------------------------------------------------------------------
-- 13. VALIDIERUNG
-- -----------------------------------------------------------------------------
-- Prüfe ob alle Tabellen erstellt wurden
SELECT 'Migration 010 completed successfully' as status,
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='teilprojekt_zuweisungen') as tp_zuw,
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='massnahmen') as mass,
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='rapport_audit_trail') as audit;