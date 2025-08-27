// Health Controller - Microservice Monitoring
const { testConnection, getStats } = require('../config/database');
const { asyncHandler } = require('../middleware/error.middleware');

class HealthController {
    static checkServices = asyncHandler(async (req, res) => {
        const services = {
            database: await HealthController.checkDatabase(),
            microservice: await HealthController.checkMicroservice(),
            storage: await HealthController.checkStorage()
        };
        
        const overall = Object.values(services).every(s => s.status === 'healthy');
        
        res.json({
            status: overall ? 'healthy' : 'degraded',
            services,
            timestamp: new Date().toISOString()
        });
    });
    
    static checkMicroservice = async () => {
        try {
            const serviceUrl = process.env.GESUCH_SERVICE_URL || 'http://localhost:3001';
            const controller = new AbortController();
            const timeoutId = setTimeout(() => controller.abort(), 5000);
            
            const response = await fetch(`${serviceUrl}/health`, {
                signal: controller.signal,
                headers: {
                    'X-API-Key': process.env.GESUCH_SERVICE_API_KEY
                }
            });
            
            clearTimeout(timeoutId);
            
            if (!response.ok) {
                return {
                    status: 'unhealthy',
                    error: `HTTP ${response.status}`,
                    responseTime: null
                };
            }
            
            const data = await response.json();
            
            return {
                status: 'healthy',
                responseTime: response.headers.get('X-Response-Time') || 'unknown',
                version: response.headers.get('X-Service-Version') || data.version || 'unknown',
                url: serviceUrl
            };
            
        } catch (error) {
            return {
                status: 'offline',
                error: error.name === 'AbortError' ? 'timeout' : error.message,
                url: process.env.GESUCH_SERVICE_URL || 'http://localhost:3001'
            };
        }
    };
    
    static checkDatabase = async () => {
        try {
            const startTime = Date.now();
            const isHealthy = await testConnection();
            const responseTime = Date.now() - startTime;
            
            return {
                status: isHealthy ? 'healthy' : 'unhealthy',
                responseTime: responseTime + 'ms',
                type: process.env.USE_SQLITE === 'true' ? 'SQLite' : 'PostgreSQL'
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    };
    
    static checkStorage = async () => {
        // Basic storage check - könnte erweitert werden
        try {
            return {
                status: 'healthy',
                type: 'local_filesystem',
                available: true
            };
        } catch (error) {
            return {
                status: 'error',
                error: error.message
            };
        }
    };
    
    static getServiceStats = asyncHandler(async (req, res) => {
        const { query } = require('../config/database');
        
        try {
            // Service Jobs Statistics
            const jobStats = await query(`
                SELECT 
                    status,
                    COUNT(*) as count,
                    AVG(CASE 
                        WHEN completed_at IS NOT NULL AND created_at IS NOT NULL 
                        THEN (julianday(completed_at) - julianday(created_at)) * 24 * 60 * 60 
                        ELSE NULL 
                    END) as avg_duration_seconds
                FROM service_jobs 
                GROUP BY status
            `);
            
            // Recent failures
            const recentFailures = await query(`
                SELECT job_id, operation, error_message, created_at
                FROM service_jobs 
                WHERE status = 'failed' 
                ORDER BY created_at DESC 
                LIMIT 10
            `);
            
            // Webhook logs
            const webhookStats = await query(`
                SELECT 
                    endpoint,
                    COUNT(*) as total_calls,
                    SUM(CASE WHEN valid_signature = 1 THEN 1 ELSE 0 END) as valid_calls,
                    SUM(CASE WHEN processed = 1 THEN 1 ELSE 0 END) as processed_calls
                FROM webhook_logs 
                WHERE created_at > datetime('now', '-7 days')
                GROUP BY endpoint
            `);
            
            res.json({
                success: true,
                stats: {
                    totalJobs: jobStats.rows?.reduce((sum, row) => sum + row.count, 0) || 0,
                    successRate: HealthController.calculateSuccessRate(jobStats.rows || []),
                    avgProcessingTime: HealthController.calculateAvgProcessingTime(jobStats.rows || []),
                    failedJobs: jobStats.rows?.find(row => row.status === 'failed')?.count || 0,
                    pendingJobs: jobStats.rows?.find(row => row.status === 'pending')?.count || 0,
                    recentFailures: recentFailures.rows || [],
                    webhookStats: webhookStats.rows || []
                }
            });
            
        } catch (error) {
            console.error('Service stats error:', error);
            res.status(500).json({
                success: false,
                error: 'Failed to fetch service statistics'
            });
        }
    });
    
    static calculateSuccessRate(jobStats) {
        const total = jobStats.reduce((sum, row) => sum + row.count, 0);
        const completed = jobStats.find(row => row.status === 'completed')?.count || 0;
        return total > 0 ? Math.round((completed / total) * 100) : 100;
    }
    
    static calculateAvgProcessingTime(jobStats) {
        const completedRow = jobStats.find(row => row.status === 'completed');
        return completedRow?.avg_duration_seconds ? 
            Math.round(completedRow.avg_duration_seconds) : 0;
    }
}

module.exports = HealthController;