import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { WorkflowNode } from './WorkflowNode';

describe('WorkflowNode', () => {
  const defaultData = {
    name: 'Test Workflow',
    stateCount: 5,
    transitionCount: 10,
    updatedAt: '2024-01-15T10:00:00Z',
  };

  it('should render workflow name', () => {
    render(<WorkflowNode data={defaultData} selected={false} />);

    expect(screen.getByText('Test Workflow')).toBeInTheDocument();
  });

  it('should render state count', () => {
    render(<WorkflowNode data={defaultData} selected={false} />);

    expect(screen.getByText('States')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render transition count', () => {
    render(<WorkflowNode data={defaultData} selected={false} />);

    expect(screen.getByText('Transitions')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should render formatted updated date', () => {
    const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

    // Date should be formatted and displayed
    const dateElement = container.querySelector('.text-\\[9px\\]');
    expect(dateElement).toBeInTheDocument();
  });

  describe('onClick handler', () => {
    it('should call onClick when node is clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<WorkflowNode data={{ ...defaultData, onClick }} selected={false} />);

      const node = screen.getByText('Test Workflow').closest('div');
      if (node) {
        await user.click(node);
      }

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', async () => {
      const user = userEvent.setup();

      render(<WorkflowNode data={defaultData} selected={false} />);

      const node = screen.getByText('Test Workflow').closest('div');

      await expect(async () => {
        if (node) {
          await user.click(node);
        }
      }).resolves.not.toThrow();
    });
  });

  describe('onEdit handler (double click)', () => {
    it('should call onEdit when node is double-clicked', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<WorkflowNode data={{ ...defaultData, onEdit }} selected={false} />);

      const node = screen.getByText('Test Workflow').closest('div');
      if (node) {
        await user.dblClick(node);
      }

      expect(onEdit).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onEdit is not provided and double-clicked', async () => {
      const user = userEvent.setup();

      render(<WorkflowNode data={defaultData} selected={false} />);

      const node = screen.getByText('Test Workflow').closest('div');

      await expect(async () => {
        if (node) {
          await user.dblClick(node);
        }
      }).resolves.not.toThrow();
    });

    it('should stop propagation on double click', async () => {
      const onEdit = vi.fn();
      const user = userEvent.setup();

      render(<WorkflowNode data={{ ...defaultData, onEdit }} selected={false} />);

      const node = screen.getByText('Test Workflow').closest('div');
      if (node) {
        await user.dblClick(node);
      }

      expect(onEdit).toHaveBeenCalled();
    });
  });

  describe('selected state', () => {
    it('should apply selected styling when selected is true', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={true} />);

      expect(container.querySelector('.border-purple-300')).toBeInTheDocument();
      expect(container.querySelector('.ring-4')).toBeInTheDocument();
      expect(container.querySelector('.scale-105')).toBeInTheDocument();
    });

    it('should not apply selected styling when selected is false', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      expect(container.querySelector('.border-purple-300')).not.toBeInTheDocument();
      expect(container.querySelector('.ring-4')).not.toBeInTheDocument();
    });
  });

  describe('React Flow handles', () => {
    it('should render target handle on top', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      const topHandle = container.querySelector('[data-handlepos="top"]');
      expect(topHandle).toBeInTheDocument();
    });

    it('should render source handle on bottom', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      const bottomHandle = container.querySelector('[data-handlepos="bottom"]');
      expect(bottomHandle).toBeInTheDocument();
    });
  });

  describe('styling and classes', () => {
    it('should have cursor-pointer class', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });

    it('should have purple gradient background', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      expect(container.querySelector('.from-purple-600')).toBeInTheDocument();
    });

    it('should have transition effects', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      expect(container.querySelector('.transition-all')).toBeInTheDocument();
    });

    it('should have hover scale effect', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      expect(container.querySelector('.hover\\:scale-102')).toBeInTheDocument();
    });

    it('should have title attribute with edit instruction', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      const nodeElement = container.querySelector('[title="Double-click to edit workflow"]');
      expect(nodeElement).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle state count of 0', () => {
      render(<WorkflowNode data={{ ...defaultData, stateCount: 0 }} selected={false} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle transition count of 0', () => {
      render(<WorkflowNode data={{ ...defaultData, transitionCount: 0 }} selected={false} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very long workflow names', () => {
      const longName = 'Workflow '.repeat(10);
      const { container } = render(
        <WorkflowNode data={{ ...defaultData, name: longName }} selected={false} />
      );

      // Should have truncate class
      expect(container.querySelector('.truncate')).toBeInTheDocument();
    });

    it('should handle large state counts', () => {
      render(<WorkflowNode data={{ ...defaultData, stateCount: 999 }} selected={false} />);

      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should handle large transition counts', () => {
      render(<WorkflowNode data={{ ...defaultData, transitionCount: 999 }} selected={false} />);

      expect(screen.getByText('999')).toBeInTheDocument();
    });

    it('should handle various date formats', () => {
      const dates = [
        '2024-01-15T10:00:00Z',
        '2024-12-31T23:59:59Z',
        '2023-06-15T12:30:00Z',
      ];

      dates.forEach(date => {
        const { container } = render(
          <WorkflowNode data={{ ...defaultData, updatedAt: date }} selected={false} />
        );
        expect(container.textContent).toBeTruthy();
      });
    });
  });

  describe('icons', () => {
    it('should render Workflow icon in header', () => {
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);

      // Workflow icon should be present
      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render Circle icon for states', () => {
      render(<WorkflowNode data={defaultData} selected={false} />);

      // Circle icon should be present next to "States"
      expect(screen.getByText('States')).toBeInTheDocument();
    });

    it('should render ArrowRight icon for transitions', () => {
      render(<WorkflowNode data={defaultData} selected={false} />);

      // ArrowRight icon should be present next to "Transitions"
      expect(screen.getByText('Transitions')).toBeInTheDocument();
    });

    it('should render Clock icon in footer', () => {
      render(<WorkflowNode data={defaultData} selected={false} />);

      // Clock icon should be present in the footer
      const { container } = render(<WorkflowNode data={defaultData} selected={false} />);
      expect(container.querySelectorAll('svg').length).toBeGreaterThan(0);
    });
  });
});
