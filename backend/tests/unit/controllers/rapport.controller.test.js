// SBV Professional V2 - Rapport Controller Tests

const RapportController = require('../../../src/controllers/rapport.controller');
const { query } = require('../../../src/config/database');

// Mock database
jest.mock('../../../src/config/database', () => ({
    query: jest.fn()
}));

describe('RapportController', () => {
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
            query: {},
            params: {},
            body: {}
        };
        
        // Mock response
        res = {
            json: jest.fn(),
            status: jest.fn().mockReturnThis()
        };
    });
    
    describe('getAllRapports', () => {
        it('should return rapports for regular user', async () => {
            req.query = { filter: 'all', page: '1', limit: '20' };
            
            // Mock single database response - controller only does 1 query
            query.mockResolvedValueOnce([
                {
                    id: 1,
                    titel: 'Test Rapport',
                    beschreibung: 'Test content',
                    status: 'entwurf',
                    author_id: 1,
                    author_name: 'Test User',
                    author_email: 'test@example.com',
                    created_at: '2025-01-20T10:00:00Z',
                    updated_at: '2025-01-20T10:00:00Z',
                    priority: 'normal',
                    category: 'test'
                }
            ]);
            
            await RapportController.getAllRapports(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                rapports: expect.arrayContaining([
                    expect.objectContaining({
                        id: 1,
                        title: 'Test Rapport',
                        content: 'Test content',
                        status: 'entwurf'
                    })
                ]),
                pagination: expect.objectContaining({
                    page: 1,
                    limit: 10,
                    total: 1,
                    totalPages: 1,
                    hasNext: false,
                    hasPrev: false
                })
            });
        });
        
        it('should filter rapports by status for admin', async () => {
            req.user.role = 'admin';
            
            query.mockResolvedValueOnce([
                {
                    id: 2,
                    titel: 'Submitted Rapport',
                    beschreibung: 'Test admin rapport',
                    status: 'eingereicht',
                    author_id: 2,
                    author_name: 'Another User',
                    author_email: 'admin@example.com',
                    created_at: '2025-01-20T11:00:00Z',
                    updated_at: '2025-01-20T11:00:00Z',
                    priority: 'normal',
                    category: 'admin'
                }
            ]);
            
            await RapportController.getAllRapports(req, res);
            
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining("SELECT r.id, r.titel as title"),
                []
            );
        });
        
        it('should handle search functionality', async () => {
            req.query = { search: 'test', page: '1', limit: '20' };
            
            query.mockResolvedValueOnce({ rows: [] })
                  .mockResolvedValueOnce({ rows: [{ total: '0' }] });
            
            await RapportController.getAllRapports(req, res);
            
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('ILIKE'),
                expect.arrayContaining(['%test%'])
            );
        });
        
        it('should handle database errors', async () => {
            query.mockRejectedValue(new Error('Database error'));
            
            await RapportController.getAllRapports(req, res);
            
            expect(res.status).toHaveBeenCalledWith(500);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Fehler beim Laden der Rapporte'
            });
        });
    });
    
    describe('getRapportById', () => {
        it('should return rapport for authorized user', async () => {
            req.params.id = '1';
            
            query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        title: 'Test Rapport',
                        author_id: 1,
                        status: 'entwurf'
                    }
                ]
            });
            
            await RapportController.getRapportById(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                rapport: expect.objectContaining({
                    id: 1,
                    title: 'Test Rapport'
                })
            });
        });
        
        it('should return 404 for non-existent rapport', async () => {
            req.params.id = '999';
            
            query.mockResolvedValue({ rows: [] });
            
            await RapportController.getRapportById(req, res);
            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Rapport nicht gefunden oder keine Berechtigung'
            });
        });
    });
    
    describe('createRapport', () => {
        it('should create new rapport successfully', async () => {
            req.body = {
                title: 'New Rapport',
                content: 'Rapport content',
                category: 'monthly'
            };
            
            query.mockResolvedValue({
                rows: [
                    {
                        id: 2,
                        title: 'New Rapport',
                        content: 'Rapport content',
                        author_id: 1,
                        status: 'entwurf'
                    }
                ]
            });
            
            await RapportController.createRapport(req, res);
            
            expect(res.status).toHaveBeenCalledWith(201);
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                rapport: expect.objectContaining({
                    title: 'New Rapport',
                    status: 'entwurf'
                }),
                message: 'Rapport erfolgreich erstellt'
            });
        });
        
        it('should validate required fields', async () => {
            req.body = { category: 'monthly' }; // Missing title and content
            
            await RapportController.createRapport(req, res);
            
            expect(res.status).toHaveBeenCalledWith(400);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Titel und Inhalt sind erforderlich'
            });
        });
    });
    
    describe('updateRapport', () => {
        it('should update rapport for authorized user', async () => {
            req.params.id = '1';
            req.body = {
                title: 'Updated Rapport',
                content: 'Updated content',
                category: 'monthly'
            };
            
            query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        title: 'Updated Rapport',
                        content: 'Updated content',
                        status: 'entwurf'
                    }
                ]
            });
            
            await RapportController.updateRapport(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                rapport: expect.objectContaining({
                    title: 'Updated Rapport'
                }),
                message: 'Rapport erfolgreich aktualisiert'
            });
        });
        
        it('should allow admin to change status', async () => {
            req.user.role = 'admin';
            req.params.id = '1';
            req.body = {
                title: 'Rapport',
                content: 'Content',
                category: 'monthly',
                status: 'genehmigt',
                priority: 'normal'
            };
            
            query.mockResolvedValue({
                rows: [{ id: 1, status: 'genehmigt' }]
            });
            
            await RapportController.updateRapport(req, res);
            
            expect(query).toHaveBeenCalledWith(
                expect.stringContaining('status = $4'),
                expect.arrayContaining(['genehmigt'])
            );
        });
    });
    
    describe('submitRapport', () => {
        it('should submit rapport for approval', async () => {
            req.params.id = '1';
            
            query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        title: 'Test Rapport',
                        status: 'eingereicht'
                    }
                ]
            });
            
            await RapportController.submitRapport(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                rapport: expect.objectContaining({
                    status: 'eingereicht'
                }),
                message: 'Rapport erfolgreich eingereicht'
            });
        });
        
        it('should reject submission of non-draft rapport', async () => {
            req.params.id = '1';
            
            query.mockResolvedValue({ rows: [] });
            
            await RapportController.submitRapport(req, res);
            
            expect(res.status).toHaveBeenCalledWith(404);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Rapport nicht gefunden oder bereits eingereicht'
            });
        });
    });
    
    describe('approveRapport', () => {
        it('should allow admin to approve rapport', async () => {
            req.user.role = 'admin';
            req.params.id = '1';
            req.body = { action: 'approve' };
            
            query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        title: 'Test Rapport',
                        status: 'genehmigt'
                    }
                ]
            });
            
            await RapportController.approveRapport(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                rapport: expect.objectContaining({
                    status: 'genehmigt'
                }),
                message: 'Rapport erfolgreich genehmigt'
            });
        });
        
        it('should reject approval from non-admin user', async () => {
            req.params.id = '1';
            req.body = { action: 'approve' };
            
            await RapportController.approveRapport(req, res);
            
            expect(res.status).toHaveBeenCalledWith(403);
            expect(res.json).toHaveBeenCalledWith({
                success: false,
                message: 'Keine Berechtigung für diese Aktion'
            });
        });
    });
    
    describe('deleteRapport', () => {
        it('should allow admin to delete rapport', async () => {
            req.user.role = 'admin';
            req.params.id = '1';
            
            query.mockResolvedValue({
                rows: [
                    {
                        id: 1,
                        title: 'Test Rapport'
                    }
                ]
            });
            
            await RapportController.deleteRapport(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                message: 'Rapport "Test Rapport" erfolgreich gelöscht'
            });
        });
        
        it('should reject deletion from non-admin user', async () => {
            req.params.id = '1';
            
            await RapportController.deleteRapport(req, res);
            
            expect(res.status).toHaveBeenCalledWith(403);
        });
    });
    
    describe('getRapportStats', () => {
        it('should return user statistics for regular user', async () => {
            query.mockResolvedValue({
                rows: [
                    { status: 'entwurf', count: '2' },
                    { status: 'eingereicht', count: '1' },
                    { status: 'genehmigt', count: '3' }
                ]
            });
            
            await RapportController.getRapportStats(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                stats: {
                    total: 6,
                    entwurf: 2,
                    eingereicht: 1,
                    in_bearbeitung: 0,
                    fertig: 0,
                    genehmigt: 3,
                    abgelehnt: 0
                }
            });
        });
        
        it('should return all statistics for admin', async () => {
            req.user.role = 'admin';
            
            query.mockResolvedValue({
                rows: [
                    { status: 'entwurf', count: '5' },
                    { status: 'genehmigt', count: '10' }
                ]
            });
            
            await RapportController.getRapportStats(req, res);
            
            expect(res.json).toHaveBeenCalledWith({
                success: true,
                stats: expect.objectContaining({
                    total: 15,
                    entwurf: 5,
                    genehmigt: 10
                })
            });
        });
    });
});