-- Migration 011: Create rapport_templates table
-- Diese Tabelle speichert die Templates für verschiedene Teilprojekte

CREATE TABLE IF NOT EXISTS rapport_templates (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    teilprojekt VARCHAR(100) NOT NULL,
    template_name VARCHAR(200) NOT NULL,
    template_data TEXT NOT NULL, -- JSON data
    aktiv BOOLEAN DEFAULT true,
    erstellt_am DATETIME DEFAULT CURRENT_TIMESTAMP,
    aktualisiert_am DATETIME DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(teilprojekt)
);

-- Beispiel Templates einfügen
INSERT INTO rapport_templates (teilprojekt, template_name, template_data) VALUES
('TP1', 'Teilprojekt 1 - Template', '{"fields": [], "budget": 100000}'),
('TP2', 'Teilprojekt 2 - Template', '{"fields": [], "budget": 200000}'),
('TP3', 'Teilprojekt 3 - Template', '{"fields": [], "budget": 300000}'),
('TP4', 'Teilprojekt 4 - Template', '{"fields": [], "budget": 400000}'),
('TP5', 'Teilprojekt 5 - Template', '{"fields": [], "budget": 500000}'),
('TP6', 'Teilprojekt 6 - Template', '{"fields": [], "budget": 600000}');