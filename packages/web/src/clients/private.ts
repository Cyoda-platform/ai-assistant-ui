import axios from "axios";
import errorInterceptor from "@/clients/interceptors/error.ts";
import jwtInterceptor from "@/clients/interceptors/jwt.ts";
import refreshToken from "@/clients/interceptors/refreshToken.ts";
import axiosRetry from 'axios-retry';

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

axiosRetry(instance, {
  retries: 3,
  retryDelay: axiosRetry.exponentialDelay,
  retryCondition: (error) => {
    const status = error?.response?.status;
    // Don't retry on rate limiting
    if (status === 429) return false;

    // Don't retry polling requests - they have their own retry logic
    const url = error?.config?.url || '';
    if (url.includes('/chats/') && error?.config?.method === 'get') {
      return false;
    }

    return axiosRetry.isRetryableError(error);
  }
});

errorInterceptor(instance);
jwtInterceptor(instance);
refreshToken(instance);

export default instance;
