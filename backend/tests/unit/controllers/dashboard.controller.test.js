// SBV Professional V2 - Dashboard Controller Tests

const DashboardController = require('../../../src/controllers/dashboard.controller');
const { query } = require('../../../src/config/database');

// Mock database
jest.mock('../../../src/config/database', () => ({
    query: jest.fn()
}));

describe('DashboardController', () => {
    let req, res;
    
    beforeEach(() => {
        // Reset mocks
        jest.clearAllMocks();
        
        // Mock request
        req = {
            user: {
                id: 1,
                role: 'user'
            },
            query: {}
        };
        
        // Mock response
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });
    
    describe('getStats', () => {
        it('should return stats for regular user', async () => {
            // Mock database responses
            query.mockImplementation((sql) => {
                if (sql.includes('rapporte')) {
                    return {
                        rows: [
                            { status: 'eingereicht', count: '2' },
                            { status: 'genehmigt', count: '1' }
                        ]
                    };
                }
                if (sql.includes('standalone_documents')) {
                    return { rows: [{ total: '5' }] };
                }
                if (sql.includes('gesuche')) {
                    return {
                        rows: [
                            { status: 'neu', count: '1' },
                            { status: 'in_bearbeitung', count: '2' }
                        ]
                    };
                }
                return { rows: [] };
            });
            
            await DashboardController.getStats(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                stats: {
                    rapporte: {
                        total: 3,
                        entwurf: 0,
                        eingereicht: 2,
                        in_bearbeitung: 0,
                        fertig: 0,
                        genehmigt: 1,
                        abgelehnt: 0
                    },
                    documents: {
                        total: 5
                    },
                    gesuche: {
                        total: 3,
                        neu: 1,
                        in_bearbeitung: 2,
                        genehmigt: 0,
                        abgelehnt: 0
                    }
                }
            });
        });
        
        it('should return stats with user count for admin', async () => {
            // Set admin role
            req.user.role = 'admin';
            
            // Mock database responses
            query.mockImplementation((sql) => {
                if (sql.includes('rapporte')) {
                    return {
                        rows: [
                            { status: 'eingereicht', count: '5' },
                            { status: 'genehmigt', count: '3' }
                        ]
                    };
                }
                if (sql.includes('standalone_documents')) {
                    return { rows: [{ total: '10' }] };
                }
                if (sql.includes('gesuche')) {
                    return { rows: [] };
                }
                if (sql.includes('users')) {
                    return { rows: [{ total: '15' }] };
                }
                return { rows: [] };
            });
            
            await DashboardController.getStats(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                stats: expect.objectContaining({
                    users: {
                        total: 15
                    }
                })
            });
        });
        
        it('should handle database errors', async () => {
            query.mockRejectedValue(new Error('Database error'));
            
            await DashboardController.getStats(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Fehler beim Laden der Dashboard-Statistiken'
            });
        });
    });
    
    describe('getRecentActivities', () => {
        it('should return recent activities for user', async () => {
            req.query.limit = '5';
            
            // Mock database responses
            query.mockImplementation((sql) => {
                if (sql.includes('rapporte')) {
                    return {
                        rows: [
                            {
                                type: 'rapport',
                                id: 1,
                                description: 'Test Rapport',
                                status: 'eingereicht',
                                date: '2025-01-20T10:00:00Z',
                                user_name: 'Test User'
                            }
                        ]
                    };
                }
                if (sql.includes('standalone_documents')) {
                    return {
                        rows: [
                            {
                                type: 'document',
                                id: 2,
                                description: 'Test Document',
                                status: 'hochgeladen',
                                date: '2025-01-20T09:00:00Z',
                                user_name: 'Test User'
                            }
                        ]
                    };
                }
                return { rows: [] };
            });
            
            await DashboardController.getRecentActivities(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                activities: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'rapport',
                        description: 'Test Rapport',
                        icon: 'rapport'
                    }),
                    expect.objectContaining({
                        type: 'document',
                        description: 'Test Document',
                        icon: 'document'
                    })
                ])
            });
        });
        
        it('should handle missing descriptions', async () => {
            query.mockImplementation((sql) => {
                if (sql.includes('rapporte')) {
                    return {
                        rows: [
                            {
                                type: 'rapport',
                                id: 1,
                                description: null,
                                status: 'eingereicht',
                                date: '2025-01-20T10:00:00Z',
                                user_name: 'Test User'
                            }
                        ]
                    };
                }
                return { rows: [] };
            });
            
            await DashboardController.getRecentActivities(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                activities: expect.arrayContaining([
                    expect.objectContaining({
                        description: 'Ohne Titel'
                    })
                ])
            });
        });
        
        it('should handle database errors', async () => {
            query.mockRejectedValue(new Error('Database error'));
            
            await DashboardController.getRecentActivities(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Fehler beim Laden der Aktivitäten'
            });
        });
    });
    
    describe('getNotifications', () => {
        it('should return urgent rapport notifications', async () => {
            query.mockImplementation((sql) => {
                if (sql.includes('kritisch')) {
                    return { rows: [{ count: '3' }] };
                }
                return { rows: [{ count: '0' }] };
            });
            
            await DashboardController.getNotifications(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                notifications: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'urgent',
                        title: '3 dringende Rapporte',
                        priority: 'critical',
                        icon: 'alert'
                    })
                ])
            });
        });
        
        it('should include pending approvals for admin', async () => {
            req.user.role = 'admin';
            
            query.mockImplementation((sql) => {
                if (sql.includes('kritisch')) {
                    return { rows: [{ count: '0' }] };
                }
                if (sql.includes('eingereicht') && !sql.includes('kritisch')) {
                    return { rows: [{ count: '5' }] };
                }
                return { rows: [{ count: '0' }] };
            });
            
            await DashboardController.getNotifications(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                notifications: expect.arrayContaining([
                    expect.objectContaining({
                        type: 'approval',
                        title: '5 Rapporte zur Genehmigung',
                        priority: 'high',
                        icon: 'clock'
                    })
                ])
            });
        });
        
        it('should handle database errors', async () => {
            query.mockRejectedValue(new Error('Database error'));
            
            await DashboardController.getNotifications(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Fehler beim Laden der Benachrichtigungen'
            });
        });
    });
});