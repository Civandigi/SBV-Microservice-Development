-- Migration 013: Microservice Integration Schema
-- Phase 1 Tag 1: Erweiterte Schema für Microservice-Support
-- Date: 2025-08-27

-- Job tracking für async operations
CREATE TABLE IF NOT EXISTS service_jobs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    job_id VARCHAR(255) UNIQUE NOT NULL,
    service_name VARCHAR(100) NOT NULL,
    operation VARCHAR(100) NOT NULL,
    status VARCHAR(50) DEFAULT 'pending',
    payload TEXT, -- JSON
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