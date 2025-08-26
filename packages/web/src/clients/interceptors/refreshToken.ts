import type {AxiosError, AxiosInstance} from "axios";
import HelperStorage from "@/helpers/HelperStorage.ts";
import useAuthStore from "@/stores/auth.ts";
import type {Auth} from "@/types/auth";

let refreshAccessTokenPromise: Promise<void> | null = null;
const helperStorage = new HelperStorage();

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
                        authStore.logout();
                        window.location.href = window.location.origin + "/";
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
                    authStore.logout();
                    window.location.href = window.location.origin + "/";
                } finally {
                    if (autoLogoutTimeout) clearTimeout(autoLogoutTimeout);
                    autoLogoutTimeout = null;
                }
            } else if (response?.status === 401 && originalConfig?.__isRetryRequest) {
                authStore.logout();
                window.location.href = window.location.origin + "/";
            }

            return Promise.reject(error);
        }
    );
};

export default refreshToken;
