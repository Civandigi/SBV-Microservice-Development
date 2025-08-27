// SBV Professional V2 - Clean Architecture Server
// Max. 250 Zeilen - modular und übersichtlich

// WICHTIG: Lade .env ZUERST, bevor irgendwas anderes passiert!
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const express = require('express');
const cors = require('cors');
const helmet = require('helmet');
const compression = require('compression');

// Configuration
const config = require('./config');
const { testConnection, initializeTables } = require('./config/database');
const { validateDatabaseConnection } = require('./config/database-safety');

// Middleware
const { errorHandler, notFoundHandler, requestLogger } = require('./middleware/error.middleware');
const { rateLimitMiddleware } = require('./middleware/rateLimit.middleware');
const { authenticateToken } = require('./middleware/auth.middleware');

// Routes
const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');
const rapportRoutes = require('./routes/rapport.routes');
const healthRoutes = require('./routes/health.routes');
const uploadRoutes = require('./routes/upload.routes');
const webhookRoutes = require('./routes/webhook.routes');
// const documentRoutes = require('../routes/documentRoutes'); // Removed - using upload.routes instead
const dashboardRoutes = require('./routes/dashboard.routes');
const budgetRoutes = require('./routes/budget.routes');
const templateRoutes = require('./routes/template.routes');
const gesuchRoutes = require('./routes/gesuch.routes');
const app = express();

// Trust proxy for rate limiting
if (config.server.isProduction) {
    app.set('trust proxy', 1);
}

// Security middleware with relaxed CSP for frontend
app.use(helmet({
    contentSecurityPolicy: {
        directives: {
            defaultSrc: ["'self'"],
            scriptSrc: ["'self'", "'unsafe-inline'", "'unsafe-eval'", "https://cdn.tailwindcss.com"],
            scriptSrcAttr: ["'unsafe-inline'"], // Allow onclick handlers
            styleSrc: ["'self'", "'unsafe-inline'", "https://fonts.googleapis.com"],
            fontSrc: ["'self'", "https://fonts.gstatic.com"],
            imgSrc: ["'self'", "data:", "https:"],
            connectSrc: ["'self'"],
            objectSrc: ["'none'"],
            mediaSrc: ["'self'"],
            frameSrc: ["'none'"],
        },
    },
    crossOriginEmbedderPolicy: false
}));

// CORS configuration
app.use(cors(config.cors));

// Request logging (development only)
if (config.server.isDevelopment) {
    app.use(requestLogger);
}

// Compression
app.use(compression());

// Body parsing
app.use(express.json({ 
    limit: '10mb',
    strict: true
}));
app.use(express.urlencoded({ 
    extended: true, 
    limit: '10mb' 
}));

// Rate limiting
app.use(rateLimitMiddleware);

// Static files (Frontend)
app.use(express.static(path.join(__dirname, '../../frontend')));

// API Routes
app.use('/api/health', healthRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/users', authenticateToken, userRoutes);
app.use('/api/rapporte', authenticateToken, rapportRoutes);
app.use('/api/rapporte', authenticateToken, require('./routes/rapportRequest.routes')); // Request-specific routes
app.use('/api/templates', authenticateToken, templateRoutes);
app.use('/api/upload', uploadRoutes);
app.use('/api/webhooks', webhookRoutes);
// app.use('/api/documents', documentRoutes); // Removed - using upload routes instead
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/budget', authenticateToken, budgetRoutes);
app.use('/api/gesuch', gesuchRoutes);

// Serve frontend for SPA routes
app.get('*', (req, res) => {
    // Don't serve frontend for API routes
    if (req.path.startsWith('/api/')) {
        return res.status(404).json({ error: 'API endpoint not found' });
    }
    
    // Serve specific HTML files if they exist
    const requestedPath = req.path;
    const htmlFile = path.join(__dirname, '../../frontend', requestedPath);
    
    if (require('fs').existsSync(htmlFile)) {
        return res.sendFile(htmlFile);
    }
    
    // Default to index.html for SPA routes
    res.sendFile(path.join(__dirname, '../../frontend/index.html'));
});

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

// Graceful shutdown
const gracefulShutdown = (signal) => {
    console.log(`\\n📤 Received ${signal}. Starting graceful shutdown...`);
    
    process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Server startup
const startServer = async () => {
    try {
        // KRITISCH: Datenbank-Sicherheitscheck ZUERST
        const dbCheck = validateDatabaseConnection();
        if (!dbCheck.isSafe) {
            console.error('\\n🔴 KRITISCH: Datenbank-Konfiguration unsicher!');
            console.error('Beheben Sie diese Fehler bevor der Server startet.');
            process.exit(1);
        }
        
        // Test database connection
        const dbConnected = await testConnection();
        if (!dbConnected) {
            console.error('❌ Cannot start server: Database connection failed');
            process.exit(1);
        }
        
        // Initialize database tables
        await initializeTables();
        
        // Start server
        const server = app.listen(config.server.port, config.server.host, () => {
            console.log('\\n🚀 SBV Professional V2 Server started successfully!\\n');
            console.log('📊 Configuration:');
            console.log('   🌍 Environment:', config.server.nodeEnv);
            console.log('   🌐 URL: http://' + config.server.host + ':' + config.server.port);
            console.log('   🗄️  Database: Connected');
            console.log('   🔒 Security: Enhanced');
            console.log('   📝 Logs:', config.server.isDevelopment ? 'Detailed' : 'Production');
            
            console.log('\\n🔧 API Endpoints:');
            console.log('   GET  /api/health        - Health check');
            console.log('   POST /api/auth/login    - User login');
            console.log('   GET  /api/auth/me       - Current user');
            console.log('   GET  /api/users         - User management');
            console.log('   GET  /api/rapporte      - Rapport management');
            
            console.log('\\n📱 Frontend: http://' + config.server.host + ':' + config.server.port);
            console.log('🩺 Health: http://' + config.server.host + ':' + config.server.port + '/api/health');
            
            if (config.server.isDevelopment) {
                console.log('\\n🔧 Development mode - Hot reloading with nodemon');
                console.log('🔄 Rate limiting: DISABLED');
            }
        });
        
        // Handle server errors
        server.on('error', (error) => {
            if (error.code === 'EADDRINUSE') {
                console.error(`❌ Port ${config.server.port} is already in use`);
            } else {
                console.error('❌ Server error:', error);
            }
            process.exit(1);
        });
        
        return server;
        
    } catch (error) {
        console.error('❌ Failed to start server:', error);
        process.exit(1);
    }
};

// Start the server
if (require.main === module) {
    startServer();
}

module.exports = { app, startServer };