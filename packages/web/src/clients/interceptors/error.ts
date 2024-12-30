import type {AxiosResponse, AxiosError, AxiosInstance} from "axios";
import HelperErrors from "@/helpers/HelperErrors.ts";

const errorInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      HelperErrors.handler(error);
      return Promise.reject(error);
    }
  );
};

export default errorInterceptor;
