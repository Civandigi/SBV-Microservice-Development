// SBV Professional V2 - Central Configuration
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../../.env') });

// Environment validation
const requiredEnvVars = [
    'JWT_SECRET'
];

// Only require DATABASE_URL if not using SQLite
if (process.env.USE_SQLITE !== 'true') {
    requiredEnvVars.push('DATABASE_URL');
}

requiredEnvVars.forEach(varName => {
    if (!process.env[varName]) {
        console.error(`❌ Error: Missing required environment variable ${varName}`);
        process.exit(1);
    }
});

// JWT Secret validation  
if (process.env.JWT_SECRET && process.env.JWT_SECRET.length < 32) {
    console.error('❌ Error: JWT_SECRET must be at least 32 characters long');
    process.exit(1);
}

module.exports = {
    // Server Configuration
    server: {
        port: process.env.PORT || 3000,
        host: process.env.HOST || 'localhost',
        nodeEnv: process.env.NODE_ENV || 'development',
        isDevelopment: process.env.NODE_ENV === 'development',
        isProduction: process.env.NODE_ENV === 'production'
    },
    
    // Database Configuration
    database: {
        url: process.env.DATABASE_URL,
        pool: {
            max: parseInt(process.env.DB_POOL_MAX) || 10,
            min: parseInt(process.env.DB_POOL_MIN) || 2,
            idleTimeoutMillis: parseInt(process.env.DB_POOL_IDLE_TIMEOUT) || 30000,
        },
        // SSL für Elestio PostgreSQL IMMER aktiviert
        ssl: process.env.DATABASE_URL && process.env.DATABASE_URL.includes('elestio') 
            ? { rejectUnauthorized: false }
            : process.env.NODE_ENV === 'production' 
                ? { rejectUnauthorized: false } 
                : false
    },
    
    // JWT Configuration
    jwt: {
        secret: process.env.JWT_SECRET,
        expiresIn: process.env.JWT_EXPIRES_IN || '8h',
        issuer: process.env.JWT_ISSUER || 'sbv-professional-v2',
        audience: process.env.JWT_AUDIENCE || 'sbv-users'
    },
    
    // Security Configuration
    security: {
        sessionSecret: process.env.SESSION_SECRET || process.env.JWT_SECRET,
        bcryptRounds: parseInt(process.env.BCRYPT_ROUNDS) || 12,
        loginMaxAttempts: parseInt(process.env.LOGIN_MAX_ATTEMPTS) || 5,
        loginLockoutMinutes: parseInt(process.env.LOGIN_LOCKOUT_DURATION_MINUTES) || 15
    },
    
    // CORS Configuration
    cors: {
        origin: process.env.ALLOWED_ORIGINS ? 
            process.env.ALLOWED_ORIGINS.split(',').map(origin => origin.trim()) : 
            process.env.NODE_ENV === 'production' ?
                ['https://*.up.railway.app', 'https://*.onrender.com'] :
                ['http://localhost:3000', 'http://localhost:3001'],
        credentials: true,
        optionsSuccessStatus: 200
    },
    
    // Rate Limiting (Vernünftige Werte - nicht zu aggressiv)
    rateLimit: {
        // General API Rate Limiting
        general: {
            windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS) || 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS) || 200, // 200 requests per 15 min (nicht zu streng)
            message: 'Zu viele Anfragen. Bitte versuchen Sie es später erneut.'
        },
        
        // Login Rate Limiting
        login: {
            windowMs: 15 * 60 * 1000, // 15 minutes
            max: parseInt(process.env.LOGIN_MAX_ATTEMPTS) || 10, // 10 attempts per 15 min
            message: 'Zu viele Anmeldeversuche. Bitte warten Sie 15 Minuten.'
        },
        
        // File Upload Rate Limiting
        upload: {
            windowMs: 60 * 60 * 1000, // 1 hour
            max: 20, // 20 uploads per hour
            message: 'Upload-Limit erreicht. Bitte warten Sie eine Stunde.'
        },
        
        // Development mode - Rate limiting disabled
        skipInDevelopment: process.env.NODE_ENV === 'development'
    },
    
    // File Upload Configuration
    upload: {
        maxFileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024, // 10MB
        uploadDir: process.env.UPLOAD_DIR || './uploads',
        allowedFileTypes: process.env.ALLOWED_FILE_TYPES ? 
            process.env.ALLOWED_FILE_TYPES.split(',').map(type => type.trim()) :
            ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'png', 'jpg', 'jpeg']
    },
    
    // Admin Configuration
    admin: {
        email: process.env.ADMIN_EMAIL || 'admin@sbv.ch',
        username: process.env.ADMIN_USERNAME || 'admin',
        password: process.env.ADMIN_PASSWORD || 'SBV2024Admin!'
    },
    
    // Feature Flags
    features: {
        userRegistration: process.env.ENABLE_REGISTRATION === 'true',
        passwordReset: process.env.ENABLE_PASSWORD_RESET === 'true',
        emailNotifications: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
        apiDocs: process.env.ENABLE_API_DOCS !== 'false'
    },
    
    // Logging Configuration
    logging: {
        level: process.env.LOG_LEVEL || 'info',
        format: process.env.LOG_FORMAT || 'json'
    },
    
    // Email Configuration
    email: {
        smtp: {
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true',
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        },
        from: process.env.EMAIL_FROM || '"SBV Professional" <noreply@sbv-professional.ch>'
    },
    
    // App Configuration
    app: {
        url: process.env.APP_URL || `http://localhost:${process.env.PORT || 3000}`
    },
    
    // Webhook Configuration
    webhook: {
        enabled: process.env.ENABLE_WEBHOOKS === 'true',
        n8nUrl: process.env.N8N_WEBHOOK_URL,
        secret: process.env.N8N_WEBHOOK_SECRET
    }
};