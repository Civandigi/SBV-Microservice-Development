// SBV Professional V2 - Rapport Controller
// Comprehensive rapport management with role-based access

const { query } = require('../config/database');

class RapportController {
    // Get all rapports with filtering and pagination (Simplified)
    static async getAllRapports(req, res) {
        try {
            console.log('📊 Starting getAllRapports...');
            console.log('User:', req.user);
            
            // Query based on user role
            let sql;
            let params = [];
            
            if (req.user.role === 'admin' || req.user.role === 'super_admin') {
                // Admins sehen alle Rapporte mit User-Informationen
                sql = `
                    SELECT r.id, r.titel as title, r.beschreibung as content, r.status, r.priority, r.category,
                           r.created_at, r.updated_at, r.author_id,
                           u.name as author_name, u.email as author_email
                    FROM rapporte r
                    LEFT JOIN users u ON r.author_id = u.id
                    ORDER BY r.created_at DESC
                    LIMIT 10
                `;
            } else {
                // User sehen nur ihre eigenen Rapporte
                sql = `
                    SELECT r.id, r.titel as title, r.beschreibung as content, r.status, r.priority, r.category,
                           r.created_at, r.updated_at, r.author_id,
                           u.name as author_name, u.email as author_email
                    FROM rapporte r
                    LEFT JOIN users u ON r.author_id = u.id
                    WHERE r.author_id = $1
                    ORDER BY r.created_at DESC
                    LIMIT 10
                `;
                params = [req.user.id];
            }
            
            console.log('Executing SQL:', sql);
            console.log('With params:', params);
            const result = await query(sql, params);
            console.log('Query result:', result);
            
            // Handle SQLite result format - SQLite returns { rows: [...] }
            const rapportData = Array.isArray(result) ? result : (result.rows || []);
            
            // Map the results to match frontend expectations
            const mappedRapports = rapportData.map(rapport => ({
                ...rapport,
                title: rapport.titel || rapport.title,
                content: rapport.beschreibung || rapport.content
            }));
            
            res.json({
                success: true,
                rapports: mappedRapports,
                pagination: {
                    page: 1,
                    limit: 10,
                    total: rapportData.length,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                }
            });
            
        } catch (error) {
            console.error('❌ Get rapports error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Rapporte',
                error: error.message
            });
        }
    }
    
    // Get single rapport by ID
    static async getRapportById(req, res) {
        try {
            const { id } = req.params;
            
            console.log(`📋 Getting rapport ${id} from database`);
            
            // Get real rapport from database
            const sql = `
                SELECT r.*, u.name as author_name, u.email as author_email
                FROM rapporte r
                LEFT JOIN users u ON r.author_id = u.id
                WHERE r.id = $1
            `;
            
            const result = await query(sql, [id]);
            const rapport = Array.isArray(result) ? result[0] : (result.rows ? result.rows[0] : null);
            
            if (!rapport) {
                return res.status(404).json({
                    success: false,
                    message: 'Rapport nicht gefunden'
                });
            }
            
            // Map database fields to frontend expectations
            const mappedRapport = {
                ...rapport,
                title: rapport.titel || rapport.title,
                content: rapport.beschreibung || rapport.content
            };
            
            console.log('Returning real rapport from DB:', mappedRapport.id, mappedRapport.status);
            
            res.json({
                success: true,
                rapport: mappedRapport
            });
            
        } catch (error) {
            console.error('Get rapport by ID error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden des Rapports'
            });
        }
    }
    
    // Create new rapport
    static async createRapport(req, res) {
        try {
            console.log('📝 createRapport called with body:', req.body);
            console.log('User:', req.user);
            
            const { title, content, category, teilprojekt_id, massnahme_id, priority = 'normal', periode } = req.body;
            const userId = req.user.id;
            
            // Minimale Validierung - nur Titel ist wirklich nötig
            if (!title) {
                return res.status(400).json({
                    success: false,
                    message: 'Ein Titel ist erforderlich'
                });
            }
            
            // Duplikatsprüfung wenn Teilprojekt und Periode angegeben sind
            if (category && periode) {
                // Extrahiere Jahr und Monat aus der Periode (z.B. "2024-01" oder "Januar 2024")
                let year, month;
                if (periode.match(/^\d{4}-\d{2}$/)) {
                    // Format: YYYY-MM
                    [year, month] = periode.split('-');
                } else {
                    // Versuche andere Formate zu parsen
                    const currentYear = new Date().getFullYear();
                    year = periode.includes('2024') ? '2024' : 
                           periode.includes('2025') ? '2025' : currentYear.toString();
                    month = new Date().getMonth() + 1; // Aktueller Monat als Fallback
                }
                
                // Prüfe ob bereits ein Rapport für dieses Teilprojekt und diese Periode existiert
                const duplicateCheck = await query(
                    `SELECT id, titel as title, status 
                     FROM rapporte 
                     WHERE author_id = $1 
                       AND category = $2 
                       AND strftime('%Y', created_at) = $3
                       AND strftime('%m', created_at) = $4
                       AND status != 'abgelehnt'`,
                    [userId, category, year, month.toString().padStart(2, '0')]
                );
                
                const existing = Array.isArray(duplicateCheck) ? duplicateCheck : (duplicateCheck.rows || []);
                
                if (existing.length > 0) {
                    return res.status(409).json({
                        success: false,
                        message: `Ein Rapport für ${category} in Periode ${periode} existiert bereits (Status: ${existing[0].status})`,
                        existingRapport: {
                            id: existing[0].id,
                            title: existing[0].title,
                            status: existing[0].status
                        }
                    });
                }
            }
            
            // Content kann leer sein
            const rapportContent = content || '{}';
            
            // Korrekte Anzahl von Parametern für die SQL-Query
            const status = req.body.status || 'entwurf';
            
            console.log('📤 Inserting rapport with params:', {
                title, rapportContent, userId, status, priority, category
            });
            
            const result = await query(
                `INSERT INTO rapporte (titel, beschreibung, author_id, status, priority, category, 
                                     created_at, updated_at)
                 VALUES ($1, $2, $3, $4, $5, $6, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)
                 RETURNING *`,
                [title, rapportContent, userId, status, priority, category]
            );
            
            console.log('✅ Insert successful:', result);
            
            // PostgreSQL returns result.rows
            const rows = Array.isArray(result) ? result : (result.rows || []);
            
            if (rows.length === 0) {
                throw new Error('Rapport konnte nicht erstellt werden');
            }
            
            res.status(201).json({
                success: true,
                rapport: rows[0],
                message: 'Rapport erfolgreich erstellt'
            });
            
        } catch (error) {
            console.error('❌ Create rapport error:', error);
            console.error('Error details:', error.message);
            console.error('Full error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Erstellen des Rapports',
                error: error.message,
                details: process.env.NODE_ENV === 'development' ? error.toString() : undefined
            });
        }
    }
    
    // Update rapport
    static async updateRapport(req, res) {
        try {
            const { id } = req.params;
            const { title, content, category, status, priority } = req.body;
            const userId = req.user.id;
            const userRole = req.user.role;
            
            // Check permissions and build update query
            let sql, params;
            
            if (userRole === 'user') {
                // Users can only update their own drafts or submitted reports
                sql = `
                    UPDATE rapporte 
                    SET titel = $1, beschreibung = $2, category = $3, updated_at = CURRENT_TIMESTAMP
                    WHERE id = $4 AND author_id = $5 
                    AND status IN ('entwurf', 'eingereicht')
                    RETURNING *
                `;
                params = [title, content, category, id, userId];
            } else {
                // Admin/SuperAdmin can update any rapport and change status
                sql = `
                    UPDATE rapporte 
                    SET titel = $1, beschreibung = $2, category = $3, status = $4, 
                        updated_at = CURRENT_TIMESTAMP
                    WHERE id = $5 
                    RETURNING *
                `;
                params = [title, content, category, status || 'entwurf', id];
            }
            
            const result = await query(sql, params);
            
            // PostgreSQL returns result.rows
            const rows = Array.isArray(result) ? result : (result.rows || []);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Rapport nicht gefunden oder keine Berechtigung zur Bearbeitung'
                });
            }
            
            res.json({
                success: true,
                rapport: rows[0],
                message: 'Rapport erfolgreich aktualisiert'
            });
            
        } catch (error) {
            console.error('Update rapport error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Aktualisieren des Rapports'
            });
        }
    }
    
    // Submit rapport for approval
    static async submitRapport(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            
            console.log(`📤 Submitting rapport ${id} for user ${userId}`);
            
            // PostgreSQL syntax with RETURNING clause
            const result = await query(
                `UPDATE rapporte 
                 SET status = 'eingereicht', updated_at = CURRENT_TIMESTAMP
                 WHERE id = $1 AND author_id = $2 AND status = 'entwurf'
                 RETURNING *`,
                [id, userId]
            );
            
            // PostgreSQL returns result.rows
            const rows = Array.isArray(result) ? result : (result.rows || []);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Rapport nicht gefunden oder bereits eingereicht'
                });
            }
            
            console.log('✅ Rapport submitted successfully:', rows[0].id);
            
            res.json({
                success: true,
                rapport: rows[0],
                message: 'Rapport erfolgreich eingereicht'
            });
            
        } catch (error) {
            console.error('❌ Submit rapport error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Einreichen des Rapports',
                error: error.message
            });
        }
    }
    
    // Approve/Reject rapport (Admin only)
    static async approveRapport(req, res) {
        try {
            const { id } = req.params;
            const { action, comment, rejection_reason } = req.body; // action: 'approve' or 'reject'
            const userRole = req.user.role;
            
            if (!['admin', 'super_admin'].includes(userRole)) {
                return res.status(403).json({
                    success: false,
                    message: 'Keine Berechtigung für diese Aktion'
                });
            }
            
            const newStatus = action === 'approve' ? 'genehmigt' : 'abgelehnt';
            
            // Include rejection_reason if rejecting
            let sql, params;
            if (action === 'reject' && rejection_reason) {
                sql = `UPDATE rapporte 
                       SET status = $1, rejection_reason = $2, updated_at = CURRENT_TIMESTAMP, approved_by = $3, approved_at = CURRENT_TIMESTAMP
                       WHERE id = $4 AND status IN ('eingereicht', 'fertig', 'in_bearbeitung')
                       RETURNING *`;
                params = [newStatus, rejection_reason, req.user.id, id];
            } else {
                sql = `UPDATE rapporte 
                       SET status = $1, updated_at = CURRENT_TIMESTAMP, approved_by = $2, approved_at = CURRENT_TIMESTAMP
                       WHERE id = $3 AND status IN ('eingereicht', 'fertig', 'in_bearbeitung')
                       RETURNING *`;
                params = [newStatus, req.user.id, id];
            }
            
            const result = await query(sql, params);
            
            // PostgreSQL returns result.rows
            const rows = Array.isArray(result) ? result : (result.rows || []);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: 'Rapport nicht gefunden oder nicht zur Genehmigung bereit'
                });
            }
            
            // TODO: Send notification email to author
            
            res.json({
                success: true,
                rapport: rows[0],
                message: `Rapport erfolgreich ${action === 'approve' ? 'genehmigt' : 'abgelehnt'}`
            });
            
        } catch (error) {
            console.error('Approve rapport error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler bei der Rapport-Genehmigung'
            });
        }
    }
    
    // Delete rapport - Users can delete their own drafts, Admins can delete any
    static async deleteRapport(req, res) {
        try {
            const { id } = req.params;
            const userId = req.user.id;
            const userRole = req.user.role;
            
            let sql, params;
            
            if (['admin', 'super_admin'].includes(userRole)) {
                // Admins können alle Rapporte löschen
                sql = 'DELETE FROM rapporte WHERE id = $1 RETURNING id, title, status';
                params = [id];
            } else {
                // User können nur ihre eigenen Entwürfe löschen
                sql = `DELETE FROM rapporte 
                       WHERE id = $1 AND author_id = $2 AND status = 'entwurf'
                       RETURNING id, title, status`;
                params = [id, userId];
            }
            
            const result = await query(sql, params);
            
            // PostgreSQL returns result.rows
            const rows = Array.isArray(result) ? result : (result.rows || []);
            
            if (rows.length === 0) {
                return res.status(404).json({
                    success: false,
                    message: userRole === 'user' 
                        ? 'Rapport nicht gefunden oder bereits eingereicht (nur Entwürfe können gelöscht werden)'
                        : 'Rapport nicht gefunden'
                });
            }
            
            res.json({
                success: true,
                message: `Rapport "${rows[0].title}" erfolgreich gelöscht`
            });
            
        } catch (error) {
            console.error('Delete rapport error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Löschen des Rapports'
            });
        }
    }
    
    // Get all rapport requests (for admin view)
    static async getAllRequests(req, res) {
        try {
            console.log('📋 Getting rapport all-requests from database');

            // Only admins can see all requests
            if (!['admin', 'super_admin'].includes(req.user.role)) {
                return res.status(403).json({
                    success: false,
                    message: 'Keine Berechtigung'
                });
            }

            const sql = `
                SELECT
                    r.id,
                    r.titel as title,
                    r.beschreibung as content,
                    r.status,
                    r.priority,
                    r.category,
                    r.created_at,
                    r.updated_at,
                    r.author_id,
                    u.name as author_name,
                    u.email as author_email
                FROM rapporte r
                LEFT JOIN users u ON r.author_id = u.id
                WHERE r.status IN ('eingereicht', 'in_bearbeitung', 'zur-pruefung')
                ORDER BY r.created_at DESC
            `;

            const result = await query(sql);
            const requests = Array.isArray(result) ? result : (result.rows || []);

            res.json({
                success: true,
                requests: requests,
                count: requests.length
            });

        } catch (error) {
            console.error('Get all requests error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Anforderungen'
            });
        }
    }

    // Get rapport statistics
    static async getRapportStats(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            
            let stats = {};
            
            if (userRole === 'user') {
                // User stats - only their own rapports
                const result = await query(
                    `SELECT status, COUNT(*) as count 
                     FROM rapporte 
                     WHERE author_id = $1 
                     GROUP BY status`,
                    [userId]
                );
                
                const rows = Array.isArray(result) ? result : (result.rows || []);
                stats = this.processStatsResult(rows);
            } else {
                // Admin/SuperAdmin stats - all rapports
                const result = await query(
                    `SELECT status, COUNT(*) as count 
                     FROM rapporte 
                     GROUP BY status`
                );
                
                const rows = Array.isArray(result) ? result : (result.rows || []);
                stats = this.processStatsResult(rows);
            }
            
            res.json({
                success: true,
                stats
            });
            
        } catch (error) {
            console.error('Get rapport stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Statistiken'
            });
        }
    }
    
    // Helper method to process stats result
    static processStatsResult(rows) {
        const stats = {
            total: 0,
            entwurf: 0,
            eingereicht: 0,
            in_bearbeitung: 0,
            fertig: 0,
            genehmigt: 0,
            abgelehnt: 0
        };
        
        rows.forEach(row => {
            const count = parseInt(row.count);
            stats[row.status] = count;
            stats.total += count;
        });
        
        return stats;
    }
}

module.exports = RapportController;