import { describe, it, expect, vi } from 'vitest';
import { render } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import FintechHomeView from './FintechHomeView';

// Mock all dependencies
vi.mock('react-i18next', () => ({
  useTranslation: () => ({ t: (key: string) => key })
}));

vi.mock('@/stores/assistant', () => ({
  useAssistantStore: vi.fn(() => ({
    chats: [],
    isLoading: false,
    fetchChats: vi.fn(),
    getChats: vi.fn().mockResolvedValue([])
  }))
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    tokenType: 'private',
    isAuthenticated: true
  }),
  useSuperUserMode: () => ({ isSuperUser: false })
}));

vi.mock('@/components/Header/Header', () => ({
  default: () => <div>Header</div>
}));

vi.mock('@/components/ChatHistoryPanel/ChatHistoryPanel', () => ({
  default: () => <div>ChatHistory</div>
}));

vi.mock('@/components/EnvironmentsPanel/EnvironmentsPanel', () => ({
  default: () => <div>Environments</div>
}));

vi.mock('@/hooks/useResizablePanel', () => ({
  useResizablePanel: () => ({
    width: 300,
    isResizing: false,
    handleMouseDown: vi.fn()
  })
}));

describe('FintechHomeView', () => {
  it('should render without crashing', () => {
    const { container } = render(
      <BrowserRouter>
        <FintechHomeView />
      </BrowserRouter>
    );
    expect(container).toBeTruthy();
  });
});
