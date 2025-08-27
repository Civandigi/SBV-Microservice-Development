// Gesuch Routes
const express = require('express');
const router = express.Router();
const { authenticateToken } = require('../middleware/auth.middleware');
const gesuchController = require('../controllers/gesuch.controller');
const multer = require('multer');

// File upload configuration
const storage = multer.memoryStorage();
const upload = multer({ 
    storage: storage,
    limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
}).single('gesuchFile');

// All routes need authentication
router.use(authenticateToken);

// Routes
router.post('/upload', upload, gesuchController.uploadGesuch);
router.put('/:gesuchId/teilprojekte', gesuchController.updateTeilprojekte);
router.post('/:gesuchId/create-rapporte', gesuchController.createRapporte);
router.get('/', gesuchController.getAllGesuche);
router.get('/:id', gesuchController.getGesuchDetails);

module.exports = router;