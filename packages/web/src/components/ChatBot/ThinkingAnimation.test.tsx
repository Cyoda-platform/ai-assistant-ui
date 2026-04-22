import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import ThinkingAnimation from './ThinkingAnimation';

describe('ThinkingAnimation', () => {
  it('should render three animated dots', () => {
    const { container } = render(<ThinkingAnimation />);

    const dots = container.querySelectorAll('.w-2.h-2.bg-slate-400.rounded-full.animate-bounce');
    expect(dots.length).toBe(3);
  });

  it('should apply custom className to wrapper', () => {
    const { container } = render(<ThinkingAnimation className="my-custom-class" />);

    const wrapper = container.querySelector('.my-custom-class');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('flex', 'items-center', 'space-x-1');
  });

  it('should have staggered animation delays', () => {
    const { container } = render(<ThinkingAnimation />);

    const dots = container.querySelectorAll('.animate-bounce');
    expect(dots[0]).toHaveStyle({ animationDelay: '0ms', animationDuration: '1.4s' });
    expect(dots[1]).toHaveStyle({ animationDelay: '200ms', animationDuration: '1.4s' });
    expect(dots[2]).toHaveStyle({ animationDelay: '400ms', animationDuration: '1.4s' });
  });

  it('should render without custom className', () => {
    const { container } = render(<ThinkingAnimation />);

    const wrapper = container.querySelector('.flex.items-center.space-x-1');
    expect(wrapper).toBeInTheDocument();
  });

  it('should have flex container for dots', () => {
    const { container } = render(<ThinkingAnimation />);

    const dotsContainer = container.querySelector('.flex.space-x-1');
    expect(dotsContainer).toBeInTheDocument();
  });
});
