import { create } from 'zustand';
import HelperStorage from "../helpers/HelperStorage";
import privateClient from "@/clients/private";
import type { Auth } from "@/types/auth";
import { getToken } from "../helpers/HelperAuth";

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

interface AuthStore extends Auth {
  // Getters
  isLoggedIn: boolean;
  parsedToken: Record<string, any> | null;
  hasToken: boolean;

  // Actions
  login: (form: any) => Promise<void>;
  saveData: (data: Partial<Auth>) => void;
  logout: (logoutFn?: () => void) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  getGuestToken: () => Promise<string>;
  postTransferChats: (guestToken: string, transferAll?: boolean) => Promise<any>;
}

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state from storage
  ...helperStorage.get("auth", { ...defaultState }),

  // Getters (computed properties)
  get isLoggedIn() {
    const state = get();
    return !!state.token && state.tokenType === 'private';
  },

  get parsedToken() {
    const state = get();
    return state.token ? parseJwt(state.token) : null;
  },

  get hasToken() {
    const state = get();
    return !!state.token;
  },

  // Actions
  async login(form: any) {
    const { data } = await privateClient.post("/auth/login", form);
    get().saveData(data);
  },

  saveData(data: Partial<Auth>) {
    set((state) => {
      const newState = { ...state, ...data };
      helperStorage.set("auth", newState);
      return newState;
    });
  },

  async logout(logoutFn?: () => void) {
    const { useAssistantStore } = await import('./assistant');
    const assistantStore = useAssistantStore.getState();
    assistantStore.setGuestChatsExist(false);

    const state = get();
    if (state.isLoggedIn && logoutFn) {
      logoutFn();
    }

    set(defaultState);
    helperStorage.set("auth", defaultState);
    helperStorage.clear();
  },

  async refreshAccessToken() {
    const token = await getToken();
    get().saveData({ token });
  },

  async getGuestToken() {
    const { data } = await privateClient.get("/v1/get_guest_token");
    get().saveData({ token: data.access_token, tokenType: 'public' });
    return data.access_token;
  },

  async postTransferChats(guestToken: string, transferAll?: boolean) {
    return privateClient.post("/v1/chats/transfer", { guest_token: guestToken });
  },
}));

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
