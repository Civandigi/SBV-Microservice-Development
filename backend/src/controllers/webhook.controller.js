// SBV Professional V2 - Webhook Controller for Microservice Integration
const { query } = require('../config/database');
const crypto = require('crypto');

class WebhookController {
    /**
     * Handle Gesuch processed webhook from microservice
     */
    static async handleGesuchProcessed(req, res) {
        try {
            // Validate webhook signature
            const signature = req.headers['x-webhook-signature'];
            if (!WebhookController.validateSignature(req.body, signature)) {
                console.error('Invalid webhook signature');
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid signature' 
                });
            }

            const { event, jobId, gesuchId, status, teilprojekte, error } = req.body;
            
            console.log(`[Webhook] Gesuch processed: ${gesuchId}, Status: ${status}`);
            
            // Log webhook receipt
            await WebhookController.logWebhook('gesuch.processed', req.body, signature, true);
            
            if (status === 'completed' && teilprojekte) {
                // Update job status
                await query(
                    `UPDATE service_jobs 
                     SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP 
                     WHERE job_id = ?`,
                    ['completed', JSON.stringify({ teilprojekte }), jobId]
                );
                
                // Save extracted Teilprojekte
                for (const tp of teilprojekte) {
                    const tpResult = await query(`
                        INSERT INTO teilprojekte 
                        (gesuch_id, nummer, name, beschreibung, budget, status)
                        VALUES (?, ?, ?, ?, ?, 'offen')
                    `, [gesuchId, tp.nummer, tp.name, tp.beschreibung || '', tp.budget || 0]);
                    
                    // Save Maßnahmen if present
                    if (tp.massnahmen && Array.isArray(tp.massnahmen)) {
                        for (const massnahme of tp.massnahmen) {
                            await query(`
                                INSERT INTO massnahmen 
                                (teilprojekt_id, name, beschreibung, budget)
                                VALUES (?, ?, ?, ?)
                            `, [tpResult.lastID, massnahme.name, massnahme.beschreibung || '', massnahme.budget || 0]);
                        }
                    }
                }
                
                // Update Gesuch status
                await query(
                    'UPDATE gesuche SET status = ?, processing_completed_at = CURRENT_TIMESTAMP WHERE id = ?',
                    ['verarbeitet', gesuchId]
                );
                
                console.log(`✅ Gesuch ${gesuchId}: ${teilprojekte.length} Teilprojekte gespeichert`);
                
                // TODO: Notify frontend via WebSocket
                // io.emit('gesuch-processed', { gesuchId, teilprojekte });
                
            } else if (status === 'failed') {
                // Update job status with error
                await query(
                    `UPDATE service_jobs 
                     SET status = ?, error_message = ?, completed_at = CURRENT_TIMESTAMP 
                     WHERE job_id = ?`,
                    ['failed', error || 'Unknown error', jobId]
                );
                
                // Update Gesuch status
                await query(
                    'UPDATE gesuche SET status = ?, service_error = ? WHERE id = ?',
                    ['fehler', error || 'Processing failed', gesuchId]
                );
                
                console.error(`❌ Gesuch ${gesuchId} processing failed: ${error}`);
            }
            
            res.json({ 
                success: true, 
                received: true,
                message: 'Webhook processed successfully' 
            });
            
        } catch (error) {
            console.error('Webhook processing error:', error);
            
            // Log failed webhook
            await WebhookController.logWebhook('gesuch.processed', req.body, '', false, error.message);
            
            res.status(500).json({ 
                success: false, 
                error: 'Webhook processing failed' 
            });
        }
    }
    
    /**
     * Handle Rapporte ready webhook from microservice
     */
    static async handleRapporteReady(req, res) {
        try {
            const signature = req.headers['x-webhook-signature'];
            if (!WebhookController.validateSignature(req.body, signature)) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid signature' 
                });
            }
            
            const { event, jobId, gesuchId, rapporte } = req.body;
            
            console.log(`[Webhook] Rapporte ready: ${gesuchId}, Count: ${rapporte.length}`);
            
            await WebhookController.logWebhook('rapporte.ready', req.body, signature, true);
            
            // Save generated Rapport templates
            const rapportIds = [];
            
            for (const rapport of rapporte) {
                const result = await query(`
                    INSERT INTO rapporte 
                    (titel, beschreibung, gesuch_id, teilprojekt_id, massnahme_id, 
                     status, is_template, author_id, created_at)
                    VALUES (?, ?, ?, ?, ?, 'entwurf', 1, NULL, CURRENT_TIMESTAMP)
                `, [
                    rapport.titel,
                    rapport.beschreibung || '',
                    gesuchId,
                    rapport.teilprojektId || null,
                    rapport.massnahmeId || null
                ]);
                
                rapportIds.push(result.lastID);
                
                // Create link in junction table
                await query(`
                    INSERT INTO gesuch_rapporte 
                    (gesuch_id, rapport_id, teilprojekt_id)
                    VALUES (?, ?, ?)
                `, [gesuchId, result.lastID, rapport.teilprojektId || null]);
            }
            
            // Update job status
            await query(
                `UPDATE service_jobs 
                 SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP 
                 WHERE job_id = ?`,
                ['completed', JSON.stringify({ rapportIds }), jobId]
            );
            
            console.log(`✅ ${rapporte.length} Rapport-Templates für Gesuch ${gesuchId} erstellt`);
            
            res.json({ 
                success: true, 
                received: true,
                rapportIds 
            });
            
        } catch (error) {
            console.error('Rapporte webhook error:', error);
            await WebhookController.logWebhook('rapporte.ready', req.body, '', false, error.message);
            res.status(500).json({ 
                success: false, 
                error: 'Webhook processing failed' 
            });
        }
    }
    
    /**
     * Handle Word export ready webhook
     */
    static async handleWordReady(req, res) {
        try {
            const signature = req.headers['x-webhook-signature'];
            if (!WebhookController.validateSignature(req.body, signature)) {
                return res.status(401).json({ 
                    success: false, 
                    error: 'Invalid signature' 
                });
            }
            
            const { event, jobId, gesuchId, downloadUrl, expiresAt, fileSize, fileName } = req.body;
            
            console.log(`[Webhook] Word export ready: ${fileName}`);
            
            await WebhookController.logWebhook('export.ready', req.body, signature, true);
            
            // Save export information
            await query(`
                INSERT INTO document_exports 
                (gesuch_id, job_id, download_url, expires_at, file_name, file_size, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [gesuchId, jobId, downloadUrl, expiresAt, fileName || 'export.docx', fileSize || 0]);
            
            // Update job status
            await query(
                `UPDATE service_jobs 
                 SET status = ?, result = ?, completed_at = CURRENT_TIMESTAMP 
                 WHERE job_id = ?`,
                ['completed', JSON.stringify({ downloadUrl, expiresAt }), jobId]
            );
            
            console.log(`✅ Word-Export bereit: ${downloadUrl}`);
            
            // TODO: Notify admin via WebSocket
            // io.emit('export-ready', { gesuchId, downloadUrl });
            
            res.json({ 
                success: true, 
                received: true,
                downloadUrl 
            });
            
        } catch (error) {
            console.error('Export webhook error:', error);
            await WebhookController.logWebhook('export.ready', req.body, '', false, error.message);
            res.status(500).json({ 
                success: false, 
                error: 'Webhook processing failed' 
            });
        }
    }
    
    /**
     * Validate webhook signature
     */
    static validateSignature(payload, signature) {
        if (!process.env.WEBHOOK_SECRET) {
            console.warn('⚠️ WEBHOOK_SECRET not configured, skipping validation');
            return true; // Skip validation in development if not configured
        }
        
        const expectedSignature = crypto
            .createHmac('sha256', process.env.WEBHOOK_SECRET)
            .update(JSON.stringify(payload))
            .digest('hex');
        
        return signature === expectedSignature;
    }
    
    /**
     * Log webhook receipt
     */
    static async logWebhook(endpoint, payload, signature, valid, error = null) {
        try {
            await query(`
                INSERT INTO webhook_logs 
                (endpoint, payload, signature, valid_signature, processed, error_message, created_at)
                VALUES (?, ?, ?, ?, ?, ?, CURRENT_TIMESTAMP)
            `, [
                endpoint,
                JSON.stringify(payload),
                signature || '',
                valid ? 1 : 0,
                error ? 0 : 1,
                error
            ]);
        } catch (logError) {
            console.error('Failed to log webhook:', logError);
        }
    }
    
    /**
     * Test endpoint for webhook configuration
     */
    static async testWebhook(req, res) {
        console.log('[Webhook Test] Headers:', req.headers);
        console.log('[Webhook Test] Body:', req.body);
        
        const signature = req.headers['x-webhook-signature'];
        const isValid = WebhookController.validateSignature(req.body, signature);
        
        res.json({
            success: true,
            message: 'Webhook test received',
            signatureValid: isValid,
            timestamp: new Date()
        });
    }
}

module.exports = WebhookController;