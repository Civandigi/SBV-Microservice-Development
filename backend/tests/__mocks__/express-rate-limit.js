// Mock for express-rate-limit
module.exports = jest.fn((config) => {
  // Return a middleware function
  return (req, res, next) => {
    // Simulate rate limit behavior for testing
    if (req.rateLimitTest) {
      // Allow test to control rate limit behavior
      if (req.rateLimitTest.exceeded) {
        req.rateLimit = {
          resetTime: new Date(Date.now() + 300000)
        };
        config.handler(req, res, next);
        return;
      }
    }
    // Normal flow - call next
    next();
  };
});