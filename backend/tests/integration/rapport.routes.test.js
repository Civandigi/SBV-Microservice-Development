// SBV Professional V2 - Updated Rapport Routes Integration Tests
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const { query } = require('../../src/config/database');
const rapportRoutes = require('../../src/routes/rapport.routes');
const { authenticateToken, requireRole } = require('../../src/middleware/auth.middleware');
const RapportController = require('../../src/controllers/rapport.controller');

// Mock middleware and controller
jest.mock('../../src/middleware/auth.middleware', () => ({
    authenticateToken: jest.fn((req, res, next) => {
        req.user = { id: 1, role: 'user' };
        next();
    }),
    requireRole: jest.fn(() => (req, res, next) => {
        if (req.user.role === 'admin' || req.user.role === 'super_admin') {
            next();
        } else {
            res.status(403).json({ success: false, message: 'Insufficient permissions' });
        }
    })
}));

jest.mock('../../src/controllers/rapport.controller', () => ({
    getAllRapports: jest.fn(),
    getRapportStats: jest.fn(),
    createRapport: jest.fn(),
    getRapportById: jest.fn(),
    updateRapport: jest.fn(),
    submitRapport: jest.fn(),
    approveRapport: jest.fn(),
    deleteRapport: jest.fn()
}));

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/rapporte', authenticateToken, rapportRoutes);

// Helper function to create auth token
const createToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret');
};

describe('Rapport Routes Integration Tests', () => {
  let adminToken, userToken;
  
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();
    
    adminToken = createToken({ id: 1, email: 'admin@test.com', role: 'admin' });
    userToken = createToken({ id: 2, email: 'user@test.com', role: 'user' });
  });

  describe('GET /api/rapporte', () => {
    it('should get user own rapporte', async () => {
      query.mockResolvedValue({
        rows: [{
          id: 1,
          datum: '2025-01-30',
          titel: 'Test Rapport',
          status: 'entwurf',
          author_id: 2,
          author_name: 'user',
          teilprojekt_name: 'Teilprojekt 1'
        }]
      });

      const response = await request(app)
        .get('/api/rapporte')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rapporte).toHaveLength(1);
      expect(response.body.rapporte[0]).toMatchObject({
        titel: 'Test Rapport',
        author_id: 2
      });
    });

    it('should get all rapporte for admin', async () => {
      query.mockResolvedValue({
        rows: [
          { id: 1, author_id: 1, titel: 'Admin Rapport' },
          { id: 2, author_id: 2, titel: 'User Rapport' }
        ]
      });

      const response = await request(app)
        .get('/api/rapporte')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rapporte).toHaveLength(2);
    });
  });

  describe('GET /api/rapporte/:id', () => {
    it('should get single rapport with details', async () => {
      query.mockResolvedValue({
        rows: [{
          id: 1,
          datum: '2025-01-30',
          titel: 'Test Rapport',
          beschreibung: 'Test Beschreibung',
          status: 'entwurf',
          author_id: 2,
          author_name: 'user',
          teilprojekt_id: 5,
          teilprojekt_name: 'Teilprojekt 1',
          gesuch_jahr: 2025
        }]
      });

      const response = await request(app)
        .get('/api/rapporte/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.rapport).toMatchObject({
        id: 1,
        titel: 'Test Rapport',
        teilprojekt_name: 'Teilprojekt 1'
      });
    });

    it('should return 404 for non-existent rapport', async () => {
      query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/rapporte/999')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Rapport not found');
    });
  });

  describe('POST /api/rapporte', () => {
    it('should create new rapport', async () => {
      query.mockResolvedValue({
        rows: [{
          id: 10,
          datum: '2025-01-30',
          titel: 'Neuer Rapport',
          beschreibung: 'Neue Beschreibung',
          status: 'entwurf',
          author_id: 2,
          teilprojekt_id: 5
        }]
      });

      const response = await request(app)
        .post('/api/rapporte')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          datum: '2025-01-30',
          titel: 'Neuer Rapport',
          beschreibung: 'Neue Beschreibung',
          teilprojekt_id: 5,
          arbeitszeit: 8.5,
          abteilung: 'IT',
          k_ziele_beitraege: 'Beitrag zu Zielen'
        });

      expect(response.status).toBe(201);
      expect(response.body.rapport).toMatchObject({
        titel: 'Neuer Rapport',
        status: 'entwurf',
        author_id: 2
      });
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/rapporte')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          titel: 'Incomplete Rapport'
          // Missing required fields
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('PUT /api/rapporte/:id', () => {
    it('should update own rapport as user', async () => {
      // First check ownership
      query.mockResolvedValueOnce({
        rows: [{ author_id: 2 }]
      });
      
      // Then update
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          titel: 'Updated Rapport',
          beschreibung: 'Updated Beschreibung',
          status: 'entwurf'
        }]
      });

      const response = await request(app)
        .put('/api/rapporte/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          titel: 'Updated Rapport',
          beschreibung: 'Updated Beschreibung'
        });

      expect(response.status).toBe(200);
      expect(response.body.rapport).toMatchObject({
        titel: 'Updated Rapport'
      });
    });

    it('should allow admin to update any rapport', async () => {
      query.mockResolvedValue({
        rows: [{
          id: 1,
          titel: 'Admin Updated',
          status: 'entwurf'
        }]
      });

      const response = await request(app)
        .put('/api/rapporte/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          titel: 'Admin Updated'
        });

      expect(response.status).toBe(200);
    });

    it('should prevent editing submitted rapport', async () => {
      query.mockResolvedValueOnce({
        rows: [{ author_id: 2 }]
      });
      
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'eingereicht'
        }]
      });

      const response = await request(app)
        .put('/api/rapporte/1')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          titel: 'Try to update'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot edit submitted rapport');
    });
  });

  describe('DELETE /api/rapporte/:id', () => {
    it('should delete own rapport as user', async () => {
      query.mockResolvedValueOnce({
        rows: [{ author_id: 2, status: 'entwurf' }]
      });
      
      query.mockResolvedValueOnce({
        rows: [{ id: 1 }]
      });

      const response = await request(app)
        .delete('/api/rapporte/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Rapport deleted successfully');
    });

    it('should prevent deleting submitted rapport', async () => {
      query.mockResolvedValue({
        rows: [{ author_id: 2, status: 'eingereicht' }]
      });

      const response = await request(app)
        .delete('/api/rapporte/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Cannot delete submitted rapport');
    });

    it('should deny deletion of other users rapport', async () => {
      query.mockResolvedValue({
        rows: [{ author_id: 999, status: 'entwurf' }]
      });

      const response = await request(app)
        .delete('/api/rapporte/1')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
    });
  });

  describe('PUT /api/rapporte/:id/status', () => {
    it('should submit rapport', async () => {
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'eingereicht'
        }]
      });
      
      webhookService.triggerRapportStatusChanged.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .put('/api/rapporte/1/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'eingereicht'
        });

      expect(response.status).toBe(200);
      expect(response.body.rapport).toMatchObject({
        status: 'eingereicht'
      });
      expect(webhookService.triggerRapportStatusChanged).toHaveBeenCalledWith(
        1, 'eingereicht', 2
      );
    });

    it('should approve rapport as admin', async () => {
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          status: 'genehmigt'
        }]
      });
      
      webhookService.triggerRapportStatusChanged.mockResolvedValue({
        success: true
      });

      const response = await request(app)
        .put('/api/rapporte/1/status')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          status: 'genehmigt',
          kommentar: 'Approved'
        });

      expect(response.status).toBe(200);
      expect(response.body.rapport).toMatchObject({
        status: 'genehmigt'
      });
    });

    it('should validate status transitions', async () => {
      const response = await request(app)
        .put('/api/rapporte/1/status')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          status: 'invalid-status'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('GET /api/rapporte/statistics', () => {
    it('should get user statistics', async () => {
      query.mockResolvedValue({
        rows: [{
          total_rapporte: 10,
          total_arbeitszeit: 85.5,
          rapporte_by_status: {
            entwurf: 2,
            eingereicht: 3,
            genehmigt: 5
          },
          avg_arbeitszeit_per_rapport: 8.55
        }]
      });

      const response = await request(app)
        .get('/api/rapporte/statistics')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.statistics).toMatchObject({
        total_rapporte: 10,
        total_arbeitszeit: 85.5
      });
    });
  });
});