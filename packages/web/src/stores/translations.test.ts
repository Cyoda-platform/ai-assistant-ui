import { describe, it, expect, vi, beforeEach } from 'vitest';
import { useTranslationsStore } from './translations';
import publicClient from '@/clients/public';

// Mock publicClient
vi.mock('@/clients/public', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

describe('translationsStore', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('getLabelsConfig', () => {
    it('should fetch labels config', async () => {
      const mockData = { labels: { 'key1': 'value1' } };
      vi.mocked(publicClient.get).mockResolvedValue({ data: mockData });

      const { getLabelsConfig } = useTranslationsStore.getState();
      const result = await getLabelsConfig();

      expect(publicClient.get).toHaveBeenCalledWith('/v1/labels_config');
      expect(result).toEqual({ data: mockData });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Network error');
      vi.mocked(publicClient.get).mockRejectedValue(mockError);

      const { getLabelsConfig } = useTranslationsStore.getState();

      await expect(getLabelsConfig()).rejects.toThrow('Network error');
    });
  });

  describe('postLabelsConfigRefresh', () => {
    it('should refresh labels config', async () => {
      const mockResponse = { success: true };
      vi.mocked(publicClient.post).mockResolvedValue({ data: mockResponse });

      const { postLabelsConfigRefresh } = useTranslationsStore.getState();
      const result = await postLabelsConfigRefresh();

      expect(publicClient.post).toHaveBeenCalledWith('/v1/labels_config/refresh');
      expect(result).toEqual({ data: mockResponse });
    });

    it('should handle errors', async () => {
      const mockError = new Error('Server error');
      vi.mocked(publicClient.post).mockRejectedValue(mockError);

      const { postLabelsConfigRefresh } = useTranslationsStore.getState();

      await expect(postLabelsConfigRefresh()).rejects.toThrow('Server error');
    });
  });
});
