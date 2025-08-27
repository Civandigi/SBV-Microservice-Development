// SBV Professional V2 - Rate Limiting Middleware
// Vernünftige Limits - nicht zu aggressiv wie V1

const config = require('../config');

// Simple in-memory rate limiter
class InMemoryRateLimiter {
    constructor() {
        this.requests = new Map();
        this.cleanup();
    }
    
    // Clean up old entries every minute
    cleanup() {
        setInterval(() => {
            const now = Date.now();
            for (const [key, data] of this.requests.entries()) {
                if (now - data.resetTime > data.windowMs) {
                    this.requests.delete(key);
                }
            }
        }, 60000);
    }
    
    isAllowed(identifier, windowMs, max) {
        const now = Date.now();
        const key = `${identifier}_${windowMs}_${max}`;
        
        if (!this.requests.has(key)) {
            this.requests.set(key, {
                count: 1,
                resetTime: now + windowMs,
                firstRequest: now,
                windowMs
            });
            return { 
                allowed: true, 
                remaining: max - 1,
                resetTime: now + windowMs
            };
        }
        
        const data = this.requests.get(key);
        
        // Reset if window expired
        if (now - data.firstRequest > windowMs) {
            this.requests.set(key, {
                count: 1,
                resetTime: now + windowMs,
                firstRequest: now,
                windowMs
            });
            return { 
                allowed: true, 
                remaining: max - 1,
                resetTime: now + windowMs
            };
        }
        
        // Check if limit exceeded
        if (data.count >= max) {
            return { 
                allowed: false, 
                remaining: 0,
                resetTime: data.resetTime
            };
        }
        
        // Increment counter
        data.count++;
        return { 
            allowed: true, 
            remaining: max - data.count,
            resetTime: data.resetTime
        };
    }
}

const rateLimiter = new InMemoryRateLimiter();

// General rate limiting middleware
const rateLimitMiddleware = (req, res, next) => {
    // Skip rate limiting in development
    if (config.rateLimit.skipInDevelopment && config.server.isDevelopment) {
        return next();
    }
    
    const identifier = req.ip || req.connection.remoteAddress;
    const { windowMs, max } = config.rateLimit.general;
    const result = rateLimiter.isAllowed(identifier, windowMs, max);
    
    // Add rate limit headers
    res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.set('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
            error: 'Zu viele Anfragen',
            message: `Sie haben das Anfrage-Limit erreicht. Versuchen Sie es in ${Math.ceil(retryAfter / 60)} Minuten erneut.`,
            retryAfter: retryAfter
        });
    }
    
    next();
};

// Login rate limiting
const loginRateLimit = (req, res, next) => {
    // Skip in development
    if (config.rateLimit.skipInDevelopment && config.server.isDevelopment) {
        return next();
    }
    
    const identifier = req.ip || req.connection.remoteAddress;
    const { windowMs, max } = config.rateLimit.login;
    const result = rateLimiter.isAllowed(identifier, windowMs, max);
    
    res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        res.set('Retry-After', retryAfter.toString());
        
        return res.status(429).json({
            error: 'Zu viele Anmeldeversuche',
            message: `Sie haben zu viele Anmeldeversuche unternommen. Versuchen Sie es in ${Math.ceil(retryAfter / 60)} Minuten erneut.`,
            retryAfter: retryAfter
        });
    }
    
    next();
};

// Upload rate limiting
const uploadRateLimit = (req, res, next) => {
    // Skip in development
    if (config.rateLimit.skipInDevelopment && config.server.isDevelopment) {
        return next();
    }
    
    const identifier = req.user ? req.user.id : (req.ip || req.connection.remoteAddress);
    const { windowMs, max } = config.rateLimit.upload;
    const result = rateLimiter.isAllowed(identifier, windowMs, max);
    
    res.set({
        'X-RateLimit-Limit': max.toString(),
        'X-RateLimit-Remaining': result.remaining.toString(),
        'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
    });
    
    if (!result.allowed) {
        const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
        
        return res.status(429).json({
            error: 'Upload-Limit erreicht',
            message: `Sie haben das Upload-Limit erreicht. Versuchen Sie es in ${Math.ceil(retryAfter / 60)} Minuten erneut.`,
            retryAfter: retryAfter
        });
    }
    
    next();
};

// Custom rate limiter
const customRateLimit = (options = {}) => {
    const {
        windowMs = config.rateLimit.general.windowMs,
        max = config.rateLimit.general.max,
        message = 'Zu viele Anfragen',
        keyGenerator = (req) => req.ip || req.connection.remoteAddress
    } = options;
    
    return (req, res, next) => {
        // Skip in development
        if (config.rateLimit.skipInDevelopment && config.server.isDevelopment) {
            return next();
        }
        
        const identifier = keyGenerator(req);
        const result = rateLimiter.isAllowed(identifier, windowMs, max);
        
        res.set({
            'X-RateLimit-Limit': max.toString(),
            'X-RateLimit-Remaining': result.remaining.toString(),
            'X-RateLimit-Reset': new Date(result.resetTime).toISOString()
        });
        
        if (!result.allowed) {
            const retryAfter = Math.ceil((result.resetTime - Date.now()) / 1000);
            res.set('Retry-After', retryAfter.toString());
            
            return res.status(429).json({
                error: 'Rate Limit erreicht',
                message: message,
                retryAfter: retryAfter
            });
        }
        
        next();
    };
};

module.exports = {
    rateLimitMiddleware,
    loginRateLimit,
    uploadRateLimit,
    customRateLimit
};