/**
 * Repository Store
 *
 * Manages repository data using the /analyze endpoint as the single source of truth.
 * Replaces the deprecated app-config backend persistence.
 *
 * Architecture:
 * - Data comes from /analyze endpoint (GitHub repository structure)
 * - Local cache for performance
 * - No backend persistence (data is read-only from repository)
 */

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import githubAppDataService, { type GitHubRepositoryInfo } from '@/services/githubAppDataService';
import type { AppRoot } from '@/components/AppsCanvas/types/appSchema';

interface RepositoryCache {
  [conversationId: string]: {
    data: AppRoot;
    repositoryInfo: GitHubRepositoryInfo;
    lastUpdated: string;
  };
}

interface RepositoryStore {
  // State
  cache: RepositoryCache;
  loading: Record<string, boolean>;
  error: Record<string, string | null>;
  pendingRequests: Record<string, Promise<AppRoot | null>>;

  // Actions
  loadRepository: (conversationId: string, repoInfo: GitHubRepositoryInfo) => Promise<AppRoot | null>;
  updateLocalData: (conversationId: string, appData: AppRoot) => void;
  clearCache: (conversationId?: string) => void;

  // Getters
  getRepositoryData: (conversationId: string) => AppRoot | null;
  getRepositoryInfo: (conversationId: string) => GitHubRepositoryInfo | null;
  isLoading: (conversationId: string) => boolean;
  getError: (conversationId: string) => string | null;
}

export const useRepositoryStore = create<RepositoryStore>()(
  persist(
    (set, get) => ({
      // Initial state
      cache: {},
      loading: {},
      error: {},
      pendingRequests: {},

      // Load repository data from /analyze endpoint
      loadRepository: async (conversationId: string, repoInfo: GitHubRepositoryInfo) => {
        const state = get();

        // DISABLED: Check cache first - always fetch fresh data for canvas
        // const cached = state.cache[conversationId];
        // if (cached &&
        //     cached.repositoryInfo.repositoryName === repoInfo.repositoryName &&
        //     cached.repositoryInfo.branch === repoInfo.branch &&
        //     cached.repositoryInfo.owner === repoInfo.owner) {
        //   console.log('📦 Using cached repository data for conversation:', conversationId);
        //   return cached.data;
        // }
        console.log('🔄 Skipping cache, always fetching fresh repository data for conversation:', conversationId);

        // Check if there's already a pending request for this conversation
        const pendingRequest = state.pendingRequests[conversationId];
        if (pendingRequest) {
          console.log('⏳ Waiting for pending request for conversation:', conversationId);
          return pendingRequest;
        }

        // Create a new request
        const requestPromise = (async () => {
          // Set loading state
          set((state) => ({
            loading: { ...state.loading, [conversationId]: true },
            error: { ...state.error, [conversationId]: null }
          }));

          try {
            console.log('🔄 Loading repository from /analyze endpoint:', { conversationId, repoInfo });

            // Load from /analyze endpoint (pass conversationId for LLM-based analysis)
            const appData = await githubAppDataService.convertGitHubToAppRoot(repoInfo, conversationId);

            // Cache it
            set((state) => ({
              cache: {
                ...state.cache,
                [conversationId]: {
                  data: appData,
                  repositoryInfo: repoInfo,
                  lastUpdated: new Date().toISOString()
                }
              },
              loading: { ...state.loading, [conversationId]: false },
              pendingRequests: (() => {
                const newPending = { ...state.pendingRequests };
                delete newPending[conversationId];
                return newPending;
              })()
            }));

            console.log('✅ Repository data loaded successfully');
            return appData;
          } catch (error: any) {
            console.error('❌ Failed to load repository:', error);

            set((state) => ({
              loading: { ...state.loading, [conversationId]: false },
              error: { ...state.error, [conversationId]: error.message || 'Failed to load repository' },
              pendingRequests: (() => {
                const newPending = { ...state.pendingRequests };
                delete newPending[conversationId];
                return newPending;
              })()
            }));

            return null;
          }
        })();

        // Store the pending request
        set((state) => ({
          pendingRequests: { ...state.pendingRequests, [conversationId]: requestPromise }
        }));

        return requestPromise;
      },

      // Update local data (for UI edits - not persisted to backend)
      updateLocalData: (conversationId: string, appData: AppRoot) => {
        const state = get();
        const cached = state.cache[conversationId];

        if (!cached) {
          console.warn('⚠️ No cached repository data found for conversation:', conversationId);
          return;
        }

        console.log('💾 Updating local repository data for conversation:', conversationId);

        set((state) => ({
          cache: {
            ...state.cache,
            [conversationId]: {
              ...cached,
              data: appData,
              lastUpdated: new Date().toISOString()
            }
          }
        }));

        console.log('✅ Local repository data updated');
      },

      // Clear cache
      clearCache: (conversationId?: string) => {
        if (conversationId) {
          set((state) => {
            const newCache = { ...state.cache };
            const newPending = { ...state.pendingRequests };
            delete newCache[conversationId];
            delete newPending[conversationId];
            return { cache: newCache, pendingRequests: newPending };
          });
        } else {
          set({ cache: {}, pendingRequests: {} });
        }
      },

      // Getters
      getRepositoryData: (conversationId: string) => {
        return get().cache[conversationId]?.data || null;
      },

      getRepositoryInfo: (conversationId: string) => {
        return get().cache[conversationId]?.repositoryInfo || null;
      },

      isLoading: (conversationId: string) => {
        return get().loading[conversationId] || false;
      },

      getError: (conversationId: string) => {
        return get().error[conversationId] || null;
      },
    }),
    {
      name: 'repository-storage',
      partialize: (state) => ({
        cache: state.cache,
      }),
    }
  )
);

