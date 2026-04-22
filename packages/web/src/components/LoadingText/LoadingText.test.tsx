import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, act } from '@testing-library/react';
import LoadingText from './LoadingText';

vi.mock('react-i18next', () => ({
  useTranslation: () => ({
    t: (key: string) => {
      const translations: Record<string, string> = {
        'common.loading': 'Loading'
      };
      return translations[key] || key;
    }
  })
}));

describe('LoadingText', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should render initial loading text with no dots', () => {
    render(<LoadingText />);

    expect(screen.getByText('Loading')).toBeInTheDocument();
  });

  it('should add one dot after 1 second', () => {
    const { container } = render(<LoadingText />);

    act(() => {
      vi.advanceTimersByTime(1000);
    });

    expect(container.textContent).toBe('Loading .');
  });

  it('should add two dots after 2 seconds', () => {
    const { container } = render(<LoadingText />);

    act(() => {
      vi.advanceTimersByTime(2000);
    });

    expect(container.textContent).toBe('Loading ..');
  });

  it('should add three dots after 3 seconds', () => {
    const { container } = render(<LoadingText />);

    act(() => {
      vi.advanceTimersByTime(3000);
    });

    expect(container.textContent).toBe('Loading ...');
  });

  it('should reset to no dots after 4 seconds', () => {
    const { container } = render(<LoadingText />);

    act(() => {
      vi.advanceTimersByTime(4000);
    });

    expect(container.textContent).toBe('Loading ');
  });

  it('should cycle through animation multiple times', () => {
    const { container } = render(<LoadingText />);

    // First cycle
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toBe('Loading .');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toBe('Loading ..');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toBe('Loading ...');

    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toBe('Loading ');

    // Second cycle
    act(() => {
      vi.advanceTimersByTime(1000);
    });
    expect(container.textContent).toBe('Loading .');
  });

  it('should cleanup interval on unmount', () => {
    const { unmount } = render(<LoadingText />);

    const clearIntervalSpy = vi.spyOn(global, 'clearInterval');

    unmount();

    expect(clearIntervalSpy).toHaveBeenCalled();
  });
});
