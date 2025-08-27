// SBV Professional V2 - Dashboard Controller
// Provides aggregated statistics for dashboard

const { query } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');

class DashboardController {
    // Get dashboard statistics
    static getStats = asyncHandler(async (req, res) => {
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
    });

    // Get recent activities
    static getRecentActivities = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const userRole = req.user.role;
        const limit = parseInt(req.query.limit) || 10;

        let activityQuery;
        let queryParams;

        const rapportSelect = `
            SELECT 'rapport' as type, r.id, r.titel as description, r.status, r.created_at as date, u.name as user_name, 'rapport' as icon
            FROM rapporte r
            JOIN users u ON r.author_id = u.id
        `;

        const documentSelect = `
            SELECT 'document' as type, d.id, d.original_name as description, 'hochgeladen' as status, d.created_at as date, u.name as user_name, 'document' as icon
            FROM documents d
            LEFT JOIN users u ON d.uploaded_by = u.id
        `;

        if (userRole === 'user') {
            activityQuery = `
                (${rapportSelect} WHERE r.author_id = $1)
                UNION ALL
                (${documentSelect} WHERE d.uploaded_by = $1)
                ORDER BY date DESC
                LIMIT $2
            `;
            queryParams = [userId, limit];
        } else {
            activityQuery = `
                (${rapportSelect})
                UNION ALL
                (${documentSelect})
                ORDER BY date DESC
                LIMIT $1
            `;
            queryParams = [limit];
        }

        const result = await query(activityQuery, queryParams);
        const activities = result.rows.map(row => ({
            ...row,
            description: row.description || 'Ohne Titel'
        }));

        res.json({
            success: true,
            activities
        });
    });

    // Get notifications
    static getNotifications = asyncHandler(async (req, res) => {
        const userId = req.user.id;
        const userRole = req.user.role;
        const isSqlite = process.env.USE_SQLITE === 'true';

        let notificationsQuery;
        let queryParams = [];

        const recentDocsClause = isSqlite
            ? `strftime('%Y-%m-%d %H:%M:%S', created_at) > strftime('%Y-%m-%d %H:%M:%S', 'now', '-24 hours')`
            : `created_at > NOW() - INTERVAL '24 hours'`;

        if (userRole === 'user') {
            notificationsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM rapporte WHERE author_id = $1 AND status = 'eingereicht' AND priority = 'kritisch') as urgent_rapporte,
                    (SELECT COUNT(*) FROM documents WHERE user_id = $1 AND ${recentDocsClause}) as recent_documents
            `;
            queryParams = [userId];
        } else {
            notificationsQuery = `
                SELECT 
                    (SELECT COUNT(*) FROM rapporte WHERE status = 'eingereicht' AND priority = 'kritisch') as urgent_rapporte,
                    (SELECT COUNT(*) FROM rapporte WHERE status = 'eingereicht') as pending_rapporte,
                    (SELECT COUNT(*) FROM documents WHERE ${recentDocsClause}) as recent_documents
            `;
        }

        const result = await query(notificationsQuery, queryParams);
        const stats = result.rows[0];
        const notifications = [];

        if (stats.urgent_rapporte > 0) {
            notifications.push({
                id: 'urgent-rapporte',
                type: 'urgent',
                title: `${stats.urgent_rapporte} dringende Rapporte`,
                date: new Date(),
                priority: 'critical',
                icon: 'alert'
            });
        }

        if (stats.pending_rapporte > 0) {
            notifications.push({
                id: 'pending-approvals',
                type: 'approval',
                title: `${stats.pending_rapporte} Rapporte zur Genehmigung`,
                date: new Date(),
                priority: 'high',
                icon: 'clock'
            });
        }

        if (stats.recent_documents > 0) {
            notifications.push({
                id: 'recent-documents',
                type: 'info',
                title: `${stats.recent_documents} neue Dokumente heute`,
                date: new Date(),
                priority: 'low',
                icon: 'document'
            });
        }

        res.json({
            success: true,
            notifications
        });
    });
}

module.exports = DashboardController;