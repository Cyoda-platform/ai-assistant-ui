import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import AuthState from './AuthState';

// Mock child components
vi.mock('@/components/LoginButton/LoginButton', () => ({
  default: () => <button data-testid="login-button">Log in</button>,
}));

vi.mock('@/components/AuthState/AuthStateAvatar', () => ({
  default: () => <div data-testid="auth-state-avatar">Avatar</div>,
}));

// Mock auth store
let mockIsLoggedIn = false;

vi.mock('@/stores/auth', () => ({
  useIsLoggedIn: () => mockIsLoggedIn,
}));

describe('AuthState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockIsLoggedIn = false;
  });

  describe('not logged in', () => {
    it('should render LoginButton when user is not logged in', () => {
      mockIsLoggedIn = false;

      render(<AuthState />);

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.queryByTestId('auth-state-avatar')).not.toBeInTheDocument();
    });

    it('should render login button with correct text', () => {
      mockIsLoggedIn = false;

      render(<AuthState />);

      expect(screen.getByText('Log in')).toBeInTheDocument();
    });
  });

  describe('logged in', () => {
    it('should render AuthStateAvatar when user is logged in', () => {
      mockIsLoggedIn = true;

      render(<AuthState />);

      expect(screen.getByTestId('auth-state-avatar')).toBeInTheDocument();
      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
    });

    it('should render avatar with correct text', () => {
      mockIsLoggedIn = true;

      render(<AuthState />);

      expect(screen.getByText('Avatar')).toBeInTheDocument();
    });
  });

  describe('state transitions', () => {
    it('should switch from LoginButton to AuthStateAvatar when logging in', () => {
      mockIsLoggedIn = false;

      const { rerender } = render(<AuthState />);

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.queryByTestId('auth-state-avatar')).not.toBeInTheDocument();

      mockIsLoggedIn = true;
      rerender(<AuthState />);

      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();
      expect(screen.getByTestId('auth-state-avatar')).toBeInTheDocument();
    });

    it('should switch from AuthStateAvatar to LoginButton when logging out', () => {
      mockIsLoggedIn = true;

      const { rerender } = render(<AuthState />);

      expect(screen.getByTestId('auth-state-avatar')).toBeInTheDocument();
      expect(screen.queryByTestId('login-button')).not.toBeInTheDocument();

      mockIsLoggedIn = false;
      rerender(<AuthState />);

      expect(screen.getByTestId('login-button')).toBeInTheDocument();
      expect(screen.queryByTestId('auth-state-avatar')).not.toBeInTheDocument();
    });
  });
});
