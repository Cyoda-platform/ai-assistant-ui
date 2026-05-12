import type {AxiosError, AxiosInstance} from "axios";
import HelperStorage from "@/helpers/HelperStorage.ts";
import { useAuthStore } from "@/stores/auth.ts";
import { triggerAuth0Logout } from "@/helpers/HelperAuth";
import type {Auth} from "@/types/auth";

let refreshAccessTokenPromise: Promise<void> | null = null;
const helperStorage = new HelperStorage();

const handleLogoutAndRedirect = () => {
    // Use getState() instead of the hook to avoid hook call outside component
    const authStore = useAuthStore.getState();
    authStore.logout();

    if (import.meta.env.VITE_IS_ELECTRON && window.electronAPI?.reloadMainWindow) {
        window.electronAPI.reloadMainWindow();
        return;
    }

    // Trigger a real Auth0 logout so the Auth0 session cookie is cleared.
    // Otherwise the next page load silently re-authenticates and we end
    // up in an endless reload loop when the API keeps returning 401.
    if (triggerAuth0Logout()) {
        return;
    }

    // Fallback for environments where Auth0 logout was not registered.
    window.location.href = window.location.origin + "/";
};

const refreshToken = (instance: AxiosInstance): void => {
    instance.interceptors.response.use(
        undefined,
        async (error: AxiosError) => {
            const response = error.response;
            const originalConfig = error.config;
            // Use getState() instead of the hook to avoid hook call outside component
            const authStore = useAuthStore.getState();
            let autoLogoutTimeout = null;

            if (
                response?.status === 401 &&
                // @ts-ignore
                !originalConfig?.__isRetryRequest
            ) {
                console.log('[RefreshToken] 401 error detected, attempting token refresh');
                console.log('[RefreshToken] Current tokenType:', authStore.tokenType);

                try {
                    // Only attempt refresh for private (Auth0) tokens, not guest tokens
                    if (authStore.tokenType !== 'private') {
                        console.log('[RefreshToken] Token is not private type, rejecting');
                        return Promise.reject(error);
                    }

                    console.log('[RefreshToken] Starting token refresh with cache bypass...');
                    if (!refreshAccessTokenPromise) {
                        // Call refreshAccessToken which will use getToken with cache bypass
                        refreshAccessTokenPromise = authStore.refreshAccessToken();
                    }

                    autoLogoutTimeout = setTimeout(() => {
                        console.error('❌ Token refresh timeout after 10 seconds');
                        // @ts-ignore - Check if this request should skip logout on auth failure
                        if (!originalConfig?.__skipLogoutOnAuthFailure) {
                            handleLogoutAndRedirect();
                        }
                    }, 10000);

                    await refreshAccessTokenPromise;
                    refreshAccessTokenPromise = null;
                    console.log('[RefreshToken] Token refresh completed successfully');

                    // @ts-ignore
                    originalConfig.__isRetryRequest = true;

                    // Always use the stored token (refreshAccessToken updates the stored token)
                    const token = helperStorage.get<Auth>("auth")?.token;
                    if (token) {
                        console.log('[RefreshToken] Updating request with new token');
                        // @ts-ignore
                        originalConfig.headers = {
                            ...originalConfig?.headers,
                            Authorization: `Bearer ${token}`,
                        };
                    } else {
                        console.error('[RefreshToken] No token found after refresh');
                    }
                    // @ts-ignore
                    return instance.request(originalConfig);
                } catch (e) {
                    console.error('❌ Token refresh failed:', e);
                    // @ts-ignore - Check if this request should skip logout on auth failure
                    if (!originalConfig?.__skipLogoutOnAuthFailure) {
                        handleLogoutAndRedirect();
                    }
                } finally {
                    if (autoLogoutTimeout) clearTimeout(autoLogoutTimeout);
                    autoLogoutTimeout = null;
                }
            } else if (response?.status === 401 && originalConfig?.__isRetryRequest) {
                // For logs API, let the error propagate so the component can handle it
                // (it may need to regenerate the ELK API key)
                const url = originalConfig?.url || '';
                if (url.includes('/logs/')) {
                    console.log('[RefreshToken] 401 on logs API after retry, letting component handle it');
                    return Promise.reject(error);
                }

                // @ts-ignore - Check if this request should skip logout on auth failure
                if (originalConfig?.__skipLogoutOnAuthFailure) {
                    console.log('[RefreshToken] 401 after retry, but skipping logout due to flag');
                    return Promise.reject(error);
                }

                console.error('❌ 401 after retry, logging out');
                handleLogoutAndRedirect();
            }

            // Don't reject immediately - let the error propagate for handling
            return Promise.reject(error);
        }
    );
};

export default refreshToken;
