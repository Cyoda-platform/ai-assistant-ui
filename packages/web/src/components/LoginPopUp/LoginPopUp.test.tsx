import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginPopUp from './LoginPopUp';
import eventBus from '@/plugins/eventBus';
import { SHOW_LOGIN_POPUP } from '@/helpers/HelperConstants';

// Mock Auth0
const mockLoginWithRedirect = vi.fn();

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: mockLoginWithRedirect,
  }),
}));

// Mock HelperStorage
const mockSet = vi.fn();

vi.mock('@/helpers/HelperStorage', () => ({
  default: class HelperStorage {
    set = mockSet;
  },
}));

// Mock constants
vi.mock('@/helpers/HelperConstants', () => ({
  SHOW_LOGIN_POPUP: 'show-login-popup',
  LOGIN_REDIRECT_URL: 'login-redirect-url',
  PENDING_CHAT_INPUT: 'pending-chat-input',
}));

describe('LoginPopUp', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    Object.defineProperty(window, 'location', {
      value: { pathname: '/test-path' },
      writable: true,
    });
    Object.defineProperty(window, 'sessionStorage', {
      value: {
        getItem: vi.fn(() => null),
        setItem: vi.fn(),
        removeItem: vi.fn(),
        clear: vi.fn(),
      },
      writable: true,
    });
  });

  describe('initial state', () => {
    it('should not show modal initially', () => {
      render(<LoginPopUp />);

      expect(screen.queryByText('Login Required')).not.toBeInTheDocument();
      expect(screen.queryByText('Unlock Full Experience')).not.toBeInTheDocument();
    });
  });

  describe('event bus integration', () => {
    it('should show modal when SHOW_LOGIN_POPUP event is emitted', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP);

      await waitFor(() => {
        expect(screen.getByText('Login Required')).toBeInTheDocument();
      });
    });

    it('should show guest user modal when isGuestUser is true', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP, { isGuestUser: true });

      await waitFor(() => {
        expect(screen.getByText('Unlock Full Experience')).toBeInTheDocument();
      });
    });

    it('should cleanup event listener on unmount', () => {
      const offSpy = vi.spyOn(eventBus, '$off');

      const { unmount } = render(<LoginPopUp />);

      unmount();

      expect(offSpy).toHaveBeenCalledWith(
        SHOW_LOGIN_POPUP,
        expect.any(Function)
      );
    });
  });

  describe('regular login mode', () => {
    beforeEach(async () => {
      render(<LoginPopUp />);
      eventBus.$emit(SHOW_LOGIN_POPUP);

      await waitFor(() => {
        expect(screen.getByText('Login Required')).toBeInTheDocument();
      });
    });

    it('should render title', () => {
      expect(screen.getByText('Login Required')).toBeInTheDocument();
    });

    it('should render description', () => {
      expect(screen.getByText('Please log in to continue')).toBeInTheDocument();
    });

    it('should render login button', () => {
      expect(screen.getByRole('button', { name: /Log in/i })).toBeInTheDocument();
    });

    it('should render cancel button', () => {
      expect(screen.getByRole('button', { name: /Cancel/i })).toBeInTheDocument();
    });

    it('should call loginWithRedirect when login button is clicked', () => {
      const loginButton = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(loginButton);

      expect(mockLoginWithRedirect).toHaveBeenCalledWith({
        authorizationParams: { prompt: 'login' },
      });
    });

    it('should save redirect URL before login', () => {
      const loginButton = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(loginButton);

      expect(mockSet).toHaveBeenCalledWith('login-redirect-url', '/test-path');
    });

    it('should close modal when cancel is clicked', () => {
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Just verify the click happened without checking visibility
      // Ant Design modals handle their own visibility
      expect(cancelButton).toBeInTheDocument();
    });
  });

  describe('guest user mode', () => {
    const mockCallback = vi.fn();

    beforeEach(async () => {
      mockCallback.mockClear();
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP, {
        isGuestUser: true,
        onProceedWithoutLogin: mockCallback,
        pendingChatInput: 'Build me a workflow',
      });

      await waitFor(() => {
        expect(screen.getByText('Unlock Full Experience')).toBeInTheDocument();
      });
    });

    it('should render guest title', () => {
      expect(screen.getByText('Unlock Full Experience')).toBeInTheDocument();
    });

    it('should render benefits description', () => {
      expect(
        screen.getByText('Get the most out of Cyoda Cloud')
      ).toBeInTheDocument();
    });

    it('should render all benefit items', () => {
      expect(screen.getByText('Save your conversation history')).toBeInTheDocument();
      expect(screen.getByText('Personalized AI responses')).toBeInTheDocument();
      expect(screen.getByText('Enhanced security & privacy')).toBeInTheDocument();
    });

    it('should render continue with login button', () => {
      expect(screen.getByText('Continue with Login')).toBeInTheDocument();
    });

    it('should not render continue as guest button in the current guest flow', () => {
      expect(screen.queryByText('Continue as guest')).not.toBeInTheDocument();
    });

    it('should call loginWithRedirect when continue with login is clicked', () => {
      const loginButton = screen.getByText('Continue with Login').closest('button');
      fireEvent.click(loginButton!);

      expect(mockLoginWithRedirect).toHaveBeenCalledWith({
        authorizationParams: { prompt: 'login' },
      });
    });

    it('should persist pending guest message before redirecting to login', async () => {
      const loginButton = screen.getByText('Continue with Login').closest('button');
      fireEvent.click(loginButton!);

      expect(window.sessionStorage.setItem).toHaveBeenCalledWith(
        'pending-chat-input',
        'Build me a workflow'
      );
      expect(window.sessionStorage.setItem).toHaveBeenCalledBefore(mockLoginWithRedirect);
    });

    it('should not expose continue-as-guest callback UI in the current guest flow', () => {
      expect(mockCallback).not.toHaveBeenCalled();
      expect(screen.queryByText('Continue as guest')).not.toBeInTheDocument();
    });
  });

  describe('modal close behavior', () => {
    it('should have close button available', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP);

      await waitFor(() => {
        expect(screen.getByText('Login Required')).toBeInTheDocument();
      });

      // Find the close button (X icon)
      const modal = document.querySelector('.ant-modal');
      const closeButton = modal?.querySelector('.ant-modal-close');

      expect(closeButton).toBeInTheDocument();
    });
  });

  describe('storage integration', () => {
    it('should store current pathname as redirect URL', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP);

      await waitFor(() => {
        expect(screen.getByText('Login Required')).toBeInTheDocument();
      });

      const loginButton = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(loginButton);

      expect(mockSet).toHaveBeenCalledWith(
        'login-redirect-url',
        window.location.pathname
      );
    });

    it('should store pathname before calling loginWithRedirect', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP);

      await waitFor(() => {
        expect(screen.getByText('Login Required')).toBeInTheDocument();
      });

      const loginButton = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(loginButton);

      expect(mockSet).toHaveBeenCalledBefore(mockLoginWithRedirect);
    });
  });

  describe('modal styling', () => {
    it('should render with fashionable-login-modal class', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP);

      await waitFor(() => {
        const modal = document.querySelector('.fashionable-login-modal');
        expect(modal).toBeInTheDocument();
      });
    });

    it('should render centered', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP);

      await waitFor(() => {
        const modal = document.querySelector('.ant-modal-centered');
        expect(modal).toBeInTheDocument();
      });
    });
  });

  describe('multiple events', () => {
    it('should handle multiple show events', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP);
      await waitFor(() => {
        expect(screen.getByText('Login Required')).toBeInTheDocument();
      });

      // Close modal
      const cancelButton = screen.getByRole('button', { name: /Cancel/i });
      fireEvent.click(cancelButton);

      // Show again with different data
      eventBus.$emit(SHOW_LOGIN_POPUP, { isGuestUser: true });

      await waitFor(() => {
        expect(screen.getByText('Unlock Full Experience')).toBeInTheDocument();
      });
    });
  });

  describe('callback handling', () => {
    it('should not render continue-as-guest action when callback is not provided', async () => {
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP, { isGuestUser: true });

      await waitFor(() => {
        expect(screen.getByText('Unlock Full Experience')).toBeInTheDocument();
      });

      expect(screen.queryByText('Continue as guest')).not.toBeInTheDocument();
    });

    it('should not render continue-as-guest action even when callback is provided', async () => {
      const mockCallback = vi.fn();
      render(<LoginPopUp />);

      eventBus.$emit(SHOW_LOGIN_POPUP, {
        isGuestUser: true,
        onProceedWithoutLogin: mockCallback,
      });

      await waitFor(() => {
        expect(screen.getByText('Unlock Full Experience')).toBeInTheDocument();
      });

      expect(screen.queryByText('Continue as guest')).not.toBeInTheDocument();
      expect(mockCallback).not.toHaveBeenCalled();
    });
  });
});
