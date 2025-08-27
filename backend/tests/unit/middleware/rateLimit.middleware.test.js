// SBV Professional V2 - Rate Limit Middleware Tests
const { rateLimitMiddleware, loginRateLimit, uploadRateLimit, customRateLimit } = require('../../../src/middleware/rateLimit.middleware');

// Mock config
jest.mock('../../../src/config', () => ({
  server: { isDevelopment: false },
  rateLimit: {
    skipInDevelopment: false,
    general: { windowMs: 900000, max: 2 }, // Low for testing
    login: { windowMs: 900000, max: 2 },
    upload: { windowMs: 3600000, max: 2 }
  }
}));

describe('Rate Limit Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {
      ip: '127.0.0.1',
      connection: { remoteAddress: '127.0.0.1' }
    };
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn(),
      set: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('rateLimitMiddleware', () => {
    it('should allow first request', () => {
      rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalled();
      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '2',
          'X-RateLimit-Remaining': '1'
        })
      );
    });

    it('should allow second request', () => {
      // First request
      rateLimitMiddleware(req, res, next);
      
      // Second request
      rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.set).toHaveBeenLastCalledWith(
        expect.objectContaining({
          'X-RateLimit-Remaining': '0'
        })
      );
    });

    it('should block third request', () => {
      // First two requests
      rateLimitMiddleware(req, res, next);
      rateLimitMiddleware(req, res, next);
      
      // Third request should be blocked
      rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(2); // Only first two
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Zu viele Anfragen',
        message: expect.stringContaining('Sie haben das Anfrage-Limit erreicht'),
        retryAfter: expect.any(Number)
      });
    });

    it('should track different IPs separately', () => {
      // First IP
      rateLimitMiddleware(req, res, next);
      rateLimitMiddleware(req, res, next);
      
      // Different IP
      req.ip = '192.168.1.1';
      rateLimitMiddleware(req, res, next);

      expect(next).toHaveBeenCalledTimes(3); // All should pass
    });

    it('should skip in development mode when configured', () => {
      const config = require('../../../src/config');
      config.server.isDevelopment = true;
      config.rateLimit.skipInDevelopment = true;

      // Should allow unlimited requests
      for (let i = 0; i < 10; i++) {
        rateLimitMiddleware(req, res, next);
      }

      expect(next).toHaveBeenCalledTimes(10);
      expect(res.status).not.toHaveBeenCalled();
    });
  });

  describe('loginRateLimit', () => {
    it('should have stricter limits for login', () => {
      // First two requests should pass
      loginRateLimit(req, res, next);
      loginRateLimit(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);

      // Third should be blocked
      loginRateLimit(req, res, next);

      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Zu viele Anmeldeversuche',
        message: expect.stringContaining('Sie haben zu viele Anmeldeversuche unternommen'),
        retryAfter: expect.any(Number)
      });
    });
  });

  describe('uploadRateLimit', () => {
    it('should use user ID when authenticated', () => {
      req.user = { id: 123 };

      uploadRateLimit(req, res, next);
      uploadRateLimit(req, res, next);

      expect(next).toHaveBeenCalledTimes(2);

      // Different user should have separate limit
      req.user = { id: 456 };
      uploadRateLimit(req, res, next);

      expect(next).toHaveBeenCalledTimes(3);
    });

    it('should fall back to IP when not authenticated', () => {
      delete req.user;

      uploadRateLimit(req, res, next);
      uploadRateLimit(req, res, next);
      uploadRateLimit(req, res, next); // Should be blocked

      expect(next).toHaveBeenCalledTimes(2);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Upload-Limit erreicht',
        message: expect.stringContaining('Sie haben das Upload-Limit erreicht'),
        retryAfter: expect.any(Number)
      });
    });
  });

  describe('customRateLimit', () => {
    it('should create custom rate limiter with options', () => {
      const customLimiter = customRateLimit({
        windowMs: 60000,
        max: 1,
        message: 'Custom limit reached',
        keyGenerator: (req) => req.user?.id || req.ip
      });

      customLimiter(req, res, next);
      expect(next).toHaveBeenCalledTimes(1);

      customLimiter(req, res, next);
      expect(res.status).toHaveBeenCalledWith(429);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Rate Limit erreicht',
        message: 'Custom limit reached',
        retryAfter: expect.any(Number)
      });
    });

    it('should use default values when no options provided', () => {
      const customLimiter = customRateLimit();

      customLimiter(req, res, next);
      expect(next).toHaveBeenCalled();
    });
  });

  describe('Rate limit headers', () => {
    it('should set correct rate limit headers', () => {
      rateLimitMiddleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith(
        expect.objectContaining({
          'X-RateLimit-Limit': '2',
          'X-RateLimit-Remaining': '1',
          'X-RateLimit-Reset': expect.stringMatching(/^\d{4}-\d{2}-\d{2}T/)
        })
      );
    });

    it('should set Retry-After header when rate limited', () => {
      // Exhaust limit
      rateLimitMiddleware(req, res, next);
      rateLimitMiddleware(req, res, next);
      
      // Clear previous calls
      res.set.mockClear();
      
      // This should be rate limited
      rateLimitMiddleware(req, res, next);

      expect(res.set).toHaveBeenCalledWith('Retry-After', expect.any(String));
    });
  });
});