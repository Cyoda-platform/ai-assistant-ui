import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EnvironmentNode } from './EnvironmentNode';

describe('EnvironmentNode', () => {
  const defaultData = {
    name: 'Production',
    environmentType: 'production' as const,
    description: 'Production environment',
    appCount: 5,
    status: 'active' as const,
  };

  it('should render environment name', () => {
    render(<EnvironmentNode data={defaultData} />);

    expect(screen.getByText('Production')).toBeInTheDocument();
  });

  it('should render environment type', () => {
    render(<EnvironmentNode data={defaultData} />);

    expect(screen.getByText('production')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<EnvironmentNode data={defaultData} />);

    expect(screen.getByText('Production environment')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const dataWithoutDescription = { ...defaultData, description: undefined };
    const { container } = render(<EnvironmentNode data={dataWithoutDescription} />);

    expect(container.textContent).not.toContain('Production environment');
  });

  it('should render app count', () => {
    render(<EnvironmentNode data={defaultData} />);

    expect(screen.getByText('5')).toBeInTheDocument();
    expect(screen.getByText('Apps')).toBeInTheDocument();
  });

  it('should render status', () => {
    render(<EnvironmentNode data={defaultData} />);

    expect(screen.getByText('active')).toBeInTheDocument();
  });

  describe('environment type styling', () => {
    it('should render production with green color', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'production' }} />
      );

      expect(container.querySelector('.from-green-600')).toBeInTheDocument();
    });

    it('should render staging with yellow color', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'staging' }} />
      );

      expect(container.querySelector('.from-yellow-600')).toBeInTheDocument();
    });

    it('should render development with blue color', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'development' }} />
      );

      expect(container.querySelector('.from-blue-600')).toBeInTheDocument();
    });

    it('should render test with purple color', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'test' }} />
      );

      expect(container.querySelector('.from-purple-600')).toBeInTheDocument();
    });
  });

  describe('environment type icons', () => {
    it('should render Cloud icon for production', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'production' }} />
      );

      expect(container.querySelector('.text-green-400')).toBeInTheDocument();
    });

    it('should render Server icon for staging', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'staging' }} />
      );

      expect(container.querySelector('.text-yellow-400')).toBeInTheDocument();
    });

    it('should render Wrench icon for development', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'development' }} />
      );

      expect(container.querySelector('.text-blue-400')).toBeInTheDocument();
    });

    it('should render TestTube icon for test', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, environmentType: 'test' }} />
      );

      expect(container.querySelector('.text-purple-400')).toBeInTheDocument();
    });
  });

  describe('status indicator', () => {
    it('should render green indicator for active status', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, status: 'active' }} />
      );

      expect(container.querySelector('.bg-green-500')).toBeInTheDocument();
    });

    it('should render gray indicator for inactive status', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, status: 'inactive' }} />
      );

      expect(container.querySelector('.bg-gray-500')).toBeInTheDocument();
    });

    it('should render orange indicator for maintenance status', () => {
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, status: 'maintenance' }} />
      );

      expect(container.querySelector('.bg-orange-500')).toBeInTheDocument();
    });

    it('should have animate-pulse class', () => {
      const { container } = render(<EnvironmentNode data={defaultData} />);

      expect(container.querySelector('.animate-pulse')).toBeInTheDocument();
    });
  });

  describe('onClick handler', () => {
    it('should call onClick when node is clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<EnvironmentNode data={{ ...defaultData, onClick }} />);

      const node = screen.getByText('Production').closest('div');
      if (node) {
        await user.click(node);
      }

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', async () => {
      const user = userEvent.setup();

      render(<EnvironmentNode data={defaultData} />);

      const node = screen.getByText('Production').closest('div');

      await expect(async () => {
        if (node) {
          await user.click(node);
        }
      }).resolves.not.toThrow();
    });
  });

  describe('styling and classes', () => {
    it('should have cursor-pointer class', () => {
      const { container } = render(<EnvironmentNode data={defaultData} />);

      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });

    it('should have hover effects', () => {
      const { container } = render(<EnvironmentNode data={defaultData} />);

      expect(container.querySelector('.hover\\:scale-105')).toBeInTheDocument();
    });

    it('should have shadow and rounded styling', () => {
      const { container } = render(<EnvironmentNode data={defaultData} />);

      expect(container.querySelector('.rounded-xl.shadow-2xl')).toBeInTheDocument();
    });
  });

  describe('React Flow handles', () => {
    it('should render source handle', () => {
      const { container } = render(<EnvironmentNode data={defaultData} />);

      const handles = container.querySelectorAll('[data-handlepos]');
      expect(handles.length).toBeGreaterThan(0);
    });
  });

  describe('edge cases', () => {
    it('should handle app count of 0', () => {
      render(<EnvironmentNode data={{ ...defaultData, appCount: 0 }} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very long environment names', () => {
      const longName = 'Environment '.repeat(10);
      render(<EnvironmentNode data={{ ...defaultData, name: longName }} />);

      expect(screen.getByText(longName)).toBeInTheDocument();
    });

    it('should handle very long descriptions with line-clamp', () => {
      const longDescription = 'Description '.repeat(50);
      const { container } = render(
        <EnvironmentNode data={{ ...defaultData, description: longDescription }} />
      );

      expect(container.querySelector('.line-clamp-2')).toBeInTheDocument();
    });

    it('should handle large app counts', () => {
      render(<EnvironmentNode data={{ ...defaultData, appCount: 999 }} />);

      expect(screen.getByText('999')).toBeInTheDocument();
    });
  });
});
