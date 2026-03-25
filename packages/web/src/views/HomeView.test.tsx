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
    chats: [],
    isLoading: false,
    fetchChats: vi.fn(),
    createChat: vi.fn(),
    getChats: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    tokenType: 'private',
    isAuthenticated: true,
    user: { email: 'test@example.com' }
  }),
  useSuperUserMode: () => ({ isSuperUser: false, toggleSuperUser: vi.fn() })
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

vi.mock('@/components/ResizeHandle/ResizeHandle', () => ({
  default: () => <div data-testid="resize-handle">ResizeHandle</div>
}));

vi.mock('@/components/LoadingSpinner/LoadingSpinner', () => ({
  default: () => <div data-testid="loading">Loading</div>
}));

describe('HomeView', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <HomeView />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
