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

    // Check if we already have a token in storage
    let token = helperStorage.get<Auth>("auth")?.token;

    // If no token, get guest token (with proper synchronization)
    if (!token) {
      if (!tokenPromise) {
        const authStore = useAuthStore.getState();
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

      // Get the token from storage after it's been saved
      token = helperStorage.get<Auth>("auth")?.token;
    }

    // Add authorization header if we have a token
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }

    return config;
  });
};

export default jwtInterceptor;
