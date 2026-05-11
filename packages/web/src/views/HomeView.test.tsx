import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import HomeView from './HomeView';

// Mock all dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key, i18n: { changeLanguage: vi.fn() } })
}));

vi.mock('@/stores/assistant', () => ({
  useAssistantStore: vi.fn(() => ({
    chatList: [],
    chatListReady: false,
    isLoadingChats: false,
    isLoadingMoreChats: false,
    hasMoreChats: false,
    isTransferringChats: false,
    fetchChats: vi.fn(),
    createChat: vi.fn(),
    getChats: vi.fn().mockResolvedValue([]),
    loadMoreChats: vi.fn(),
    deleteChatById: vi.fn(),
    postChats: vi.fn().mockResolvedValue({ data: { technical_id: 'test-id' } })
  }))
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    tokenType: 'private',
    token: 'test-token',
    isAuthenticated: true,
    user: { email: 'test@example.com' }
  }),
  useIsLoggedIn: () => true,
  useSuperUserMode: () => false
}));

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: vi.fn(),
    isLoading: false,
  })
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

const localStorageMock = {
  getItem: vi.fn(() => null),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'localStorage', { value: localStorageMock, writable: true });
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <HomeView />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });

  it('should not contain old AI Studio branding', () => {
    const { container } = render(
      <BrowserRouter>
        <HomeView />
      </BrowserRouter>
    );
    expect(container.textContent).not.toContain('Cyoda AI Studio');
    expect(container.textContent).not.toContain('BUILD WITH CYODA AI');
  });
});
