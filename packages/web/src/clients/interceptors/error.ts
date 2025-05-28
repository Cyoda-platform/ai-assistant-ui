import type {AxiosResponse, AxiosError, AxiosInstance} from "axios";
import HelperErrors from "../../helpers/HelperErrors";
import eventBus from "../../plugins/eventBus";
import {SHOW_LOGIN_POPUP} from "../../helpers/HelperConstants";

const errorInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      const response = error.response;
      if(response?.config?.url.includes('/v1/chats/transfer') && [403].includes(response?.status)) {
        HelperErrors.handler(error);
        return Promise.reject(error);
      }
      if ([403, 429].includes(response?.status)) {
        eventBus.$emit(SHOW_LOGIN_POPUP);
        return Promise.reject(error);
      }
      HelperErrors.handler(error);
      return Promise.reject(error);
    }
  );
};

export default errorInterceptor;
