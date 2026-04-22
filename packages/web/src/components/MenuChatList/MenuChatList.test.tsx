import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import MenuChatList from './MenuChatList';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';

// Mock router
vi.mock('react-router-dom', () => ({
  useLocation: () => ({ pathname: '/chats' }),
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      if (key === 'menu_chat_list.empty.title') return 'No chats yet';
      if (key === 'menu_chat_list.empty.description') return 'Start a new chat to begin';
      return key;
    },
  }),
}));

// Mock assistant store
const mockGetChats = vi.fn();
const mockChats: any[] = [];

vi.mock('@/stores/assistant', () => ({
  useAssistantStore: () => ({
    getChats: mockGetChats,
    chats: mockChats,
  }),
}));

describe('MenuChatList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockChats.length = 0;
    mockGetChats.mockResolvedValue(undefined);
  });

  describe('loading state', () => {
    it('should show loading spinner initially', async () => {
      mockGetChats.mockImplementation(() => new Promise(() => {})); // Never resolves

      const { container } = render(<MenuChatList />);

      expect(container.querySelector('.ant-spin')).toBeInTheDocument();
    });

    it('should render with menu-chat-list class while loading', () => {
      mockGetChats.mockImplementation(() => new Promise(() => {}));

      const { container } = render(<MenuChatList />);

      const menuChatList = container.querySelector('.menu-chat-list');
      expect(menuChatList).toBeInTheDocument();
    });
  });

  describe('empty state', () => {
    it('should show empty state when no chats', async () => {
      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText('No chats yet')).toBeInTheDocument();
      });
    });

    it('should show empty description', async () => {
      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText('Start a new chat to begin')).toBeInTheDocument();
      });
    });

    it('should render Ant Design Empty component', async () => {
      const { container } = render(<MenuChatList />);

      await waitFor(() => {
        const emptyComponent = container.querySelector('.ant-empty');
        expect(emptyComponent).toBeInTheDocument();
      });
    });

    it('should use simple empty image', async () => {
      const { container } = render(<MenuChatList />);

      await waitFor(() => {
        const simpleImage = container.querySelector('.ant-empty-image');
        expect(simpleImage).toBeInTheDocument();
      });
    });
  });

  describe('chats list', () => {
    beforeEach(() => {
      mockChats.push(
        { id: 1, name: 'Chat 1' },
        { id: 2, name: 'Chat 2' },
        { id: 3, name: 'Chat 3' }
      );
    });

    it('should render chats when available', async () => {
      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText('Chat 1')).toBeInTheDocument();
        expect(screen.getByText('Chat 2')).toBeInTheDocument();
        expect(screen.getByText('Chat 3')).toBeInTheDocument();
      });
    });

    it('should render chat items with correct structure', async () => {
      const { container } = render(<MenuChatList />);

      await waitFor(() => {
        const items = container.querySelectorAll('.menu-chat-list__item');
        expect(items.length).toBe(3);
      });
    });

    it('should show "Untitled Chat" for chats without name', async () => {
      mockChats.push({ id: 4, name: null });

      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText('Untitled Chat')).toBeInTheDocument();
      });
    });

    it('should render each chat with unique key', async () => {
      const { container } = render(<MenuChatList />);

      await waitFor(() => {
        const items = container.querySelectorAll('.menu-chat-list__item');
        expect(items.length).toBe(3);
      });
    });
  });

  describe('onReady callback', () => {
    it('should call onReady after loading chats', async () => {
      const onReady = vi.fn();

      render(<MenuChatList onReady={onReady} />);

      await waitFor(() => {
        expect(onReady).toHaveBeenCalledTimes(1);
      });
    });

    it('should not error when onReady is not provided', async () => {
      expect(() => {
        render(<MenuChatList />);
      }).not.toThrow();

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalled();
      });
    });
  });

  describe('error handling', () => {
    it('should handle getChats error gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetChats.mockRejectedValue(new Error('Failed to load'));

      render(<MenuChatList />);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Failed to load chats:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should show empty state after error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetChats.mockRejectedValue(new Error('Failed to load'));

      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText('No chats yet')).toBeInTheDocument();
      });
    });

    it('should stop loading after error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockGetChats.mockRejectedValue(new Error('Failed to load'));

      const { container } = render(<MenuChatList />);

      await waitFor(() => {
        const spinner = container.querySelector('.ant-spin');
        expect(spinner).not.toBeInTheDocument();
      });
    });
  });

  describe('event bus integration', () => {
    it('should listen to UPDATE_CHAT_LIST event', async () => {
      const onSpy = vi.spyOn(eventBus, '$on');

      render(<MenuChatList />);

      await waitFor(() => {
        expect(onSpy).toHaveBeenCalledWith(UPDATE_CHAT_LIST, expect.any(Function));
      });
    });

    it('should reload chats when UPDATE_CHAT_LIST is emitted', async () => {
      render(<MenuChatList />);

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalledTimes(1);
      });

      mockGetChats.mockClear();

      eventBus.$emit(UPDATE_CHAT_LIST);

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalledTimes(1);
      });
    });

    it('should cleanup event listener on unmount', async () => {
      const offSpy = vi.spyOn(eventBus, '$off');

      const { unmount } = render(<MenuChatList />);

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalled();
      });

      unmount();

      expect(offSpy).toHaveBeenCalledWith(UPDATE_CHAT_LIST, expect.any(Function));
    });
  });

  describe('initial load', () => {
    it('should load chats on mount', async () => {
      render(<MenuChatList />);

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalledTimes(1);
      });
    });

    it('should call getChats from assistant store', async () => {
      render(<MenuChatList />);

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalled();
      });
    });
  });

  describe('onActive callback', () => {
    it('should accept onActive prop', () => {
      const onActive = vi.fn();

      expect(() => {
        render(<MenuChatList onActive={onActive} />);
      }).not.toThrow();
    });

    it('should not error when onActive is not provided', async () => {
      expect(() => {
        render(<MenuChatList />);
      }).not.toThrow();

      await waitFor(() => {
        expect(mockGetChats).toHaveBeenCalled();
      });
    });
  });

  describe('chats with various content', () => {
    it('should handle empty chat names', async () => {
      mockChats.push({ id: 1, name: '' });

      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText('Untitled Chat')).toBeInTheDocument();
      });
    });

    it('should render long chat names', async () => {
      const longName = 'A'.repeat(100);
      mockChats.push({ id: 1, name: longName });

      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText(longName)).toBeInTheDocument();
      });
    });

    it('should handle special characters in chat names', async () => {
      mockChats.push({ id: 1, name: '<script>alert("xss")</script>' });

      render(<MenuChatList />);

      await waitFor(() => {
        expect(screen.getByText('<script>alert("xss")</script>')).toBeInTheDocument();
      });
    });
  });
});
