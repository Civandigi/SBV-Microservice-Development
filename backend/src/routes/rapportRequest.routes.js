// SBV Professional V2 - Rapport Request Routes
const express = require('express');
const RapportRequestController = require('../controllers/rapportRequest.controller');
const { authenticateToken, requireRole } = require('../middleware/auth.middleware');

const router = express.Router();

// All request routes require authentication
router.use(authenticateToken);

// Create new rapport request (Admin only)
router.post('/request', requireRole(['admin', 'super_admin']), RapportRequestController.createRequest);

// Get requests for current user
router.get('/requested', RapportRequestController.getUserRequests);

// Get all requests (Admin only)
router.get('/all-requests', requireRole(['admin', 'super_admin']), RapportRequestController.getAllRequests);

// Fulfill a request
router.post('/fulfill-request/:requestId', RapportRequestController.fulfillRequest);

module.exports = router;