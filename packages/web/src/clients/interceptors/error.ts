import type {AxiosResponse, AxiosError, AxiosInstance} from "axios";
import HelperErrors from "@/helpers/HelperErrors.ts";
import eventBus from "../../plugins/eventBus";
import {SHOW_LOGIN_POPUP} from "../../helpers/HelperConstants";

const errorInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const response = error.response;
      if (response?.status === 403) {
        eventBus.$emit(SHOW_LOGIN_POPUP);
        return Promise.reject(error);
      }
      HelperErrors.handler(error);
      return Promise.reject(error);
    }
  );
};

export default errorInterceptor;
