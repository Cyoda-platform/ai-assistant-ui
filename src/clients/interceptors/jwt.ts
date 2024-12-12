import type {AxiosInstance} from "axios";
import HelperStorage from "@/helpers/HelperStorage.ts";
import type {Auth} from "@/types/auth";

const helperStorage = new HelperStorage();

const jwtInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.request.use((config) => {
    const token = helperStorage.get<Auth>('auth')?.token;
    config.headers.Authorization = token ? `Bearer ${token}` : '';
    return config;
  });
};

export default jwtInterceptor;
