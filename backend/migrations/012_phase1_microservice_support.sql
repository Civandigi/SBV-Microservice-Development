-- Phase 1: Microservice Support Migration
-- Erweitert die Datenbank für Service-Integration

-- Service Jobs Tracking
CREATE TABLE IF NOT EXISTS service_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    payload TEXT, -- JSON
    status VARCHAR(50) DEFAULT 'pending',
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

-- Erweitere teilprojekte für Service-Integration
ALTER TABLE teilprojekte ADD COLUMN service_job_id VARCHAR(255);
ALTER TABLE teilprojekte ADD COLUMN extracted_data TEXT; -- JSON
ALTER TABLE teilprojekte ADD COLUMN extraction_confidence DECIMAL(3,2);

-- Erweitere rapporte für Service-Integration
ALTER TABLE rapporte ADD COLUMN service_job_id VARCHAR(255);
ALTER TABLE rapporte ADD COLUMN template_version VARCHAR(50);
ALTER TABLE rapporte ADD COLUMN generation_settings TEXT; -- JSON

-- Indexe für Performance
CREATE INDEX IF NOT EXISTS idx_service_jobs_job_id ON service_jobs(job_id);
CREATE INDEX IF NOT EXISTS idx_service_jobs_status ON service_jobs(status);
CREATE INDEX IF NOT EXISTS idx_gesuche_service_job_id ON gesuche(service_job_id);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_endpoint ON webhook_logs(endpoint);
CREATE INDEX IF NOT EXISTS idx_webhook_logs_created_at ON webhook_logs(created_at);
