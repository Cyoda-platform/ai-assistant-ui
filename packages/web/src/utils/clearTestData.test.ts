import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  clearOrphanedTestData,
  clearAllMockData,
  initializeCleanState,
} from './clearTestData';

// Mock console methods to avoid noise in test output
const consoleSpy = {
  log: vi.spyOn(console, 'log').mockImplementation(() => {}),
  error: vi.spyOn(console, 'error').mockImplementation(() => {}),
};

describe('clearTestData', () => {
  // Mock localStorage
  const localStorageMock: { [key: string]: string } = {};

  beforeEach(() => {
    // Clear all mocks and storage before each test
    vi.clearAllMocks();
    Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);

    // Setup localStorage mock
    global.localStorage = {
      getItem: vi.fn((key: string) => localStorageMock[key] || null),
      setItem: vi.fn((key: string, value: string) => {
        localStorageMock[key] = value;
      }),
      removeItem: vi.fn((key: string) => {
        delete localStorageMock[key];
      }),
      clear: vi.fn(() => {
        Object.keys(localStorageMock).forEach(key => delete localStorageMock[key]);
      }),
      key: vi.fn((index: number) => Object.keys(localStorageMock)[index] || null),
      length: Object.keys(localStorageMock).length,
    };
  });

  describe('clearOrphanedTestData', () => {
    it('should remove all storage keys', () => {
      // Setup test data in localStorage
      localStorageMock['mock_api_environments'] = 'test-env';
      localStorageMock['mock_api_requirements'] = 'test-req';
      localStorageMock['mock_api_entities'] = 'test-ent';
      localStorageMock['mock_api_workflows'] = 'test-wf';

      clearOrphanedTestData();

      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_entities');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_workflows');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_environments');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_requirements');
      expect(consoleSpy.log).toHaveBeenCalledWith('🧹 Clearing deprecated mock data');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Cleaned up orphaned test data');
    });

    it('should log success message', () => {
      clearOrphanedTestData();

      expect(consoleSpy.log).toHaveBeenCalledWith('✅ Cleaned up orphaned test data');
    });

    it('should not throw when localStorage fails', () => {
      // Force localStorage.removeItem to throw consistently
      vi.mocked(localStorage.removeItem).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw - errors are caught internally
      expect(() => clearOrphanedTestData()).not.toThrow();
    });
  });

  describe('clearAllMockData', () => {
    it('should clear all storage keys', () => {
      localStorageMock['mock_api_environments'] = 'test-env';
      localStorageMock['mock_api_requirements'] = 'test-req';
      localStorageMock['mock_api_entities'] = 'test-ent';
      localStorageMock['mock_api_workflows'] = 'test-wf';

      clearAllMockData();

      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_environments');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_requirements');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_entities');
      expect(localStorage.removeItem).toHaveBeenCalledWith('mock_api_workflows');
    });

    it('should log each cleared key', () => {
      clearAllMockData();

      expect(consoleSpy.log).toHaveBeenCalledWith('🧹 Cleared mock_api_environments');
      expect(consoleSpy.log).toHaveBeenCalledWith('🧹 Cleared mock_api_requirements');
      expect(consoleSpy.log).toHaveBeenCalledWith('🧹 Cleared mock_api_entities');
      expect(consoleSpy.log).toHaveBeenCalledWith('🧹 Cleared mock_api_workflows');
      expect(consoleSpy.log).toHaveBeenCalledWith('✅ All mock data cleared');
    });

    it('should not throw when localStorage fails', () => {
      vi.mocked(localStorage.removeItem).mockImplementation(() => {
        throw new Error('Storage error');
      });

      // Should not throw - errors are caught internally
      expect(() => clearAllMockData()).not.toThrow();
    });
  });

  describe('initializeCleanState', () => {
    it('should clear old non-chat-specific data and orphaned data', () => {
      localStorageMock['mock_api_environments'] = 'test-env';
      localStorageMock['mock_api_entities'] = 'test-ent';

      initializeCleanState();

      expect(localStorage.removeItem).toHaveBeenCalled();
      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Clean state initialized - using repository store for data'
      );
    });

    it('should log success message', () => {
      initializeCleanState();

      expect(consoleSpy.log).toHaveBeenCalledWith(
        '✅ Clean state initialized - using repository store for data'
      );
    });

    it('should remove old keys without chat suffix', () => {
      localStorageMock['mock_api_environments'] = 'test-env';

      initializeCleanState();

      expect(localStorage.getItem).toHaveBeenCalled();
      expect(localStorage.removeItem).toHaveBeenCalled();
    });
  });
});
