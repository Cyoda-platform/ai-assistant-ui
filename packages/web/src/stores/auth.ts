import {defineStore} from "pinia";
import HelperStorage from "../helpers/HelperStorage.ts";
import privateClient from "@/clients/private.ts";
import type {Auth} from "@/types/auth";
import {getToken} from "../helpers/HelperAuth";
import useAssistantStore from "./assistant";

const helperStorage = new HelperStorage();
const defaultState: Auth = {
  token: "",
  tokenType: "",
  refreshToken: "",
  userId: "",
  username: "",
  picture: "",
  family_name: "",
  given_name: "",
  email: "",
};

const useAuthStore = defineStore('auth', {
  state: () => ({
    ...helperStorage.get("auth", {...defaultState}),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && state.tokenType === 'private',

    parsedToken: (state) => {
      return state.token ? parseJwt(state.token) : null;
    },
  },

  actions: {
    async login(form) {
      const {data} = await privateClient.post("/auth/login", form);
      this.saveData(data);
    },

    saveData(data) {
      this.$patch(data);
      helperStorage.set("auth", this.$state);
    },

    async logout(logoutFn) {
      const assistantStore = useAssistantStore();
      assistantStore.setGuestChatsExist(false);
      if (this.isLoggedIn && logoutFn) {
        logoutFn();
      }
      this.$patch(defaultState);
      helperStorage.set("auth", defaultState);
      helperStorage.clear();
    },

    async refreshAccessToken() {
      const token = await getToken();
      this.saveData({token});
    },

    async getGuestToken() {
      const {data} = await privateClient.get("/v1/get_guest_token");
      this.saveData({token: data.access_token, tokenType: 'public'});
      return data.access_token;
    },

    async postTransferChats(guestToken) {
      return privateClient.post("/v1/chats/transfer", {guest_token: guestToken});
    },
  },
});

function parseJwt(token: string): Record<string, any> | null {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
        atob(base64)
            .split('')
            .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
            .join('')
    );
    return JSON.parse(jsonPayload);
  } catch (e) {
    return null;
  }
}

export default useAuthStore;
