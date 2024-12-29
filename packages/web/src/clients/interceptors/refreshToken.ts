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

      if (
        response?.status === 401 &&
        // @ts-ignore
        !originalConfig?.__isRetryRequest
      ) {
        const authStore = useAuthStore();

        try {
          if (!refreshAccessTokenPromise) {
            refreshAccessTokenPromise = authStore.refreshAccessToken();
          }
          await refreshAccessTokenPromise;
          refreshAccessTokenPromise = null;

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
        } catch {
          authStore.logout();
          window.location.href = "/";
        }
      }

      return Promise.reject(error);
    }
  );
};

export default refreshToken;
