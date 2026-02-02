import { describe, it, expect, beforeEach, vi } from 'vitest';
import axios from 'axios';
import type { AxiosInstance, AxiosError } from 'axios';
import errorInterceptor from './error';
import HelperErrors from '../../helpers/HelperErrors';
import eventBus from '../../plugins/eventBus';
import { SHOW_LOGIN_POPUP } from '../../helpers/HelperConstants';

// Mock dependencies
vi.mock('../../helpers/HelperErrors', () => ({
  default: {
    handler: vi.fn()
  }
}));

vi.mock('../../plugins/eventBus', () => ({
  default: {
    $emit: vi.fn()
  }
}));

describe('error interceptor', () => {
  let axiosInstance: AxiosInstance;

  beforeEach(() => {
    vi.clearAllMocks();
    axiosInstance = axios.create();
  });

  describe('successful responses', () => {
    it('should pass through successful responses', async () => {
      errorInterceptor(axiosInstance);

      const mockResponse = { data: { message: 'success' }, status: 200, statusText: 'OK', headers: {}, config: {} as any };

      // Trigger the interceptor manually
      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];
      const result = await responseInterceptor.fulfilled(mockResponse);

      expect(result).toEqual(mockResponse);
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });
  });

  describe('connection errors', () => {
    it('should handle connection errors and call error handler', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          method: 'post'
        } as any,
        message: 'Network Error',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).toHaveBeenCalledWith(error);
    });

    it('should not show error for polling GET requests to chats', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats/123',
          method: 'get'
        } as any,
        message: 'Network Error',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });
  });

  describe('401 errors', () => {
    it('should skip 401 errors without showing error modal', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/test',
          method: 'get'
        } as any,
        response: {
          status: 401,
          data: {},
          statusText: 'Unauthorized',
          headers: {},
          config: {
            url: '/v1/test',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });
  });

  describe('chat endpoints', () => {
    it('should not show error modal for text-answers endpoint', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats/123/text-answers',
          method: 'post'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/chats/123/text-answers',
            method: 'post'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });

    it('should not show error modal for answers endpoint', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats/123/answers',
          method: 'post'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/chats/123/answers',
            method: 'post'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });

    it('should not show error modal for text-questions endpoint', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats/text-questions',
          method: 'post'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/chats/text-questions',
            method: 'post'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });

    it('should not show error modal for questions endpoint', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats/questions',
          method: 'post'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/chats/questions',
            method: 'post'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });
  });

  describe('task endpoints', () => {
    it('should not show error modal for task endpoints', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/tasks/123',
          method: 'get'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/tasks/123',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });
  });

  describe('app-config endpoint', () => {
    it('should not show error modal for 404 on app-config GET by-conversation', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/app-config/by-conversation/123',
          method: 'get'
        } as any,
        response: {
          status: 404,
          data: {},
          statusText: 'Not Found',
          headers: {},
          config: {
            url: '/v1/app-config/by-conversation/123',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });

    it('should show error modal for non-404 errors on app-config', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/app-config/by-conversation/123',
          method: 'get'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/app-config/by-conversation/123',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).toHaveBeenCalledWith(error);
    });
  });

  describe('logs endpoint', () => {
    it('should not show error modal for logs endpoints', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/logs/123',
          method: 'get'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/logs/123',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });
  });

  describe('chats/transfer endpoint', () => {
    it('should always show error modal for 403 on chats/transfer', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats/transfer',
          method: 'post'
        } as any,
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
          headers: {},
          config: {
            url: '/v1/chats/transfer',
            method: 'post'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).toHaveBeenCalledWith(error);
    });
  });

  describe('403/429 errors', () => {
    it('should show login popup for 403 errors', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/users/profile',
          method: 'get'
        } as any,
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
          headers: {},
          config: {
            url: '/v1/users/profile',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(eventBus.$emit).toHaveBeenCalledWith(SHOW_LOGIN_POPUP);
    });

    it('should show login popup for 429 errors', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/users/profile',
          method: 'get'
        } as any,
        response: {
          status: 429,
          data: {},
          statusText: 'Too Many Requests',
          headers: {},
          config: {
            url: '/v1/users/profile',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(eventBus.$emit).toHaveBeenCalledWith(SHOW_LOGIN_POPUP);
    });

    it('should show error modal instead of login popup for create chat with error message', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats',
          method: 'POST'
        } as any,
        response: {
          status: 403,
          data: {
            message: 'You have reached the maximum number of chats'
          },
          statusText: 'Forbidden',
          headers: {},
          config: {
            url: '/v1/chats',
            method: 'POST'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).toHaveBeenCalledWith(error);
      expect(eventBus.$emit).not.toHaveBeenCalledWith(SHOW_LOGIN_POPUP);
    });

    it('should show error modal for create chat with error field', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats',
          method: 'POST'
        } as any,
        response: {
          status: 403,
          data: {
            error: 'Chat limit exceeded'
          },
          statusText: 'Forbidden',
          headers: {},
          config: {
            url: '/v1/chats',
            method: 'POST'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).toHaveBeenCalledWith(error);
      expect(eventBus.$emit).not.toHaveBeenCalledWith(SHOW_LOGIN_POPUP);
    });

    it('should show login popup for create chat POST without error message', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats',
          method: 'POST'
        } as any,
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
          headers: {},
          config: {
            url: '/v1/chats',
            method: 'POST'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(eventBus.$emit).toHaveBeenCalledWith(SHOW_LOGIN_POPUP);
      expect(HelperErrors.handler).not.toHaveBeenCalled();
    });

    it('should show error modal for POST to /v1/chats/approve', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/chats/approve',
          method: 'POST'
        } as any,
        response: {
          status: 403,
          data: {},
          statusText: 'Forbidden',
          headers: {},
          config: {
            url: '/v1/chats/approve',
            method: 'POST'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(eventBus.$emit).toHaveBeenCalledWith(SHOW_LOGIN_POPUP);
    });
  });

  describe('other errors', () => {
    it('should show error modal for generic 500 errors', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/users/profile',
          method: 'get'
        } as any,
        response: {
          status: 500,
          data: {},
          statusText: 'Internal Server Error',
          headers: {},
          config: {
            url: '/v1/users/profile',
            method: 'get'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).toHaveBeenCalledWith(error);
    });

    it('should show error modal for 400 errors', async () => {
      errorInterceptor(axiosInstance);

      const error: Partial<AxiosError> = {
        config: {
          url: '/v1/users/profile',
          method: 'patch'
        } as any,
        response: {
          status: 400,
          data: {},
          statusText: 'Bad Request',
          headers: {},
          config: {
            url: '/v1/users/profile',
            method: 'patch'
          } as any
        },
        message: 'Request failed',
        name: 'AxiosError'
      };

      const responseInterceptor = (axiosInstance.interceptors.response as any).handlers[0];

      await expect(responseInterceptor.rejected(error)).rejects.toThrow();
      expect(HelperErrors.handler).toHaveBeenCalledWith(error);
    });
  });
});
