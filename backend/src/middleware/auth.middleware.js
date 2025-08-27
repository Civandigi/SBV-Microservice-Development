// SBV Professional V2 - Authentication Middleware
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const config = require('../config');

// JWT Token verification
const authenticateToken = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN
        
        if (!token) {
            return res.status(401).json({ 
                error: 'Zugriff verweigert',
                message: 'Kein Token bereitgestellt' 
            });
        }
        
        // Verify JWT token
        const decoded = jwt.verify(token, config.jwt.secret);
        
        // Get user from database to ensure they still exist and are active
        const result = await query(
            'SELECT id, email, name, role, is_active FROM users WHERE id = $1',
            [decoded.userId]
        );
        
        // SQLite returns array directly, not { rows: [...] }
        const users = Array.isArray(result) ? result : (result.rows || []);
        
        if (users.length === 0) {
            return res.status(401).json({ 
                error: 'Ungültiger Token',
                message: 'Benutzer nicht gefunden' 
            });
        }
        
        const user = users[0];
        
        // SQLite stores boolean as 1/0, so check both
        if (!user.is_active && user.is_active !== 1) {
            return res.status(401).json({ 
                error: 'Konto deaktiviert',
                message: 'Ihr Konto wurde deaktiviert' 
            });
        }
        
        // Add user to request object
        req.user = {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        };
        
        next();
        
    } catch (error) {
        if (error.name === 'JsonWebTokenError') {
            return res.status(401).json({ 
                error: 'Ungültiger Token',
                message: 'Token ist nicht gültig' 
            });
        }
        
        if (error.name === 'TokenExpiredError') {
            return res.status(401).json({ 
                error: 'Token abgelaufen',
                message: 'Bitte melden Sie sich erneut an' 
            });
        }
        
        console.error('❌ Auth middleware error:', error);
        return res.status(500).json({ 
            error: 'Authentifizierungsfehler',
            message: 'Unerwarteter Fehler bei der Authentifizierung' 
        });
    }
};

// Role-based authorization middleware
const requireRole = (requiredRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(401).json({ 
                error: 'Nicht authentifiziert',
                message: 'Benutzer ist nicht angemeldet' 
            });
        }
        
        // Convert single role to array
        const roles = Array.isArray(requiredRoles) ? requiredRoles : [requiredRoles];
        
        if (!roles.includes(req.user.role)) {
            return res.status(403).json({ 
                error: 'Nicht autorisiert',
                message: 'Unzureichende Berechtigung für diese Aktion' 
            });
        }
        
        next();
    };
};

// Specific role shortcuts
const requireAdmin = requireRole(['admin', 'super_admin']);
const requireSuperAdmin = requireRole(['super_admin']);

// Resource ownership check
const requireOwnershipOrAdmin = (resourceIdParam = 'id', userIdField = 'created_by') => {
    return async (req, res, next) => {
        try {
            const resourceId = req.params[resourceIdParam];
            const userId = req.user.id;
            const userRole = req.user.role;
            
            // Admin and Super Admin can access any resource
            if (userRole === 'admin' || userRole === 'super_admin') {
                return next();
            }
            
            // For regular users, check ownership
            // This will be implemented when we know the specific resource table
            // For now, we'll add the logic in the route handlers
            next();
            
        } catch (error) {
            console.error('❌ Ownership check error:', error);
            return res.status(500).json({ 
                error: 'Autorisierungsfehler',
                message: 'Fehler bei der Berechtigungsprüfung' 
            });
        }
    };
};

// Optional authentication (for public endpoints that can benefit from user context)
const optionalAuth = async (req, res, next) => {
    try {
        const authHeader = req.headers['authorization'];
        const token = authHeader && authHeader.split(' ')[1];
        
        if (!token) {
            req.user = null;
            return next();
        }
        
        const decoded = jwt.verify(token, config.jwt.secret);
        const result = await query(
            'SELECT id, email, name, role, is_active FROM users WHERE id = $1 AND is_active = true',
            [decoded.userId]
        );
        
        // SQLite returns array directly, not { rows: [...] }
        const users = Array.isArray(result) ? result : (result.rows || []);
        
        req.user = users.length > 0 ? {
            id: users[0].id,
            email: users[0].email,
            name: users[0].name,
            role: users[0].role
        } : null;
        
        next();
        
    } catch (error) {
        // Ignore token errors for optional auth
        req.user = null;
        next();
    }
};

module.exports = {
    authenticateToken,
    requireRole,
    requireAdmin,
    requireSuperAdmin,
    requireOwnershipOrAdmin,
    optionalAuth
};