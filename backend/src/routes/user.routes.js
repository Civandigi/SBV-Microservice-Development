// SBV Professional V2 - User Routes
const express = require('express');
const bcrypt = require('bcryptjs');
const { query } = require('../config/database');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { apiRateLimit } = require('../middleware/rateLimit.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const emailService = require('../services/email.service');

const router = express.Router();

// Get current user profile
router.get('/profile', 
    authenticateToken,
    asyncHandler(async (req, res) => {
        const result = await query(
            'SELECT id, email, role, first_name, last_name, created_at FROM users WHERE id = $1',
            [req.user.id]
        );

        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'User not found' });
        }

        res.json({ user: result.rows[0] });
    })
);

// Update user profile
router.put('/profile',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { first_name, last_name } = req.body;
        
        const result = await query(
            'UPDATE users SET first_name = $1, last_name = $2, updated_at = CURRENT_TIMESTAMP WHERE id = $3',
            [first_name, last_name, req.user.id]
        );
        
        // SQLite doesn't support RETURNING, so fetch the updated user
        const userResult = await query(
            'SELECT id, email, role, first_name, last_name FROM users WHERE id = $1',
            [req.user.id]
        );

        res.json({ user: userResult.rows[0] });
    })
);

// Admin/Super Admin: Get all users
router.get('/',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    asyncHandler(async (req, res) => {
        const result = await query(
            'SELECT id, name, email, role, first_name, last_name, is_active, created_at FROM users ORDER BY created_at DESC'
        );

        res.json({ users: result.rows });
    })
);

// Admin: Create new user
router.post('/',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    asyncHandler(async (req, res) => {
        const { name, email, password, role, is_active = true } = req.body;
        
        // Validate required fields
        if (!name || !email || !password || !role) {
            return res.status(400).json({ error: 'Alle Pflichtfelder müssen ausgefüllt werden' });
        }
        
        // Check if name or email already exists
        const existingUser = await query(
            'SELECT id FROM users WHERE name = $1 OR email = $2',
            [name, email]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
        }
        
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Create user
        const result = await query(
            `INSERT INTO users (name, email, password, role, is_active) 
             VALUES ($1, $2, $3, $4, $5) 
             RETURNING id, name, email, role, is_active, created_at`,
            [name, email, hashedPassword, role, is_active]
        );
        
        // Send welcome email
        await emailService.sendWelcomeEmail(result.rows[0]);
        
        res.status(201).json({ user: result.rows[0] });
    })
);

// Admin: Update user
router.put('/:id',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { name, email, role, is_active } = req.body;
        
        // Check if user exists
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        
        // Check if name or email already taken by another user
        const existingUser = await query(
            'SELECT id FROM users WHERE (name = $1 OR email = $2) AND id != $3',
            [name, email, id]
        );
        
        if (existingUser.rows.length > 0) {
            return res.status(400).json({ error: 'Benutzername oder E-Mail bereits vergeben' });
        }
        
        // Update user
        const result = await query(
            `UPDATE users 
             SET name = $1, email = $2, role = $3, is_active = $4, updated_at = NOW() 
             WHERE id = $5 
             RETURNING id, name, email, role, is_active`,
            [name, email, role, is_active, id]
        );
        
        res.json({ user: result.rows[0] });
    })
);

// Admin: Reset user password
router.put('/:id/password',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        const { password } = req.body;
        
        if (!password || password.length < 6) {
            return res.status(400).json({ error: 'Passwort muss mindestens 6 Zeichen lang sein' });
        }
        
        // Check if user exists
        const userCheck = await query('SELECT id FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        
        // Hash new password
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // Update password
        await query(
            'UPDATE users SET password = $1, updated_at = NOW() WHERE id = $2',
            [hashedPassword, id]
        );
        
        res.json({ message: 'Passwort erfolgreich zurückgesetzt' });
    })
);

// Admin: Delete user
router.delete('/:id',
    authenticateToken,
    requireRole(['admin', 'super_admin']),
    asyncHandler(async (req, res) => {
        const { id } = req.params;
        
        // Prevent self-deletion
        if (id == req.user.id) {
            return res.status(400).json({ error: 'Sie können sich nicht selbst löschen' });
        }
        
        // Check if user exists
        const userCheck = await query('SELECT name FROM users WHERE id = $1', [id]);
        if (userCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Benutzer nicht gefunden' });
        }
        
        // Delete user (cascade will handle related records)
        await query('DELETE FROM users WHERE id = $1', [id]);
        
        res.json({ 
            message: 'Benutzer erfolgreich gelöscht',
            name: userCheck.rows[0].name
        });
    })
);

module.exports = router;