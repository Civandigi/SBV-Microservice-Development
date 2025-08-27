// SBV Professional V2 - Webhook Service Tests
const axios = require('axios');
const { query } = require('../../../src/config/database');
const webhookService = require('../../../src/services/webhook.service');

// Mock dependencies
jest.mock('axios');
jest.mock('../../../src/config/database');

describe('Webhook Service', () => {
  beforeEach(() => {
    // Mock environment variables
    process.env.ENABLE_WEBHOOKS = 'true';
    process.env.N8N_WEBHOOK_URL = 'https://n8n.test.com/webhook/sbv';
    process.env.N8N_WEBHOOK_SECRET = 'test-secret';

    // Clear mocks
    jest.clearAllMocks();
  });

  describe('triggerGesuchSubmitted', () => {
    it('should send webhook when gesuch is submitted', async () => {
      const gesuchId = 1;
      const userId = 10;
      
      // Mock database queries
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          jahr: 2025,
          titel: 'Test Gesuch',
          status: 'eingereicht',
          eingereicht_am: '2025-01-30T10:00:00Z'
        }]
      });
      
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nummer: 1,
          name: 'Teilprojekt 1',
          budget: 50000
        }]
      });

      query.mockResolvedValueOnce({
        rows: [{ username: 'testuser' }]
      });

      // Mock successful webhook call
      axios.post.mockResolvedValue({ 
        status: 200, 
        data: { success: true } 
      });

      const result = await webhookService.triggerGesuchSubmitted(gesuchId, userId);

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://n8n.test.com/webhook/sbv',
        expect.objectContaining({
          event: 'gesuch.submitted',
          timestamp: expect.any(String),
          data: expect.objectContaining({
            gesuch: expect.objectContaining({
              id: 1,
              jahr: 2025,
              titel: 'Test Gesuch'
            }),
            teilprojekte: expect.any(Array),
            submittedBy: 'testuser'
          })
        }),
        expect.objectContaining({
          headers: expect.objectContaining({
            'Content-Type': 'application/json',
            'X-SBV-Signature': expect.any(String)
          })
        })
      );
    });

    it('should return skipped when webhooks are disabled', async () => {
      process.env.ENABLE_WEBHOOKS = 'false';
      
      const result = await webhookService.triggerGesuchSubmitted(1, 1);
      
      expect(result.skipped).toBe(true);
      expect(axios.post).not.toHaveBeenCalled();
    });

    it('should handle webhook failures gracefully', async () => {
      query.mockResolvedValue({ rows: [{ id: 1 }] });
      axios.post.mockRejectedValue(new Error('Network error'));

      const result = await webhookService.triggerGesuchSubmitted(1, 1);

      expect(result.success).toBe(false);
      expect(result.error).toBe('Network error');
    });

    it('should log webhook attempts', async () => {
      query.mockResolvedValueOnce({ rows: [{ id: 1 }] });
      query.mockResolvedValueOnce({ rows: [] });
      query.mockResolvedValueOnce({ rows: [{ username: 'test' }] });
      query.mockResolvedValueOnce({ rows: [] }); // Log insert
      
      axios.post.mockResolvedValue({ status: 200 });

      await webhookService.triggerGesuchSubmitted(1, 1);

      // Check that log was created
      const logCall = query.mock.calls.find(call => 
        call[0].includes('INSERT INTO webhook_logs')
      );
      expect(logCall).toBeDefined();
    });
  });

  describe('triggerTeilprojektApproved', () => {
    it('should send webhook when teilprojekt is approved', async () => {
      const teilprojektId = 1;
      const userId = 10;

      // Mock database queries
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          nummer: 1,
          name: 'Test Teilprojekt',
          status: 'genehmigt',
          gesuch_id: 5
        }]
      });

      query.mockResolvedValueOnce({
        rows: [{ username: 'admin' }]
      });

      axios.post.mockResolvedValue({ status: 200 });

      const result = await webhookService.triggerTeilprojektApproved(teilprojektId, userId);

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://n8n.test.com/webhook/sbv',
        expect.objectContaining({
          event: 'teilprojekt.approved',
          data: expect.objectContaining({
            teilprojekt: expect.objectContaining({
              id: 1,
              name: 'Test Teilprojekt',
              status: 'genehmigt'
            }),
            approvedBy: 'admin'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('triggerRapportStatusChanged', () => {
    it('should send webhook when rapport status changes', async () => {
      const rapportId = 1;
      const newStatus = 'genehmigt';
      const userId = 10;

      // Mock database queries
      query.mockResolvedValueOnce({
        rows: [{
          id: 1,
          titel: 'Test Rapport',
          status: 'genehmigt',
          teilprojekt_id: 2
        }]
      });

      query.mockResolvedValueOnce({
        rows: [{ username: 'admin' }]
      });

      axios.post.mockResolvedValue({ status: 200 });

      const result = await webhookService.triggerRapportStatusChanged(rapportId, newStatus, userId);

      expect(result.success).toBe(true);
      expect(axios.post).toHaveBeenCalledWith(
        'https://n8n.test.com/webhook/sbv',
        expect.objectContaining({
          event: 'rapport.status_changed',
          data: expect.objectContaining({
            rapport: expect.objectContaining({
              id: 1,
              titel: 'Test Rapport',
              status: 'genehmigt'
            }),
            newStatus: 'genehmigt',
            changedBy: 'admin'
          })
        }),
        expect.any(Object)
      );
    });
  });

  describe('createSignature', () => {
    it('should create valid HMAC signature', () => {
      const payload = { test: 'data' };
      const signature = webhookService.createSignature(payload);

      expect(signature).toMatch(/^sha256=[a-f0-9]{64}$/);
    });
  });

  describe('isEnabled', () => {
    it('should return true when webhooks are enabled', () => {
      process.env.ENABLE_WEBHOOKS = 'true';
      expect(webhookService.isEnabled()).toBe(true);
    });

    it('should return false when webhooks are disabled', () => {
      process.env.ENABLE_WEBHOOKS = 'false';
      expect(webhookService.isEnabled()).toBe(false);
    });
  });
});