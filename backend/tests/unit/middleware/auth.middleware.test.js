// SBV Professional V2 - Auth Middleware Tests
const jwt = require('jsonwebtoken');
const { authenticateToken, requireRole } = require('../../../src/middleware/auth.middleware');
const { query } = require('../../../src/config/database');

// Mock the JWT module and database
jest.mock('jsonwebtoken');
jest.mock('../../../src/config/database');

describe('Auth Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      headers: {}
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('authenticateToken', () => {
    it('should return 401 if no token is provided', async () => {
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Zugriff verweigert',
        message: 'Kein Token bereitgestellt'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token format is invalid', async () => {
      req.headers.authorization = 'InvalidToken';
      
      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Zugriff verweigert',
        message: 'Kein Token bereitgestellt'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 if token is invalid', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';
      jwt.verify.mockImplementation(() => {
        throw new Error('JsonWebTokenError');
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Authentifizierungsfehler',
        message: 'Unerwarteter Fehler bei der Authentifizierung'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should return 401 for JsonWebTokenError', async () => {
      req.headers.authorization = 'Bearer invalid.token.here';
      const error = new Error('Invalid token');
      error.name = 'JsonWebTokenError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Ungültiger Token',
        message: 'Token ist nicht gültig'
      });
    });

    it('should return 401 for TokenExpiredError', async () => {
      req.headers.authorization = 'Bearer expired.token.here';
      const error = new Error('Token expired');
      error.name = 'TokenExpiredError';
      jwt.verify.mockImplementation(() => {
        throw error;
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Token abgelaufen',
        message: 'Bitte melden Sie sich erneut an'
      });
    });

    it('should return 401 if user not found in database', async () => {
      req.headers.authorization = 'Bearer valid.token.here';
      jwt.verify.mockReturnValue({ userId: 999 });
      query.mockResolvedValue({ rows: [] });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Ungültiger Token',
        message: 'Benutzer nicht gefunden'
      });
    });

    it('should return 401 if user is inactive', async () => {
      req.headers.authorization = 'Bearer valid.token.here';
      jwt.verify.mockReturnValue({ userId: 1 });
      query.mockResolvedValue({ 
        rows: [{
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          is_active: false
        }]
      });

      await authenticateToken(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Konto deaktiviert',
        message: 'Ihr Konto wurde deaktiviert'
      });
    });

    it('should call next if token is valid and user is active', async () => {
      req.headers.authorization = 'Bearer valid.token.here';
      jwt.verify.mockReturnValue({ userId: 1 });
      query.mockResolvedValue({ 
        rows: [{
          id: 1,
          email: 'test@example.com',
          name: 'Test User',
          role: 'user',
          is_active: true
        }]
      });

      await authenticateToken(req, res, next);

      expect(req.user).toEqual({
        id: 1,
        email: 'test@example.com',
        name: 'Test User',
        role: 'user'
      });
      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('requireRole', () => {
    beforeEach(() => {
      req.user = { id: 1, email: 'test@example.com', role: 'user' };
    });

    it('should return 401 if user is not set', () => {
      delete req.user;
      const middleware = requireRole(['admin']);
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Nicht authentifiziert',
        message: 'Benutzer ist nicht angemeldet'
      });
    });

    it('should return 403 if user role is not in allowed roles', () => {
      const middleware = requireRole(['admin', 'superadmin']);
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({ 
        error: 'Nicht autorisiert',
        message: 'Unzureichende Berechtigung für diese Aktion'
      });
      expect(next).not.toHaveBeenCalled();
    });

    it('should call next if user role is in allowed roles', () => {
      const middleware = requireRole(['user', 'admin']);
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should handle single role as string', () => {
      const middleware = requireRole('user');
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });

    it('should block admin from user routes', () => {
      req.user.role = 'admin';
      const middleware = requireRole('superadmin');
      
      middleware(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(next).not.toHaveBeenCalled();
    });

    it('should allow exact role match', () => {
      req.user.role = 'superadmin';
      const middleware = requireRole(['superadmin']);
      
      middleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.status).not.toHaveBeenCalled();
    });
  });
});