import { describe, it, expect, beforeEach, vi } from 'vitest';
import { setTokenGetter, getToken } from './HelperAuth';

describe('HelperAuth', () => {
  beforeEach(() => {
    // Reset to default empty token getter
    setTokenGetter(async () => '');
  });

  describe('getToken', () => {
    it('should return empty string by default', async () => {
      const token = await getToken();
      expect(token).toBe('');
    });

    it('should return token from custom getter', async () => {
      const mockToken = 'test-token-123';
      setTokenGetter(async () => mockToken);

      const token = await getToken();
      expect(token).toBe(mockToken);
    });

    it('should pass options to token getter', async () => {
      const mockGetter = vi.fn(async () => 'token');
      setTokenGetter(mockGetter);

      await getToken({ cacheMode: 'off' });

      expect(mockGetter).toHaveBeenCalledWith({ cacheMode: 'off' });
    });

    it('should support cache mode "on"', async () => {
      const mockGetter = vi.fn(async () => 'cached-token');
      setTokenGetter(mockGetter);

      await getToken({ cacheMode: 'on' });

      expect(mockGetter).toHaveBeenCalledWith({ cacheMode: 'on' });
    });

    it('should work without options', async () => {
      const mockGetter = vi.fn(async () => 'token');
      setTokenGetter(mockGetter);

      await getToken();

      expect(mockGetter).toHaveBeenCalledWith(undefined);
    });

    it('should return a Promise', () => {
      const result = getToken();
      expect(result).toBeInstanceOf(Promise);
    });
  });

  describe('setTokenGetter', () => {
    it('should update the token getter function', async () => {
      const firstToken = 'first-token';
      const secondToken = 'second-token';

      setTokenGetter(async () => firstToken);
      expect(await getToken()).toBe(firstToken);

      setTokenGetter(async () => secondToken);
      expect(await getToken()).toBe(secondToken);
    });

    it('should allow complex token getter logic', async () => {
      let callCount = 0;
      setTokenGetter(async (options) => {
        callCount++;
        if (options?.cacheMode === 'off') {
          return `fresh-token-${callCount}`;
        }
        return `cached-token`;
      });

      const token1 = await getToken({ cacheMode: 'on' });
      expect(token1).toBe('cached-token');

      const token2 = await getToken({ cacheMode: 'off' });
      expect(token2).toBe('fresh-token-2');
    });

    it('should handle async token getter', async () => {
      setTokenGetter(async () => {
        await new Promise(resolve => setTimeout(resolve, 10));
        return 'delayed-token';
      });

      const token = await getToken();
      expect(token).toBe('delayed-token');
    });

    it('should handle token getter that returns different values', async () => {
      let counter = 0;
      setTokenGetter(async () => `token-${++counter}`);

      expect(await getToken()).toBe('token-1');
      expect(await getToken()).toBe('token-2');
      expect(await getToken()).toBe('token-3');
    });
  });

  describe('integration scenarios', () => {
    it('should support JWT token pattern', async () => {
      const mockJWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0.dozjgNryP4J3jVmNHl0w5N_XgL0n3I9PlFUP0THsR8U';
      setTokenGetter(async () => mockJWT);

      const token = await getToken();
      expect(token).toBe(mockJWT);
      expect(token).toMatch(/^eyJ/); // JWT starts with eyJ
    });

    it('should support Bearer token pattern', async () => {
      const bearerToken = 'Bearer abc123def456';
      setTokenGetter(async () => bearerToken);

      const token = await getToken();
      expect(token).toBe(bearerToken);
      expect(token).toContain('Bearer');
    });

    it('should handle empty token gracefully', async () => {
      setTokenGetter(async () => '');

      const token = await getToken();
      expect(token).toBe('');
      expect(token).toHaveLength(0);
    });

    it('should handle token getter errors', async () => {
      setTokenGetter(async () => {
        throw new Error('Token fetch failed');
      });

      await expect(getToken()).rejects.toThrow('Token fetch failed');
    });

    it('should maintain state across multiple calls', async () => {
      let tokenVersion = 1;
      setTokenGetter(async () => `v${tokenVersion}`);

      expect(await getToken()).toBe('v1');
      expect(await getToken()).toBe('v1');

      tokenVersion = 2;
      expect(await getToken()).toBe('v2');
    });

    it('should support conditional token refresh', async () => {
      let cachedToken = 'initial-token';
      let refreshCount = 0;

      setTokenGetter(async (options) => {
        if (options?.cacheMode === 'off') {
          refreshCount++;
          cachedToken = `refreshed-token-${refreshCount}`;
        }
        return cachedToken;
      });

      expect(await getToken({ cacheMode: 'on' })).toBe('initial-token');
      expect(await getToken({ cacheMode: 'on' })).toBe('initial-token');
      expect(refreshCount).toBe(0);

      expect(await getToken({ cacheMode: 'off' })).toBe('refreshed-token-1');
      expect(refreshCount).toBe(1);

      expect(await getToken({ cacheMode: 'on' })).toBe('refreshed-token-1');
      expect(refreshCount).toBe(1);
    });
  });
});
