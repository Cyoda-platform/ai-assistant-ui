import {defineStore} from "pinia";
import HelperStorage from "../helpers/HelperStorage";
import publicClient from "@/clients/public";
import type {Auth} from "@/types/auth";

const helperStorage = new HelperStorage();
const defaultState: Auth = {
  token: "",
  refreshToken: "",
  userId: "",
  username: "",
};

const useAuthStore = defineStore('auth', {
  state: () => ({
    ...helperStorage.get("auth", {...defaultState}),
  }),

  actions: {
    async login(form) {
      const {data} = await publicClient.post("/auth/login", form);
      this.saveData(data);
    },

    saveData(data) {
      this.$patch(data);
      helperStorage.set("auth", this.$state);
    },

    async logout() {
      this.$patch(defaultState);
      helperStorage.set("auth", defaultState);
    },

    async refreshAccessToken() {
      const {data} = await publicClient.get("/auth/token", {
        headers: {
          Authorization: `Bearer ${this.refreshToken}`,
        },
      });
      this.saveData({token: data.token});
    },
  },

  getters: {
    isLoggedIn: (state) => !!state.token,
  },
});

export default useAuthStore;
