import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import LoadingSpinner from './LoadingSpinner';

describe('LoadingSpinner', () => {
  it('should render with default size (md)', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.w-8.h-8');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with small size', () => {
    const { container } = render(<LoadingSpinner size="sm" />);

    const spinner = container.querySelector('.w-4.h-4');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with medium size', () => {
    const { container } = render(<LoadingSpinner size="md" />);

    const spinner = container.querySelector('.w-8.h-8');
    expect(spinner).toBeInTheDocument();
  });

  it('should render with large size', () => {
    const { container } = render(<LoadingSpinner size="lg" />);

    const spinner = container.querySelector('.w-12.h-12');
    expect(spinner).toBeInTheDocument();
  });

  it('should apply custom className to wrapper', () => {
    const { container } = render(<LoadingSpinner className="custom-class" />);

    const wrapper = container.querySelector('.custom-class');
    expect(wrapper).toBeInTheDocument();
    expect(wrapper).toHaveClass('flex', 'items-center', 'justify-center');
  });

  it('should have animation class', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeInTheDocument();
  });

  it('should have correct border classes', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.border-3.border-slate-600.border-t-teal-500');
    expect(spinner).toBeInTheDocument();
  });

  it('should have rounded-full class', () => {
    const { container } = render(<LoadingSpinner />);

    const spinner = container.querySelector('.rounded-full');
    expect(spinner).toBeInTheDocument();
  });

  it('should combine size and custom className', () => {
    const { container } = render(<LoadingSpinner size="lg" className="my-custom-class" />);

    const wrapper = container.querySelector('.my-custom-class');
    expect(wrapper).toBeInTheDocument();

    const spinner = container.querySelector('.w-12.h-12');
    expect(spinner).toBeInTheDocument();
  });
});
