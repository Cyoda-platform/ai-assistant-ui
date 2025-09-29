import type {AxiosInstance} from "axios";
import useAuthStore from "../../stores/auth";
import type {Auth} from "@/types/auth";
import HelperStorage from "../../helpers/HelperStorage";

let tokenPromise = null;

const helperStorage = new HelperStorage();
const jwtInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(async (config) => {

    if (config.url?.includes("/get_guest_token")) {
      return config;
    }

    const authStore = useAuthStore();
    if (!authStore.hasToken) {
      if (!tokenPromise) tokenPromise = authStore.getGuestToken();
      await tokenPromise;
      tokenPromise = null;
    }

    const token = helperStorage.get<Auth>("auth")?.token;
    config.headers.Authorization = `Bearer ${token}`;
    return config;
  });
};

export default jwtInterceptor;
