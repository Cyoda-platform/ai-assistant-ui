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
});

errorInterceptor(instance);
jwtInterceptor(instance);
refreshToken(instance);

export default instance;
