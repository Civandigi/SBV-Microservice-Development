# SBV Professional V2 - Test Suite

## Overview

This test suite provides comprehensive testing for the SBV Professional V2 backend application, ensuring code quality and reliability through unit and integration tests.

## Test Structure

```
backend/tests/
├── unit/                    # Unit tests for individual components
│   ├── middleware/         # Middleware unit tests
│   │   ├── auth.middleware.test.js
│   │   ├── error.middleware.test.js
│   │   └── rateLimit.middleware.test.js
│   └── services/           # Service unit tests
│       ├── email.service.test.js
│       └── webhook.service.test.js
├── integration/            # Integration tests for API routes
│   ├── auth.routes.test.js
│   ├── user.routes.test.js
│   ├── gesuch.routes.test.js
│   └── rapport.routes.test.js
├── helpers/                # Test utilities and mocks
│   └── db.mock.js         # Database mock helper
└── setup.js               # Jest test setup configuration
```

## Running Tests

### Run all tests
```bash
npm test
```

### Run tests with coverage
```bash
npm test -- --coverage
```

### Run tests in watch mode
```bash
npm run test:watch
```

### Run specific test file
```bash
npm test -- auth.middleware.test.js
```

### Run tests matching pattern
```bash
npm test -- --testNamePattern="should authenticate valid token"
```

## Coverage Requirements

The project maintains a minimum test coverage of 30%:
- Branches: 30%
- Functions: 30%
- Lines: 30%
- Statements: 30%

## Test Categories

### Unit Tests

Unit tests focus on testing individual components in isolation:

- **Middleware Tests**: Test authentication, error handling, and rate limiting
- **Service Tests**: Test email service, webhook service functionality
- **Utility Tests**: Test helper functions and utilities

### Integration Tests

Integration tests verify the complete request/response cycle:

- **Auth Routes**: Login, token refresh, password changes
- **User Routes**: User management, profile updates
- **Gesuch Routes**: Gesuch and Teilprojekt management
- **Rapport Routes**: Rapport CRUD operations and workflow

## Writing Tests

### Test Structure Example

```javascript
describe('Component Name', () => {
  beforeEach(() => {
    // Setup before each test
  });

  afterEach(() => {
    // Cleanup after each test
  });

  describe('method/feature', () => {
    it('should do something specific', async () => {
      // Arrange
      const input = { /* test data */ };
      
      // Act
      const result = await functionToTest(input);
      
      // Assert
      expect(result).toBe(expected);
    });
  });
});
```

### Mocking Guidelines

1. **Database Queries**: Use the `db.mock.js` helper
```javascript
const dbMock = require('../helpers/db.mock');

dbMock.mockQuery([{ id: 1, name: 'Test' }]);
```

2. **External Services**: Mock at the module level
```javascript
jest.mock('../../src/services/email.service');
```

3. **Environment Variables**: Set in test setup
```javascript
process.env.JWT_SECRET = 'test-secret';
```

## Best Practices

1. **Test Isolation**: Each test should be independent
2. **Clear Test Names**: Use descriptive test names that explain what is being tested
3. **AAA Pattern**: Arrange, Act, Assert structure for clarity
4. **Mock External Dependencies**: Don't make real API calls or database queries
5. **Test Edge Cases**: Include error scenarios and boundary conditions
6. **Keep Tests Simple**: One assertion per test when possible
7. **Use Test Helpers**: Leverage the db.mock.js helper for consistency

## Common Testing Patterns

### Testing Authenticated Routes
```javascript
const token = jwt.sign({ id: 1, role: 'admin' }, 'test-secret');

const response = await request(app)
  .get('/api/protected')
  .set('Authorization', `Bearer ${token}`);
```

### Testing Error Scenarios
```javascript
it('should return 404 when resource not found', async () => {
  dbMock.mockQuery([]); // Empty result
  
  const response = await request(app).get('/api/resource/999');
  
  expect(response.status).toBe(404);
  expect(response.body).toHaveProperty('error');
});
```

### Testing Async Operations
```javascript
it('should handle async operations', async () => {
  const mockData = dbMock.mockUser();
  dbMock.mockQuery([mockData]);
  
  const result = await userService.findById(1);
  
  expect(result).toEqual(mockData);
});
```

## Debugging Tests

### View detailed test output
```bash
npm test -- --verbose
```

### Debug specific test
```bash
node --inspect-brk node_modules/.bin/jest --runInBand path/to/test.js
```

### Check coverage gaps
```bash
npm test -- --coverage
# Then open coverage/lcov-report/index.html in browser
```

## CI/CD Integration

Tests are automatically run in the CI/CD pipeline. Ensure all tests pass before merging:

1. All tests must pass
2. Coverage thresholds must be met
3. No console errors or warnings

## Troubleshooting

### Common Issues

1. **Database connection errors**: Ensure database mocks are properly configured
2. **Token validation failures**: Check JWT_SECRET is set in test environment
3. **Async timeout**: Increase timeout for slow tests using `jest.setTimeout(10000)`
4. **Module not found**: Check import paths and mock configurations

### Getting Help

If you encounter issues:
1. Check existing test patterns in the codebase
2. Review Jest documentation
3. Ensure all dependencies are installed with `npm install`