-- SBV Professional V2 - Webhook Logs Table
-- Migration: 005_webhook_logs.sql
-- Created: 2025-07-30
-- Description: Creates webhook_logs table for tracking webhook events

BEGIN;

-- Create webhook_logs table
CREATE TABLE IF NOT EXISTS webhook_logs (
    id SERIAL PRIMARY KEY,
    entity_id INTEGER NOT NULL,
    event_type VARCHAR(100) NOT NULL,
    status VARCHAR(20) NOT NULL CHECK (status IN ('success', 'failed', 'pending')),
    response_data JSONB,
    retry_count INTEGER DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add indexes for performance
CREATE INDEX idx_webhook_logs_entity ON webhook_logs(entity_id);
CREATE INDEX idx_webhook_logs_event_type ON webhook_logs(event_type);
CREATE INDEX idx_webhook_logs_status ON webhook_logs(status);
CREATE INDEX idx_webhook_logs_created ON webhook_logs(created_at);

-- Add comments
COMMENT ON TABLE webhook_logs IS 'Audit log for all webhook events sent to n8n';
COMMENT ON COLUMN webhook_logs.entity_id IS 'ID of the entity (gesuch_id, teilprojekt_id, etc.)';
COMMENT ON COLUMN webhook_logs.event_type IS 'Type of webhook event (gesuch.submitted, teilprojekt.approved, etc.)';
COMMENT ON COLUMN webhook_logs.status IS 'Status of the webhook delivery';
COMMENT ON COLUMN webhook_logs.response_data IS 'Response data from n8n webhook';
COMMENT ON COLUMN webhook_logs.retry_count IS 'Number of retry attempts for failed webhooks';

-- Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_webhook_logs_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
CREATE TRIGGER update_webhook_logs_updated_at_trigger
    BEFORE UPDATE ON webhook_logs
    FOR EACH ROW
    EXECUTE FUNCTION update_webhook_logs_updated_at();

-- Add webhook configuration to system_config (if table exists)
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'system_config') THEN
        INSERT INTO system_config (key, value, description, created_at)
        VALUES 
            ('webhook.enabled', 'false', 'Enable/disable webhook integration', NOW()),
            ('webhook.retry_max_attempts', '3', 'Maximum retry attempts for failed webhooks', NOW()),
            ('webhook.retry_delay_seconds', '300', 'Delay between retry attempts in seconds', NOW())
        ON CONFLICT (key) DO NOTHING;
    END IF;
END $$;

COMMIT;

-- Migration completed: Webhook logs table created for n8n integration