// SBV Professional V2 - Webhook Management Routes
const express = require('express');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const webhookService = require('../services/webhook.service');
const WebhookController = require('../controllers/webhook.controller');
const { query } = require('../config/database');

const router = express.Router();

// ============== MICROSERVICE WEBHOOKS ==============
// These endpoints receive webhooks from the external Gesuch processing service

// Webhook: Gesuch processed
router.post('/gesuch-processed', asyncHandler(WebhookController.handleGesuchProcessed));

// Webhook: Rapporte ready
router.post('/rapporte-ready', asyncHandler(WebhookController.handleRapporteReady));

// Webhook: Word export ready
router.post('/word-ready', asyncHandler(WebhookController.handleWordReady));

// Test webhook endpoint for development
router.post('/test-microservice', asyncHandler(WebhookController.testWebhook));

// ============== EXISTING WEBHOOK MANAGEMENT ==============

// Test webhook configuration (Admin only)
router.post('/test',
    authenticateToken,
    requireRole(['admin', 'superadmin']),
    asyncHandler(async (req, res) => {
        const result = await webhookService.testWebhook();
        
        res.json({
            success: result.success,
            message: result.message || result.error,
            details: result.details,
            configuration: {
                enabled: process.env.ENABLE_WEBHOOKS === 'true',
                url_configured: !!process.env.N8N_WEBHOOK_URL,
                secret_configured: !!process.env.N8N_WEBHOOK_SECRET
            }
        });
    })
);

// Get webhook logs (Admin only)
router.get('/logs',
    authenticateToken,
    requireRole(['admin', 'superadmin']),
    asyncHandler(async (req, res) => {
        const { limit = 50, offset = 0, status, event_type } = req.query;
        
        let sql = 'SELECT * FROM webhook_logs WHERE 1=1';
        const params = [];
        let paramCount = 0;
        
        if (status) {
            params.push(status);
            sql += ` AND status = $${++paramCount}`;
        }
        
        if (event_type) {
            params.push(event_type);
            sql += ` AND event_type = $${++paramCount}`;
        }
        
        sql += ' ORDER BY created_at DESC';
        params.push(limit, offset);
        sql += ` LIMIT $${++paramCount} OFFSET $${++paramCount}`;
        
        const result = await query(sql, params);
        
        // Get total count
        let countSql = 'SELECT COUNT(*) as total FROM webhook_logs WHERE 1=1';
        const countParams = [];
        
        if (status) {
            countParams.push(status);
            countSql += ` AND status = $${countParams.length}`;
        }
        
        if (event_type) {
            countParams.push(event_type);
            countSql += ` AND event_type = $${countParams.length}`;
        }
        
        const countResult = await query(countSql, countParams);
        
        res.json({
            logs: result.rows,
            pagination: {
                total: parseInt(countResult.rows[0].total),
                limit: parseInt(limit),
                offset: parseInt(offset)
            }
        });
    })
);

// Retry failed webhook (Admin only)
router.post('/retry/:logId',
    authenticateToken,
    requireRole(['admin', 'superadmin']),
    asyncHandler(async (req, res) => {
        const { logId } = req.params;
        
        // Get webhook log
        const logResult = await query(
            'SELECT * FROM webhook_logs WHERE id = $1',
            [logId]
        );
        
        if (logResult.rows.length === 0) {
            return res.status(404).json({ error: 'Webhook log not found' });
        }
        
        const log = logResult.rows[0];
        
        if (log.status === 'success') {
            return res.status(400).json({ error: 'Cannot retry successful webhook' });
        }
        
        // Retry based on event type
        let retryResult;
        
        switch (log.event_type) {
            case 'gesuch.submitted':
                retryResult = await webhookService.triggerGesuchSubmitted(
                    log.entity_id, 
                    req.user.id
                );
                break;
                
            case 'teilprojekt.approved':
                retryResult = await webhookService.triggerTeilprojektApproved(
                    log.entity_id,
                    req.user.id
                );
                break;
                
            default:
                return res.status(400).json({ 
                    error: 'Unknown event type for retry' 
                });
        }
        
        // Update retry count
        await query(
            'UPDATE webhook_logs SET retry_count = retry_count + 1 WHERE id = $1',
            [logId]
        );
        
        res.json({
            success: retryResult.success,
            message: retryResult.success ? 'Webhook retry successful' : 'Webhook retry failed',
            error: retryResult.error
        });
    })
);

// Get webhook statistics (Admin only)
router.get('/stats',
    authenticateToken,
    requireRole(['admin', 'superadmin']),
    asyncHandler(async (req, res) => {
        const statsResult = await query(`
            SELECT 
                COUNT(*) as total,
                COUNT(*) FILTER (WHERE status = 'success') as successful,
                COUNT(*) FILTER (WHERE status = 'failed') as failed,
                COUNT(*) FILTER (WHERE status = 'pending') as pending,
                COUNT(DISTINCT event_type) as event_types,
                MAX(created_at) as last_webhook_at
            FROM webhook_logs
        `);
        
        const eventStatsResult = await query(`
            SELECT 
                event_type,
                COUNT(*) as count,
                COUNT(*) FILTER (WHERE status = 'success') as successful,
                COUNT(*) FILTER (WHERE status = 'failed') as failed
            FROM webhook_logs
            GROUP BY event_type
            ORDER BY count DESC
        `);
        
        res.json({
            overall: statsResult.rows[0],
            by_event: eventStatsResult.rows,
            configuration: {
                enabled: process.env.ENABLE_WEBHOOKS === 'true',
                url_configured: !!process.env.N8N_WEBHOOK_URL
            }
        });
    })
);

module.exports = router;