const { query } = require('../config/database');

class GesuchMicroserviceClient {
    constructor() {
        this.baseUrl = process.env.GESUCH_SERVICE_URL || 'http://localhost:3001';
        this.apiKey = process.env.GESUCH_SERVICE_API_KEY;
        this.timeout = parseInt(process.env.GESUCH_SERVICE_TIMEOUT || '30000');
    }
    
    async processGesuch(fileBuffer, filename, metadata) {
        const formData = new FormData();
        formData.append('file', new Blob([fileBuffer]), filename);
        formData.append('metadata', JSON.stringify({
            gesuchId: metadata.gesuchId,
            jahr: metadata.jahr,
            titel: metadata.titel,
            callbackUrl: `${process.env.APP_URL}/api/webhooks/gesuch-processed`
        }));
        
        try {
            const response = await fetch(`${this.baseUrl}/process-gesuch`, {
                method: 'POST',
                headers: {
                    'X-API-Key': this.apiKey
                },
                body: formData,
                signal: AbortSignal.timeout(this.timeout)
            });
            
            if (!response.ok) {
                throw new Error(`Service returned ${response.status}`);
            }
            
            const result = await response.json();
            
            // Track job
            await this.trackJob(result.jobId, 'process-gesuch', metadata);
            
            return result;
            
        } catch (error) {
            console.error('Microservice call failed:', error);
            
            // Fallback to manual mode
            return {
                jobId: null,
                status: 'manual',
                message: 'Automatische Verarbeitung nicht verfügbar'
            };
        }
    }
    
    async generateRapporte(gesuchId, teilprojekte, settings = {}) {
        const payload = {
            gesuchId,
            teilprojekte,
            templateSettings: settings,
            callbackUrl: `${process.env.APP_URL}/api/webhooks/rapporte-ready`
        };
        
        try {
            const response = await fetch(`${this.baseUrl}/generate-rapporte`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(this.timeout)
            });
            
            if (!response.ok) {
                throw new Error(`Service returned ${response.status}`);
            }
            
            const result = await response.json();
            
            // Track job
            await this.trackJob(result.jobId, 'generate-rapporte', payload);
            
            return result;
            
        } catch (error) {
            console.error('Rapport generation failed:', error);
            
            return {
                jobId: null,
                status: 'manual',
                message: 'Automatische Rapport-Generierung nicht verfügbar'
            };
        }
    }
    
    async exportWord(rapportIds, gesuchId, format = 'docx') {
        const payload = {
            rapportIds,
            gesuchId,
            format,
            callbackUrl: `${process.env.APP_URL}/api/webhooks/word-ready`
        };
        
        try {
            const response = await fetch(`${this.baseUrl}/export-word`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'X-API-Key': this.apiKey
                },
                body: JSON.stringify(payload),
                signal: AbortSignal.timeout(this.timeout)
            });
            
            if (!response.ok) {
                throw new Error(`Service returned ${response.status}`);
            }
            
            const result = await response.json();
            
            // Track job
            await this.trackJob(result.jobId, 'export-word', payload);
            
            return result;
            
        } catch (error) {
            console.error('Word export failed:', error);
            
            return {
                jobId: null,
                status: 'manual',
                message: 'Automatischer Word-Export nicht verfügbar'
            };
        }
    }
    
    async getJobStatus(jobId) {
        try {
            const response = await fetch(`${this.baseUrl}/status/${jobId}`, {
                headers: {
                    'X-API-Key': this.apiKey
                },
                signal: AbortSignal.timeout(10000)
            });
            
            if (!response.ok) {
                throw new Error(`Service returned ${response.status}`);
            }
            
            return await response.json();
            
        } catch (error) {
            console.error('Status check failed:', error);
            
            return {
                status: 'unknown',
                message: 'Status nicht verfügbar'
            };
        }
    }
    
    async trackJob(jobId, operation, payload) {
        try {
            await query(`
                INSERT INTO service_jobs (job_id, service_name, operation, payload, status)
                VALUES (?, 'gesuch-microservice', ?, ?, 'pending')
            `, [jobId, operation, JSON.stringify(payload)]);
        } catch (error) {
            console.error('Failed to track job:', error);
        }
    }
    
    async updateJobStatus(jobId, status, result = null, error = null) {
        try {
            await query(`
                UPDATE service_jobs 
                SET status = ?, result = ?, error_message = ?, updated_at = CURRENT_TIMESTAMP
                WHERE job_id = ?
            `, [status, result ? JSON.stringify(result) : null, error, jobId]);
        } catch (error) {
            console.error('Failed to update job status:', error);
        }
    }
    
    async logWebhook(endpoint, payload, signature, validSignature, error = null) {
        try {
            await query(`
                INSERT INTO webhook_logs (endpoint, payload, signature, valid_signature, error_message)
                VALUES (?, ?, ?, ?, ?)
            `, [endpoint, JSON.stringify(payload), signature, validSignature, error]);
        } catch (error) {
            console.error('Failed to log webhook:', error);
        }
    }
}

module.exports = new GesuchMicroserviceClient();
