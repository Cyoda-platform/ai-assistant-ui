import type {AxiosResponse, AxiosError, AxiosInstance} from "axios";
import HelperErrors from "../../helpers/HelperErrors";
import eventBus from "../../plugins/eventBus";
import {SHOW_LOGIN_POPUP} from "../../helpers/HelperConstants";

const errorInterceptor = (instance: AxiosInstance): void => {
  instance.interceptors.response.use(
    (response: AxiosResponse) => response,
    (error: AxiosError) => {
      // Handle connection errors (no response from server)
      if (!error.response) {
        // Only show error for non-polling requests
        const url = error.config?.url || '';
        const isPollingRequest = url.includes('/chats/') && error.config?.method?.toLowerCase() === 'get';

        if (!isPollingRequest) {
          HelperErrors.handler(error);
        }
        return Promise.reject(error);
      }

      const response = error.response;
      const url = response?.config?.url || '';

      // Skip 401 errors - they're handled by the refreshToken interceptor
      // This interceptor runs after refreshToken, so if we see a 401 here,
      // it means the refresh already failed or was skipped
      if (response?.status === 401) {
        console.log('⚠️ 401 error in errorInterceptor (after refresh attempt)');
        return Promise.reject(error);
      }

      // For chat-related endpoints (answers, questions), don't show modal
      // The error will be displayed in the chat UI instead
      const isChatEndpoint = url.includes('/text-answers') ||
                            url.includes('/answers') ||
                            url.includes('/text-questions') ||
                            url.includes('/questions');

      // Special handling for /v1/chats/transfer - always show error modal
      if(url.includes('/v1/chats/transfer') && [403].includes(response?.status)) {
        HelperErrors.handler(error);
        return Promise.reject(error);
      }

      // For 403/429 errors, show login popup UNLESS it's a POST to /v1/chats (create chat)
      // or has a specific error message that should be displayed
      if ([403, 429].includes(response?.status)) {
        const isCreateChat = url.includes('/v1/chats') && response?.config?.method?.toUpperCase() === 'POST' && !url.includes('/text-') && !url.includes('/approve') && !url.includes('/rollback') && !url.includes('/notification');

        // If it's create chat with an error message, show the error modal instead of login popup
        if (isCreateChat && (response?.data?.message || response?.data?.error)) {
          HelperErrors.handler(error);
          return Promise.reject(error);
        }

        // Otherwise show login popup
        eventBus.$emit(SHOW_LOGIN_POPUP);
        return Promise.reject(error);
      }

      // Only show error modal if it's not a chat endpoint
      if (!isChatEndpoint) {
        HelperErrors.handler(error);
      }

      return Promise.reject(error);
    }
  );
};

export default errorInterceptor;
