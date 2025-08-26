import type {AxiosError, AxiosInstance} from "axios";
import HelperStorage from "@/helpers/HelperStorage.ts";
import useAuthStore from "@/stores/auth.ts";
import type {Auth} from "@/types/auth";

let refreshAccessTokenPromise: Promise<void> | null = null;
const helperStorage = new HelperStorage();

const handleLogoutAndRedirect = () => {
    const authStore = useAuthStore();
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
            const authStore = useAuthStore();
            let autoLogoutTimeout = null;

            if (
                response?.status === 401 &&
                // @ts-ignore
                !originalConfig?.__isRetryRequest
            ) {
                try {
                    if (!refreshAccessTokenPromise) {
                        refreshAccessTokenPromise = authStore.refreshAccessToken();
                    }

                    autoLogoutTimeout = setTimeout(() => {
                        handleLogoutAndRedirect();
                    }, 10000);

                    await refreshAccessTokenPromise;
                    refreshAccessTokenPromise = null;
                    autoLogoutTimeout = null;

                    // @ts-ignore
                    originalConfig.__isRetryRequest = true;
                    const token = helperStorage.get<Auth>("auth")?.token;
                    if (token) {
                        // @ts-ignore
                        originalConfig.headers = {
                            ...originalConfig?.headers,
                            Authorization: `Bearer ${token}`,
                        };
                    }
                    // @ts-ignore
                    return instance.request(originalConfig);
                } catch (e) {
                    handleLogoutAndRedirect();
                } finally {
                    if (autoLogoutTimeout) clearTimeout(autoLogoutTimeout);
                    autoLogoutTimeout = null;
                }
            } else if (response?.status === 401 && originalConfig?.__isRetryRequest) {
                handleLogoutAndRedirect();
            }

            return Promise.reject(error);
        }
    );
};

export default refreshToken;
