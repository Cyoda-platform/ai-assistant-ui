import React from 'react';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import HomeView from './HomeView';
import { LOGIN_REDIRECT_URL, PENDING_CHAT_INPUT } from '@/helpers/HelperConstants';
import eventBus from '@/plugins/eventBus';

const testState = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  loginWithRedirectMock: vi.fn(),
  helperStorageSetMock: vi.fn(),
  assistantStore: {
    chatList: [],
    chatListReady: false,
    isLoadingChats: false,
    isLoadingMoreChats: false,
    hasMoreChats: false,
    isTransferringChats: false,
    getChats: vi.fn().mockResolvedValue([]),
    loadMoreChats: vi.fn(),
    deleteChatById: vi.fn(),
    postChats: vi.fn().mockResolvedValue({ data: { technical_id: 'chat-123' } }),
  },
  authStore: {
    tokenType: '',
    token: '',
    family_name: 'User',
    given_name: 'Test',
    isCyodaEmployee: false,
  },
  isLoggedIn: false,
}));

const sessionStorageState = new Map<string, string>();
const localStorageState = new Map<string, string>();

vi.mock('react-router-dom', () => ({
  useNavigate: () => testState.navigateMock,
  useSearchParams: () => [new URLSearchParams(), vi.fn()],
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: testState.loginWithRedirectMock,
    isLoading: false,
  }),
}));

vi.mock('@/stores/assistant', () => ({
  useAssistantStore: (selector?: (state: any) => any) => {
    const state = testState.assistantStore;
    return selector ? selector(state) : state;
  },
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => testState.authStore,
  useIsLoggedIn: () => testState.isLoggedIn,
  useSuperUserMode: () => false,
}));

vi.mock('@/helpers/HelperStorage', () => ({
  default: class HelperStorage {
    set = testState.helperStorageSetMock;
  }
}));

vi.mock('@/plugins/eventBus', () => ({
  default: { $on: vi.fn(), $off: vi.fn(), $emit: vi.fn() }
}));

vi.mock('@/helpers/HelperChatGroups', () => ({
  groupChatsByDate: vi.fn(() => [])
}));

vi.mock('@/components/Header/Header', () => ({
  default: () => <div data-testid="header">Header</div>
}));

vi.mock('@/components/ChatHistoryPanel/ChatHistoryPanel', () => ({
  default: () => <div data-testid="chat-history">ChatHistory</div>
}));

vi.mock('@/components/EnvironmentsPanel/EnvironmentsPanel', () => ({
  default: () => <div data-testid="environments">Environments</div>
}));

vi.mock('@/hooks/useResizablePanel', () => ({
  useResizablePanel: () => ({
    width: 300,
    isResizing: false,
    handleMouseDown: vi.fn()
  })
}));

describe('HomeView pending message flow', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sessionStorageState.clear();
    localStorageState.clear();

    testState.authStore = {
      tokenType: '',
      token: '',
      family_name: 'User',
      given_name: 'Test',
      isCyodaEmployee: false,
    };
    testState.isLoggedIn = false;
    testState.assistantStore.isLoadingChats = false;
    testState.assistantStore.isLoadingMoreChats = false;
    testState.assistantStore.hasMoreChats = false;
    testState.assistantStore.isTransferringChats = false;
    testState.assistantStore.getChats.mockResolvedValue([]);
    testState.assistantStore.postChats.mockResolvedValue({ data: { technical_id: 'chat-123' } });

    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn((key: string) => sessionStorageState.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => sessionStorageState.set(key, value)),
        removeItem: vi.fn((key: string) => sessionStorageState.delete(key)),
        clear: vi.fn(() => sessionStorageState.clear()),
      },
      writable: true,
    });

    Object.defineProperty(window, 'localStorage', {
      value: {
        getItem: vi.fn((key: string) => localStorageState.get(key) ?? null),
        setItem: vi.fn((key: string, value: string) => localStorageState.set(key, value)),
        removeItem: vi.fn((key: string) => localStorageState.delete(key)),
        clear: vi.fn(() => localStorageState.clear()),
      },
      writable: true,
    });
  });

  it('stores the typed message and starts login for unauthenticated users', async () => {
    render(<HomeView />);

    fireEvent.change(screen.getByPlaceholderText(/Ask the assistant/i), {
      target: { value: 'Build me a payment workflow' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Send/i }).closest('form')!);

    expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
      PENDING_CHAT_INPUT,
      'Build me a payment workflow'
    );
    expect(testState.helperStorageSetMock).toHaveBeenCalledWith(LOGIN_REDIRECT_URL, '/');
    expect(testState.loginWithRedirectMock).toHaveBeenCalledWith({
      authorizationParams: { prompt: 'login' }
    });
  });

  it('restores a pending message after login and opens the created chat', async () => {
    sessionStorageState.set(PENDING_CHAT_INPUT, 'Explain this entity lifecycle');
    testState.authStore = {
      tokenType: 'private',
      token: 'private-token',
      family_name: 'User',
      given_name: 'Test',
      isCyodaEmployee: false,
    };
    testState.isLoggedIn = true;

    render(<HomeView />);

    await waitFor(() => {
      expect(testState.assistantStore.postChats).toHaveBeenCalledWith({
        name: 'Explain this entity lifecycle',
        description: ''
      });
    });

    expect(window.sessionStorage.removeItem).toHaveBeenCalledWith(PENDING_CHAT_INPUT);
    expect(window.localStorage.setItem).toHaveBeenCalledWith(
      'initial-message-chat-123',
      'Explain this entity lifecycle'
    );
    expect(testState.navigateMock).toHaveBeenNthCalledWith(
      1,
      expect.stringMatching(/^\/chat\/temp-.*\?openCanvas=true&creating=true$/)
    );
    expect(testState.navigateMock).toHaveBeenNthCalledWith(
      2,
      '/chat/chat-123?openCanvas=true',
      { replace: true }
    );
  });

  it('passes the guest typed message into the login popup payload', async () => {
    testState.authStore = {
      tokenType: 'public',
      token: 'header.eyJjYWFzX29yZ19pZCI6Imd1ZXN0LXRlc3QifQ==.signature',
      family_name: 'User',
      given_name: 'Test',
      isCyodaEmployee: false,
    };

    render(<HomeView />);

    fireEvent.change(screen.getByPlaceholderText(/Ask the assistant/i), {
      target: { value: 'Create an approval workflow' },
    });
    fireEvent.submit(screen.getByRole('button', { name: /Send/i }).closest('form')!);

    expect(eventBus.$emit).toHaveBeenCalledWith(
      'showLoginPopUp',
      expect.objectContaining({
        isGuestUser: true,
        pendingChatInput: 'Create an approval workflow',
        onProceedWithoutLogin: expect.any(Function),
      })
    );
  });
});
