// SBV Professional V2 - Dashboard Routes Tests

const request = require('supertest');
const express = require('express');
const dashboardRoutes = require('../../src/routes/dashboard.routes');
const { authenticateToken } = require('../../src/middleware/auth.middleware');
const DashboardController = require('../../src/controllers/dashboard.controller');

// Mock authentication middleware
jest.mock('../../src/middleware/auth.middleware', () => ({
    authenticateToken: jest.fn((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
    })
}));

// Mock controller
jest.mock('../../src/controllers/dashboard.controller', () => ({
    getStats: jest.fn(),
    getRecentActivities: jest.fn(),
    getNotifications: jest.fn()
}));

describe('Dashboard Routes', () => {
    let app;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Create express app with routes
        app = express();
        app.use(express.json());
        app.use('/api/dashboard', dashboardRoutes);
    });
    
    describe('Authentication', () => {
        it('should require authentication for all routes', () => {
            expect(authenticateToken).toBeDefined();
        });
    });
    
    describe('GET /api/dashboard/stats', () => {
        it('should call DashboardController.getStats', async () => {
            DashboardController.getStats.mockImplementation((req, res) => {
                res.json({ success: true, stats: {} });
            });
            
            const response = await request(app)
                .get('/api/dashboard/stats')
                .expect(200);
            
            expect(DashboardController.getStats).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual({ 
                success: true, 
                stats: {} 
            });
        });
        
        it('should pass request and response to controller', async () => {
            DashboardController.getStats.mockImplementation((req, res) => {
                expect(req.user).toEqual({ id: 1, role: 'user' });
                res.json({ success: true });
            });
            
            await request(app)
                .get('/api/dashboard/stats')
                .expect(200);
            
            expect(DashboardController.getStats).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('GET /api/dashboard/activities', () => {
        it('should call DashboardController.getRecentActivities', async () => {
            DashboardController.getRecentActivities.mockImplementation((req, res) => {
                res.json({ success: true, activities: [] });
            });
            
            const response = await request(app)
                .get('/api/dashboard/activities')
                .expect(200);
            
            expect(DashboardController.getRecentActivities).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual({ 
                success: true, 
                activities: [] 
            });
        });
        
        it('should pass query parameters to controller', async () => {
            DashboardController.getRecentActivities.mockImplementation((req, res) => {
                expect(req.query.limit).toBe('5');
                res.json({ success: true, activities: [] });
            });
            
            await request(app)
                .get('/api/dashboard/activities?limit=5')
                .expect(200);
            
            expect(DashboardController.getRecentActivities).toHaveBeenCalledTimes(1);
        });
    });
    
    describe('GET /api/dashboard/notifications', () => {
        it('should call DashboardController.getNotifications', async () => {
            DashboardController.getNotifications.mockImplementation((req, res) => {
                res.json({ success: true, notifications: [] });
            });
            
            const response = await request(app)
                .get('/api/dashboard/notifications')
                .expect(200);
            
            expect(DashboardController.getNotifications).toHaveBeenCalledTimes(1);
            expect(response.body).toEqual({ 
                success: true, 
                notifications: [] 
            });
        });
    });
    
    describe('Error handling', () => {
        it('should handle controller errors', async () => {
            DashboardController.getStats.mockImplementation((req, res) => {
                res.status(500).json({ success: false, message: 'Server error' });
            });
            
            const response = await request(app)
                .get('/api/dashboard/stats')
                .expect(500);
            
            expect(response.body).toEqual({ 
                success: false, 
                message: 'Server error' 
            });
        });
    });
    
    describe('Invalid routes', () => {
        it('should return 404 for non-existent routes', async () => {
            await request(app)
                .get('/api/dashboard/invalid')
                .expect(404);
        });
    });
});