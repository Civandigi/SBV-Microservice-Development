// SBV Professional V2 - Dashboard Controller
// Provides aggregated statistics for dashboard

const { query } = require('../config/database');

class DashboardController {
    // Get dashboard statistics
    static async getStats(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            
            // Build queries based on user role
            let rapporteQuery = 'SELECT status, COUNT(*) as count FROM rapporte';
            let documentsQuery = 'SELECT COUNT(*) as total FROM documents';
            let gesucheQuery = 'SELECT status, COUNT(*) as count FROM gesuche';
            let usersQuery = 'SELECT COUNT(*) as total FROM users WHERE is_active = true';
            
            const queryParams = [];
            
            // Apply role-based filtering
            if (userRole === 'user') {
                rapporteQuery += ' WHERE author_id = $1';
                documentsQuery += ' WHERE user_id = $1';
                queryParams.push(userId);
            }
            
            rapporteQuery += ' GROUP BY status';
            gesucheQuery += ' GROUP BY status';
            
            // Execute queries in parallel
            const [rapporteResult, documentsResult, gesucheResult, usersResult] = await Promise.all([
                query(rapporteQuery, userRole === 'user' ? queryParams : []),
                query(documentsQuery, userRole === 'user' ? queryParams : []),
                query(gesucheQuery),
                userRole !== 'user' ? query(usersQuery) : Promise.resolve({ rows: [] })
            ]);
            
            // Process Rapporte stats
            const rapporteStats = {
                total: 0,
                entwurf: 0,
                eingereicht: 0,
                in_bearbeitung: 0,
                fertig: 0,
                genehmigt: 0,
                abgelehnt: 0
            };
            
            rapporteResult.rows.forEach(row => {
                rapporteStats[row.status] = parseInt(row.count);
                rapporteStats.total += parseInt(row.count);
            });
            
            // Process Gesuche stats
            const gesucheStats = {
                total: 0,
                neu: 0,
                in_bearbeitung: 0,
                genehmigt: 0,
                abgelehnt: 0
            };
            
            gesucheResult.rows.forEach(row => {
                gesucheStats[row.status] = parseInt(row.count);
                gesucheStats.total += parseInt(row.count);
            });
            
            // Build response
            const stats = {
                rapporte: rapporteStats,
                documents: {
                    total: parseInt(documentsResult.rows[0]?.total || 0)
                },
                gesuche: gesucheStats
            };
            
            // Add user stats for admin/super_admin
            if (userRole !== 'user') {
                stats.users = {
                    total: parseInt(usersResult.rows[0]?.total || 0)
                };
            }
            
            res.json({
                success: true,
                stats
            });
            
        } catch (error) {
            console.error('Dashboard stats error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Dashboard-Statistiken'
            });
        }
    }
    
    // Get recent activities
    static async getRecentActivities(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            const limit = parseInt(req.query.limit) || 10;
            
            const activities = [];
            
            // Get recent Rapporte
            let rapporteQuery = `
                SELECT 
                    'rapport' as type,
                    r.id,
                    r.titel as description,
                    r.status,
                    r.created_at as date,
                    u.name as user_name
                FROM rapporte r
                JOIN users u ON r.author_id = u.id
            `;
            
            if (userRole === 'user') {
                rapporteQuery += ' WHERE r.author_id = $1';
            }
            
            rapporteQuery += ' ORDER BY r.created_at DESC LIMIT $' + (userRole === 'user' ? '2' : '1');
            
            const rapporteResult = await query(
                rapporteQuery,
                userRole === 'user' ? [userId, Math.floor(limit / 2)] : [Math.floor(limit / 2)]
            );
            
            rapporteResult.rows.forEach(row => {
                activities.push({
                    type: row.type,
                    id: row.id,
                    description: row.description || 'Ohne Titel',
                    status: row.status,
                    date: row.date,
                    user: row.user_name,
                    icon: 'rapport'
                });
            });
            
            // Get recent documents (if user has access)
            let documentsQuery = `
                SELECT 
                    'document' as type,
                    d.id,
                    d.original_name as description,
                    'hochgeladen' as status,
                    d.created_at as date,
                    u.name as user_name
                FROM documents d
                LEFT JOIN users u ON d.uploaded_by = u.id
            `;
            
            if (userRole === 'user') {
                documentsQuery += ' WHERE d.uploaded_by = $1';
            }
            
            documentsQuery += ' ORDER BY d.created_at DESC LIMIT $' + (userRole === 'user' ? '2' : '1');
            
            const documentsResult = await query(
                documentsQuery,
                userRole === 'user' ? [userId, Math.floor(limit / 2)] : [Math.floor(limit / 2)]
            );
            
            documentsResult.rows.forEach(row => {
                activities.push({
                    type: row.type,
                    id: row.id,
                    description: row.description,
                    status: row.status,
                    date: row.date,
                    user: row.user_name,
                    icon: 'document'
                });
            });
            
            // Sort all activities by date
            activities.sort((a, b) => new Date(b.date) - new Date(a.date));
            
            // Limit to requested amount
            const limitedActivities = activities.slice(0, limit);
            
            res.json({
                success: true,
                activities: limitedActivities
            });
            
        } catch (error) {
            console.error('Recent activities error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Aktivitäten'
            });
        }
    }
    
    // Get notifications
    static async getNotifications(req, res) {
        try {
            const userId = req.user.id;
            const userRole = req.user.role;
            
            const notifications = [];
            
            // Check for urgent Rapporte
            let urgentQuery = `
                SELECT COUNT(*) as count 
                FROM rapporte 
                WHERE status = 'eingereicht' 
                AND priority = 'kritisch'
            `;
            
            if (userRole === 'user') {
                urgentQuery += ' AND author_id = $1';
            }
            
            const urgentResult = await query(
                urgentQuery,
                userRole === 'user' ? [userId] : []
            );
            
            const urgentCount = parseInt(urgentResult.rows[0].count);
            if (urgentCount > 0) {
                notifications.push({
                    id: 'urgent-rapporte',
                    type: 'urgent',
                    title: `${urgentCount} dringende Rapporte`,
                    date: new Date(),
                    priority: 'critical',
                    icon: 'alert'
                });
            }
            
            // Check for pending approvals (admin only)
            if (userRole === 'admin' || userRole === 'super_admin') {
                const pendingResult = await query(`
                    SELECT COUNT(*) as count 
                    FROM rapporte 
                    WHERE status = 'eingereicht'
                `);
                
                const pendingCount = parseInt(pendingResult.rows[0].count);
                if (pendingCount > 0) {
                    notifications.push({
                        id: 'pending-approvals',
                        type: 'approval',
                        title: `${pendingCount} Rapporte zur Genehmigung`,
                        date: new Date(),
                        priority: 'high',
                        icon: 'clock'
                    });
                }
            }
            
            // Check for recent documents
            const recentDocsResult = await query(`
                SELECT COUNT(*) as count 
                FROM documents 
                WHERE datetime(created_at) > datetime('now', '-24 hours')
                ${userRole === 'user' ? 'AND user_id = $1' : ''}
            `, userRole === 'user' ? [userId] : []);
            
            const recentDocsCount = parseInt(recentDocsResult.rows[0].count);
            if (recentDocsCount > 0) {
                notifications.push({
                    id: 'recent-documents',
                    type: 'info',
                    title: `${recentDocsCount} neue Dokumente heute`,
                    date: new Date(),
                    priority: 'low',
                    icon: 'document'
                });
            }
            
            res.json({
                success: true,
                notifications
            });
            
        } catch (error) {
            console.error('Notifications error:', error);
            res.status(500).json({
                success: false,
                message: 'Fehler beim Laden der Benachrichtigungen'
            });
        }
    }
}

module.exports = DashboardController;