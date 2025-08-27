// SBV Professional V2 - Health Check Routes
const express = require('express');
const { testConnection, getStats } = require('../config/database');
const config = require('../config');
const { asyncHandler } = require('../middleware/error.middleware');
const HealthController = require('../controllers/health.controller');

const router = express.Router();

// Basic health check
router.get('/', asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    // Test database connection
    const dbHealthy = await testConnection();
    const dbResponseTime = Date.now() - startTime;
    
    const health = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        environment: config.server.nodeEnv,
        version: '2.0.0',
        uptime: process.uptime(),
        memory: {
            used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024) + ' MB',
            total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024) + ' MB'
        },
        database: {
            status: dbHealthy ? 'connected' : 'disconnected', 
            responseTime: dbResponseTime + 'ms'
        }
    };
    
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(health);
}));

// Detailed health check (for monitoring systems)
router.get('/detailed', asyncHandler(async (req, res) => {
    const startTime = Date.now();
    
    // Test database connection
    const dbHealthy = await testConnection();
    const dbResponseTime = Date.now() - startTime;
    
    // Get database stats (if connected)
    let dbStats = null;
    if (dbHealthy) {
        try {
            dbStats = await getStats();
        } catch (error) {
            console.error('❌ Error getting database stats:', error);
        }
    }
    
    const detailedHealth = {
        status: dbHealthy ? 'healthy' : 'unhealthy',
        timestamp: new Date().toISOString(),
        application: {
            name: 'SBV Professional V2',
            version: '2.0.0',
            environment: config.server.nodeEnv,
            uptime: process.uptime(),
            port: config.server.port
        },
        system: {
            platform: process.platform,
            nodeVersion: process.version,
            memory: {
                used: Math.round(process.memoryUsage().heapUsed / 1024 / 1024),
                total: Math.round(process.memoryUsage().heapTotal / 1024 / 1024),
                external: Math.round(process.memoryUsage().external / 1024 / 1024),
                unit: 'MB'
            },
            cpu: {
                usage: process.cpuUsage()
            }
        },
        database: {
            status: dbHealthy ? 'connected' : 'disconnected',
            responseTime: dbResponseTime,
            stats: dbStats
        },
        features: {
            rateLimiting: !config.rateLimit.skipInDevelopment || !config.server.isDevelopment,
            registration: config.features.userRegistration,
            passwordReset: config.features.passwordReset,
            emailNotifications: config.features.emailNotifications
        }
    };
    
    const statusCode = dbHealthy ? 200 : 503;
    res.status(statusCode).json(detailedHealth);
}));

// Simple ping endpoint
router.get('/ping', (req, res) => {
    res.json({ 
        status: 'pong',
        timestamp: new Date().toISOString()
    });
});

// Ready check (for Kubernetes readiness probes)
router.get('/ready', asyncHandler(async (req, res) => {
    const dbHealthy = await testConnection();
    
    if (dbHealthy) {
        res.json({ 
            status: 'ready',
            timestamp: new Date().toISOString()
        });
    } else {
        res.status(503).json({ 
            status: 'not ready',
            reason: 'database connection failed',
            timestamp: new Date().toISOString()
        });
    }
}));

// Live check (for Kubernetes liveness probes)
router.get('/live', (req, res) => {
    res.json({ 
        status: 'alive',
        timestamp: new Date().toISOString(),
        uptime: process.uptime()
    });
});

// Email service status check
router.get('/email-status', asyncHandler(async (req, res) => {
    const EmailService = require('../services/email.service');
    
    const status = {
        enabled: EmailService.enabled,
        serviceType: EmailService.serviceType || 'none',
        from: process.env.EMAIL_FROM || process.env.MAILGUN_FROM || config.email?.from || 'noreply@sbv-professional.ch'
    };
    
    // Add service-specific fields
    if (EmailService.serviceType === 'mailgun') {
        status.mailgunDomain = EmailService.mailgunDomain || null;
        status.mailgunRegion = process.env.MAILGUN_EU === 'true' ? 'EU' : 'US';
    } else if (EmailService.serviceType === 'smtp') {
        status.host = config.email?.smtp?.host || null;
        status.port = config.email?.smtp?.port || 587;
    }
    
    res.json(status);
}));

// === PHASE 4: MICROSERVICE MONITORING ===

// Comprehensive service health check
router.get('/services', HealthController.checkServices);

// Service statistics for admin dashboard
router.get('/service-stats', HealthController.getServiceStats);

// Microservice-specific health check
router.get('/microservice', asyncHandler(async (req, res) => {
    const result = await HealthController.checkMicroservice();
    const statusCode = result.status === 'healthy' ? 200 : 503;
    res.status(statusCode).json(result);
}));

module.exports = router;