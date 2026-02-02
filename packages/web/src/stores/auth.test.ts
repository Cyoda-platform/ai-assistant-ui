import { describe, it, expect, beforeEach, vi } from 'vitest';
import { useAuthStore } from './auth';
import privateClient from '@/clients/private';
import publicClient from '@/clients/public';

// Mock dependencies
vi.mock('@/clients/private', () => ({
  default: {
    post: vi.fn(),
    get: vi.fn(),
  },
}));

vi.mock('@/clients/public', () => ({
  default: {
    get: vi.fn(),
    post: vi.fn(),
  },
}));

vi.mock('@/helpers/HelperStorage', () => ({
  default: class {
    private storage = new Map();
    get(key: string, defaultValue: any) {
      return this.storage.get(key) ?? defaultValue;
    }
    set(key: string, value: any) {
      this.storage.set(key, value);
    }
    clear() {
      this.storage.clear();
    }
  },
}));

vi.mock('@/helpers/HelperAuth', () => ({
  getToken: vi.fn(),
}));

vi.mock('./assistant', () => ({
  useAssistantStore: {
    getState: () => ({
      setGuestChatsExist: vi.fn(),
    }),
  },
}));

describe('authStore', () => {
  const defaultState = {
    token: '',
    tokenType: '',
    refreshToken: '',
    userId: '',
    username: '',
    picture: '',
    family_name: '',
    given_name: '',
    email: '',
    isCyodaEmployee: false,
    superUserMode: false,
    selectedUserId: '',
  };

  beforeEach(() => {
    // Reset store to default state
    useAuthStore.setState(defaultState);
    vi.clearAllMocks();
  });

  describe('initial state', () => {
    it('should initialize with empty token', () => {
      const { token } = useAuthStore.getState();
      expect(token).toBe('');
    });

    it('should initialize with empty tokenType', () => {
      const { tokenType } = useAuthStore.getState();
      expect(tokenType).toBe('');
    });

    it('should initialize with isCyodaEmployee as false', () => {
      const { isCyodaEmployee } = useAuthStore.getState();
      expect(isCyodaEmployee).toBe(false);
    });

    it('should initialize with superUserMode as false', () => {
      const { superUserMode } = useAuthStore.getState();
      expect(superUserMode).toBe(false);
    });
  });

  describe('login', () => {
    it('should call login endpoint and save data', async () => {
      const mockLoginData = {
        token: 'test-token',
        tokenType: 'private',
        userId: 'user-123',
        username: 'testuser',
        email: 'test@example.com',
      };

      vi.mocked(privateClient.post).mockResolvedValue({ data: mockLoginData });

      const { login } = useAuthStore.getState();
      await login({ username: 'testuser', password: 'password' });

      expect(privateClient.post).toHaveBeenCalledWith('/auth/login', {
        username: 'testuser',
        password: 'password',
      });

      const state = useAuthStore.getState();
      expect(state.token).toBe('test-token');
      expect(state.tokenType).toBe('private');
      expect(state.userId).toBe('user-123');
    });
  });

  describe('saveData', () => {
    it('should update state with partial data', () => {
      const { saveData } = useAuthStore.getState();
      saveData({ token: 'new-token', userId: 'user-456' });

      const state = useAuthStore.getState();
      expect(state.token).toBe('new-token');
      expect(state.userId).toBe('user-456');
      expect(state.tokenType).toBe(''); // unchanged
    });

    it('should merge data with existing state', () => {
      useAuthStore.setState({ token: 'old-token', username: 'olduser' });

      const { saveData } = useAuthStore.getState();
      saveData({ username: 'newuser' });

      const state = useAuthStore.getState();
      expect(state.token).toBe('old-token'); // unchanged
      expect(state.username).toBe('newuser'); // updated
    });
  });

  describe('logout', () => {
    it('should reset state to default', async () => {
      useAuthStore.setState({
        token: 'test-token',
        tokenType: 'private',
        userId: 'user-123',
        username: 'testuser',
      });

      const { logout } = useAuthStore.getState();
      await logout();

      const state = useAuthStore.getState();
      expect(state.token).toBe('');
      expect(state.tokenType).toBe('');
      expect(state.userId).toBe('');
      expect(state.username).toBe('');
    });

    it('should call logout function when logged in', async () => {
      useAuthStore.setState({ token: 'test-token', tokenType: 'private' });

      const logoutFn = vi.fn();
      const { logout } = useAuthStore.getState();
      await logout(logoutFn);

      expect(logoutFn).toHaveBeenCalled();
    });

    it('should not call logout function when not logged in', async () => {
      useAuthStore.setState({ token: '', tokenType: '' });

      const logoutFn = vi.fn();
      const { logout } = useAuthStore.getState();
      await logout(logoutFn);

      expect(logoutFn).not.toHaveBeenCalled();
    });

    it('should not call logout function when token type is public', async () => {
      useAuthStore.setState({ token: 'guest-token', tokenType: 'public' });

      const logoutFn = vi.fn();
      const { logout } = useAuthStore.getState();
      await logout(logoutFn);

      expect(logoutFn).not.toHaveBeenCalled();
    });
  });

  describe('refreshAccessToken', () => {
    it('should refresh token successfully', async () => {
      const { getToken } = await import('@/helpers/HelperAuth');

      // Mock a JWT token with caas_cyoda_employee claim
      const mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJjYWFzX2N5b2RhX2VtcGxveWVlIjp0cnVlLCJzdWIiOiIxMjM0NTY3ODkwIn0.X';
      vi.mocked(getToken).mockResolvedValue(mockToken);

      const { refreshAccessToken } = useAuthStore.getState();
      await refreshAccessToken();

      expect(getToken).toHaveBeenCalledWith({ cacheMode: 'off' });

      const state = useAuthStore.getState();
      expect(state.token).toBe(mockToken);
    });

    it('should handle token refresh errors', async () => {
      const { getToken } = await import('@/helpers/HelperAuth');
      const mockError = new Error('Token refresh failed');
      vi.mocked(getToken).mockRejectedValue(mockError);

      const { refreshAccessToken } = useAuthStore.getState();

      await expect(refreshAccessToken()).rejects.toThrow('Token refresh failed');
    });
  });

  describe('getGuestToken', () => {
    it('should fetch and save guest token', async () => {
      const mockGuestToken = 'guest-token-123';
      vi.mocked(publicClient.get).mockResolvedValue({
        data: { access_token: mockGuestToken },
      });

      const { getGuestToken } = useAuthStore.getState();
      const token = await getGuestToken();

      expect(publicClient.get).toHaveBeenCalledWith('/v1/get_guest_token');
      expect(token).toBe(mockGuestToken);

      const state = useAuthStore.getState();
      expect(state.token).toBe(mockGuestToken);
      expect(state.tokenType).toBe('public');
    });
  });

  describe('postTransferChats', () => {
    it('should transfer chats with guest token', async () => {
      const mockResponse = { success: true };
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockResponse });

      const { postTransferChats } = useAuthStore.getState();
      await postTransferChats('guest-token-123');

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/transfer', {
        guest_token: 'guest-token-123',
      });
    });

    it('should support transferAll parameter', async () => {
      const mockResponse = { success: true };
      vi.mocked(privateClient.post).mockResolvedValue({ data: mockResponse });

      const { postTransferChats } = useAuthStore.getState();
      await postTransferChats('guest-token-123', true);

      expect(privateClient.post).toHaveBeenCalledWith('/v1/chats/transfer', {
        guest_token: 'guest-token-123',
      });
    });
  });

  describe('toggleSuperUserMode', () => {
    it('should toggle super user mode when user is Cyoda employee', () => {
      useAuthStore.setState({ isCyodaEmployee: true, superUserMode: false });

      const { toggleSuperUserMode } = useAuthStore.getState();
      toggleSuperUserMode();

      expect(useAuthStore.getState().superUserMode).toBe(true);

      toggleSuperUserMode();
      expect(useAuthStore.getState().superUserMode).toBe(false);
    });

    it('should not toggle super user mode when user is not Cyoda employee', () => {
      useAuthStore.setState({ isCyodaEmployee: false, superUserMode: false });

      const { toggleSuperUserMode } = useAuthStore.getState();
      toggleSuperUserMode();

      expect(useAuthStore.getState().superUserMode).toBe(false);
    });
  });

  describe('setSelectedUserId', () => {
    it('should set selected user ID', () => {
      const { setSelectedUserId } = useAuthStore.getState();
      setSelectedUserId('user-789');

      expect(useAuthStore.getState().selectedUserId).toBe('user-789');
    });

    it('should update selected user ID', () => {
      useAuthStore.setState({ selectedUserId: 'old-user' });

      const { setSelectedUserId } = useAuthStore.getState();
      setSelectedUserId('new-user');

      expect(useAuthStore.getState().selectedUserId).toBe('new-user');
    });
  });
});
