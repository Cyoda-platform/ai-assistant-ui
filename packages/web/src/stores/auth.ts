import {defineStore} from "pinia";
import HelperStorage from "../helpers/HelperStorage.ts";
import privateClient from "@/clients/private.ts";
import type {Auth} from "@/types/auth";
import {useAuth0} from "@auth0/auth0-vue";

const helperStorage = new HelperStorage();
const defaultState: Auth = {
  token: "",
  tokenType: "",
  refreshToken: "",
  userId: "",
  username: "",
};

const useAuthStore = defineStore('auth', {
  state: () => ({
    ...helperStorage.get("auth", {...defaultState}),
  }),

  getters: {
    isLoggedIn: (state) => !!state.token && state.tokenType === 'private',
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
      if (this.isLoggedIn) {
       logoutFn();
      }
      this.$patch(defaultState);
      helperStorage.set("auth", defaultState);
    },

    async refreshAccessToken() {
      const {getAccessTokenSilently} = useAuth0();
      const token = await getAccessTokenSilently();
      this.saveData({token});
    },

    async getGuestToken() {
      const {data} = await privateClient.get("/v1/get_guest_token");
      this.saveData({token: data.access_token, tokenType: 'public'});
      return data.access_token;
    },

    async postTransferChats(guestToken) {
      return privateClient.post("/v1/transfer-chats", {guest_token: guestToken});
    },
  },
});

export default useAuthStore;
