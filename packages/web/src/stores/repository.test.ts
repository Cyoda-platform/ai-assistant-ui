import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useRepositoryStore } from './repository';
import githubAppDataService from '@/services/githubAppDataService';
import type { AppRoot } from '@/components/AppsCanvas/types/appSchema';
import type { GitHubRepositoryInfo } from '@/services/githubAppDataService';

// Mock dependencies
vi.mock('@/services/githubAppDataService', () => ({
  default: {
    convertGitHubToAppRoot: vi.fn(),
  },
}));

// Mock localStorage for zustand persist
const localStorageMock = (() => {
  let store: Record<string, string> = {};

  return {
    getItem: (key: string) => store[key] || null,
    setItem: (key: string, value: string) => {
      store[key] = value;
    },
    removeItem: (key: string) => {
      delete store[key];
    },
    clear: () => {
      store = {};
    },
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('repositoryStore', () => {
  const mockRepoInfo: GitHubRepositoryInfo = {
    owner: 'test-owner',
    repositoryName: 'test-repo',
    branch: 'main',
  };

  const mockAppData: AppRoot = {
    entities: [],
    workflows: [],
    environments: [],
    rootPath: '/',
  } as AppRoot;

  beforeEach(() => {
    // Reset store
    useRepositoryStore.setState({
      cache: {},
      loading: {},
      error: {},
      pendingRequests: {},
    });
    vi.clearAllMocks();
    localStorageMock.clear();
  });

  describe('initial state', () => {
    it('should initialize with empty cache', () => {
      const { cache } = useRepositoryStore.getState();
      expect(cache).toEqual({});
    });

    it('should initialize with empty loading state', () => {
      const { loading } = useRepositoryStore.getState();
      expect(loading).toEqual({});
    });

    it('should initialize with empty error state', () => {
      const { error } = useRepositoryStore.getState();
      expect(error).toEqual({});
    });

    it('should initialize with empty pending requests', () => {
      const { pendingRequests } = useRepositoryStore.getState();
      expect(pendingRequests).toEqual({});
    });
  });

  describe('loadRepository', () => {
    it('should load repository data successfully', async () => {
      vi.mocked(githubAppDataService.convertGitHubToAppRoot).mockResolvedValue(mockAppData);

      const { loadRepository } = useRepositoryStore.getState();
      const result = await loadRepository('conversation-1', mockRepoInfo);

      expect(githubAppDataService.convertGitHubToAppRoot).toHaveBeenCalledWith(
        mockRepoInfo,
        'conversation-1'
      );
      expect(result).toEqual(mockAppData);

      const { cache, loading } = useRepositoryStore.getState();
      expect(cache['conversation-1']).toBeDefined();
      expect(cache['conversation-1'].data).toEqual(mockAppData);
      expect(cache['conversation-1'].repositoryInfo).toEqual(mockRepoInfo);
      expect(loading['conversation-1']).toBe(false);
    });

    it('should set loading state during request', async () => {
      let resolvePromise: (value: AppRoot) => void;
      const promise = new Promise<AppRoot>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(githubAppDataService.convertGitHubToAppRoot).mockReturnValue(promise);

      const { loadRepository } = useRepositoryStore.getState();
      const loadPromise = loadRepository('conversation-1', mockRepoInfo);

      // Check loading state is true
      expect(useRepositoryStore.getState().loading['conversation-1']).toBe(true);

      // Resolve the promise
      resolvePromise!(mockAppData);
      await loadPromise;

      // Check loading state is false after completion
      expect(useRepositoryStore.getState().loading['conversation-1']).toBe(false);
    });

    it('should handle errors during load', async () => {
      const mockError = new Error('Network error');
      vi.mocked(githubAppDataService.convertGitHubToAppRoot).mockRejectedValue(mockError);

      const { loadRepository } = useRepositoryStore.getState();
      const result = await loadRepository('conversation-1', mockRepoInfo);

      expect(result).toBeNull();

      const { error, loading } = useRepositoryStore.getState();
      expect(error['conversation-1']).toBe('Network error');
      expect(loading['conversation-1']).toBe(false);
    });

    it('should deduplicate concurrent requests for same conversation', async () => {
      let resolvePromise: (value: AppRoot) => void;
      const promise = new Promise<AppRoot>((resolve) => {
        resolvePromise = resolve;
      });
      vi.mocked(githubAppDataService.convertGitHubToAppRoot).mockReturnValue(promise);

      const { loadRepository } = useRepositoryStore.getState();

      // Start two concurrent requests
      const request1 = loadRepository('conversation-1', mockRepoInfo);
      const request2 = loadRepository('conversation-1', mockRepoInfo);

      // Should only call the service once
      expect(githubAppDataService.convertGitHubToAppRoot).toHaveBeenCalledTimes(1);

      // Resolve the promise
      resolvePromise!(mockAppData);

      const [result1, result2] = await Promise.all([request1, request2]);
      expect(result1).toEqual(mockAppData);
      expect(result2).toEqual(mockAppData);
    });

    it('should clear pending request after completion', async () => {
      vi.mocked(githubAppDataService.convertGitHubToAppRoot).mockResolvedValue(mockAppData);

      const { loadRepository } = useRepositoryStore.getState();
      await loadRepository('conversation-1', mockRepoInfo);

      const { pendingRequests } = useRepositoryStore.getState();
      expect(pendingRequests['conversation-1']).toBeUndefined();
    });
  });

  describe('updateLocalData', () => {
    it('should update cached data', () => {
      // Setup initial cache
      useRepositoryStore.setState({
        cache: {
          'conversation-1': {
            data: mockAppData,
            repositoryInfo: mockRepoInfo,
            lastUpdated: '2024-01-01T00:00:00.000Z',
          },
        },
      });

      const updatedAppData = { ...mockAppData, rootPath: '/updated' } as AppRoot;
      const { updateLocalData } = useRepositoryStore.getState();
      updateLocalData('conversation-1', updatedAppData);

      const { cache } = useRepositoryStore.getState();
      expect(cache['conversation-1'].data).toEqual(updatedAppData);
      expect(cache['conversation-1'].repositoryInfo).toEqual(mockRepoInfo);
    });

    it('should update lastUpdated timestamp', () => {
      const oldTimestamp = '2024-01-01T00:00:00.000Z';
      useRepositoryStore.setState({
        cache: {
          'conversation-1': {
            data: mockAppData,
            repositoryInfo: mockRepoInfo,
            lastUpdated: oldTimestamp,
          },
        },
      });

      const { updateLocalData } = useRepositoryStore.getState();
      updateLocalData('conversation-1', mockAppData);

      const { cache } = useRepositoryStore.getState();
      expect(cache['conversation-1'].lastUpdated).not.toBe(oldTimestamp);
    });

    it('should not update if conversation not in cache', () => {
      const { updateLocalData } = useRepositoryStore.getState();
      updateLocalData('non-existent', mockAppData);

      const { cache } = useRepositoryStore.getState();
      expect(cache['non-existent']).toBeUndefined();
    });
  });

  describe('clearCache', () => {
    beforeEach(() => {
      useRepositoryStore.setState({
        cache: {
          'conversation-1': {
            data: mockAppData,
            repositoryInfo: mockRepoInfo,
            lastUpdated: '2024-01-01T00:00:00.000Z',
          },
          'conversation-2': {
            data: mockAppData,
            repositoryInfo: mockRepoInfo,
            lastUpdated: '2024-01-01T00:00:00.000Z',
          },
        },
        pendingRequests: {
          'conversation-1': Promise.resolve(mockAppData),
        },
      });
    });

    it('should clear specific conversation cache', () => {
      const { clearCache } = useRepositoryStore.getState();
      clearCache('conversation-1');

      const { cache } = useRepositoryStore.getState();
      expect(cache['conversation-1']).toBeUndefined();
      expect(cache['conversation-2']).toBeDefined();
    });

    it('should clear specific conversation pending requests', () => {
      const { clearCache } = useRepositoryStore.getState();
      clearCache('conversation-1');

      const { pendingRequests } = useRepositoryStore.getState();
      expect(pendingRequests['conversation-1']).toBeUndefined();
    });

    it('should clear all cache when no conversation specified', () => {
      const { clearCache } = useRepositoryStore.getState();
      clearCache();

      const { cache, pendingRequests } = useRepositoryStore.getState();
      expect(cache).toEqual({});
      expect(pendingRequests).toEqual({});
    });
  });

  describe('getters', () => {
    beforeEach(() => {
      useRepositoryStore.setState({
        cache: {
          'conversation-1': {
            data: mockAppData,
            repositoryInfo: mockRepoInfo,
            lastUpdated: '2024-01-01T00:00:00.000Z',
          },
        },
        loading: {
          'conversation-1': true,
        },
        error: {
          'conversation-1': 'Test error',
        },
      });
    });

    it('getRepositoryData should return cached data', () => {
      const { getRepositoryData } = useRepositoryStore.getState();
      const data = getRepositoryData('conversation-1');
      expect(data).toEqual(mockAppData);
    });

    it('getRepositoryData should return null for non-existent conversation', () => {
      const { getRepositoryData } = useRepositoryStore.getState();
      const data = getRepositoryData('non-existent');
      expect(data).toBeNull();
    });

    it('getRepositoryInfo should return repository info', () => {
      const { getRepositoryInfo } = useRepositoryStore.getState();
      const info = getRepositoryInfo('conversation-1');
      expect(info).toEqual(mockRepoInfo);
    });

    it('getRepositoryInfo should return null for non-existent conversation', () => {
      const { getRepositoryInfo } = useRepositoryStore.getState();
      const info = getRepositoryInfo('non-existent');
      expect(info).toBeNull();
    });

    it('isLoading should return loading state', () => {
      const { isLoading } = useRepositoryStore.getState();
      expect(isLoading('conversation-1')).toBe(true);
      expect(isLoading('conversation-2')).toBe(false);
    });

    it('getError should return error message', () => {
      const { getError } = useRepositoryStore.getState();
      expect(getError('conversation-1')).toBe('Test error');
      expect(getError('conversation-2')).toBeNull();
    });
  });
});
