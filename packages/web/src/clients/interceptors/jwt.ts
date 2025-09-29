import type {AxiosInstance} from "axios";
import { useAuthStore } from "../../stores/auth";
import type {Auth} from "@/types/auth";
import HelperStorage from "../../helpers/HelperStorage";

let tokenPromise: Promise<string> | null = null;

const helperStorage = new HelperStorage();
const jwtInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.request.use(async (config) => {

    // Skip guest token endpoint to avoid circular dependency
    if (config.url?.includes("/get_guest_token")) {
      return config;
    }

    const authStore = useAuthStore.getState();

    // If no token exists, get guest token (with proper synchronization)
    if (!authStore.token) {
      if (!tokenPromise) {
        tokenPromise = authStore.getGuestToken().then((newToken) => {
          tokenPromise = null; // Clear the promise after completion
          return newToken;
        }).catch((error) => {
          tokenPromise = null; // Clear the promise on error too
          throw error;
        });
      }

      // Wait for the token to be obtained
      await tokenPromise;
    }

    // Always use the stored token (whether guest or Auth0)
    const token = helperStorage.get<Auth>("auth")?.token;
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
};

export default jwtInterceptor;
