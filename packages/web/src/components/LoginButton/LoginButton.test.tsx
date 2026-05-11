import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import LoginButton from './LoginButton';

// Mock Auth0
const mockLoginWithRedirect = vi.fn();
const mockNavigate = vi.fn();

vi.mock('@auth0/auth0-react', () => ({
  useAuth0: () => ({
    loginWithRedirect: mockLoginWithRedirect,
    isAuthenticated: false,
    isLoading: false,
  }),
}));

vi.mock('react-router-dom', () => ({
  useNavigate: () => mockNavigate,
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
  LOGIN_REDIRECT_URL: 'login-redirect-url',
}));

describe('LoginButton', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('rendering', () => {
    it('should render button with "Log in" text', () => {
      render(<LoginButton />);

      expect(screen.getByText('Log in')).toBeInTheDocument();
    });

    it('should render as a button element', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      expect(button).toBeInTheDocument();
      expect(button.tagName).toBe('BUTTON');
    });

    it('should have correct styling classes', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      expect(button.className).toContain('rounded-lg');
      expect(button.className).toContain('text-white');
      expect(button.className).toContain('transition-colors');
    });
  });

  describe('click behavior', () => {
    it('should call loginWithRedirect when clicked', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(button);

      expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
    });

    it('should save redirect URL to storage before login', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(button);

      expect(mockSet).toHaveBeenCalledWith('login-redirect-url', '/');
      expect(mockSet).toHaveBeenCalledBefore(mockLoginWithRedirect);
    });

    it('should call loginWithRedirect with correct parameters', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(button);

      expect(mockLoginWithRedirect).toHaveBeenCalledWith({
        appState: {
          returnTo: '/',
        },
        authorizationParams: {
          prompt: 'login',
        },
      });
    });

    it('should handle multiple clicks', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });

      fireEvent.click(button);
      fireEvent.click(button);
      fireEvent.click(button);

      expect(mockLoginWithRedirect).toHaveBeenCalledTimes(3);
      expect(mockSet).toHaveBeenCalledTimes(3);
    });
  });

  describe('storage behavior', () => {
    it('should store "/" as redirect URL', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(button);

      expect(mockSet).toHaveBeenCalledWith(
        expect.any(String),
        '/'
      );
    });

    it('should use LOGIN_REDIRECT_URL constant as storage key', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(button);

      expect(mockSet).toHaveBeenCalledWith(
        'login-redirect-url',
        expect.any(String)
      );
    });
  });

  describe('Auth0 integration', () => {
    it('should use prompt: "login" for fresh login', () => {
      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });
      fireEvent.click(button);

      expect(mockLoginWithRedirect).toHaveBeenCalledWith(
        expect.objectContaining({
          authorizationParams: expect.objectContaining({
            prompt: 'login',
          }),
        })
      );
    });
  });

  describe('error handling', () => {
    it('should not throw error if loginWithRedirect fails', async () => {
      mockLoginWithRedirect.mockImplementationOnce(() => {
        throw new Error('Auth0 error');
      });

      render(<LoginButton />);

      const button = screen.getByRole('button', { name: /Log in/i });

      expect(() => {
        fireEvent.click(button);
      }).not.toThrow();

      await waitFor(() => {
        expect(mockLoginWithRedirect).toHaveBeenCalledTimes(1);
      });
    });
  });
});
