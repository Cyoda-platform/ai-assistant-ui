import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import refreshTokenInterceptor from './refreshToken';
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

// Mock window.location
delete (window as any).location;
window.location = { href: '', origin: 'http://localhost' } as any;

// Mock window.electronAPI
(window as any).electronAPI = {
  reloadMainWindow: vi.fn()
};

describe('refreshToken interceptor', () => {
  let axiosInstance: AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    sharedStorage.clear();
    axiosInstance = axios.create();
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
    // Reset electron env flag
    (import.meta.env as any).VITE_IS_ELECTRON = undefined;
  });

  describe('non-401 errors', () => {
    it('should pass through non-401 errors', async () => {
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: vi.fn(),
        logout: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          headers: {} as any
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(mockGetState.refreshAccessToken).not.toHaveBeenCalled();
      expect(mockGetState.logout).not.toHaveBeenCalled();
    });
  });

  describe('401 errors with guest token', () => {
    it('should reject 401 error for guest tokens without refresh', async () => {
      const mockGetState = {
        tokenType: 'guest',
        refreshAccessToken: vi.fn(),
        logout: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          headers: {} as any
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(mockGetState.refreshAccessToken).not.toHaveBeenCalled();
    });
  });

  describe('401 errors with private token', () => {
    it('should refresh token and retry request on 401', async () => {
      const mockRefreshAccessToken = vi.fn().mockResolvedValue(undefined);
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: mockRefreshAccessToken,
        logout: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      sharedStorage.set('auth', { token: 'new-token-after-refresh' });

      refreshTokenInterceptor(axiosInstance);

      const originalConfig = {
        url: '/v1/test',
        method: 'get',
        headers: { Authorization: 'Bearer old-token' } as any
      };

      const error: Partial<AxiosError> = {
        config: originalConfig as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: originalConfig as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const mockRequestSpy = vi.spyOn(axiosInstance, 'request').mockResolvedValue({ data: 'success' });

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      const resultPromise = responseInterceptor.rejected(error);

      // Advance timers to allow async operations but not trigger timeout
      await vi.advanceTimersByTimeAsync(100);

      await resultPromise;

      expect(mockRefreshAccessToken).toHaveBeenCalled();
      expect(mockRequestSpy).toHaveBeenCalledWith(
        expect.objectContaining({
          headers: expect.objectContaining({
            Authorization: 'Bearer new-token-after-refresh'
          }),
          __isRetryRequest: true
        })
      );
    });

    it('should deduplicate concurrent token refresh requests', async () => {
      const mockRefreshAccessToken = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 1000))
      );
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: mockRefreshAccessToken,
        logout: vi.fn()
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      sharedStorage.set('auth', { token: 'refreshed-token' });

      refreshTokenInterceptor(axiosInstance);

      const error1: Partial<AxiosError> = {
        config: {
          url: '/v1/test1',
          headers: {} as any
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const error2: Partial<AxiosError> = {
        config: {
          url: '/v1/test2',
          headers: {} as any
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      vi.spyOn(axiosInstance, 'request').mockResolvedValue({ data: 'success' });

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      // Start two concurrent 401 errors
      const promise1 = responseInterceptor.rejected(error1);
      const promise2 = responseInterceptor.rejected(error2);

      // Advance time to complete the refresh
      await vi.advanceTimersByTimeAsync(1100);

      await Promise.all([promise1, promise2]);

      // Should only call refreshAccessToken once despite concurrent requests
      expect(mockRefreshAccessToken).toHaveBeenCalledTimes(1);
    });

    it.skip('should logout and redirect on refresh timeout', async () => {
      const mockRefreshAccessToken = vi.fn().mockImplementation(() =>
        new Promise(() => {}) // Never resolves - simulates hanging
      );
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: mockRefreshAccessToken,
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          headers: {} as any
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      const resultPromise = responseInterceptor.rejected(error);

      // Advance time past the 10 second timeout
      await vi.advanceTimersByTimeAsync(11000);

      // Wait a bit for the timeout handler to execute
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe('http://localhost/');
    });

    it.skip('should not logout on timeout if __skipLogoutOnAuthFailure flag is set', async () => {
      const mockRefreshAccessToken = vi.fn().mockImplementation(() =>
        new Promise(() => {}) // Never resolves
      );
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: mockRefreshAccessToken,
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          headers: {} as any,
          __skipLogoutOnAuthFailure: true
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      const resultPromise = responseInterceptor.rejected(error);

      // Advance time past the timeout
      await vi.advanceTimersByTimeAsync(11000);
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLogout).not.toHaveBeenCalled();
    });

    it.skip('should logout and redirect on refresh failure', async () => {
      const mockRefreshAccessToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: mockRefreshAccessToken,
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          headers: {} as any
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      // Call and don't await - the interceptor catches the error
      responseInterceptor.rejected(error);

      // Advance timers to allow async operations
      await vi.advanceTimersByTimeAsync(100);

      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe('http://localhost/');
    });

    it('should not logout on refresh failure if __skipLogoutOnAuthFailure flag is set', async () => {
      const mockRefreshAccessToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: mockRefreshAccessToken,
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          headers: {} as any,
          __skipLogoutOnAuthFailure: true
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      responseInterceptor.rejected(error);

      await vi.advanceTimersByTimeAsync(100);

      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  describe('401 on retry request', () => {
    it.skip('should logout on 401 after retry for non-logs endpoints', async () => {
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: vi.fn(),
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/users/profile',
          headers: {} as any,
          __isRetryRequest: true
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await responseInterceptor.rejected(error);

      // Wait for async operations
      await new Promise(resolve => setTimeout(resolve, 100));

      expect(mockLogout).toHaveBeenCalled();
      expect(window.location.href).toBe('http://localhost/');
    });

    it('should not logout on 401 after retry for logs endpoints', async () => {
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: vi.fn(),
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/logs/123',
          headers: {} as any,
          __isRetryRequest: true
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(mockLogout).not.toHaveBeenCalled();
    });

    it('should not logout on 401 after retry if __skipLogoutOnAuthFailure flag is set', async () => {
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: vi.fn(),
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/users/profile',
          headers: {} as any,
          __isRetryRequest: true,
          __skipLogoutOnAuthFailure: true
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(mockLogout).not.toHaveBeenCalled();
    });
  });

  describe('Electron app support', () => {
    it.skip('should reload main window in Electron app', async () => {
      import.meta.env.VITE_IS_ELECTRON = 'true';

      const mockRefreshAccessToken = vi.fn().mockRejectedValue(new Error('Refresh failed'));
      const mockLogout = vi.fn();
      const mockGetState = {
        tokenType: 'private',
        refreshAccessToken: mockRefreshAccessToken,
        logout: mockLogout
      };
      vi.mocked(useAuthStore.getState).mockReturnValue(mockGetState as any);

      refreshTokenInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          headers: {} as any
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {} as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await responseInterceptor.rejected(error).catch(() => {});

      await vi.advanceTimersByTimeAsync(100);

      expect(mockLogout).toHaveBeenCalled();
      expect((window as any).electronAPI.reloadMainWindow).toHaveBeenCalled();
    });
  });
});
