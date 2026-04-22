import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DebugAuthState from './DebugAuthState';

// Mock auth store
let mockToken = '';
let mockTokenType = '';
let mockEmail = '';
let mockIsCyodaEmployee = false;
let mockSuperUserMode = false;

vi.mock('@/stores/auth', () => ({
  useAuthStore: () => ({
    token: mockToken,
    tokenType: mockTokenType,
    email: mockEmail,
  }),
  useIsCyodaEmployee: () => mockIsCyodaEmployee,
  useSuperUserMode: () => mockSuperUserMode,
}));

describe('DebugAuthState', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockToken = '';
    mockTokenType = '';
    mockEmail = '';
    mockIsCyodaEmployee = false;
    mockSuperUserMode = false;
  });

  describe('rendering', () => {
    it('should render debug panel with title', () => {
      render(<DebugAuthState />);

      expect(screen.getByText('🔍 Auth Debug Info')).toBeInTheDocument();
    });

    it('should render log button', () => {
      render(<DebugAuthState />);

      expect(screen.getByText('Log Full State to Console')).toBeInTheDocument();
    });
  });

  describe('not logged in state', () => {
    it('should show "No" when user is not authenticated', () => {
      mockToken = '';
      mockTokenType = '';

      render(<DebugAuthState />);

      expect(screen.getByText('Is Logged In:')).toBeInTheDocument();
      expect(screen.getByText('No')).toBeInTheDocument();
    });

    it('should show "none" for token type when not logged in', () => {
      mockToken = '';
      mockTokenType = '';

      render(<DebugAuthState />);

      expect(screen.getByText('Token Type:')).toBeInTheDocument();
      expect(screen.getAllByText('none').length).toBeGreaterThanOrEqual(1);
    });

    it('should show "none" for email when not logged in', () => {
      mockToken = '';
      mockEmail = '';

      render(<DebugAuthState />);

      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getAllByText('none').length).toBeGreaterThan(0);
    });

    it('should show "none" for token preview when not logged in', () => {
      mockToken = '';

      render(<DebugAuthState />);

      expect(screen.getByText('Token Preview:')).toBeInTheDocument();
      expect(screen.getAllByText('none').length).toBeGreaterThan(0);
    });
  });

  describe('logged in state', () => {
    it('should show "Yes" when user is authenticated with private token', () => {
      mockToken = 'test-token-123';
      mockTokenType = 'private';

      render(<DebugAuthState />);

      expect(screen.getByText('Is Logged In:')).toBeInTheDocument();
      expect(screen.getByText('Yes')).toBeInTheDocument();
    });

    it('should render user email when logged in', () => {
      mockToken = 'test-token-123';
      mockTokenType = 'private';
      mockEmail = 'test@example.com';

      render(<DebugAuthState />);

      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('test@example.com')).toBeInTheDocument();
    });

    it('should render token type when logged in', () => {
      mockToken = 'test-token-123';
      mockTokenType = 'private';

      render(<DebugAuthState />);

      expect(screen.getByText('Token Type:')).toBeInTheDocument();
      expect(screen.getByText('private')).toBeInTheDocument();
    });

    it('should render token preview when available', () => {
      mockToken = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0';
      mockTokenType = 'private';

      render(<DebugAuthState />);

      expect(screen.getByText('Token Preview:')).toBeInTheDocument();
      expect(screen.getByText(/eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9/)).toBeInTheDocument();
    });

    it('should truncate long tokens with ellipsis', () => {
      mockToken = 'a'.repeat(100);
      mockTokenType = 'private';

      render(<DebugAuthState />);

      const tokenText = screen.getByText(/a{50}\.\.\./);
      expect(tokenText).toBeInTheDocument();
    });
  });

  describe('Cyoda employee status', () => {
    it('should show "TRUE ✓" when user is Cyoda employee', () => {
      mockIsCyodaEmployee = true;

      render(<DebugAuthState />);

      expect(screen.getByText('Is Cyoda Employee:')).toBeInTheDocument();
      expect(screen.getByText('TRUE ✓')).toBeInTheDocument();
    });

    it('should show "FALSE ✗" when user is not Cyoda employee', () => {
      mockIsCyodaEmployee = false;

      render(<DebugAuthState />);

      expect(screen.getByText('Is Cyoda Employee:')).toBeInTheDocument();
      expect(screen.getByText('FALSE ✗')).toBeInTheDocument();
    });
  });

  describe('super user mode', () => {
    it('should show "ENABLED ✓" when super user mode is active', () => {
      mockSuperUserMode = true;

      render(<DebugAuthState />);

      expect(screen.getByText('Super User Mode:')).toBeInTheDocument();
      expect(screen.getByText('ENABLED ✓')).toBeInTheDocument();
    });

    it('should show "DISABLED" when super user mode is not active', () => {
      mockSuperUserMode = false;

      render(<DebugAuthState />);

      expect(screen.getByText('Super User Mode:')).toBeInTheDocument();
      expect(screen.getByText('DISABLED')).toBeInTheDocument();
    });
  });

  describe('complete user scenarios', () => {
    it('should render complete info for regular user', () => {
      mockToken = 'test-token-123';
      mockTokenType = 'private';
      mockEmail = 'regular@example.com';
      mockIsCyodaEmployee = false;
      mockSuperUserMode = false;

      render(<DebugAuthState />);

      expect(screen.getByText('Token Type:')).toBeInTheDocument();
      expect(screen.getByText('private')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('regular@example.com')).toBeInTheDocument();
      expect(screen.getByText('Is Cyoda Employee:')).toBeInTheDocument();
      expect(screen.getByText('FALSE ✗')).toBeInTheDocument();
      expect(screen.getByText('Super User Mode:')).toBeInTheDocument();
      expect(screen.getByText('DISABLED')).toBeInTheDocument();
    });

    it('should render complete info for Cyoda employee with super user', () => {
      mockToken = 'admin-token-456';
      mockTokenType = 'private';
      mockEmail = 'admin@cyoda.com';
      mockIsCyodaEmployee = true;
      mockSuperUserMode = true;

      render(<DebugAuthState />);

      expect(screen.getByText('Token Type:')).toBeInTheDocument();
      expect(screen.getByText('private')).toBeInTheDocument();
      expect(screen.getByText('Email:')).toBeInTheDocument();
      expect(screen.getByText('admin@cyoda.com')).toBeInTheDocument();
      expect(screen.getByText('Is Cyoda Employee:')).toBeInTheDocument();
      expect(screen.getByText('TRUE ✓')).toBeInTheDocument();
      expect(screen.getByText('Super User Mode:')).toBeInTheDocument();
      expect(screen.getByText('ENABLED ✓')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have correct positioning classes', () => {
      const { container } = render(<DebugAuthState />);

      const debugPanel = container.firstChild as HTMLElement;
      expect(debugPanel.className).toContain('fixed');
      expect(debugPanel.className).toContain('bottom-4');
      expect(debugPanel.className).toContain('right-4');
    });

    it('should have z-index for overlay', () => {
      const { container } = render(<DebugAuthState />);

      const debugPanel = container.firstChild as HTMLElement;
      expect(debugPanel.className).toContain('z-[10000]');
    });
  });
});
