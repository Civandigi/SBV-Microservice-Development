// SBV Professional V2 - Upload Routes
const express = require('express');
const multer = require('multer');
const { query } = require('../config/database');
const { authenticateToken } = require('../middleware/auth.middleware');
const { asyncHandler } = require('../middleware/error.middleware');
const config = require('../config');

const router = express.Router();

// Configure multer for memory storage (files stored in RAM temporarily)
const storage = multer.memoryStorage();

const upload = multer({
    storage: storage,
    limits: {
        fileSize: config.upload.maxFileSize // 10MB default
    },
    fileFilter: (req, file, cb) => {
        // Extract file extension
        const fileExt = file.originalname.split('.').pop().toLowerCase();
        
        // Check if file type is allowed
        if (config.upload.allowedFileTypes.includes(fileExt)) {
            cb(null, true);
        } else {
            cb(new Error(`Dateityp .${fileExt} ist nicht erlaubt. Erlaubte Typen: ${config.upload.allowedFileTypes.join(', ')}`));
        }
    }
});

// Upload file for a rapport
router.post('/rapport/:rapportId',
    authenticateToken,
    upload.single('file'),
    asyncHandler(async (req, res) => {
        const { rapportId } = req.params;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen' });
        }
        
        // Check if user has access to this rapport
        const rapportCheck = await query(
            `SELECT id FROM rapporte 
             WHERE id = $1 AND (author_id = $2 OR $3 IN ('admin', 'super_admin'))`,
            [rapportId, req.user.id, req.user.role]
        );
        
        if (rapportCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Kein Zugriff auf diesen Rapport' });
        }
        
        // Save file to database
        const result = await query(
            `INSERT INTO documents (rapport_id, filename, original_name, file_size, mime_type, file_data, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, rapport_id, filename, original_name, file_size, mime_type, uploaded_by, created_at`,
            [
                rapportId,
                `${Date.now()}-${file.originalname}`, // Unique filename
                file.originalname,
                file.size,
                file.mimetype,
                file.buffer, // File data as BYTEA
                req.user.id
            ]
        );
        
        // Update rapport to mark it has attachments
        await query(
            `UPDATE rapporte SET updated_at = NOW() WHERE id = $1`,
            [rapportId]
        );
        
        res.json({ 
            success: true,
            document: result.rows[0],
            message: 'Datei erfolgreich hochgeladen'
        });
    })
);

// Get list of documents for a rapport
router.get('/rapport/:rapportId/documents',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { rapportId } = req.params;
        
        // Check if user has access to this rapport
        const rapportCheck = await query(
            `SELECT id FROM rapporte 
             WHERE id = $1 AND (author_id = $2 OR status = 'genehmigt' OR $3 IN ('admin', 'super_admin'))`,
            [rapportId, req.user.id, req.user.role]
        );
        
        if (rapportCheck.rows.length === 0) {
            return res.status(403).json({ error: 'Kein Zugriff auf diesen Rapport' });
        }
        
        // Get document metadata (without file data)
        const result = await query(
            `SELECT id, rapport_id, filename, original_name, file_size, mime_type, 
                    uploaded_by, created_at 
             FROM documents 
             WHERE rapport_id = $1 
             ORDER BY created_at DESC`,
            [rapportId]
        );
        
        res.json({ documents: result.rows });
    })
);

// Download a specific document
router.get('/document/:documentId',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { documentId } = req.params;
        
        // Get document with rapport info to check access
        const result = await query(
            `SELECT d.*, r.author_id, r.status 
             FROM documents d
             JOIN rapporte r ON d.rapport_id = r.id
             WHERE d.id = $1`,
            [documentId]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dokument nicht gefunden' });
        }
        
        const document = result.rows[0];
        
        // Check access rights
        const hasAccess = 
            document.author_id === req.user.id ||
            document.status === 'genehmigt' ||
            req.user.role === 'admin' ||
            req.user.role === 'super_admin';
            
        if (!hasAccess) {
            return res.status(403).json({ error: 'Kein Zugriff auf dieses Dokument' });
        }
        
        // Set appropriate headers
        res.setHeader('Content-Type', document.mime_type);
        res.setHeader('Content-Disposition', `attachment; filename="${document.original_name}"`);
        res.setHeader('Content-Length', document.file_size);
        
        // Send file data
        res.send(document.file_data);
    })
);

// Delete a document
router.delete('/document/:documentId',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { documentId } = req.params;
        
        // Check if user owns the document or is admin
        const result = await query(
            `DELETE FROM documents 
             WHERE id = $1 AND (uploaded_by = $2 OR $3 IN ('admin', 'super_admin'))
             RETURNING id`,
            [documentId, req.user.id, req.user.role]
        );
        
        if (result.rows.length === 0) {
            return res.status(404).json({ error: 'Dokument nicht gefunden oder keine Berechtigung' });
        }
        
        res.json({ 
            success: true,
            message: 'Dokument erfolgreich gelöscht'
        });
    })
);

// Upload file for a Gesuch
router.post('/gesuch/:gesuchId',
    authenticateToken,
    upload.single('file'),
    asyncHandler(async (req, res) => {
        const { gesuchId } = req.params;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen' });
        }
        
        // Check if user has admin access
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Nur Administratoren können Gesuch-Dokumente hochladen' });
        }
        
        // Check if Gesuch exists
        const gesuchCheck = await query('SELECT id FROM gesuche WHERE id = $1', [gesuchId]);
        
        if (gesuchCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Gesuch nicht gefunden' });
        }
        
        // Save file to database
        const result = await query(
            `INSERT INTO documents (gesuch_id, filename, original_name, file_size, mime_type, file_data, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, gesuch_id, filename, original_name, file_size, mime_type, uploaded_by, created_at`,
            [
                gesuchId,
                `${Date.now()}-${file.originalname}`,
                file.originalname,
                file.size,
                file.mimetype,
                file.buffer,
                req.user.id
            ]
        );
        
        res.json({ 
            success: true,
            document: result.rows[0],
            message: 'Datei erfolgreich hochgeladen'
        });
    })
);

// Upload file for a Teilprojekt
router.post('/teilprojekt/:teilprojektId',
    authenticateToken,
    upload.single('file'),
    asyncHandler(async (req, res) => {
        const { teilprojektId } = req.params;
        const file = req.file;
        
        if (!file) {
            return res.status(400).json({ error: 'Keine Datei hochgeladen' });
        }
        
        // Check if user has admin access
        if (req.user.role !== 'admin' && req.user.role !== 'superadmin') {
            return res.status(403).json({ error: 'Nur Administratoren können Teilprojekt-Dokumente hochladen' });
        }
        
        // Check if Teilprojekt exists
        const tpCheck = await query('SELECT id FROM teilprojekte WHERE id = $1', [teilprojektId]);
        
        if (tpCheck.rows.length === 0) {
            return res.status(404).json({ error: 'Teilprojekt nicht gefunden' });
        }
        
        // Save file to database
        const result = await query(
            `INSERT INTO documents (teilprojekt_id, filename, original_name, file_size, mime_type, file_data, uploaded_by)
             VALUES ($1, $2, $3, $4, $5, $6, $7)
             RETURNING id, teilprojekt_id, filename, original_name, file_size, mime_type, uploaded_by, created_at`,
            [
                teilprojektId,
                `${Date.now()}-${file.originalname}`,
                file.originalname,
                file.size,
                file.mimetype,
                file.buffer,
                req.user.id
            ]
        );
        
        res.json({ 
            success: true,
            document: result.rows[0],
            message: 'Datei erfolgreich hochgeladen'
        });
    })
);

// Get documents for Gesuch
router.get('/gesuch/:gesuchId/documents',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { gesuchId } = req.params;
        
        const result = await query(
            `SELECT id, gesuch_id, filename, original_name, file_size, mime_type, 
                    uploaded_by, created_at 
             FROM documents 
             WHERE gesuch_id = $1 
             ORDER BY created_at DESC`,
            [gesuchId]
        );
        
        res.json({ documents: result.rows });
    })
);

// Get documents for Teilprojekt
router.get('/teilprojekt/:teilprojektId/documents',
    authenticateToken,
    asyncHandler(async (req, res) => {
        const { teilprojektId } = req.params;
        
        const result = await query(
            `SELECT id, teilprojekt_id, filename, original_name, file_size, mime_type, 
                    uploaded_by, created_at 
             FROM documents 
             WHERE teilprojekt_id = $1 
             ORDER BY created_at DESC`,
            [teilprojektId]
        );
        
        res.json({ documents: result.rows });
    })
);

module.exports = router;