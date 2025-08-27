// SBV Professional V2 - Error Handling Middleware
const config = require('../config');

// Request logging middleware (development only)
const requestLogger = (req, res, next) => {
    if (config.server.isDevelopment) {
        const start = Date.now();
        const { method, url, ip } = req;
        
        res.on('finish', () => {
            const duration = Date.now() - start;
            const { statusCode } = res;
            
            const logColor = statusCode >= 400 ? '\x1b[31m' : '\x1b[32m'; // Red for errors, green for success
            const resetColor = '\x1b[0m';
            
            console.log(`${logColor}${method} ${url} ${statusCode} - ${duration}ms - ${ip}${resetColor}`);
        });
    }
    
    next();
};

// 404 Not Found handler
const notFoundHandler = (req, res, next) => {
    res.status(404).json({
        error: 'Nicht gefunden',
        message: `Route ${req.method} ${req.path} wurde nicht gefunden`,
        path: req.path,
        method: req.method
    });
};

// Global error handler
const errorHandler = (error, req, res, next) => {
    // Log error details
    console.error('❌ Error occurred:', {
        message: error.message,
        stack: config.server.isDevelopment ? error.stack : undefined,
        url: req.url,
        method: req.method,
        user: req.user ? req.user.id : 'anonymous',
        timestamp: new Date().toISOString()
    });
    
    // Default error response
    let statusCode = error.statusCode || 500;
    let message = 'Ein unerwarteter Fehler ist aufgetreten';
    let details = null;
    
    // Handle specific error types
    if (error.name === 'ValidationError') {
        statusCode = 400;
        message = 'Validierungsfehler';
        details = error.details;
    } else if (error.name === 'UnauthorizedError') {
        statusCode = 401;
        message = 'Nicht autorisiert';
    } else if (error.name === 'ForbiddenError') {
        statusCode = 403;
        message = 'Zugriff verweigert';
    } else if (error.name === 'NotFoundError') {
        statusCode = 404;
        message = 'Ressource nicht gefunden';
    } else if (error.name === 'ConflictError') {
        statusCode = 409;
        message = 'Konflikt';
    } else if (error.code === '23505') { // PostgreSQL unique violation
        statusCode = 409;
        message = 'Diese Daten existieren bereits';
    } else if (error.code === '23503') { // PostgreSQL foreign key violation
        statusCode = 400;
        message = 'Ungültige Referenz';
    } else if (error.code === '23502') { // PostgreSQL not null violation
        statusCode = 400;
        message = 'Erforderliche Felder fehlen';
    } else if (error.message) {
        message = error.message;
    }
    
    // Construct error response
    const errorResponse = {
        error: error.name || 'ServerError',
        message: message,
        statusCode: statusCode
    };
    
    // Add details in development mode
    if (config.server.isDevelopment) {
        errorResponse.stack = error.stack;
        errorResponse.details = details;
    }
    
    // Add details if they exist
    if (details) {
        errorResponse.details = details;
    }
    
    res.status(statusCode).json(errorResponse);
};

// Custom error classes
class ValidationError extends Error {
    constructor(message, details = null) {
        super(message);
        this.name = 'ValidationError';
        this.statusCode = 400;
        this.details = details;
    }
}

class UnauthorizedError extends Error {
    constructor(message = 'Nicht autorisiert') {
        super(message);
        this.name = 'UnauthorizedError';
        this.statusCode = 401;
    }
}

class ForbiddenError extends Error {
    constructor(message = 'Zugriff verweigert') {
        super(message);
        this.name = 'ForbiddenError';
        this.statusCode = 403;
    }
}

class NotFoundError extends Error {
    constructor(message = 'Ressource nicht gefunden') {
        super(message);
        this.name = 'NotFoundError';
        this.statusCode = 404;
    }
}

class ConflictError extends Error {
    constructor(message = 'Konflikt') {
        super(message);
        this.name = 'ConflictError';
        this.statusCode = 409;
    }
}

// Async wrapper to catch async errors
const asyncHandler = (fn) => {
    return (req, res, next) => {
        Promise.resolve(fn(req, res, next)).catch(next);
    };
};

// Security headers middleware
const securityHeaders = (req, res, next) => {
    // Remove server information
    res.removeHeader('X-Powered-By');
    
    // Add security headers
    res.set({
        'X-Content-Type-Options': 'nosniff',
        'X-Frame-Options': 'DENY',
        'X-XSS-Protection': '1; mode=block',
        'Referrer-Policy': 'strict-origin-when-cross-origin'
    });
    
    next();
};

module.exports = {
    requestLogger,
    notFoundHandler,
    errorHandler,
    securityHeaders,
    asyncHandler,
    
    // Custom error classes
    ValidationError,
    UnauthorizedError,
    ForbiddenError,
    NotFoundError,
    ConflictError
};