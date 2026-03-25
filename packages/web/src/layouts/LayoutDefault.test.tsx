import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import LayoutDefault from './LayoutDefault';

describe('LayoutDefault', () => {
  it('should render children', () => {
    render(
      <LayoutDefault>
        <div data-testid="test-child">Test Content</div>
      </LayoutDefault>
    );

    expect(screen.getByTestId('test-child')).toBeInTheDocument();
    expect(screen.getByText('Test Content')).toBeInTheDocument();
  });

  it('should have correct CSS classes', () => {
    const { container } = render(
      <LayoutDefault>
        <div>Test</div>
      </LayoutDefault>
    );

    expect(container.querySelector('.layout-default')).toBeInTheDocument();
    expect(container.querySelector('.layout-default__main')).toBeInTheDocument();
  });

  it('should render multiple children', () => {
    render(
      <LayoutDefault>
        <div data-testid="child1">Child 1</div>
        <div data-testid="child2">Child 2</div>
        <div data-testid="child3">Child 3</div>
      </LayoutDefault>
    );

    expect(screen.getByTestId('child1')).toBeInTheDocument();
    expect(screen.getByTestId('child2')).toBeInTheDocument();
    expect(screen.getByTestId('child3')).toBeInTheDocument();
  });

  it('should render without children', () => {
    const { container } = render(<LayoutDefault>{null}</LayoutDefault>);

    expect(container.querySelector('.layout-default')).toBeInTheDocument();
  });
});
