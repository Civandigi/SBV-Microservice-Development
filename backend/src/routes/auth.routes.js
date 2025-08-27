// SBV Professional V2 - Authentication Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../config/database');
const config = require('../config');
const { loginRateLimit } = require('../middleware/rateLimit.middleware');
const { authenticateToken } = require('../middleware/auth.middleware');
const { asyncHandler, ValidationError, UnauthorizedError } = require('../middleware/error.middleware');

const router = express.Router();

// Login endpoint
router.post('/login', loginRateLimit, asyncHandler(async (req, res) => {
    const { email, password } = req.body;
    
    // Input validation
    if (!email || !password) {
        throw new ValidationError('E-Mail und Passwort sind erforderlich');
    }
    
    if (!email.includes('@')) {
        throw new ValidationError('Ungültige E-Mail-Adresse');
    }
    
    // Get user from database
    const result = await query(
        'SELECT id, email, name, password_hash, role, is_active, login_attempts, locked_until FROM users WHERE email = $1',
        [email.toLowerCase()]
    );
    
    // SQLite returns array directly, not { rows: [...] }
    const users = Array.isArray(result) ? result : (result.rows || []);
    
    if (users.length === 0) {
        throw new UnauthorizedError('Ungültige Anmeldedaten');
    }
    
    const user = users[0];
    
    // Check if account is active (SQLite stores boolean as 1/0)
    if (!user.is_active && user.is_active !== 1) {
        throw new UnauthorizedError('Ihr Konto wurde deaktiviert');
    }
    
    // Check if account is locked
    if (user.locked_until && new Date() < new Date(user.locked_until)) {
        const lockoutMinutes = Math.ceil((new Date(user.locked_until) - new Date()) / (1000 * 60));
        throw new UnauthorizedError(`Konto ist gesperrt. Versuchen Sie es in ${lockoutMinutes} Minuten erneut.`);
    }
    
    // Verify password
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    
    if (!isValidPassword) {
        // Increment login attempts
        const newAttempts = (user.login_attempts || 0) + 1;
        let lockoutTime = null;
        
        // Lock account after max attempts
        if (newAttempts >= config.security.loginMaxAttempts) {
            lockoutTime = new Date(Date.now() + config.security.loginLockoutMinutes * 60 * 1000);
        }
        
        await query(
            'UPDATE users SET login_attempts = $1, locked_until = $2 WHERE id = $3',
            [newAttempts, lockoutTime, user.id]
        );
        
        if (lockoutTime) {
            throw new UnauthorizedError(`Zu viele fehlgeschlagene Anmeldeversuche. Konto für ${config.security.loginLockoutMinutes} Minuten gesperrt.`);
        }
        
        throw new UnauthorizedError('Ungültige Anmeldedaten');
    }
    
    // Reset login attempts and update last login
    await query(
        'UPDATE users SET login_attempts = 0, locked_until = NULL, last_login = CURRENT_TIMESTAMP WHERE id = $1',
        [user.id]
    );
    
    // Generate JWT token
    const token = jwt.sign(
        { 
            userId: user.id,
            email: user.email,
            role: user.role
        },
        config.jwt.secret,
        { 
            expiresIn: config.jwt.expiresIn,
            issuer: config.jwt.issuer,
            audience: config.jwt.audience
        }
    );
    
    // Log successful login
    await query(
        'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [
            user.id,
            'login_success',
            JSON.stringify({ method: 'password' }),
            req.ip
        ]
    );
    
    res.json({
        success: true,
        message: 'Erfolgreich angemeldet',
        token,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role
        }
    });
}));

// Get current user info
router.get('/me', authenticateToken, asyncHandler(async (req, res) => {
    const result = await query(
        'SELECT id, email, name, role, created_at, last_login FROM users WHERE id = $1',
        [req.user.id]
    );
    
    // SQLite returns array directly, not { rows: [...] }
    const users = Array.isArray(result) ? result : (result.rows || []);
    
    if (users.length === 0) {
        throw new UnauthorizedError('Benutzer nicht gefunden');
    }
    
    const user = users[0];
    
    res.json({
        success: true,
        user: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
            created_at: user.created_at,
            last_login: user.last_login
        }
    });
}));

// Logout endpoint (optional - mainly for logging)
router.post('/logout', authenticateToken, asyncHandler(async (req, res) => {
    // Log logout
    await query(
        'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [
            req.user.id,
            'logout',
            JSON.stringify({ method: 'manual' }),
            req.ip
        ]
    );
    
    res.json({
        success: true,
        message: 'Erfolgreich abgemeldet'
    });
}));

// Token validation endpoint
router.post('/validate-token', authenticateToken, (req, res) => {
    res.json({
        success: true,
        valid: true,
        user: {
            id: req.user.id,
            email: req.user.email,
            name: req.user.name,
            role: req.user.role
        }
    });
});

// Password change endpoint  
router.post('/change-password', authenticateToken, asyncHandler(async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    
    // Input validation
    if (!currentPassword || !newPassword) {
        throw new ValidationError('Aktuelles und neues Passwort sind erforderlich');
    }
    
    if (newPassword.length < 6) {
        throw new ValidationError('Neues Passwort muss mindestens 6 Zeichen lang sein');
    }
    
    // Get current password hash
    const result = await query(
        'SELECT password_hash FROM users WHERE id = $1',
        [req.user.id]
    );
    
    // SQLite returns array directly, not { rows: [...] }
    const users = Array.isArray(result) ? result : (result.rows || []);
    
    if (users.length === 0) {
        throw new UnauthorizedError('Benutzer nicht gefunden');
    }
    
    // Verify current password
    const isValidPassword = await bcrypt.compare(currentPassword, users[0].password_hash);
    
    if (!isValidPassword) {
        throw new UnauthorizedError('Aktuelles Passwort ist ungültig');
    }
    
    // Hash new password
    const newPasswordHash = await bcrypt.hash(newPassword, config.security.bcryptRounds);
    
    // Update password
    await query(
        'UPDATE users SET password_hash = $1, updated_at = CURRENT_TIMESTAMP WHERE id = $2',
        [newPasswordHash, req.user.id]
    );
    
    // Log password change
    await query(
        'INSERT INTO activity_logs (user_id, action, details, ip_address) VALUES ($1, $2, $3, $4)',
        [
            req.user.id,
            'password_change',
            JSON.stringify({ success: true }),
            req.ip
        ]
    );
    
    res.json({
        success: true,
        message: 'Passwort erfolgreich geändert'
    });
}));

module.exports = router;