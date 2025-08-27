// SBV Professional V2 - Email Service Tests
const nodemailer = require('nodemailer');
const emailService = require('../../../src/services/email.service');

// Mock nodemailer
jest.mock('nodemailer');

describe('Email Service', () => {
  let mockTransporter;
  let mockSendMail;

  beforeEach(() => {
    // Mock environment variables
    process.env.ENABLE_EMAIL_NOTIFICATIONS = 'true';
    process.env.SMTP_HOST = 'smtp.test.com';
    process.env.SMTP_PORT = '587';
    process.env.SMTP_USER = 'test@example.com';
    process.env.SMTP_PASS = 'testpass';
    process.env.EMAIL_FROM = 'SBV Test <noreply@test.com>';
    process.env.APP_URL = 'http://localhost:3000';

    // Create mock transporter
    mockSendMail = jest.fn().mockResolvedValue({ messageId: 'test-id' });
    mockTransporter = {
      sendMail: mockSendMail
    };
    nodemailer.createTransport.mockReturnValue(mockTransporter);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('sendWelcomeEmail', () => {
    it('should send welcome email with correct parameters', async () => {
      const user = {
        email: 'newuser@test.com',
        username: 'testuser'
      };

      await emailService.sendWelcomeEmail(user);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'SBV Test <noreply@test.com>',
        to: 'newuser@test.com',
        subject: 'Willkommen bei SBV Professional',
        html: expect.stringContaining('Willkommen bei SBV Professional'),
        html: expect.stringContaining('testuser')
      });
    });

    it('should not send email if notifications are disabled', async () => {
      process.env.ENABLE_EMAIL_NOTIFICATIONS = 'false';
      
      const user = {
        email: 'newuser@test.com',
        username: 'testuser'
      };

      await emailService.sendWelcomeEmail(user);

      expect(mockSendMail).not.toHaveBeenCalled();
    });

    it('should handle email sending errors gracefully', async () => {
      mockSendMail.mockRejectedValue(new Error('SMTP error'));
      
      const user = {
        email: 'newuser@test.com',
        username: 'testuser'
      };

      // Should not throw
      await expect(emailService.sendWelcomeEmail(user)).resolves.not.toThrow();
    });
  });

  describe('sendPasswordResetEmail', () => {
    it('should send password reset email with new password', async () => {
      const user = {
        email: 'user@test.com',
        username: 'testuser'
      };
      const newPassword = 'TempPass123!';

      await emailService.sendPasswordResetEmail(user, newPassword);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'SBV Test <noreply@test.com>',
        to: 'user@test.com',
        subject: 'Ihr Passwort wurde zurückgesetzt',
        html: expect.stringContaining('Passwort wurde zurückgesetzt'),
        html: expect.stringContaining(newPassword)
      });
    });
  });

  describe('sendGesuchSubmittedEmail', () => {
    it('should send gesuch submission email to multiple recipients', async () => {
      const gesuch = {
        id: 1,
        jahr: 2025,
        titel: 'Test Gesuch',
        anzahl_teilprojekte: 3
      };
      const recipients = ['admin1@test.com', 'admin2@test.com'];

      await emailService.sendGesuchSubmittedEmail(gesuch, recipients);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'SBV Test <noreply@test.com>',
        to: recipients,
        subject: 'Neues Gesuch eingereicht: Test Gesuch (2025)',
        html: expect.stringContaining('Test Gesuch'),
        html: expect.stringContaining('2025'),
        html: expect.stringContaining('3 Teilprojekte')
      });
    });
  });

  describe('sendRapportNotification', () => {
    it('should send rapport notification email', async () => {
      const rapport = {
        id: 1,
        titel: 'Test Rapport',
        status: 'eingereicht'
      };
      const recipients = ['admin@test.com'];
      const action = 'eingereicht';

      await emailService.sendRapportNotification(rapport, recipients, action);

      expect(mockSendMail).toHaveBeenCalledWith({
        from: 'SBV Test <noreply@test.com>',
        to: recipients,
        subject: 'Rapport eingereicht: Test Rapport',
        html: expect.stringContaining('Test Rapport'),
        html: expect.stringContaining('eingereicht')
      });
    });

    it('should use different subject for approved rapport', async () => {
      const rapport = {
        id: 1,
        titel: 'Test Rapport',
        status: 'genehmigt'
      };
      const recipients = ['user@test.com'];
      const action = 'genehmigt';

      await emailService.sendRapportNotification(rapport, recipients, action);

      expect(mockSendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          subject: 'Rapport genehmigt: Test Rapport'
        })
      );
    });
  });

  describe('isEnabled', () => {
    it('should return true when email notifications are enabled', () => {
      process.env.ENABLE_EMAIL_NOTIFICATIONS = 'true';
      expect(emailService.isEnabled()).toBe(true);
    });

    it('should return false when email notifications are disabled', () => {
      process.env.ENABLE_EMAIL_NOTIFICATIONS = 'false';
      expect(emailService.isEnabled()).toBe(false);
    });
  });
});