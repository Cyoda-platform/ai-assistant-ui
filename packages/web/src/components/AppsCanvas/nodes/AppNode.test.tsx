import { renderWithReactFlow } from '@/test-utils/renderWithReactFlow';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { AppNode } from './AppNode';

describe('AppNode', () => {
  const defaultData = {
    name: 'Test App',
    description: 'Test description',
    requirementCount: 5,
    version: '1.0.0',
    status: 'running' as const,
  };

  it('should render app name', () => {
    renderWithReactFlow(<AppNode data={defaultData} />);

    expect(screen.getByText('Test App')).toBeInTheDocument();
  });

  it('should render version when provided', () => {
    renderWithReactFlow(<AppNode data={defaultData} />);

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('should not render version when not provided', () => {
    const dataWithoutVersion = { ...defaultData, version: undefined };
    const { container } = renderWithReactFlow(<AppNode data={dataWithoutVersion} />);

    expect(container.textContent).not.toContain('v1.0.0');
  });

  it('should render description when provided', () => {
    renderWithReactFlow(<AppNode data={defaultData} />);

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should not render description section when not provided', () => {
    const dataWithoutDescription = { ...defaultData, description: undefined };
    const { container } = renderWithReactFlow(<AppNode data={dataWithoutDescription} />);

    expect(container.textContent).not.toContain('Test description');
  });

  it('should render requirement count', () => {
    renderWithReactFlow(<AppNode data={defaultData} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Requirements')).toBeInTheDocument();
  });

  describe('status rendering', () => {
    it('should render running status with green color', () => {
      const { container } = renderWithReactFlow(
        <AppNode data={{ ...defaultData, status: 'running' }} />
      );

      expect(screen.getByText('running')).toBeInTheDocument();
      expect(container.querySelector('.from-teal-600')).toBeInTheDocument();
    });

    it('should render stopped status with red color', () => {
      const { container } = renderWithReactFlow(
        <AppNode data={{ ...defaultData, status: 'stopped' }} />
      );

      expect(screen.getByText('stopped')).toBeInTheDocument();
      expect(container.querySelector('.from-gray-600')).toBeInTheDocument();
    });

    it('should render deploying status with yellow color', () => {
      const { container } = renderWithReactFlow(
        <AppNode data={{ ...defaultData, status: 'deploying' }} />
      );

      expect(screen.getByText('deploying')).toBeInTheDocument();
      expect(container.querySelector('.from-yellow-600')).toBeInTheDocument();
    });
  });

  describe('status icon rendering', () => {
    it('should render Play icon for running status', () => {
      const { container } = renderWithReactFlow(
        <AppNode data={{ ...defaultData, status: 'running' }} />
      );

      const playIcon = container.querySelector('.text-green-400');
      expect(playIcon).toBeInTheDocument();
    });

    it('should render Square icon for stopped status', () => {
      const { container } = renderWithReactFlow(
        <AppNode data={{ ...defaultData, status: 'stopped' }} />
      );

      const squareIcon = container.querySelector('.text-red-400');
      expect(squareIcon).toBeInTheDocument();
    });

    it('should render Loader icon with animation for deploying status', () => {
      const { container } = renderWithReactFlow(
        <AppNode data={{ ...defaultData, status: 'deploying' }} />
      );

      const loaderIcon = container.querySelector('.text-yellow-400.animate-spin');
      expect(loaderIcon).toBeInTheDocument();
    });
  });

  describe('onClick handler', () => {
    it('should call onClick when node is clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      renderWithReactFlow(<AppNode data={{ ...defaultData, onClick }} />);

      const node = screen.getByText('Test App').closest('div');
      if (node) {
        await user.click(node);
      }

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', async () => {
      const user = userEvent.setup();

      renderWithReactFlow(<AppNode data={defaultData} />);

      const node = screen.getByText('Test App').closest('div');


        if (node) {
          await user.click(node);
        }
    });
  });

  describe('styling and classes', () => {
    it('should have cursor-pointer class', () => {
      const { container } = renderWithReactFlow(<AppNode data={defaultData} />);

      const node = container.querySelector('.cursor-pointer');
      expect(node).toBeInTheDocument();
    });

    it('should have hover effects', () => {
      const { container } = renderWithReactFlow(<AppNode data={defaultData} />);

      const node = container.querySelector('.hover\\:scale-105');
      expect(node).toBeInTheDocument();
    });

    it('should have shadow and rounded styling', () => {
      const { container } = renderWithReactFlow(<AppNode data={defaultData} />);

      const node = container.querySelector('.rounded-lg.shadow-xl');
      expect(node).toBeInTheDocument();
    });
  });

  describe('React Flow handles', () => {
    it('should render source and target handles', () => {
      const { container } = renderWithReactFlow(<AppNode data={defaultData} />);

      // React Flow handles are rendered
      const handles = container.querySelectorAll('[data-handlepos]');
      expect(handles.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle requirement count of 0', () => {
      renderWithReactFlow(<AppNode data={{ ...defaultData, requirementCount: 0 }} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very long app names', () => {
      const longName = 'A'.repeat(100);
      renderWithReactFlow(<AppNode data={{ ...defaultData, name: longName }} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long descriptions', () => {
      const longDescription = 'Description '.repeat(50);
      const { container } = renderWithReactFlow(
        <AppNode data={{ ...defaultData, description: longDescription }} />
      );

      // Should have line-clamp class to truncate
      const descElement = container.querySelector('.line-clamp-2');
      expect(descElement).toBeInTheDocument();
    });

    it('should handle large requirement counts', () => {
      renderWithReactFlow(<AppNode data={{ ...defaultData, requirementCount: 9999 }} />);

      expect(screen.getByText('9999')).toBeInTheDocument();
    });
  });

  describe('accessibility', () => {
    it('should have proper Package icon', () => {
      const { container } = renderWithReactFlow(<AppNode data={defaultData} />);

      // Package icon should be present
      const packageIcon = container.querySelector('svg');
      expect(packageIcon).toBeInTheDocument();
    });
  });
});
