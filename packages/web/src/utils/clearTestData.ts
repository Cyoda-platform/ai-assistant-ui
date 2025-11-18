/**
 * Utility to clear test/cached data from localStorage
 * This helps ensure a clean state for new users
 */

const STORAGE_KEYS = {
  ENVIRONMENTS: 'mock_api_environments',
  REQUIREMENTS: 'mock_api_requirements',
  ENTITIES: 'mock_api_entities',
  WORKFLOWS: 'mock_api_workflows',
};

/**
 * Clear old localStorage data that was stored without chat-specific keys.
 * This should be called once during app initialization to migrate to per-chat storage.
 */
function clearOldNonChatSpecificData(): void {
  try {
    const keysToRemove = Object.values(STORAGE_KEYS);
    let removedCount = 0;

    keysToRemove.forEach(key => {
      // Only remove keys that don't have the _chat_ suffix
      if (localStorage.getItem(key) !== null) {
        console.log(`🧹 Removing old non-chat-specific key: ${key}`);
        localStorage.removeItem(key);
        removedCount++;
      }
    });

    if (removedCount > 0) {
      console.log(`✅ Cleared ${removedCount} old non-chat-specific localStorage keys`);
    }
  } catch (error) {
    console.error('Error clearing old localStorage data:', error);
  }
}

/**
 * Clear all test entities and workflows
 * This removes orphaned data from previous test sessions
 */
export function clearOrphanedTestData(): void {
  try {
    // Clear old mock data (deprecated - now using repository store)
    console.log('🧹 Clearing deprecated mock data');

    localStorage.removeItem(STORAGE_KEYS.ENTITIES);
    localStorage.removeItem(STORAGE_KEYS.WORKFLOWS);
    localStorage.removeItem(STORAGE_KEYS.ENVIRONMENTS);
    localStorage.removeItem(STORAGE_KEYS.REQUIREMENTS);

    console.log('✅ Cleaned up orphaned test data');
  } catch (error) {
    console.error('Failed to clear orphaned test data:', error);
  }
}

/**
 * Clear all mock API data (use with caution!)
 * This is useful for complete reset during development
 */
export function clearAllMockData(): void {
  try {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
      console.log(`🧹 Cleared ${key}`);
    });
    console.log('✅ All mock data cleared');
  } catch (error) {
    console.error('Failed to clear all mock data:', error);
  }
}

/**
 * Initialize clean state on app load
 * This runs automatically when the app starts
 */
export function initializeCleanState(): void {
  // Clear old non-chat-specific data first (one-time migration)
  clearOldNonChatSpecificData();

  // Clear deprecated mock data
  clearOrphanedTestData();

  console.log('✅ Clean state initialized - using repository store for data');
}

