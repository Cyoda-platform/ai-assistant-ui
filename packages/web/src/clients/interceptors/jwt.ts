import type {AxiosInstance} from "axios";
import useAuthStore from "../../stores/auth";

let tokenPromise = null;

const jwtInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(async (config) => {

    if (config.url?.includes("/get_guest_token")) {
      return config;
    }

    const authStore = useAuthStore();
    if (!authStore.token) {
      if (!tokenPromise) tokenPromise = authStore.getGuestToken();
      await tokenPromise;
      tokenPromise = null;
    }
    config.headers.Authorization = `Bearer ${authStore.token}`;
    return config;
  });
};

export default jwtInterceptor;
