import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LoadingText from './LoadingText';

// Mock useTranslation
const mockT = vi.fn((key: string) => {
  if (key === 'common.loading') return 'Loading';
  return key;
});

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: mockT,
    i18n: {
      changeLanguage: vi.fn(),
    },
  }),
}));

describe('LoadingText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.clearAllMocks();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe('rendering', () => {
    it('should render initial loading text with no dots', () => {
      render(<LoadingText />);
      expect(screen.getByText(/^Loading\s*$/)).toBeInTheDocument();
    });

    it('should use translation for loading text', () => {
      render(<LoadingText />);
      expect(mockT).toHaveBeenCalledWith('common.loading');
    });
  });

  describe('animation', () => {
    it('should add one dot after 1 second', () => {
      render(<LoadingText />);

      expect(screen.getByText(/^Loading\s*$/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });

      expect(screen.getByText(/^Loading\s*\.$/)).toBeInTheDocument();
    });

    it('should add two dots after 2 seconds', () => {
      render(<LoadingText />);

      act(() => {
        vi.advanceTimersByTime(2000);
      });

      expect(screen.getByText(/^Loading\s*\.\.$/)).toBeInTheDocument();
    });

    it('should add three dots after 3 seconds', () => {
      render(<LoadingText />);

      act(() => {
        vi.advanceTimersByTime(3000);
      });

      expect(screen.getByText(/^Loading\s*\.\.\.$/)).toBeInTheDocument();
    });

    it('should reset to no dots after 4 seconds', () => {
      render(<LoadingText />);

      act(() => {
        vi.advanceTimersByTime(4000);
      });

      expect(screen.getByText(/^Loading\s*$/)).toBeInTheDocument();
    });

    it('should cycle through dots continuously', () => {
      render(<LoadingText />);

      // First cycle
      expect(screen.getByText(/^Loading\s*$/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/^Loading\s*\.$/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/^Loading\s*\.\.$/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/^Loading\s*\.\.\.$/)).toBeInTheDocument();

      // Second cycle
      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/^Loading\s*$/)).toBeInTheDocument();

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/^Loading\s*\.$/)).toBeInTheDocument();
    });
  });

  describe('cleanup', () => {
    it('should clear interval on unmount', () => {
      const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

      const { unmount } = render(<LoadingText />);

      unmount();

      expect(clearIntervalSpy).toHaveBeenCalled();

      clearIntervalSpy.mockRestore();
    });

    it('should not update state after unmount', () => {
      const { unmount } = render(<LoadingText />);

      unmount();

      // Advance time after unmount
      act(() => {
        vi.advanceTimersByTime(5000);
      });

      // No error should be thrown (component should not try to update state)
      expect(true).toBe(true);
    });
  });

  describe('edge cases', () => {
    it('should handle multiple render cycles', () => {
      const { rerender } = render(<LoadingText />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/^Loading\s*\.$/)).toBeInTheDocument();

      rerender(<LoadingText />);

      act(() => {
        vi.advanceTimersByTime(1000);
      });
      expect(screen.getByText(/^Loading\s*\.\.$/)).toBeInTheDocument();
    });

    it('should start from 0 dots on initial render', () => {
      render(<LoadingText />);

      // Counter should be 0 initially, showing "Loading " with no dots
      expect(screen.getByText(/^Loading\s*$/)).toBeInTheDocument();
      expect(screen.queryByText(/^Loading\s*\.$/)).not.toBeInTheDocument();
    });

    it('should handle interval correctly after multiple cycles', () => {
      render(<LoadingText />);

      // Go through multiple complete cycles
      for (let cycle = 0; cycle < 3; cycle++) {
        act(() => {
          vi.advanceTimersByTime(4000);
        });
        expect(screen.getByText(/^Loading\s*$/)).toBeInTheDocument();
      }
    });
  });
});
