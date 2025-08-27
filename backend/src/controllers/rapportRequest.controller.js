// SBV Professional V2 - Rapport Request Controller
// Handles admin rapport requests with deadlines

const { query } = require('../config/database');
const EmailService = require('../services/email.service');
const { asyncHandler } = require('../middleware/error.middleware');

class RapportRequestController {
    // Create a new rapport request
    static createRequest = asyncHandler(async (req, res) => {
        const { user_id, teilprojekt, deadline, description } = req.body;
        const requestedBy = req.user.id;
        const requestedByRole = req.user.role;

        // Only admins can create requests
        if (!['admin', 'super_admin'].includes(requestedByRole)) {
            return res.status(403).json({
                success: false,
                message: 'Nur Administratoren können Rapporte anfordern'
            });
        }

        // Validate required fields
        if (!user_id || !teilprojekt || !deadline) {
            return res.status(400).json({
                success: false,
                message: 'User, Teilprojekt und Deadline sind erforderlich'
            });
        }

        // Check if deadline is in the future
        const deadlineDate = new Date(deadline);
        if (deadlineDate <= new Date()) {
            return res.status(400).json({
                success: false,
                message: 'Deadline muss in der Zukunft liegen'
            });
        }

        // Check if a similar request already exists and is pending
        const existingCheck = await query(
            `SELECT id FROM rapporte
             WHERE author_id = $1
               AND category = $2
               AND is_requested = true
               AND fulfilled_rapport_id IS NULL`,
            [user_id, teilprojekt]
        );

        const existing = Array.isArray(existingCheck) ? existingCheck : (existingCheck.rows || []);

        if (existing.length > 0) {
            return res.status(409).json({
                success: false,
                message: 'Es existiert bereits eine offene Anforderung für diesen User und dieses Teilprojekt'
            });
        }

        // Create the request
        const result = await query(
            `INSERT INTO rapporte (
                title,
                content,
                author_id,
                requested_by,
                category,
                deadline,
                request_description,
                is_requested,
                request_created_at,
                status,
                created_at,
                updated_at
            ) VALUES (
                $1, '{}', $2, $3, $4, $5, $6, true, CURRENT_TIMESTAMP, 'angefordert', CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
            ) RETURNING *`,
            [
                `Anforderung: ${teilprojekt} - Fällig: ${deadline}`,
                user_id,
                requestedBy,
                teilprojekt,
                deadline,
                description || ''
            ]
        );

        const rows = Array.isArray(result) ? result : (result.rows || []);

        if (rows.length === 0) {
            throw new Error('Anforderung konnte nicht erstellt werden');
        }

        // Get user details for email
        const userResult = await query(
            'SELECT email, name FROM users WHERE id = $1',
            [user_id]
        );
        const userRows = Array.isArray(userResult) ? userResult : (userResult.rows || []);

        if (userRows.length > 0) {
            const user = userRows[0];
            // Send email notification
            try {
                await EmailService.sendRapportRequest({
                    to: user.email,
                    userName: user.name,
                    teilprojekt: teilprojekt,
                    deadline: deadline,
                    description: description
                });
            } catch (emailError) {
                console.error('Email sending failed:', emailError);
                // Continue even if email fails
            }
        }

        res.status(201).json({
            success: true,
            request: rows[0],
            message: 'Rapport-Anforderung erfolgreich erstellt'
        });
    });

    // Get all requests for current user
    static getUserRequests = asyncHandler(async (req, res) => {
        const userId = req.user.id;

        // PostgreSQL-compatible query
        const result = await query(
            `SELECT
                r.id,
                r.title,
                r.category as teilprojekt,
                r.deadline,
                r.request_description,
                r.request_created_at,
                r.fulfilled_rapport_id,
                r.requested_by,
                u.name as requested_by_name,
                CASE
                    WHEN r.fulfilled_rapport_id IS NOT NULL THEN 'erfüllt'
                    WHEN r.deadline < CURRENT_DATE THEN 'überfällig'
                    WHEN r.deadline <= CURRENT_DATE + INTERVAL '3 days' THEN 'dringend'
                    ELSE 'offen'
                END as status,
                (r.deadline - CURRENT_DATE) as days_remaining
            FROM rapporte r
            LEFT JOIN users u ON r.requested_by = u.id
            WHERE r.author_id = $1
              AND r.is_requested = true
            ORDER BY r.deadline ASC`,
            [userId]
        );

        const rows = Array.isArray(result) ? result : (result.rows || []);

        // Group by status für konsistente Response
        const grouped = {
            overdue: rows.filter(r => r.status === 'überfällig'),
            urgent: rows.filter(r => r.status === 'dringend'),
            pending: rows.filter(r => r.status === 'offen'),
            fulfilled: rows.filter(r => r.status === 'erfüllt')
        };

        res.json({
            success: true,
            requests: rows,
            count: rows.length,
            pending: rows.filter(r => !r.fulfilled_rapport_id).length,
            stats: {
                total: rows.length,
                overdue: grouped.overdue.length,
                urgent: grouped.urgent.length,
                pending: grouped.pending.length,
                fulfilled: grouped.fulfilled.length
            }
        });
    });

    // Get all requests (Admin only)
    static getAllRequests = asyncHandler(async (req, res) => {
        console.log('getAllRequests called - User:', req.user.id, 'Role:', req.user.role);
        const userRole = req.user.role;

        if (!['admin', 'super_admin'].includes(userRole)) {
            return res.status(403).json({
                success: false,
                message: 'Keine Berechtigung'
            });
        }

        // PostgreSQL-compatible query
        const result = await query(
            `SELECT
                r.id,
                r.title,
                r.category as teilprojekt,
                r.deadline,
                r.request_description,
                r.request_created_at,
                r.fulfilled_rapport_id,
                r.author_id,
                u1.name as requested_for_name,
                u1.email as requested_for_email,
                r.requested_by,
                u2.name as requested_by_name,
                CASE
                    WHEN r.fulfilled_rapport_id IS NOT NULL THEN 'erfüllt'
                    WHEN r.deadline < CURRENT_DATE THEN 'überfällig'
                    WHEN r.deadline <= CURRENT_DATE + INTERVAL '3 days' THEN 'dringend'
                    ELSE 'offen'
                END as status,
                (r.deadline - CURRENT_DATE) as days_remaining
            FROM rapporte r
            LEFT JOIN users u1 ON r.author_id = u1.id
            LEFT JOIN users u2 ON r.requested_by = u2.id
            WHERE r.is_requested = true
            ORDER BY r.deadline ASC`
        );

        const rows = Array.isArray(result) ? result : (result.rows || []);

        // Group by status
        const grouped = {
            overdue: rows.filter(r => r.status === 'überfällig'),
            urgent: rows.filter(r => r.status === 'dringend'),
            pending: rows.filter(r => r.status === 'offen'),
            fulfilled: rows.filter(r => r.status === 'erfüllt')
        };

        res.json({
            success: true,
            requests: rows,
            grouped: grouped,
            stats: {
                total: rows.length,
                overdue: grouped.overdue.length,
                urgent: grouped.urgent.length,
                pending: grouped.pending.length,
                fulfilled: grouped.fulfilled.length
            }
        });
    });

    // Fulfill a request by linking it to a created rapport
    static fulfillRequest = asyncHandler(async (req, res) => {
        const { requestId } = req.params;
        const { rapport_id } = req.body;
        const userId = req.user.id;

        if (!rapport_id) {
            return res.status(400).json({
                success: false,
                message: 'Rapport ID ist erforderlich'
            });
        }

        // Check if the request belongs to the user
        const requestCheck = await query(
            'SELECT id, author_id FROM rapporte WHERE id = $1 AND is_requested = true',
            [requestId]
        );

        const requestRows = Array.isArray(requestCheck) ? requestCheck : (requestCheck.rows || []);

        if (requestRows.length === 0) {
            return res.status(404).json({
                success: false,
                message: 'Anforderung nicht gefunden'
            });
        }

        if (requestRows[0].author_id !== userId) {
            return res.status(403).json({
                success: false,
                message: 'Sie können nur Ihre eigenen Anforderungen erfüllen'
            });
        }

        // Update the request
        const result = await query(
            `UPDATE rapporte
             SET fulfilled_rapport_id = $1,
                 request_fulfilled_at = CURRENT_TIMESTAMP,
                 updated_at = CURRENT_TIMESTAMP
             WHERE id = $2
             RETURNING *`,
            [rapport_id, requestId]
        );

        const rows = Array.isArray(result) ? result : (result.rows || []);

        if (rows.length === 0) {
            return res.status(500).json({
                success: false,
                message: 'Anforderung konnte nicht aktualisiert werden'
            });
        }

        res.json({
            success: true,
            request: rows[0],
            message: 'Anforderung erfolgreich erfüllt'
        });
    });

    // Check deadlines and send reminders (for cron job)
    static async checkDeadlines() {
        try {
            // Find requests with upcoming deadlines (3 days) that haven't been reminded
            const result = await query(
                `SELECT 
                    r.id,
                    r.deadline,
                    r.category as teilprojekt,
                    r.request_description,
                    r.author_id,
                    u.email,
                    u.name
                FROM rapporte r
                JOIN users u ON r.author_id = u.id
                WHERE r.is_requested = true
                  AND r.fulfilled_rapport_id IS NULL
                  AND r.reminder_sent = false
                  AND r.deadline <= CURRENT_DATE + INTERVAL '3 days'
                  AND r.deadline >= CURRENT_DATE`
            );

            const rows = Array.isArray(result) ? result : (result.rows || []);

            for (const request of rows) {
                try {
                    // Send reminder email
                    await EmailService.sendDeadlineReminder({
                        to: request.email,
                        userName: request.name,
                        teilprojekt: request.teilprojekt,
                        deadline: request.deadline,
                        description: request.request_description
                    });

                    // Mark as reminded
                    await query(
                        'UPDATE rapporte SET reminder_sent = true WHERE id = $1',
                        [request.id]
                    );

                    console.log(`Reminder sent for request ${request.id}`);
                } catch (emailError) {
                    console.error(`Failed to send reminder for request ${request.id}:`, emailError);
                }
            }

            return {
                success: true,
                reminded: rows.length
            };

        } catch (error) {
            console.error('Check deadlines error:', error);
            return {
                success: false,
                error: error.message
            };
        }
    }
}

module.exports = RapportRequestController;