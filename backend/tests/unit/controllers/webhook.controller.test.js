const WebhookController = require('../../../src/controllers/webhook.controller');
const crypto = require('crypto');

describe('WebhookController', () => {

    describe('validateSignature', () => {
        const secret = 'my-super-secret-webhook-secret';
        const payload = { event: 'test', data: 'some-data' };
        let originalEnv;

        beforeAll(() => {
            originalEnv = process.env;
            process.env.WEBHOOK_SECRET = secret;
        });

        afterAll(() => {
            process.env = originalEnv;
        });

        it('should return true for a valid signature', () => {
            const signature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            const isValid = WebhookController.validateSignature(payload, signature);
            expect(isValid).toBe(true);
        });

        it('should return false for an invalid signature', () => {
            const invalidSignature = 'invalid-signature';
            const isValid = WebhookController.validateSignature(payload, invalidSignature);
            expect(isValid).toBe(false);
        });

        it('should return false for a tampered payload', () => {
            const signature = crypto
                .createHmac('sha256', secret)
                .update(JSON.stringify(payload))
                .digest('hex');

            const tamperedPayload = { ...payload, data: 'tampered-data' };
            const isValid = WebhookController.validateSignature(tamperedPayload, signature);
            expect(isValid).toBe(false);
        });

        it('should return true if WEBHOOK_SECRET is not configured', () => {
            delete process.env.WEBHOOK_SECRET;
            const isValid = WebhookController.validateSignature(payload, 'any-signature');
            expect(isValid).toBe(true);
            process.env.WEBHOOK_SECRET = secret; // Restore for other tests
        });
    });
});
