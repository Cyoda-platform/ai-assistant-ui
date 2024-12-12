import axios from "axios";
import errorInterceptor from "@/clients/interceptors/error.ts";

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_AUTH,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

errorInterceptor(instance);

export default instance;
