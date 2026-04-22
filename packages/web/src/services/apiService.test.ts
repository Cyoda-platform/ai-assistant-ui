import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';
import apiService from './apiService';

// Mock console to avoid noise
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('apiService', () => {
  const mockFetch = vi.fn();

  beforeEach(() => {
    global.fetch = mockFetch;
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('createFromChat', () => {
    it('should create entity from chat successfully', async () => {
      const mockResponse = {
        id: 'entity-123',
        type: 'entity',
        data: { name: 'Test Entity' },
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.createFromChat('chat-1', 'entity', 'app-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/chat/chat-1/create'),
        expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ type: 'entity', app_id: 'app-1' }),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should handle API errors', async () => {
      const mockError = {
        error: {
          code: 'NOT_FOUND',
          message: 'Chat not found',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(apiService.createFromChat('invalid', 'entity')).rejects.toEqual(
        mockError
      );
    });
  });

  describe('GET endpoints', () => {
    it('should get app config', async () => {
      const mockConfig = { appId: 'app-1', name: 'Test App' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockConfig,
      });

      const result = await apiService.getAppConfig('app-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/config'),
        expect.any(Object)
      );
      expect(result).toEqual(mockConfig);
    });

    it('should get entity detail', async () => {
      const mockEntity = { id: 'entity-1', name: 'Test Entity' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEntity,
      });

      const result = await apiService.getEntityDetail('app-1', 'entity-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/entities/entity-1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockEntity);
    });

    it('should get workflow detail', async () => {
      const mockWorkflow = { id: 'wf-1', name: 'Test Workflow' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockWorkflow,
      });

      const result = await apiService.getWorkflowDetail('app-1', 'wf-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/workflows/wf-1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockWorkflow);
    });

    it('should get environment detail', async () => {
      const mockEnv = { id: 'env-1', name: 'Test Environment' };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockEnv,
      });

      const result = await apiService.getEnvironmentDetail('app-1', 'env-1');

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/environments/env-1'),
        expect.any(Object)
      );
      expect(result).toEqual(mockEnv);
    });
  });

  describe('SAVE endpoints', () => {
    it('should save app config', async () => {
      const mockData = { name: 'Updated App' };
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.saveAppConfig('app-1', mockData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/config'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should save entity detail', async () => {
      const mockData = { name: 'Updated Entity' };
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.saveEntityDetail('app-1', 'entity-1', mockData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/entities/entity-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should save workflow detail', async () => {
      const mockData = { name: 'Updated Workflow' };
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.saveWorkflowDetail('app-1', 'wf-1', mockData);

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/workflows/wf-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });

    it('should save environment detail', async () => {
      const mockData = { name: 'Updated Environment' };
      const mockResponse = { success: true };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockResponse,
      });

      const result = await apiService.saveEnvironmentDetail(
        'app-1',
        'env-1',
        mockData
      );

      expect(mockFetch).toHaveBeenCalledWith(
        expect.stringContaining('/apps/app-1/environments/env-1'),
        expect.objectContaining({
          method: 'PUT',
          body: JSON.stringify(mockData),
        })
      );
      expect(result).toEqual(mockResponse);
    });
  });

  describe('error handling', () => {
    it('should handle network errors', async () => {
      mockFetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(apiService.getAppConfig('app-1')).rejects.toThrow(
        'Network error'
      );
    });

    it('should handle non-ok responses', async () => {
      const mockError = {
        error: {
          code: 'UNAUTHORIZED',
          message: 'Invalid credentials',
        },
      };

      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => mockError,
      });

      await expect(apiService.getAppConfig('app-1')).rejects.toEqual(mockError);
    });

  });
});
