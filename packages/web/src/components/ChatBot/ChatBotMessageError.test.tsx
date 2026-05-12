import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import ChatBotMessageError from './ChatBotMessageError';
import dayjs from 'dayjs';

// Mock useTextResponsiveContainer hook
vi.mock('@/hooks/useTextResponsiveContainer', () => ({
  useTextResponsiveContainer: () => ({
    className: 'mocked-responsive-class',
  }),
}));

describe('ChatBotMessageError', () => {
  const defaultMessage = {
    type: 'error',
    text: 'An error occurred',
  };

  describe('rendering', () => {
    it('should render error message text', () => {
      render(<ChatBotMessageError message={defaultMessage} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('should render ERROR badge', () => {
      render(<ChatBotMessageError message={defaultMessage} />);

      expect(screen.getByText('ERROR')).toBeInTheDocument();
    });

    it('should render with proper container structure', () => {
      const { container } = render(<ChatBotMessageError message={defaultMessage} />);

      const mainContainer = container.querySelector('.w-full.flex.justify-start');
      expect(mainContainer).toBeInTheDocument();
    });

    it('should render error icon', () => {
      const { container } = render(<ChatBotMessageError message={defaultMessage} />);

      // Lucide icons render as SVG
      const svgs = container.querySelectorAll('svg');
      expect(svgs.length).toBeGreaterThan(0);
    });
  });

  describe('date formatting', () => {
    it('should format date when last_modified is provided', () => {
      const message = {
        ...defaultMessage,
        last_modified: '2024-01-15T10:30:00Z',
      };

      render(<ChatBotMessageError message={message} />);

      const formattedDate = dayjs(message.last_modified).format('DD/MM/YYYY HH:mm:ss');
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('should use current date when last_modified is not provided', () => {
      render(<ChatBotMessageError message={defaultMessage} />);

      const currentDate = dayjs().format('DD/MM/YYYY HH:mm:ss');
      expect(screen.getByText(currentDate)).toBeInTheDocument();
    });

    it('should display date next to ERROR badge', () => {
      const message = {
        ...defaultMessage,
        last_modified: '2024-01-15T10:30:00Z',
      };

      const { container } = render(<ChatBotMessageError message={message} />);

      const badgeContainer = container.querySelector('.flex.items-center.space-x-2');
      expect(badgeContainer).toBeInTheDocument();
      expect(badgeContainer?.querySelector('.text-xs.text-slate-500')).toBeInTheDocument();
    });
  });

  describe('message content', () => {
    it('should display simple error messages', () => {
      const message = {
        ...defaultMessage,
        text: 'Simple error',
      };

      render(<ChatBotMessageError message={message} />);

      expect(screen.getByText('Simple error')).toBeInTheDocument();
    });

    it('should display multiline error messages', () => {
      const message = {
        ...defaultMessage,
        text: 'Error line 1\nError line 2\nError line 3',
      };

      render(<ChatBotMessageError message={message} />);

      expect(screen.getByText(/Error line 1/)).toBeInTheDocument();
    });

    it('should display long error messages', () => {
      const longError = 'A'.repeat(500);
      const message = {
        ...defaultMessage,
        text: longError,
      };

      render(<ChatBotMessageError message={message} />);

      expect(screen.getByText(longError)).toBeInTheDocument();
    });

    it('should handle error messages with special characters', () => {
      const message = {
        ...defaultMessage,
        text: 'Error: <script>alert("test")</script>',
      };

      render(<ChatBotMessageError message={message} />);

      expect(screen.getByText(/Error.*script/)).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have error badge with red styling classes', () => {
      const { container } = render(<ChatBotMessageError message={defaultMessage} />);

      const badge = container.querySelector('.bg-red-50');
      expect(badge).toBeInTheDocument();
    });

    it('should have gradient avatar background', () => {
      const { container } = render(<ChatBotMessageError message={defaultMessage} />);

      const avatar = container.querySelector('.bg-gradient-to-r.from-red-500.to-red-600');
      expect(avatar).toBeInTheDocument();
    });

    it('should have responsive padding classes', () => {
      const { container } = render(<ChatBotMessageError message={defaultMessage} />);

      const mainDiv = container.querySelector('.px-4.md\\:px-6.lg\\:px-8');
      expect(mainDiv).toBeInTheDocument();
    });

    it('should have rounded avatar', () => {
      const { container } = render(<ChatBotMessageError message={defaultMessage} />);

      const avatar = container.querySelector('.rounded-full');
      expect(avatar).toBeInTheDocument();
    });
  });

  describe('responsive container hook integration', () => {
    it('should use useTextResponsiveContainer hook', () => {
      const { container } = render(<ChatBotMessageError message={defaultMessage} />);

      const responsiveElement = container.querySelector('.mocked-responsive-class');
      expect(responsiveElement).toBeInTheDocument();
    });

    it('should pass message text to hook', () => {
      const message = {
        ...defaultMessage,
        text: 'Test error for hook',
      };

      render(<ChatBotMessageError message={message} />);

      expect(screen.getByText('Test error for hook')).toBeInTheDocument();
    });
  });

  describe('raw data', () => {
    it('should handle message with raw data', () => {
      const message = {
        ...defaultMessage,
        raw: { code: 500, details: 'Server error' },
      };

      render(<ChatBotMessageError message={message} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });

    it('should render without raw data', () => {
      render(<ChatBotMessageError message={defaultMessage} />);

      expect(screen.getByText('An error occurred')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty error text', () => {
      const message = {
        ...defaultMessage,
        text: '',
      };

      const { container } = render(<ChatBotMessageError message={message} />);

      expect(container.querySelector('.text-red-700')).toBeInTheDocument();
    });

    it('should handle very long dates', () => {
      const message = {
        ...defaultMessage,
        last_modified: '2024-12-31T23:59:59.999Z',
      };

      render(<ChatBotMessageError message={message} />);

      const formattedDate = dayjs(message.last_modified).format('DD/MM/YYYY HH:mm:ss');
      expect(screen.getByText(formattedDate)).toBeInTheDocument();
    });

    it('should handle invalid date format gracefully', () => {
      const message = {
        ...defaultMessage,
        last_modified: 'invalid-date',
      };

      const { container } = render(<ChatBotMessageError message={message} />);

      // Should still render without crashing
      expect(container.querySelector('.text-xs.text-slate-500')).toBeInTheDocument();
    });
  });
});
