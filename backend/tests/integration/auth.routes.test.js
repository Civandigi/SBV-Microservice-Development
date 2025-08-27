// SBV Professional V2 - Auth Routes Integration Tests
const request = require('supertest');
const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { query } = require('../../src/config/database');
const authRoutes = require('../../src/routes/auth.routes');

// Mock database
jest.mock('../../src/config/database');

// Create Express app for testing
const app = express();
app.use(express.json());
app.use('/api/auth', authRoutes);

describe('Auth Routes Integration Tests', () => {
  beforeEach(() => {
    process.env.JWT_SECRET = 'test-secret';
    process.env.JWT_EXPIRES_IN = '24h';
    jest.clearAllMocks();
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'testuser',
          email: 'test@example.com',
          password: hashedPassword,
          role: 'user',
          is_active: true
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body).toHaveProperty('user');
      expect(response.body.user).toMatchObject({
        id: 1,
        username: 'testuser',
        email: 'test@example.com',
        role: 'user'
      });
      expect(response.body.user).not.toHaveProperty('password');
    });

    it('should reject login with invalid password', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'testuser',
          password: hashedPassword,
          is_active: true
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'wrongpassword'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject login for non-existent user', async () => {
      query.mockResolvedValue({ rows: [] });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Invalid credentials');
    });

    it('should reject login for inactive user', async () => {
      const hashedPassword = await bcrypt.hash('password123', 10);
      query.mockResolvedValue({
        rows: [{
          id: 1,
          username: 'testuser',
          password: hashedPassword,
          is_active: false
        }]
      });

      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'password123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Account is deactivated');
    });

    it('should require username and password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({});

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error', 'Username and password are required');
    });
  });

  describe('POST /api/auth/refresh', () => {
    it('should refresh token with valid token', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'user' };
      const token = jwt.sign(user, process.env.JWT_SECRET);

      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', `Bearer ${token}`);

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('token');
      expect(response.body.token).not.toBe(token); // New token
    });

    it('should reject refresh with invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh')
        .set('Authorization', 'Bearer invalid.token');

      expect(response.status).toBe(403);
      expect(response.body).toHaveProperty('error', 'Invalid token.');
    });

    it('should reject refresh without token', async () => {
      const response = await request(app)
        .post('/api/auth/refresh');

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Access denied. No token provided.');
    });
  });

  describe('POST /api/auth/logout', () => {
    it('should logout successfully', async () => {
      const response = await request(app)
        .post('/api/auth/logout');

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Logged out successfully');
    });
  });

  describe('POST /api/auth/change-password', () => {
    it('should change password with valid current password', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'user' };
      const token = jwt.sign(user, process.env.JWT_SECRET);
      const currentHashedPassword = await bcrypt.hash('oldpassword', 10);

      query.mockResolvedValueOnce({
        rows: [{ password: currentHashedPassword }]
      });
      query.mockResolvedValueOnce({ rows: [] }); // Update query

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty('message', 'Password changed successfully');
    });

    it('should reject password change with wrong current password', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'user' };
      const token = jwt.sign(user, process.env.JWT_SECRET);
      const currentHashedPassword = await bcrypt.hash('oldpassword', 10);

      query.mockResolvedValue({
        rows: [{ password: currentHashedPassword }]
      });

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'wrongpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
      expect(response.body).toHaveProperty('error', 'Current password is incorrect');
    });

    it('should require authentication for password change', async () => {
      const response = await request(app)
        .post('/api/auth/change-password')
        .send({
          currentPassword: 'oldpassword',
          newPassword: 'newpassword123'
        });

      expect(response.status).toBe(401);
    });

    it('should validate new password length', async () => {
      const user = { id: 1, email: 'test@example.com', role: 'user' };
      const token = jwt.sign(user, process.env.JWT_SECRET);

      const response = await request(app)
        .post('/api/auth/change-password')
        .set('Authorization', `Bearer ${token}`)
        .send({
          currentPassword: 'oldpassword',
          newPassword: '123' // Too short
        });

      expect(response.status).toBe(400);
      expect(response.body).toHaveProperty('error');
    });
  });
});