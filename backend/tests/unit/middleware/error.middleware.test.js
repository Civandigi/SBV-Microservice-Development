// SBV Professional V2 - Error Middleware Tests
const { errorHandler, asyncHandler } = require('../../../src/middleware/error.middleware');

describe('Error Middleware', () => {
  let req, res, next;

  beforeEach(() => {
    req = {};
    res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn()
    };
    next = jest.fn();
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('errorHandler', () => {
    it('should handle validation error with 400 status', () => {
      const err = new Error('Validation failed');
      err.name = 'ValidationError';
      err.details = { field: 'email', message: 'Invalid email' };

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(400);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Validation failed',
        details: { field: 'email', message: 'Invalid email' }
      });
    });

    it('should handle unauthorized error with 401 status', () => {
      const err = new Error('Unauthorized access');
      err.name = 'UnauthorizedError';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(401);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Unauthorized access'
      });
    });

    it('should handle JWT errors with 403 status', () => {
      const err = new Error('jwt malformed');
      err.name = 'JsonWebTokenError';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Invalid token'
      });
    });

    it('should handle token expired error', () => {
      const err = new Error('jwt expired');
      err.name = 'TokenExpiredError';

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Token expired'
      });
    });

    it('should handle custom status code', () => {
      const err = new Error('Custom error');
      err.statusCode = 409;

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(409);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Custom error'
      });
    });

    it('should handle generic errors with 500 status', () => {
      const err = new Error('Internal error');

      errorHandler(err, req, res, next);

      expect(res.status).toHaveBeenCalledWith(500);
      expect(res.json).toHaveBeenCalledWith({
        error: 'Internal server error'
      });
    });

    it('should log errors in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const err = new Error('Dev error');
      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();

      errorHandler(err, req, res, next);

      expect(consoleSpy).toHaveBeenCalledWith('Error:', err);
      
      consoleSpy.mockRestore();
      process.env.NODE_ENV = originalEnv;
    });

    it('should include stack trace in development mode', () => {
      const originalEnv = process.env.NODE_ENV;
      process.env.NODE_ENV = 'development';
      
      const err = new Error('Dev error');
      err.stack = 'Error stack trace';

      errorHandler(err, req, res, next);

      expect(res.json).toHaveBeenCalledWith(
        expect.objectContaining({
          stack: 'Error stack trace'
        })
      );
      
      process.env.NODE_ENV = originalEnv;
    });
  });

  describe('asyncHandler', () => {
    it('should handle successful async function', async () => {
      const asyncFn = jest.fn().mockResolvedValue('success');
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).not.toHaveBeenCalled();
    });

    it('should catch async errors and pass to next', async () => {
      const error = new Error('Async error');
      const asyncFn = jest.fn().mockRejectedValue(error);
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req, res, next);

      expect(asyncFn).toHaveBeenCalledWith(req, res, next);
      expect(next).toHaveBeenCalledWith(error);
    });

    it('should preserve function context', async () => {
      const context = { value: 'test' };
      const asyncFn = jest.fn(function() {
        return Promise.resolve(this.value);
      });
      const wrapped = asyncHandler(asyncFn.bind(context));

      await wrapped(req, res, next);

      expect(asyncFn).toHaveBeenCalled();
    });

    it('should handle synchronous errors in async functions', async () => {
      const error = new Error('Sync error in async');
      const asyncFn = jest.fn(() => {
        throw error;
      });
      const wrapped = asyncHandler(asyncFn);

      await wrapped(req, res, next);

      expect(next).toHaveBeenCalledWith(error);
    });
  });
});