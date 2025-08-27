// SBV Professional V2 - Webhook Service for n8n Integration
const axios = require('axios');
const { query } = require('../config/database');

class WebhookService {
    constructor() {
        this.webhookUrl = process.env.N8N_WEBHOOK_URL;
        this.webhookSecret = process.env.N8N_WEBHOOK_SECRET;
        this.enabled = process.env.ENABLE_WEBHOOKS === 'true';
    }

    /**
     * Trigger webhook when Gesuch is submitted
     * @param {number} gesuchId - ID of the submitted Gesuch
     * @param {number} userId - ID of the user who submitted
     */
    async triggerGesuchSubmitted(gesuchId, userId) {
        if (!this.enabled) {
            console.log('Webhooks disabled - skipping Gesuch submission webhook');
            return { success: true, skipped: true };
        }

        if (!this.webhookUrl) {
            console.error('N8N_WEBHOOK_URL not configured');
            return { success: false, error: 'Webhook URL not configured' };
        }

        try {
            // Get complete Gesuch data
            const gesuchData = await this.getCompleteGesuchData(gesuchId);
            
            // Get user data
            const userResult = await query(
                'SELECT id, username, email, role FROM users WHERE id = $1',
                [userId]
            );
            
            const payload = {
                event: 'gesuch.submitted',
                timestamp: new Date().toISOString(),
                data: {
                    gesuch: gesuchData.gesuch,
                    teilprojekte: gesuchData.teilprojekte,
                    k_ziele: gesuchData.k_ziele,
                    jahresvergleich: gesuchData.jahresvergleich,
                    user: userResult.rows[0]
                },
                metadata: {
                    webhook_version: '1.0',
                    system: 'sbv-professional-v2'
                }
            };

            // Add HMAC signature if secret is configured
            const headers = {
                'Content-Type': 'application/json',
                'X-Webhook-Event': 'gesuch.submitted',
                'X-Webhook-Timestamp': payload.timestamp
            };

            if (this.webhookSecret) {
                const crypto = require('crypto');
                const signature = crypto
                    .createHmac('sha256', this.webhookSecret)
                    .update(JSON.stringify(payload))
                    .digest('hex');
                headers['X-Webhook-Signature'] = signature;
            }

            // Send webhook
            const response = await axios.post(this.webhookUrl, payload, {
                headers,
                timeout: 30000 // 30 seconds timeout
            });

            console.log(`Webhook sent successfully for Gesuch ${gesuchId}`, {
                status: response.status,
                webhookId: response.data?.id
            });

            // Log webhook event
            await this.logWebhookEvent(gesuchId, 'gesuch.submitted', 'success', response.data);

            return { 
                success: true, 
                webhookId: response.data?.id,
                status: response.status 
            };

        } catch (error) {
            console.error('Webhook error:', error.message);
            
            // Log failed webhook
            await this.logWebhookEvent(
                gesuchId, 
                'gesuch.submitted', 
                'failed', 
                { error: error.message }
            );

            return { 
                success: false, 
                error: error.message 
            };
        }
    }

    /**
     * Trigger webhook when Teilprojekt is approved
     * @param {number} teilprojektId - ID of the approved Teilprojekt
     * @param {number} approvedBy - ID of the user who approved
     */
    async triggerTeilprojektApproved(teilprojektId, approvedBy) {
        if (!this.enabled) {
            return { success: true, skipped: true };
        }

        try {
            // Get Teilprojekt with Gesuch data
            const tpResult = await query(`
                SELECT tp.*, g.jahr, g.titel as gesuch_titel
                FROM teilprojekte tp
                JOIN gesuche g ON tp.gesuch_id = g.id
                WHERE tp.id = $1
            `, [teilprojektId]);

            if (tpResult.rows.length === 0) {
                throw new Error('Teilprojekt not found');
            }

            const payload = {
                event: 'teilprojekt.approved',
                timestamp: new Date().toISOString(),
                data: {
                    teilprojekt: tpResult.rows[0],
                    approved_by: approvedBy
                }
            };

            const response = await axios.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Event': 'teilprojekt.approved'
                },
                timeout: 30000
            });

            await this.logWebhookEvent(
                teilprojektId, 
                'teilprojekt.approved', 
                'success', 
                response.data
            );

            return { success: true };

        } catch (error) {
            console.error('Webhook error:', error.message);
            await this.logWebhookEvent(
                teilprojektId, 
                'teilprojekt.approved', 
                'failed', 
                { error: error.message }
            );
            return { success: false, error: error.message };
        }
    }

    /**
     * Get complete Gesuch data including all related entities
     */
    async getCompleteGesuchData(gesuchId) {
        // Get Gesuch
        const gesuchResult = await query(
            'SELECT * FROM gesuche WHERE id = $1',
            [gesuchId]
        );

        // Get Teilprojekte with statistics
        const teilprojekteResult = await query(`
            SELECT 
                tp.*,
                COUNT(DISTINCT r.id) as anzahl_rapporte,
                COUNT(DISTINCT m.id) as anzahl_massnahmen
            FROM teilprojekte tp
            LEFT JOIN rapporte r ON tp.id = r.teilprojekt_id
            LEFT JOIN massnahmen m ON tp.id = m.teilprojekt_id
            WHERE tp.gesuch_id = $1
            GROUP BY tp.id
            ORDER BY tp.nummer
        `, [gesuchId]);

        // Get K-Ziele
        const kZieleResult = await query(
            'SELECT * FROM k_ziele WHERE gesuch_id = $1 ORDER BY id',
            [gesuchId]
        );

        // Get Jahresvergleich
        const jahresvergleichResult = await query(
            'SELECT * FROM jahresvergleich WHERE gesuch_id = $1 ORDER BY id',
            [gesuchId]
        );

        return {
            gesuch: gesuchResult.rows[0],
            teilprojekte: teilprojekteResult.rows,
            k_ziele: kZieleResult.rows,
            jahresvergleich: jahresvergleichResult.rows
        };
    }

    /**
     * Log webhook events for audit trail
     */
    async logWebhookEvent(entityId, eventType, status, responseData) {
        try {
            await query(`
                INSERT INTO webhook_logs 
                (entity_id, event_type, status, response_data, created_at)
                VALUES ($1, $2, $3, $4, NOW())
            `, [entityId, eventType, status, JSON.stringify(responseData)]);
        } catch (error) {
            // Don't fail the webhook if logging fails
            console.error('Failed to log webhook event:', error);
        }
    }

    /**
     * Test webhook configuration
     */
    async testWebhook() {
        if (!this.webhookUrl) {
            return { 
                success: false, 
                error: 'N8N_WEBHOOK_URL not configured' 
            };
        }

        try {
            const payload = {
                event: 'test',
                timestamp: new Date().toISOString(),
                message: 'Test webhook from SBV Professional V2'
            };

            const response = await axios.post(this.webhookUrl, payload, {
                headers: {
                    'Content-Type': 'application/json',
                    'X-Webhook-Event': 'test'
                },
                timeout: 10000
            });

            return {
                success: true,
                status: response.status,
                message: 'Webhook test successful'
            };

        } catch (error) {
            return {
                success: false,
                error: error.message,
                details: error.response?.data
            };
        }
    }
}

module.exports = new WebhookService();