// SBV Professional V2 - Dashboard Routes

const express = require('express');
const router = express.Router();
const DashboardController = require('../controllers/dashboard.controller');
const { authenticateToken } = require('../middleware/auth.middleware');

// All dashboard routes require authentication
router.use(authenticateToken);

// Dashboard endpoints
router.get('/stats', DashboardController.getStats);
router.get('/activities', DashboardController.getRecentActivities);
router.get('/notifications', DashboardController.getNotifications);

module.exports = router;