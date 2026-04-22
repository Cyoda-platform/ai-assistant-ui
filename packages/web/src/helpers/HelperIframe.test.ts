import { describe, it, expect, beforeEach } from 'vitest';

describe('HelperIframe', () => {
  describe('isInIframe', () => {
    beforeEach(() => {
      // Reset the module to get fresh evaluation
      vi.resetModules();
    });

    it('should detect when not in iframe (normal window)', async () => {
      // In test environment, window.self === window.top by default
      const { isInIframe } = await import('./HelperIframe');

      expect(isInIframe).toBe(false);
      expect(window.self).toBe(window.top);
    });

    it('should be a boolean value', async () => {
      const { isInIframe } = await import('./HelperIframe');

      expect(typeof isInIframe).toBe('boolean');
    });

    it('should be defined', async () => {
      const { isInIframe } = await import('./HelperIframe');

      expect(isInIframe).toBeDefined();
    });

    // Note: Testing isInIframe === true is difficult without an actual iframe context
    // In a real browser with iframe, window.self !== window.top would be true
    // This is tested in integration/E2E tests
  });
});
