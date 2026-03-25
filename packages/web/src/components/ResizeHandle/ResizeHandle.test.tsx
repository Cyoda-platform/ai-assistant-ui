import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ResizeHandle from './ResizeHandle';

describe('ResizeHandle', () => {
  const defaultProps = {
    onMouseDown: vi.fn(),
    isResizing: false,
    position: 'left' as const,
  };

  describe('rendering', () => {
    it('should render resize handle', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      const handle = container.firstChild;
      expect(handle).toBeInTheDocument();
    });

    it('should render grip icon', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      // Lucide icon renders as SVG
      const icon = container.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should render indicator element', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      // Check for the structure: handle has two children
      const handle = container.firstChild as HTMLElement;
      const firstChild = handle.children[0];
      expect(firstChild).toBeInTheDocument();
    });

    it('should render hit area element', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      // Check for the structure: handle has two children
      const handle = container.firstChild as HTMLElement;
      const secondChild = handle.children[1];
      expect(secondChild).toBeInTheDocument();
    });
  });

  describe('position prop', () => {
    it('should apply left position class', () => {
      const { container } = render(
        <ResizeHandle {...defaultProps} position="left" />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).toContain('left');
    });

    it('should apply right position class', () => {
      const { container } = render(
        <ResizeHandle {...defaultProps} position="right" />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).toContain('right');
    });
  });

  describe('isResizing prop', () => {
    it('should apply resizing class when isResizing is true', () => {
      const { container } = render(
        <ResizeHandle {...defaultProps} isResizing={true} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).toContain('resizing');
    });

    it('should not apply resizing class when isResizing is false', () => {
      const { container } = render(
        <ResizeHandle {...defaultProps} isResizing={false} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).not.toContain('resizing');
    });
  });

  describe('className prop', () => {
    it('should apply custom className', () => {
      const { container } = render(
        <ResizeHandle {...defaultProps} className="custom-class" />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).toContain('custom-class');
    });

    it('should work without custom className', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      const handle = container.firstChild as HTMLElement;
      expect(handle).toBeInTheDocument();
    });

    it('should combine multiple class names', () => {
      const { container } = render(
        <ResizeHandle
          {...defaultProps}
          isResizing={true}
          position="right"
          className="my-custom-class"
        />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).toContain('resizeHandle');
      expect(handle.className).toContain('right');
      expect(handle.className).toContain('resizing');
      expect(handle.className).toContain('my-custom-class');
    });
  });

  describe('mouse events', () => {
    it('should call onMouseDown when handle is clicked', () => {
      const onMouseDown = vi.fn();
      const { container } = render(
        <ResizeHandle {...defaultProps} onMouseDown={onMouseDown} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.mouseDown(handle);

      expect(onMouseDown).toHaveBeenCalledTimes(1);
    });

    it('should pass mouse event to onMouseDown handler', () => {
      const onMouseDown = vi.fn();
      const { container } = render(
        <ResizeHandle {...defaultProps} onMouseDown={onMouseDown} />
      );

      const handle = container.firstChild as HTMLElement;
      fireEvent.mouseDown(handle, { clientX: 100, clientY: 200 });

      expect(onMouseDown).toHaveBeenCalled();
      expect(onMouseDown.mock.calls[0][0]).toBeInstanceOf(Object);
    });

    it('should handle multiple mouse down events', () => {
      const onMouseDown = vi.fn();
      const { container } = render(
        <ResizeHandle {...defaultProps} onMouseDown={onMouseDown} />
      );

      const handle = container.firstChild as HTMLElement;

      fireEvent.mouseDown(handle);
      fireEvent.mouseDown(handle);
      fireEvent.mouseDown(handle);

      expect(onMouseDown).toHaveBeenCalledTimes(3);
    });
  });

  describe('state transitions', () => {
    it('should update className when isResizing changes', () => {
      const { container, rerender } = render(
        <ResizeHandle {...defaultProps} isResizing={false} />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).not.toContain('resizing');

      rerender(<ResizeHandle {...defaultProps} isResizing={true} />);
      expect(handle.className).toContain('resizing');
    });

    it('should update className when position changes', () => {
      const { container, rerender } = render(
        <ResizeHandle {...defaultProps} position="left" />
      );

      const handle = container.firstChild as HTMLElement;
      expect(handle.className).toContain('left');

      rerender(<ResizeHandle {...defaultProps} position="right" />);
      expect(handle.className).toContain('right');
      expect(handle.className).not.toContain('left');
    });
  });

  describe('structure', () => {
    it('should have two child elements (indicator and hit area)', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      const handle = container.firstChild as HTMLElement;
      expect(handle.children.length).toBe(2);
    });

    it('should have indicator as first child', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      const handle = container.firstChild as HTMLElement;
      const firstChild = handle.children[0];
      // First child should contain the SVG icon
      const icon = firstChild.querySelector('svg');
      expect(icon).toBeInTheDocument();
    });

    it('should have hit area as second child', () => {
      const { container } = render(<ResizeHandle {...defaultProps} />);

      const handle = container.firstChild as HTMLElement;
      const secondChild = handle.children[1];
      // Second child is the hit area (should not have any children)
      expect(secondChild.children.length).toBe(0);
    });
  });
});
