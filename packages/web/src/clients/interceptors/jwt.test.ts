import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import type { AxiosInstance } from 'axios';
import jwtInterceptor from './jwt';
import { useAuthStore } from '../../stores/auth';
import HelperStorage from '../../helpers/HelperStorage';

// Shared storage for mocking
const sharedStorage = new Map();

// Mock dependencies
vi.mock('../../stores/auth', () => ({
  useAuthStore: {
    getState: vi.fn()
  }
}));

vi.mock('../../helpers/HelperStorage', () => {
  return {
    default: class {
      get(key: string) {
        return sharedStorage.get(key);
      }
      set(key: string, value: any) {
        sharedStorage.set(key, value);
      }
    }
  };
});

describe('jwt interceptor', () => {
  let axiosInstance: AxiosInstance;
  let helperStorage: HelperStorage;

  beforeEach(() => {
    vi.clearAllMocks();
    sharedStorage.clear();
    axiosInstance = axios.create();
    helperStorage = new HelperStorage();
  });

  describe('guest token endpoint', () => {
    it('should skip adding auth header for get_guest_token endpoint', async () => {
      const mockGetState = {
        token: null,
        getGuestToken: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      jwtInterceptor(axiosInstance);

      const config = {
        url: '/auth/get_guest_token',
        method: 'post',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];
      const result = await requestInterceptor.fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
      expect(mockGetState.getGuestToken).not.toHaveBeenCalled();
    });
  });

  describe('with existing token', () => {
    it('should add Authorization header when token exists in storage', async () => {
      const mockGetState = {
        token: 'existing-token',
        getGuestToken: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      // Set token in storage
      helperStorage.set('auth', { token: 'storage-token' });

      jwtInterceptor(axiosInstance);

      const config = {
        url: '/v1/test',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];
      const result = await requestInterceptor.fulfilled(config);

      expect(result.headers.Authorization).toBe('Bearer storage-token');
    });

    it('should use stored token over authStore token', async () => {
      const mockGetState = {
        token: 'store-token',
        getGuestToken: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      // Set different token in storage
      helperStorage.set('auth', { token: 'storage-token' });

      jwtInterceptor(axiosInstance);

      const config = {
        url: '/v1/test',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];
      const result = await requestInterceptor.fulfilled(config);

      // Should use storage token, not store token
      expect(result.headers.Authorization).toBe('Bearer storage-token');
    });
  });

  describe('without token', () => {
    it('should get guest token when no token exists', async () => {
      const mockGetGuestToken = vi.fn().mockResolvedValue('new-guest-token');
      const mockGetState = {
        token: null,
        getGuestToken: mockGetGuestToken
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      jwtInterceptor(axiosInstance);

      const config = {
        url: '/v1/test',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];

      // First request should trigger getGuestToken
      await requestInterceptor.fulfilled(config);

      expect(mockGetGuestToken).toHaveBeenCalledTimes(1);
    });

    it('should deduplicate concurrent requests for guest token', async () => {
      let resolveToken: (value: string) => void;
      const tokenPromise = new Promise<string>((resolve) => {
        resolveToken = resolve;
      });

      const mockGetGuestToken = vi.fn().mockReturnValue(tokenPromise);
      const mockGetState = {
        token: null,
        getGuestToken: mockGetGuestToken
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      jwtInterceptor(axiosInstance);

      const config1 = {
        url: '/v1/test1',
        method: 'get',
        headers: {} as any
      };

      const config2 = {
        url: '/v1/test2',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];

      // Start two concurrent requests
      const promise1 = requestInterceptor.fulfilled(config1);
      const promise2 = requestInterceptor.fulfilled(config2);

      // Resolve the token
      resolveToken!('guest-token');

      await Promise.all([promise1, promise2]);

      // Should only call getGuestToken once despite concurrent requests
      expect(mockGetGuestToken).toHaveBeenCalledTimes(1);
    });

    it('should handle guest token error', async () => {
      const mockGetGuestToken = vi.fn().mockRejectedValue(new Error('Failed to get token'));
      const mockGetState = {
        token: null,
        getGuestToken: mockGetGuestToken
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      jwtInterceptor(axiosInstance);

      const config = {
        url: '/v1/test',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];

      await expect(requestInterceptor.fulfilled(config)).rejects.toThrow('Failed to get token');
    });

    it('should retry getting guest token after error', async () => {
      const mockGetGuestToken = vi.fn()
        .mockRejectedValueOnce(new Error('First attempt failed'))
        .mockResolvedValueOnce('guest-token-second-attempt');

      const mockGetState = {
        token: null,
        getGuestToken: mockGetGuestToken
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      jwtInterceptor(axiosInstance);

      const config1 = {
        url: '/v1/test1',
        method: 'get',
        headers: {} as any
      };

      const config2 = {
        url: '/v1/test2',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];

      // First request fails
      await expect(requestInterceptor.fulfilled(config1)).rejects.toThrow();

      // Second request should retry and succeed
      await requestInterceptor.fulfilled(config2);

      expect(mockGetGuestToken).toHaveBeenCalledTimes(2);
    });
  });

  describe('no token in storage', () => {
    it('should not add Authorization header when no token in storage', async () => {
      const mockGetState = {
        token: 'store-token',
        getGuestToken: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      // Don't set any token in storage
      helperStorage.set('auth', null);

      jwtInterceptor(axiosInstance);

      const config = {
        url: '/v1/test',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];
      const result = await requestInterceptor.fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });

    it('should not add Authorization header when auth object has no token', async () => {
      const mockGetState = {
        token: 'store-token',
        getGuestToken: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      // Set auth object without token
      helperStorage.set('auth', { user: 'test' });

      jwtInterceptor(axiosInstance);

      const config = {
        url: '/v1/test',
        method: 'get',
        headers: {} as any
      };

      const requestInterceptor = (axiosInstance.interceptors.request as any).handlers[0];
      const result = await requestInterceptor.fulfilled(config);

      expect(result.headers.Authorization).toBeUndefined();
    });
  });
});
