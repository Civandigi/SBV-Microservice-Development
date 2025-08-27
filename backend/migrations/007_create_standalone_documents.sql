-- SBV Professional V2 - Standalone Documents Table
-- Migration: 007_create_standalone_documents.sql
-- Created: 2025-07-30
-- Description: Creates standalone documents table for general document management

-- Check if documents table needs to be renamed
DO $$
BEGIN
    IF EXISTS (SELECT FROM pg_tables WHERE tablename = 'documents' AND schemaname = 'public') 
       AND NOT EXISTS (SELECT FROM pg_tables WHERE tablename = 'rapport_documents' AND schemaname = 'public') THEN
        ALTER TABLE documents RENAME TO rapport_documents;
    END IF;
END $$;

-- Create new standalone_documents table for general document management
CREATE TABLE IF NOT EXISTS standalone_documents (
    id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    title VARCHAR(255) NOT NULL,
    filename VARCHAR(255) NOT NULL,
    original_filename VARCHAR(255) NOT NULL,
    category VARCHAR(50) NOT NULL CHECK (category IN ('formulare', 'richtlinien', 'vorlagen', 'berichte')),
    description TEXT,
    file_path VARCHAR(500) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_standalone_documents_user_id ON standalone_documents(user_id);
CREATE INDEX IF NOT EXISTS idx_standalone_documents_category ON standalone_documents(category);
CREATE INDEX IF NOT EXISTS idx_standalone_documents_created_at ON standalone_documents(created_at DESC);

-- Add trigger to update updated_at
CREATE OR REPLACE FUNCTION update_documents_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_standalone_documents_updated_at
    BEFORE UPDATE ON standalone_documents
    FOR EACH ROW
    EXECUTE FUNCTION update_documents_updated_at();

-- Add comment for documentation
COMMENT ON TABLE standalone_documents IS 'Stores standalone documents for general document management (forms, guidelines, templates, reports)';

-- Add some example documents for demo users (only if users exist)
INSERT INTO standalone_documents (user_id, title, filename, original_filename, category, description, file_path, file_size, mime_type) 
SELECT 1, 'SBV Mitarbeiter Handbuch', '1234567890-abc123.pdf', 'sbv_handbuch_2025.pdf', 'richtlinien', 'Aktuelles Handbuch für alle SBV Mitarbeiter', '/uploads/documents/1234567890-abc123.pdf', 2458624, 'application/pdf'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO standalone_documents (user_id, title, filename, original_filename, category, description, file_path, file_size, mime_type) 
SELECT 1, 'Urlaubsantrag Formular', '1234567891-def456.pdf', 'urlaubsantrag_formular.pdf', 'formulare', 'Formular für Urlaubsanträge', '/uploads/documents/1234567891-def456.pdf', 156789, 'application/pdf'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 1);

INSERT INTO standalone_documents (user_id, title, filename, original_filename, category, description, file_path, file_size, mime_type) 
SELECT 2, 'Projektbericht Q1 2025', '1234567892-ghi789.pdf', 'projektbericht_q1_2025.pdf', 'berichte', 'Quartalbericht für das erste Quartal 2025', '/uploads/documents/1234567892-ghi789.pdf', 3567890, 'application/pdf'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 2);

INSERT INTO standalone_documents (user_id, title, filename, original_filename, category, description, file_path, file_size, mime_type) 
SELECT 2, 'Rapport Vorlage', '1234567893-jkl012.docx', 'rapport_vorlage.docx', 'vorlagen', 'Standard Vorlage für Arbeitsrapporte', '/uploads/documents/1234567893-jkl012.docx', 89456, 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 2);

INSERT INTO standalone_documents (user_id, title, filename, original_filename, category, description, file_path, file_size, mime_type) 
SELECT 3, 'IT Sicherheitsrichtlinie', '1234567894-mno345.pdf', 'it_sicherheit_richtlinie.pdf', 'richtlinien', 'Richtlinie für IT-Sicherheit im Unternehmen', '/uploads/documents/1234567894-mno345.pdf', 456789, 'application/pdf'
WHERE EXISTS (SELECT 1 FROM users WHERE id = 3);

-- Grant permissions
GRANT SELECT, INSERT, UPDATE, DELETE ON standalone_documents TO CURRENT_USER;
GRANT USAGE, SELECT ON SEQUENCE standalone_documents_id_seq TO CURRENT_USER;