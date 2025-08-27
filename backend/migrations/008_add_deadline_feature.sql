-- Migration: Add Deadline Feature for Rapport Requests
-- Date: 2025-08-06
-- Description: Adds fields to support admin rapport requests with deadlines

-- Add new columns to rapporte table for deadline feature
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS requested_by INTEGER REFERENCES users(id);
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS deadline DATE;
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS request_description TEXT;
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS is_requested BOOLEAN DEFAULT FALSE;
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS request_created_at TIMESTAMP;
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS reminder_sent BOOLEAN DEFAULT FALSE;
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS request_fulfilled_at TIMESTAMP;
ALTER TABLE rapporte ADD COLUMN IF NOT EXISTS fulfilled_rapport_id INTEGER;

-- Create indices for performance
CREATE INDEX IF NOT EXISTS idx_rapporte_deadline 
    ON rapporte(deadline) 
    WHERE is_requested = true AND deadline IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_rapporte_requested_user 
    ON rapporte(author_id, is_requested) 
    WHERE is_requested = true;

CREATE INDEX IF NOT EXISTS idx_rapporte_requested_by 
    ON rapporte(requested_by) 
    WHERE requested_by IS NOT NULL;

-- Create a view for easy access to pending requests (simplified without user joins first)
CREATE OR REPLACE VIEW pending_rapport_requests AS
SELECT 
    r.id,
    r.title,
    r.request_description,
    r.deadline,
    r.request_created_at,
    r.author_id,
    r.requested_by,
    r.category as teilprojekt,
    CASE 
        WHEN r.fulfilled_rapport_id IS NOT NULL THEN 'fulfilled'
        WHEN r.deadline < CURRENT_DATE THEN 'overdue'
        WHEN r.deadline <= CURRENT_DATE + INTERVAL '3 days' THEN 'urgent'
        ELSE 'pending'
    END as status,
    r.deadline - CURRENT_DATE as days_remaining
FROM rapporte r
WHERE r.is_requested = true;