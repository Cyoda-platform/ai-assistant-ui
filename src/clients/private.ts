import axios from "axios";
import errorInterceptor from "@/clients/interceptors/error.ts";
import jwtInterceptor from "@/clients/interceptors/jwt.ts";
import refreshToken from "@/clients/interceptors/refreshToken.ts";

const instance = axios.create({
  baseURL: import.meta.env.VITE_APP_API_BASE,
  headers: {
    'X-Requested-With': 'XMLHttpRequest',
  },
});

errorInterceptor(instance);
jwtInterceptor(instance);
refreshToken(instance);

export default instance;
