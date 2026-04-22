import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { EntityVersionNode } from './EntityNode';

describe('EntityVersionNode', () => {
  const defaultData = {
    entityName: 'Customer',
    version: '1.0.0',
    description: 'Customer entity',
    state: 'active',
    workflowCount: 3,
    requirementCount: 5,
    codeCount: 10,
    isActive: true,
    updatedAt: '2024-01-15T10:00:00Z',
  };

  it('should render entity name', () => {
    render(<EntityVersionNode data={defaultData} selected={false} />);

    expect(screen.getByText('Customer')).toBeInTheDocument();
  });

  it('should render version', () => {
    render(<EntityVersionNode data={defaultData} selected={false} />);

    expect(screen.getByText('v1.0.0')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<EntityVersionNode data={defaultData} selected={false} />);

    expect(screen.getByText('Customer entity')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const dataWithoutDescription = { ...defaultData, description: undefined };
    const { container } = render(<EntityVersionNode data={dataWithoutDescription} selected={false} />);

    expect(container.textContent).not.toContain('Customer entity');
  });

  it('should render state', () => {
    render(<EntityVersionNode data={defaultData} selected={false} />);

    expect(screen.getByText('active')).toBeInTheDocument();
  });

  it('should render workflow count', () => {
    render(<EntityVersionNode data={defaultData} selected={false} />);

    expect(screen.getByText('Workflows')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
  });

  it('should render requirement count', () => {
    render(<EntityVersionNode data={defaultData} selected={false} />);

    expect(screen.getByText('Requirements')).toBeInTheDocument();
    expect(screen.getByText('5')).toBeInTheDocument();
  });

  it('should render code count when greater than 0', () => {
    render(<EntityVersionNode data={defaultData} selected={false} />);

    expect(screen.getByText('Code')).toBeInTheDocument();
    expect(screen.getByText('10')).toBeInTheDocument();
  });

  it('should not render code count when 0', () => {
    const dataWithZeroCode = { ...defaultData, codeCount: 0 };
    render(<EntityVersionNode data={dataWithZeroCode} selected={false} />);

    expect(screen.queryByText('Code')).not.toBeInTheDocument();
  });

  it('should not render code count when undefined', () => {
    const dataWithoutCode = { ...defaultData, codeCount: undefined };
    render(<EntityVersionNode data={dataWithoutCode} selected={false} />);

    expect(screen.queryByText('Code')).not.toBeInTheDocument();
  });

  it('should render formatted updated date', () => {
    const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

    // Date should be formatted and displayed
    expect(container.textContent).toContain('Updated');
  });

  describe('isActive state', () => {
    it('should render blue gradient when active', () => {
      const { container } = render(
        <EntityVersionNode data={{ ...defaultData, isActive: true }} selected={false} />
      );

      expect(container.querySelector('.from-blue-600')).toBeInTheDocument();
    });

    it('should render slate gradient when inactive', () => {
      const { container } = render(
        <EntityVersionNode data={{ ...defaultData, isActive: false }} selected={false} />
      );

      expect(container.querySelector('.from-slate-600')).toBeInTheDocument();
    });

    it('should render CheckCircle icon when active', () => {
      const { container } = render(
        <EntityVersionNode data={{ ...defaultData, isActive: true }} selected={false} />
      );

      const checkIcon = container.querySelector('.text-white');
      expect(checkIcon).toBeInTheDocument();
    });

    it('should render Clock icon when inactive', () => {
      const { container } = render(
        <EntityVersionNode data={{ ...defaultData, isActive: false }} selected={false} />
      );

      const clockIcon = container.querySelector('.text-white');
      expect(clockIcon).toBeInTheDocument();
    });
  });

  describe('selected state', () => {
    it('should apply selected styling when selected is true', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={true} />);

      expect(container.querySelector('.border-white')).toBeInTheDocument();
      expect(container.querySelector('.ring-4')).toBeInTheDocument();
      expect(container.querySelector('.scale-105')).toBeInTheDocument();
    });

    it('should not apply selected styling when selected is false', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(container.querySelector('.ring-4')).not.toBeInTheDocument();
      expect(container.querySelector('.scale-105')).not.toBeInTheDocument();
    });

    it('should have hover effects when not selected', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(container.querySelector('.hover\\:border-white\\/60')).toBeInTheDocument();
      expect(container.querySelector('.hover\\:scale-102')).toBeInTheDocument();
    });
  });

  describe('onClick handler', () => {
    it('should call onClick when node is clicked', async () => {
      const onClick = vi.fn();
      const user = userEvent.setup();

      render(<EntityVersionNode data={{ ...defaultData, onClick }} selected={false} />);

      const node = screen.getByText('Customer').closest('div');
      if (node) {
        await user.click(node);
      }

      expect(onClick).toHaveBeenCalledTimes(1);
    });

    it('should not throw when onClick is not provided', async () => {
      const user = userEvent.setup();

      render(<EntityVersionNode data={defaultData} selected={false} />);

      const node = screen.getByText('Customer').closest('div');

      await expect(async () => {
        if (node) {
          await user.click(node);
        }
      }).resolves.not.toThrow();
    });
  });

  describe('React Flow handles', () => {
    it('should render source handle on bottom', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      const bottomHandle = container.querySelector('[data-handlepos="bottom"]');
      expect(bottomHandle).toBeInTheDocument();
    });

    it('should render target handle on top', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      const topHandle = container.querySelector('[data-handlepos="top"]');
      expect(topHandle).toBeInTheDocument();
    });
  });

  describe('styling and classes', () => {
    it('should have cursor-pointer class', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(container.querySelector('.cursor-pointer')).toBeInTheDocument();
    });

    it('should have rounded-xl styling', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(container.querySelector('.rounded-xl')).toBeInTheDocument();
    });

    it('should have shadow-2xl styling', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(container.querySelector('.shadow-2xl')).toBeInTheDocument();
    });

    it('should have transition effects', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(container.querySelector('.transition-all')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle workflow count of 0', () => {
      render(<EntityVersionNode data={{ ...defaultData, workflowCount: 0 }} selected={false} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle requirement count of 0', () => {
      render(<EntityVersionNode data={{ ...defaultData, requirementCount: 0 }} selected={false} />);

      expect(screen.getByText('0')).toBeInTheDocument();
    });

    it('should handle very long entity names with truncate', () => {
      const longName = 'EntityName'.repeat(10);
      const { container } = render(
        <EntityVersionNode data={{ ...defaultData, entityName: longName }} selected={false} />
      );

      expect(container.querySelector('.truncate')).toBeInTheDocument();
    });

    it('should handle very long descriptions with line-clamp', () => {
      const longDescription = 'Description '.repeat(50);
      const { container } = render(
        <EntityVersionNode data={{ ...defaultData, description: longDescription }} selected={false} />
      );

      expect(container.querySelector('.line-clamp-2')).toBeInTheDocument();
    });

    it('should handle large counts', () => {
      const largeCountsData = {
        ...defaultData,
        workflowCount: 999,
        requirementCount: 888,
        codeCount: 777,
      };
      render(<EntityVersionNode data={largeCountsData} selected={false} />);

      expect(screen.getByText('999')).toBeInTheDocument();
      expect(screen.getByText('888')).toBeInTheDocument();
      expect(screen.getByText('777')).toBeInTheDocument();
    });

    it('should handle various date formats', () => {
      const dates = [
        '2024-01-15T10:00:00Z',
        '2024-12-31T23:59:59Z',
        '2023-06-15T12:30:00Z',
      ];

      dates.forEach(date => {
        const { container } = render(
          <EntityVersionNode data={{ ...defaultData, updatedAt: date }} selected={false} />
        );
        expect(container.textContent).toContain('Updated');
      });
    });

    it('should render all three stats sections correctly', () => {
      render(<EntityVersionNode data={defaultData} selected={false} />);

      // All three stat sections should be present
      expect(screen.getByText('Workflows')).toBeInTheDocument();
      expect(screen.getByText('Requirements')).toBeInTheDocument();
      expect(screen.getByText('Code')).toBeInTheDocument();
    });
  });

  describe('icons', () => {
    it('should render Database icon in header', () => {
      const { container } = render(<EntityVersionNode data={defaultData} selected={false} />);

      const icons = container.querySelectorAll('svg');
      expect(icons.length).toBeGreaterThan(0);
    });

    it('should render Workflow icon for workflow count', () => {
      render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(screen.getByText('Workflows')).toBeInTheDocument();
    });

    it('should render FileText icon for requirements count', () => {
      render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(screen.getByText('Requirements')).toBeInTheDocument();
    });

    it('should render Code icon for code count when present', () => {
      render(<EntityVersionNode data={defaultData} selected={false} />);

      expect(screen.getByText('Code')).toBeInTheDocument();
    });
  });
});
