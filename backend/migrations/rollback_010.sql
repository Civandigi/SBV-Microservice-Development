-- ============================================================================
-- Rollback: 010_multi_user_teilprojekt_system.sql
-- Datum: 2025-08-26
-- Beschreibung: Rollback für Multi-User Teilprojekt-System
-- ============================================================================

-- -----------------------------------------------------------------------------
-- 1. VIEWS LÖSCHEN
-- -----------------------------------------------------------------------------
DROP VIEW IF EXISTS v_teilprojekt_hierarchie;
DROP VIEW IF EXISTS v_user_massnahmen;
DROP VIEW IF EXISTS v_user_teilprojekte;

-- -----------------------------------------------------------------------------
-- 2. TRIGGER LÖSCHEN
-- -----------------------------------------------------------------------------
DROP TRIGGER IF EXISTS tr_zuweisung_create_audit;
DROP TRIGGER IF EXISTS tr_teilprojekt_audit;

-- -----------------------------------------------------------------------------
-- 3. INDIZES LÖSCHEN
-- -----------------------------------------------------------------------------
-- Historie
DROP INDEX IF EXISTS idx_historie_date;
DROP INDEX IF EXISTS idx_historie_aktion;
DROP INDEX IF EXISTS idx_historie_tp;

-- Workflow
DROP INDEX IF EXISTS idx_rapport_massnahme;
DROP INDEX IF EXISTS idx_rapport_workflow;

-- Rapport-Felder
DROP INDEX IF EXISTS idx_rf_quelle;
DROP INDEX IF EXISTS idx_rf_typ;
DROP INDEX IF EXISTS idx_rf_rapport;

-- Audit-Trail
DROP INDEX IF EXISTS idx_audit_date;
DROP INDEX IF EXISTS idx_audit_user;
DROP INDEX IF EXISTS idx_audit_entity;

-- Maßnahmen
DROP INDEX IF EXISTS idx_mn_status;
DROP INDEX IF EXISTS idx_mn_tp;
DROP INDEX IF EXISTS idx_mn_parent;
DROP INDEX IF EXISTS idx_mn_zuweisungen_rolle;
DROP INDEX IF EXISTS idx_mn_zuweisungen_mn;
DROP INDEX IF EXISTS idx_mn_zuweisungen_user;

-- Teilprojekte
DROP INDEX IF EXISTS idx_tp_aktiv;
DROP INDEX IF EXISTS idx_tp_ebene;
DROP INDEX IF EXISTS idx_tp_parent;
DROP INDEX IF EXISTS idx_tp_zuweisungen_rolle;
DROP INDEX IF EXISTS idx_tp_zuweisungen_gueltig;
DROP INDEX IF EXISTS idx_tp_zuweisungen_tp;
DROP INDEX IF EXISTS idx_tp_zuweisungen_user;

-- -----------------------------------------------------------------------------
-- 4. FOREIGN KEY CONSTRAINTS TEMPORÄR DEAKTIVIEREN
-- -----------------------------------------------------------------------------
PRAGMA foreign_keys = OFF;

-- -----------------------------------------------------------------------------
-- 5. SPALTEN AUS BESTEHENDEN TABELLEN ENTFERNEN (SQLite-Workaround)
-- -----------------------------------------------------------------------------
-- SQLite unterstützt kein direktes DROP COLUMN, daher Tabellen neu erstellen

-- Backup und Neuerstellen von gesuch_teilprojekte
CREATE TABLE gesuch_teilprojekte_backup AS 
SELECT id, gesuch_id, nummer, name, beschreibung, budget, 
       automatisch_erkannt, manuell_korrigiert, rapport_id, created_at
FROM gesuch_teilprojekte;

DROP TABLE gesuch_teilprojekte;

CREATE TABLE gesuch_teilprojekte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    gesuch_id INTEGER REFERENCES gesuche(id) ON DELETE CASCADE,
    nummer VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    budget DECIMAL(12, 2),
    automatisch_erkannt BOOLEAN,
    manuell_korrigiert BOOLEAN,
    rapport_id INTEGER REFERENCES rapporte(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

INSERT INTO gesuch_teilprojekte 
SELECT * FROM gesuch_teilprojekte_backup;

DROP TABLE gesuch_teilprojekte_backup;

-- Backup und Neuerstellen von rapporte (ohne neue Spalten)
CREATE TABLE rapporte_backup AS 
SELECT id, titel, beschreibung, datum, arbeitszeit, abteilung, 
       k_ziele_beitraege, herausforderungen, status, priority, category,
       author_id, assigned_to, approved_by, gesuch_id, teilprojekt_id,
       created_at, updated_at, submitted_at, approved_at, rejection_reason
FROM rapporte;

DROP TABLE rapporte;

CREATE TABLE rapporte (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    titel VARCHAR(500) NOT NULL,
    beschreibung TEXT,
    datum DATE,
    arbeitszeit DECIMAL(5,2),
    abteilung VARCHAR(100),
    k_ziele_beitraege TEXT,
    herausforderungen TEXT,
    status VARCHAR(50) DEFAULT 'entwurf' CHECK (status IN ('entwurf', 'eingereicht', 'in_bearbeitung', 'fertig', 'genehmigt', 'abgelehnt')),
    priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('niedrig', 'normal', 'hoch', 'kritisch')),
    category VARCHAR(100),
    author_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
    assigned_to INTEGER REFERENCES users(id) ON DELETE SET NULL,
    approved_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
    gesuch_id INTEGER REFERENCES gesuche(id),
    teilprojekt_id INTEGER REFERENCES gesuch_teilprojekte(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    submitted_at TIMESTAMP,
    approved_at TIMESTAMP,
    rejection_reason TEXT
);

INSERT INTO rapporte 
SELECT * FROM rapporte_backup;

DROP TABLE rapporte_backup;

-- -----------------------------------------------------------------------------
-- 6. NEUE TABELLEN LÖSCHEN
-- -----------------------------------------------------------------------------
DROP TABLE IF EXISTS rapport_felder;
DROP TABLE IF EXISTS rapport_audit_trail;
DROP TABLE IF EXISTS teilprojekt_historie;
DROP TABLE IF EXISTS massnahmen_zuweisungen;
DROP TABLE IF EXISTS massnahmen;
DROP TABLE IF EXISTS teilprojekt_zuweisungen;

-- -----------------------------------------------------------------------------
-- 7. FOREIGN KEY CONSTRAINTS WIEDER AKTIVIEREN
-- -----------------------------------------------------------------------------
PRAGMA foreign_keys = ON;

-- -----------------------------------------------------------------------------
-- 8. VALIDIERUNG DES ROLLBACKS
-- -----------------------------------------------------------------------------
SELECT 'Rollback 010 completed successfully' as status,
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='teilprojekt_zuweisungen') as tp_zuw_removed,
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='massnahmen') as mass_removed,
       (SELECT COUNT(*) FROM sqlite_master WHERE type='table' AND name='rapport_audit_trail') as audit_removed,
       'Expected: 0, 0, 0' as expected;

-- -----------------------------------------------------------------------------
-- 9. AUDIT-EINTRAG FÜR ROLLBACK
-- -----------------------------------------------------------------------------
-- Falls die audit_trail Tabelle noch existiert (in älteren Versionen)
INSERT OR IGNORE INTO activity_logs (
    user_id, action, resource_type, resource_id, 
    details, created_at
) VALUES (
    1, 'rollback', 'migration', 10,
    json_object('migration', '010_multi_user_teilprojekt_system', 'action', 'rollback'),
    CURRENT_TIMESTAMP
);