// SBV Professional V2 - Database Mock Helper
const { query } = require('../../src/config/database');

// Mock the database module
jest.mock('../../src/config/database');

// Helper class for mocking database responses
class DbMock {
  constructor() {
    this.reset();
  }

  reset() {
    query.mockReset();
    query.mockClear();
  }

  // Mock a successful query with results
  mockQuery(rows = []) {
    query.mockResolvedValueOnce({ rows });
  }

  // Mock multiple queries in sequence
  mockQueries(...rowsArray) {
    rowsArray.forEach(rows => {
      this.mockQuery(rows);
    });
  }

  // Mock a query error
  mockError(error = new Error('Database error')) {
    query.mockRejectedValueOnce(error);
  }

  // Mock user data
  mockUser(overrides = {}) {
    return {
      id: 1,
      username: 'testuser',
      email: 'test@example.com',
      role: 'user',
      is_active: true,
      created_at: new Date(),
      ...overrides
    };
  }

  // Mock rapport data
  mockRapport(overrides = {}) {
    return {
      id: 1,
      datum: '2025-01-30',
      titel: 'Test Rapport',
      beschreibung: 'Test Description',
      status: 'entwurf',
      author_id: 1,
      teilprojekt_id: 1,
      created_at: new Date(),
      ...overrides
    };
  }

  // Mock gesuch data
  mockGesuch(overrides = {}) {
    return {
      id: 1,
      jahr: 2025,
      titel: 'Test Gesuch',
      beschreibung: 'Test Description',
      status: 'entwurf',
      erstellt_von: 1,
      created_at: new Date(),
      ...overrides
    };
  }

  // Mock teilprojekt data
  mockTeilprojekt(overrides = {}) {
    return {
      id: 1,
      gesuch_id: 1,
      nummer: 1,
      name: 'Test Teilprojekt',
      beschreibung: 'Test Description',
      budget: 50000,
      status: 'offen',
      created_at: new Date(),
      ...overrides
    };
  }

  // Get the mocked query function
  getQuery() {
    return query;
  }
}

// Export a singleton instance
module.exports = new DbMock();