// Simple test to verify Jest is working
describe('Simple Test', () => {
  it('should pass basic arithmetic', () => {
    expect(2 + 2).toBe(4);
  });

  it('should handle async operations', async () => {
    const promise = Promise.resolve('success');
    await expect(promise).resolves.toBe('success');
  });
});