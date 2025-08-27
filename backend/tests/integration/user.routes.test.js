// SBV Professional V2 - User Routes Integration Tests
const request = require('supertest');
const express = require('express');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { query } = require('../../src/config/database');
const userRoutes = require('../../src/routes/user.routes');
const { authenticateToken, requireRole } = require('../../src/middleware/auth.middleware');
const emailService = require('../../src/services/email.service');

// Mock dependencies
jest.mock('../../src/config/database');
jest.mock('../../src/services/email.service');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/users', authenticateToken, userRoutes);

// Helper function to create auth token
const createToken = (user) => {
  return jwt.sign(user, process.env.JWT_SECRET || 'test-secret');
};

describe('User Routes Integration Tests', () => {
  let adminToken, userToken, superadminToken;

  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    jest.clearAllMocks();

    // Create tokens for different roles
    adminToken = createToken({ id: 1, email: 'admin@test.com', role: 'admin' });
    userToken = createToken({ id: 2, email: 'user@test.com', role: 'user' });
    superadminToken = createToken({ id: 3, email: 'superadmin@test.com', role: 'superadmin' });
  });

  describe('GET /api/users/profile', () => {
    it('should get current user profile', async () => {
      query.mockResolvedValue({
        rows: [{
          id: 2,
          email: 'user@test.com',
          role: 'user',
          first_name: 'Test',
          last_name: 'User',
          created_at: '2025-01-01'
        }]
      });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        id: 2,
        email: 'user@test.com',
        role: 'user',
        first_name: 'Test',
        last_name: 'User'
      });
    });

    it('should return 404 if user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .get('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'User not found');
    });
  });

  describe('PUT /api/users/profile', () => {
    it('should update current user profile', async () => {
      query.mockResolvedValue({
        rows: [{
          id: 2,
          email: 'user@test.com',
          role: 'user',
          first_name: 'Updated',
          last_name: 'Name'
        }]
      });

      const response = await request(app)
        .put('/api/users/profile')
        .set('Authorization', `Bearer ${userToken}`)
        .send({
          first_name: 'Updated',
          last_name: 'Name'
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        first_name: 'Updated',
        last_name: 'Name'
      });
    });
  });

  describe('GET /api/users', () => {
    const mockUsers = [
      { id: 1, username: 'admin', email: 'admin@test.com', role: 'admin' },
      { id: 2, username: 'user', email: 'user@test.com', role: 'user' }
    ];

    it('should get all users for admin', async () => {
      query.mockResolvedValue({ rows: mockUsers });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
      expect(response.body.users[0]).not.toHaveProperty('password');
    });

    it('should get all users for superadmin', async () => {
      query.mockResolvedValue({ rows: mockUsers });

      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${superadminToken}`);

      expect(response.status).toBe(200);
      expect(response.body.users).toHaveLength(2);
    });

    it('should deny access for regular user', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${userToken}`);

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error');
    });
  });

  describe('POST /api/users', () => {
    it('should create new user as admin', async () => {
      query.mockResolvedValueOnce({ rows: [] }); // Check existing user
      query.mockResolvedValueOnce({
        rows: [{
          id: 10,
          username: 'newuser',
          email: 'new@test.com',
          role: 'user',
          is_active: true,
          created_at: new Date()
        }]
      });

      emailService.sendWelcomeEmail.mockResolvedValue();

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser',
          email: 'new@test.com',
          password: 'password123',
          role: 'user'
        });

      expect(response.status).toBe(201);
      expect(response.body.user).toMatchObject({
        username: 'newuser',
        email: 'new@test.com',
        role: 'user'
      });
      expect(emailService.sendWelcomeEmail).toHaveBeenCalled();
    });

    it('should reject if username already exists', async () => {
      query.mockResolvedValue({ rows: [{ id: 1 }] }); // User exists

      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'existing',
          email: 'new@test.com',
          password: 'password123',
          role: 'user'
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Benutzername oder E-Mail bereits vergeben');
    });

    it('should validate required fields', async () => {
      const response = await request(app)
        .post('/api/users')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'newuser'
          // Missing email, password, role
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Alle Pflichtfelder müssen ausgefüllt werden');
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update user as admin', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: 10 }] }); // User exists
      query.mockResolvedValueOnce({ rows: [] }); // Email not taken
      query.mockResolvedValueOnce({
        rows: [{
          id: 10,
          username: 'updated',
          email: 'updated@test.com',
          role: 'admin',
          is_active: true
        }]
      });

      const response = await request(app)
        .put('/api/users/10')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updated',
          email: 'updated@test.com',
          role: 'admin',
          is_active: true
        });

      expect(response.status).toBe(200);
      expect(response.body.user).toMatchObject({
        username: 'updated',
        email: 'updated@test.com',
        role: 'admin'
      });
    });

    it('should return 404 if user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .put('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          username: 'updated',
          email: 'updated@test.com',
          role: 'user',
          is_active: true
        });

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Benutzer nicht gefunden');
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should reset user password as admin', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: 10 }] }); // User exists
      query.mockResolvedValueOnce({ rows: [] }); // Update query

      const response = await request(app)
        .put('/api/users/10/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Passwort erfolgreich zurückgesetzt');
    });

    it('should validate password length', async () => {
      const response = await request(app)
        .put('/api/users/10/password')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          password: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Passwort muss mindestens 6 Zeichen lang sein');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as admin', async () => {
      query.mockResolvedValueOnce({ 
        rows: [{ username: 'deleteduser' }] 
      }); // User exists
      query.mockResolvedValueOnce({ rows: [] }); // Delete query

      const response = await request(app)
        .delete('/api/users/10')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Benutzer erfolgreich gelöscht');
      expect(response.body).toHaveProperty('username', 'deleteduser');
    });

    it('should prevent self-deletion', async () => {
      const response = await request(app)
        .delete('/api/users/1') // Admin's own ID
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Sie können sich nicht selbst löschen');
    });

    it('should return 404 if user not found', async () => {
      query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .delete('/api/users/999')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(response.status).toBe(404);
      expect(response.body).toHaveProperty('error', 'Benutzer nicht gefunden');
    });
  });
});