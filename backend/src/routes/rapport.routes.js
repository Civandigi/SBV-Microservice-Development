// SBV Professional V2 - Rapport Routes
const express = require('express');
const RapportController = require('../controllers/rapport.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');
const { apiRateLimit } = require('../middleware/rateLimit.middleware');

const router = express.Router();

// All rapport routes require authentication
router.use(authenticateToken);

// Get all rapports with filtering and pagination
router.get('/', RapportController.getAllRapports);

// Get rapport statistics
router.get('/stats', RapportController.getRapportStats);

// Get all rapport requests (for admin view)
router.get('/all-requests', RapportController.getAllRequests);

// Create new rapport
router.post('/', RapportController.createRapport);

// Get single rapport by ID
router.get('/:id', RapportController.getRapportById);

// Update rapport
router.put('/:id', RapportController.updateRapport);

// Submit rapport for approval
router.post('/:id/submit', RapportController.submitRapport);

// Approve/Reject rapport (Admin only)
router.post('/:id/approve', requireRole(['admin', 'super_admin']), RapportController.approveRapport);

// Delete rapport (Users can delete drafts, Admins can delete any)
router.delete('/:id', RapportController.deleteRapport);

module.exports = router;