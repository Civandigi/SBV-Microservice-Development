-- Migration 009: Gesuch Tables for Production
-- Full implementation with all required fields

-- Drop existing tables if they exist (for clean migration)
DROP TABLE IF EXISTS gesuch_teilprojekte CASCADE;
DROP TABLE IF EXISTS gesuche CASCADE;

-- 1. Create gesuche (applications) table
CREATE TABLE IF NOT EXISTS gesuche (
    id SERIAL PRIMARY KEY,
    jahr INTEGER NOT NULL,
    titel VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    datei_pfad TEXT NOT NULL,
    datei_name VARCHAR(255) NOT NULL,
    datei_typ VARCHAR(50),
    datei_groesse INTEGER,
    
    -- Extracted/corrected data (JSON for flexibility)
    extrahierte_daten TEXT,
    korrigierte_daten TEXT,
    
    -- Status tracking
    status VARCHAR(50) DEFAULT 'hochgeladen',
    bearbeitet_von INTEGER REFERENCES users(id),
    
    -- Timestamps
    hochgeladen_am TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    bearbeitet_am TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Create gesuch_teilprojekte (sub-projects) table
CREATE TABLE IF NOT EXISTS gesuch_teilprojekte (
    id SERIAL PRIMARY KEY,
    gesuch_id INTEGER NOT NULL REFERENCES gesuche(id) ON DELETE CASCADE,
    
    -- Teilprojekt details
    nummer VARCHAR(50),
    name VARCHAR(255) NOT NULL,
    beschreibung TEXT,
    budget DECIMAL(12, 2),
    
    -- Tracking
    automatisch_erkannt BOOLEAN DEFAULT false,
    manuell_korrigiert BOOLEAN DEFAULT false,
    
    -- Related rapport (if created)
    rapport_id INTEGER REFERENCES rapporte(id),
    
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 3. Add gesuch reference to rapporte table
ALTER TABLE rapporte 
ADD COLUMN IF NOT EXISTS gesuch_id INTEGER REFERENCES gesuche(id),
ADD COLUMN IF NOT EXISTS teilprojekt_id INTEGER REFERENCES gesuch_teilprojekte(id);

-- 4. Create indices for performance
CREATE INDEX IF NOT EXISTS idx_gesuche_jahr ON gesuche(jahr);
CREATE INDEX IF NOT EXISTS idx_gesuche_status ON gesuche(status);
CREATE INDEX IF NOT EXISTS idx_gesuch_teilprojekte_gesuch ON gesuch_teilprojekte(gesuch_id);
CREATE INDEX IF NOT EXISTS idx_rapporte_gesuch ON rapporte(gesuch_id);

-- 5. Add comments for documentation
-- Comments are not supported in SQLite, but kept as documentation:
-- gesuche: Stores uploaded Gesuch documents with extracted and corrected data
-- gesuch_teilprojekte: Stores individual sub-projects extracted from Gesuch documents
-- extrahierte_daten: Automatically extracted data from document (JSON string)
-- korrigierte_daten: Admin-corrected data after review (JSON string)
-- automatisch_erkannt: Whether this sub-project was automatically detected
-- manuell_korrigiert: Whether admin made manual corrections