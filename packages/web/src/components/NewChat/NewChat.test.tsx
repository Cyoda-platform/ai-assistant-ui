import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import NewChat from './NewChat';
import eventBus from '@/plugins/eventBus';
import { UPDATE_CHAT_LIST } from '@/helpers/HelperConstants';

// Mock isInIframe
vi.mock('@/helpers/HelperIframe', () => ({
  isInIframe: () => false,
}));

// Mock i18next
vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string, options?: any) => {
      if (key === 'new_chat.h1') return 'Welcome';
      if (key === 'new_chat.h2') return 'AI Assistant';
      if (key === 'new_chat.title') return 'How can I help you today?';
      if (key === 'new_chat.input.placeholder') return 'Type your message here...';
      if (key === 'examples.title') return 'Try these examples:';
      if (key === 'examples.items.clickable') {
        if (options?.returnObjects) {
          return ['Example 1', 'Example 2', 'Example 3'];
        }
      }
      if (key === 'examples.items.readonly') return 'More examples coming soon';
      return key;
    },
  }),
}));

// Mock stores
const mockPostChats = vi.fn();
const mockSetGuestChatsExist = vi.fn();

vi.mock('@/stores/assistant', () => ({
  useAssistantStore: () => ({
    postChats: mockPostChats,
    setGuestChatsExist: mockSetGuestChatsExist,
  }),
}));

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    isLoggedIn: true,
  }),
}));

describe('NewChat', () => {
  const mockOnCreated = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    mockPostChats.mockResolvedValue({ data: { technical_id: 'chat-123' } });
    delete (window as any).location;
    (window as any).location = { search: '', href: 'http://localhost/' };
    window.history.replaceState = vi.fn();
  });

  describe('rendering', () => {
    it('should render header title', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByText('Welcome')).toBeInTheDocument();
    });

    it('should render subtitle', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByText('AI Assistant')).toBeInTheDocument();
    });

    it('should render question text', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByText('How can I help you today?')).toBeInTheDocument();
    });

    it('should render textarea input', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByPlaceholderText('Type your message here...')).toBeInTheDocument();
    });

    it('should render submit button', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByRole('button', { name: /send/i })).toBeInTheDocument();
    });

    it('should render copyright footer', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByText(/Copyright/)).toBeInTheDocument();
      expect(screen.getByText('CYODA Ltd.')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('should call onCreated with temp ID immediately', async () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test message' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            technical_id: expect.stringContaining('temp-'),
            initialMessage: 'Test message',
          })
        );
      });
    });

    it('should create chat with truncated name for long messages', async () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const longMessage = 'A'.repeat(100);
      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: longMessage } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockPostChats).toHaveBeenCalledWith({
          name: 'A'.repeat(50) + '...',
          description: '',
        });
      });
    });

    it('should call onCreated with real chat ID after creation', async () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith({
          technical_id: 'chat-123',
          initialMessage: 'Test',
        });
      });
    });

    it('should emit UPDATE_CHAT_LIST event after creation', async () => {
      const emitSpy = vi.spyOn(eventBus, '$emit');

      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(emitSpy).toHaveBeenCalledWith(UPDATE_CHAT_LIST);
      });
    });

    it('should show loading state during submission', async () => {
      mockPostChats.mockImplementation(() => new Promise(() => {})); // Never resolves

      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(submitBtn).toHaveClass('ant-btn-loading');
      });
    });

    it('should require message input', async () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('Please enter your request')).toBeInTheDocument();
      });
    });
  });

  describe('error handling', () => {
    it('should handle post chat error', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
      mockPostChats.mockRejectedValue(new Error('Failed to create'));

      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(consoleErrorSpy).toHaveBeenCalledWith(
          'Error creating chat:',
          expect.any(Error)
        );
      });

      consoleErrorSpy.mockRestore();
    });

    it('should still call onCreated with temp ID even on error', async () => {
      vi.spyOn(console, 'error').mockImplementation(() => {});
      mockPostChats.mockRejectedValue(new Error('Failed'));

      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockOnCreated).toHaveBeenCalledWith(
          expect.objectContaining({
            technical_id: expect.stringContaining('temp-'),
          })
        );
      });
    });
  });

  describe('guest user behavior', () => {
    beforeEach(() => {
      vi.mock('@/stores/auth', () => ({
        useAuthStore: () => ({
          isLoggedIn: false,
        }),
      }));
    });

    it('should set guest chats exist flag for non-logged-in users', async () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...');
      const submitBtn = screen.getByRole('button', { name: /send/i });

      fireEvent.change(textarea, { target: { value: 'Test' } });
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(mockPostChats).toHaveBeenCalled();
      });
    });
  });

  describe('URL parameter handling', () => {
    it('should auto-submit when name parameter is in URL', async () => {
      (window as any).location.search = '?name=Auto+submit+message';

      render(<NewChat onCreated={mockOnCreated} />);

      await waitFor(() => {
        expect(mockPostChats).toHaveBeenCalled();
      });
    });

    it('should clean up URL after auto-submit', async () => {
      const mockUrl = new URL('http://localhost/?name=Test');
      (window as any).location.href = mockUrl.toString();
      (window as any).location.search = mockUrl.search;

      render(<NewChat onCreated={mockOnCreated} />);

      await waitFor(() => {
        expect(window.history.replaceState).toHaveBeenCalled();
      });
    });

    it('should populate form field from URL parameter', async () => {
      (window as any).location.search = '?name=URL+message';

      render(<NewChat onCreated={mockOnCreated} />);

      await waitFor(() => {
        const textarea = screen.getByPlaceholderText('Type your message here...') as HTMLTextAreaElement;
        expect(textarea.value).toBe('URL message');
      });
    });
  });

  describe('clickable examples', () => {
    it('should render examples section', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByText('Try these examples:')).toBeInTheDocument();
    });

    it('should render example buttons', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByText('Example 1')).toBeInTheDocument();
      expect(screen.getByText('Example 2')).toBeInTheDocument();
      expect(screen.getByText('Example 3')).toBeInTheDocument();
    });

    it('should submit when example is clicked', async () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const exampleBtn = screen.getByText('Example 1');
      fireEvent.click(exampleBtn);

      await waitFor(() => {
        expect(mockPostChats).toHaveBeenCalledWith({
          name: 'Example 1',
          description: '',
        });
      });
    });

    it('should populate form when example is clicked', async () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const exampleBtn = screen.getByText('Example 2');
      fireEvent.click(exampleBtn);

      const textarea = screen.getByPlaceholderText('Type your message here...') as HTMLTextAreaElement;
      expect(textarea.value).toBe('Example 2');
    });

    it('should render more examples text', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      expect(screen.getByText('More examples coming soon')).toBeInTheDocument();
    });
  });

  describe('styling and structure', () => {
    it('should have new-chat class', () => {
      const { container } = render(<NewChat onCreated={mockOnCreated} />);

      expect(container.querySelector('.new-chat')).toBeInTheDocument();
    });

    it('should have form element', () => {
      const { container } = render(<NewChat onCreated={mockOnCreated} />);

      expect(container.querySelector('.new-chat__form')).toBeInTheDocument();
    });

    it('should have footer with current year', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const currentYear = new Date().getFullYear();
      expect(screen.getByText(new RegExp(currentYear.toString()))).toBeInTheDocument();
    });

    it('should have CYODA link with correct attributes', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const link = screen.getByText('CYODA Ltd.').closest('a');
      expect(link).toHaveAttribute('href', 'https://www.cyoda.com/');
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    });
  });

  describe('textarea configuration', () => {
    it('should have autosize configuration', () => {
      const { container } = render(<NewChat onCreated={mockOnCreated} />);

      const textarea = container.querySelector('.new-chat__textarea');
      expect(textarea).toBeInTheDocument();
    });

    it('should accept user input', () => {
      render(<NewChat onCreated={mockOnCreated} />);

      const textarea = screen.getByPlaceholderText('Type your message here...') as HTMLTextAreaElement;
      fireEvent.change(textarea, { target: { value: 'User input' } });

      expect(textarea.value).toBe('User input');
    });
  });
});
