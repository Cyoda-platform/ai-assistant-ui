import React from 'react';
import { render, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

const testState = vi.hoisted(() => ({
  navigateMock: vi.fn(),
  getAccessTokenSilentlyMock: vi.fn(),
  saveDataMock: vi.fn(),
  getChatsMock: vi.fn(),
  setIsTransferringChatsMock: vi.fn(),
  setGuestChatsExistMock: vi.fn(),
  helperStorageGetMock: vi.fn(),
  helperStorageRemoveItemMock: vi.fn(),
  handleFirstVisitMock: vi.fn(() => null),
  locationMock: { pathname: '/', search: '' },
  authStoreState: { token: '', tokenType: '', saveData: vi.fn() } as any,
  assistantStoreState: {
    getChats: vi.fn(),
    setIsTransferringChats: vi.fn(),
    setGuestChatsExist: vi.fn(),
  } as any,
}));

vi.mock('react-router-dom', () => ({
  useLocation: () => testState.locationMock,
  useNavigate: () => testState.navigateMock,
  Outlet: () => <div data-testid="outlet" />,
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    user: { sub: 'user-1', email: 'user@example.com' },
    getAccessTokenSilently: testState.getAccessTokenSilentlyMock,
    isAuthenticated: true,
    isLoading: false,
    error: undefined,
  }),
}));

vi.mock('./stores/auth', () => {
  const useAuthStore = Object.assign(() => testState.authStoreState, {
    getState: () => testState.authStoreState,
  });
  return { useAuthStore };
});

vi.mock('./stores/assistant', () => ({
  useAssistantStore: () => testState.assistantStoreState,
}));

vi.mock('./components/ErrorBoundary/ErrorBoundary', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('./components/LoginPopUp/LoginPopUp', () => ({ default: () => <div /> }));
vi.mock('./components/ChatBot/ChatBotRenameDialog', () => ({ default: () => <div /> }));
vi.mock('./components/ConfirmationDialog/ConfirmationDialog', () => ({ default: () => <div /> }));

vi.mock('./helpers/HelperStorage', () => ({
  default: class HelperStorage {
    get = testState.helperStorageGetMock;
    removeItem = testState.helperStorageRemoveItemMock;
  }
}));

vi.mock('./helpers/HelperConstants', () => ({
  LOGIN_REDIRECT_URL: 'login-redirect-url',
}));

vi.mock('./helpers/HelperIframe', () => ({ isInIframe: false }));
vi.mock('./helpers/HelperAuth', () => ({ setTokenGetter: vi.fn() }));
vi.mock('./helpers/HelperTheme', () => ({ useDetectTheme: () => vi.fn() }));
vi.mock('./router', () => ({ useNavigationGuards: () => ({ handleFirstVisit: testState.handleFirstVisitMock }) }));
vi.mock('./utils/clearTestData', () => ({ initializeCleanState: vi.fn() }));

const buildJwt = (payload: Record<string, unknown>) => `header.${btoa(JSON.stringify(payload))}.signature`;

describe('App post-login redirect', () => {
  beforeEach(() => {
    testState.navigateMock.mockReset();
    testState.getAccessTokenSilentlyMock.mockReset();
    testState.saveDataMock.mockReset();
    testState.getChatsMock.mockReset();
    testState.setIsTransferringChatsMock.mockReset();
    testState.setGuestChatsExistMock.mockReset();
    testState.helperStorageGetMock.mockReset();
    testState.helperStorageRemoveItemMock.mockReset();
    testState.handleFirstVisitMock.mockClear();

    testState.locationMock = { pathname: '/', search: '' };
    testState.authStoreState = { token: '', tokenType: '', saveData: testState.saveDataMock };
    testState.assistantStoreState = {
      getChats: testState.getChatsMock,
      setIsTransferringChats: testState.setIsTransferringChatsMock,
      setGuestChatsExist: testState.setGuestChatsExistMock,
    };

    testState.getAccessTokenSilentlyMock.mockResolvedValue(buildJwt({ caas_cyoda_employee: false }));
    testState.getChatsMock.mockResolvedValue(undefined);
    testState.helperStorageGetMock.mockImplementation((_key: string, fallback: string) => fallback);
  });

  it('does not navigate again when already on the target route', async () => {
    render(<App />);

    await waitFor(() => {
      expect(testState.getChatsMock).toHaveBeenCalled();
    });

    expect(testState.navigateMock).not.toHaveBeenCalled();
  });

  it('navigates to the stored return route when on a different page', async () => {
    testState.locationMock = { pathname: '/welcome', search: '' };
    testState.helperStorageGetMock.mockReturnValue('/');

    render(<App />);

    await waitFor(() => {
      expect(testState.navigateMock).toHaveBeenCalledWith('/', { replace: true });
    });

    expect(testState.navigateMock).toHaveBeenCalledBefore(testState.getChatsMock);
  });
});
