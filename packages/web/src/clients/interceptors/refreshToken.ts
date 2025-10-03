import type {AxiosError, AxiosInstance} from "axios";
import HelperStorage from "@/helpers/HelperStorage.ts";
import { useAuthStore } from "@/stores/auth.ts";
import type {Auth} from "@/types/auth";

let refreshAccessTokenPromise: Promise<void> | null = null;
const helperStorage = new HelperStorage();

const handleLogoutAndRedirect = () => {
    debugger;
    // Use getState() instead of the hook to avoid hook call outside component
    const authStore = useAuthStore.getState();
    authStore.logout();

    if (import.meta.env.VITE_IS_ELECTRON && window.electronAPI?.reloadMainWindow) {
        window.electronAPI.reloadMainWindow();
    } else {
        window.location.href = window.location.origin + "/";
    }
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
                console.log('🔄 401 Unauthorized detected, attempting token refresh...', {
                    url: originalConfig?.url,
                    tokenType: authStore.tokenType
                });

                try {
                    // Only attempt refresh for private (Auth0) tokens, not guest tokens
                    if (authStore.tokenType !== 'private') {
                        console.log('⚠️ Cannot refresh guest token, skipping retry');
                        return Promise.reject(error);
                    }

                    if (!refreshAccessTokenPromise) {
                        console.log('🔄 Starting token refresh...');
                        refreshAccessTokenPromise = authStore.refreshAccessToken();
                    } else {
                        console.log('🔄 Token refresh already in progress, waiting...');
                    }

                    autoLogoutTimeout = setTimeout(() => {
                        console.error('❌ Token refresh timeout after 10 seconds');
                        handleLogoutAndRedirect();
                    }, 10000);

                    await refreshAccessTokenPromise;
                    refreshAccessTokenPromise = null;
                    console.log('✅ Token refresh successful');

                    // @ts-ignore
                    originalConfig.__isRetryRequest = true;

                    // Always use the stored token (refreshAccessToken updates the stored token)
                    const token = helperStorage.get<Auth>("auth")?.token;
                    if (token) {
                        // @ts-ignore
                        originalConfig.headers = {
                            ...originalConfig?.headers,
                            Authorization: `Bearer ${token}`,
                        };
                        console.log('🔄 Retrying original request with new token:', originalConfig?.url);
                    }
                    // @ts-ignore
                    return instance.request(originalConfig);
                } catch (e) {
                    console.error('❌ Token refresh failed:', e);
                    handleLogoutAndRedirect();
                } finally {
                    if (autoLogoutTimeout) clearTimeout(autoLogoutTimeout);
                    autoLogoutTimeout = null;
                }
            } else if (response?.status === 401 && originalConfig?.__isRetryRequest) {
                console.error('❌ 401 after retry, logging out');
                handleLogoutAndRedirect();
            }

            return Promise.reject(error);
        }
    );
};

export default refreshToken;
