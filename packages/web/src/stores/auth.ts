import { create } from 'zustand';
import HelperStorage from "../helpers/HelperStorage";
import privateClient from "@/clients/private";
import publicClient from "@/clients/public";
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
  isCyodaEmployee: false,
  superUserMode: false,
};

interface AuthStore extends Auth {
  // Actions
  login: (form: any) => Promise<void>;
  saveData: (data: Partial<Auth>) => void;
  logout: (logoutFn?: () => void) => Promise<void>;
  refreshAccessToken: () => Promise<void>;
  getGuestToken: () => Promise<string>;
  postTransferChats: (guestToken: string, transferAll?: boolean) => Promise<any>;
  toggleSuperUserMode: () => void;
}

// Load stored auth data and merge with defaults to ensure new fields exist
const storedAuth = helperStorage.get("auth", { ...defaultState });
const initialState = { ...defaultState, ...storedAuth };

console.log('🔧 Auth Store Initialization:', {
  storedAuth,
  defaultState,
  initialState,
  hasIsCyodaEmployee: 'isCyodaEmployee' in initialState,
  isCyodaEmployeeValue: initialState.isCyodaEmployee
});

export const useAuthStore = create<AuthStore>((set, get) => ({
  // Initial state from storage merged with defaults
  ...initialState,

  // Actions
  async login(form: any) {
    const { data } = await privateClient.post("/auth/login", form);
    get().saveData(data);
  },

  saveData(data: Partial<Auth>) {
    console.log('saveData called with:', data);
    set((state) => {
      const newState = { ...state, ...data };
      console.log('Auth state updated:', {
        oldState: state,
        newState,
        isLoggedIn: newState.token && newState.tokenType === 'private'
      });
      helperStorage.set("auth", newState);
      return newState;
    });
  },

  async logout(logoutFn?: () => void) {
    const { useAssistantStore } = await import('./assistant');
    const assistantStore = useAssistantStore.getState();
    assistantStore.setGuestChatsExist(false);

    const state = get();
    const isLoggedIn = state.token && state.tokenType === 'private';
    if (isLoggedIn && logoutFn) {
      logoutFn();
    }

    set(defaultState);
    helperStorage.set("auth", defaultState);
    helperStorage.clear();
  },

  async refreshAccessToken() {
    console.log('🔄 refreshAccessToken called');
    try {
      const token = await getToken();
      console.log('✅ New token obtained from Auth0:', token.substring(0, 20) + '...');

      // Parse JWT token to maintain caas_cyoda_employee status
      let isCyodaEmployee = false;
      try {
        const parsed = parseJwt(token);
        if (parsed) {
          isCyodaEmployee = parsed.caas_cyoda_employee === true;
          console.log('🔍 Token parsed, isCyodaEmployee:', isCyodaEmployee);
        }
      } catch (e) {
        console.error('❌ Error parsing JWT token during refresh:', e);
      }

      get().saveData({ token, isCyodaEmployee });
      console.log('✅ Token refresh complete and saved');
    } catch (error) {
      console.error('❌ Failed to refresh token:', error);
      throw error;
    }
  },

  async getGuestToken() {
    // Use publicClient to avoid circular dependency with JWT interceptor
    const { data } = await publicClient.get("/v1/get_guest_token");
    get().saveData({ token: data.access_token, tokenType: 'public' });
    return data.access_token;
  },

  async postTransferChats(guestToken: string, transferAll?: boolean) {
    return privateClient.post("/v1/chats/transfer", { guest_token: guestToken });
  },

  toggleSuperUserMode() {
    set((state) => {
      // Only allow toggle if user is a Cyoda employee
      if (!state.isCyodaEmployee) {
        console.warn('Super user mode is only available for Cyoda employees');
        return state;
      }
      const newValue = !state.superUserMode;
      const newState = { ...state, superUserMode: newValue };
      helperStorage.set("auth", newState);
      console.log('Super user mode toggled:', newValue);
      return { superUserMode: newValue };
    });
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

// Reactive selectors for components
export const useIsLoggedIn = () => useAuthStore((state) => !!state.token && state.tokenType === 'private');
export const useHasToken = () => useAuthStore((state) => !!state.token);
export const useParsedToken = () => useAuthStore((state) => state.token ? parseJwt(state.token) : null);
export const useIsCyodaEmployee = () => useAuthStore((state) => state.isCyodaEmployee);
export const useSuperUserMode = () => useAuthStore((state) => state.superUserMode);

export default useAuthStore;
