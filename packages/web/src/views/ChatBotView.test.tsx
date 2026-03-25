import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import ChatBotView from './ChatBotView';

// Mock all dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('@/stores/assistant', () => ({
  useAssistantStore: vi.fn((selector) => {
    const state = {
      chats: [],
      chatList: [],
      currentChat: null,
      isLoading: false,
      isLoadingChats: false,
      chatListReady: true,
      isTransferringChats: false,
      fetchChatById: vi.fn()
    };
    return selector ? selector(state) : state;
  })
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    tokenType: 'private',
    isAuthenticated: true
  }),
  useSuperUserMode: () => ({ isSuperUser: false })
}));

vi.mock('@/components/ChatBot/ChatBot', () => ({
  default: () => <div data-testid="chatbot">ChatBot</div>
}));

vi.mock('@/components/Header/Header', () => ({
  default: () => <div>Header</div>
}));

vi.mock('@/hooks/useAppTabs', () => ({
  useAppTabs: () => ({
    getActiveTab: vi.fn(),
    updateTab: vi.fn()
  })
}));

vi.mock('@/hooks/useResizablePanel', () => ({
  useResizablePanel: () => ({
    width: 300,
    isResizing: false,
    handleMouseDown: vi.fn()
  })
}));

vi.mock('@/hooks/useWorkflowExampleDetection', () => ({
  useWorkflowExampleDetection: () => ({
    isWorkflowExample: false
  })
}));

describe('ChatBotView', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter initialEntries={['/chat/123']}>
        <ChatBotView />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
