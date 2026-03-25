import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { DashboardChart } from './DashboardChart';
import type { RechartsConfig } from '../types/diagrams';

// Mock Recharts components
vi.mock('recharts', () => ({
  LineChart: ({ children, ...props }: any) => <div data-testid="line-chart" {...props}>{children}</div>,
  AreaChart: ({ children, ...props }: any) => <div data-testid="area-chart" {...props}>{children}</div>,
  BarChart: ({ children, ...props }: any) => <div data-testid="bar-chart" {...props}>{children}</div>,
  ComposedChart: ({ children, ...props }: any) => <div data-testid="composed-chart" {...props}>{children}</div>,
  PieChart: ({ children, ...props }: any) => <div data-testid="pie-chart" {...props}>{children}</div>,
  Line: () => <div data-testid="line" />,
  Area: () => <div data-testid="area" />,
  Bar: () => <div data-testid="bar" />,
  Pie: () => <div data-testid="pie" />,
  Cell: () => <div data-testid="cell" />,
  XAxis: () => <div data-testid="x-axis" />,
  YAxis: () => <div data-testid="y-axis" />,
  CartesianGrid: () => <div data-testid="cartesian-grid" />,
  Tooltip: () => <div data-testid="tooltip" />,
  Legend: () => <div data-testid="legend" />,
  ResponsiveContainer: ({ children }: any) => <div data-testid="responsive-container">{children}</div>,
}));

describe('DashboardChart', () => {
  const defaultData = [
    { name: 'Jan', value: 100 },
    { name: 'Feb', value: 200 },
    { name: 'Mar', value: 150 },
  ];

  const baseConfig: RechartsConfig = {
    id: 'chart-1',
    name: 'Test Chart',
    description: 'Test description',
    library: 'recharts',
    chartType: 'line',
    data: defaultData,
    xAxisKey: 'name',
    yAxisKeys: ['value'],
  };

  it('should render chart name', () => {
    render(<DashboardChart config={baseConfig} />);

    expect(screen.getByText('Test Chart')).toBeInTheDocument();
  });

  it('should render description when provided', () => {
    render(<DashboardChart config={baseConfig} />);

    expect(screen.getByText('Test description')).toBeInTheDocument();
  });

  it('should not render description when not provided', () => {
    const configWithoutDescription = { ...baseConfig, description: undefined };
    render(<DashboardChart config={configWithoutDescription} />);

    expect(screen.queryByText('Test description')).not.toBeInTheDocument();
  });

  it('should render ResponsiveContainer', () => {
    render(<DashboardChart config={baseConfig} />);

    expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
  });

  describe('line chart', () => {
    it('should render LineChart for line type', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'line' }} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should render grid when showGrid is true', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'line', showGrid: true }} />);

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('should not render grid when showGrid is false', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'line', showGrid: false }} />);

      expect(screen.queryByTestId('cartesian-grid')).not.toBeInTheDocument();
    });

    it('should render tooltip when showTooltip is true', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'line', showTooltip: true }} />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });

    it('should not render tooltip when showTooltip is false', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'line', showTooltip: false }} />);

      expect(screen.queryByTestId('tooltip')).not.toBeInTheDocument();
    });

    it('should render legend when showLegend is true', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'line', showLegend: true }} />);

      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should not render legend when showLegend is false', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'line', showLegend: false }} />);

      expect(screen.queryByTestId('legend')).not.toBeInTheDocument();
    });

    it('should render Line components for each yAxisKey', () => {
      const multiLineConfig = {
        ...baseConfig,
        chartType: 'line' as const,
        yAxisKeys: ['value1', 'value2', 'value3'],
      };
      render(<DashboardChart config={multiLineConfig} />);

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(3);
    });
  });

  describe('area chart', () => {
    it('should render AreaChart for area type', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'area' }} />);

      expect(screen.getByTestId('area-chart')).toBeInTheDocument();
    });

    it('should render Area components for each yAxisKey', () => {
      const multiAreaConfig = {
        ...baseConfig,
        chartType: 'area' as const,
        yAxisKeys: ['value1', 'value2'],
      };
      render(<DashboardChart config={multiAreaConfig} />);

      const areas = screen.getAllByTestId('area');
      expect(areas).toHaveLength(2);
    });
  });

  describe('bar chart', () => {
    it('should render BarChart for bar type', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'bar' }} />);

      expect(screen.getByTestId('bar-chart')).toBeInTheDocument();
    });

    it('should render Bar components for each yAxisKey', () => {
      const multiBarConfig = {
        ...baseConfig,
        chartType: 'bar' as const,
        yAxisKeys: ['value1', 'value2'],
      };
      render(<DashboardChart config={multiBarConfig} />);

      const bars = screen.getAllByTestId('bar');
      expect(bars).toHaveLength(2);
    });
  });

  describe('composed chart', () => {
    it('should render ComposedChart for composed type', () => {
      render(<DashboardChart config={{ ...baseConfig, chartType: 'composed' }} />);

      expect(screen.getByTestId('composed-chart')).toBeInTheDocument();
    });

    it('should render Area for first key and Lines for rest in composed chart', () => {
      const composedConfig = {
        ...baseConfig,
        chartType: 'composed' as const,
        yAxisKeys: ['value1', 'value2', 'value3'],
      };
      render(<DashboardChart config={composedConfig} />);

      const areas = screen.getAllByTestId('area');
      const lines = screen.getAllByTestId('line');
      expect(areas).toHaveLength(1);
      expect(lines).toHaveLength(2);
    });
  });

  describe('pie chart', () => {
    it('should render PieChart for pie type', () => {
      const pieData = [
        { name: 'A', value: 400 },
        { name: 'B', value: 300 },
        { name: 'C', value: 200 },
      ];
      const pieConfig = {
        ...baseConfig,
        chartType: 'pie' as const,
        data: pieData,
      };
      render(<DashboardChart config={pieConfig} />);

      expect(screen.getByTestId('pie-chart')).toBeInTheDocument();
    });

    it('should render Pie component', () => {
      const pieData = [
        { name: 'A', value: 400 },
        { name: 'B', value: 300 },
      ];
      const pieConfig = {
        ...baseConfig,
        chartType: 'pie' as const,
        data: pieData,
      };
      render(<DashboardChart config={pieConfig} />);

      expect(screen.getByTestId('pie')).toBeInTheDocument();
    });

    it('should render Cell components for each data point', () => {
      const pieData = [
        { name: 'A', value: 400 },
        { name: 'B', value: 300 },
        { name: 'C', value: 200 },
      ];
      const pieConfig = {
        ...baseConfig,
        chartType: 'pie' as const,
        data: pieData,
      };
      render(<DashboardChart config={pieConfig} />);

      const cells = screen.getAllByTestId('cell');
      expect(cells).toHaveLength(3);
    });
  });

  describe('unsupported chart type', () => {
    it('should render error message for unsupported chart type', () => {
      const unsupportedConfig = {
        ...baseConfig,
        chartType: 'unsupported' as any,
      };
      render(<DashboardChart config={unsupportedConfig} />);

      expect(screen.getByText(/Unsupported chart type: unsupported/i)).toBeInTheDocument();
    });
  });

  describe('default values', () => {
    it('should use default colors when not provided', () => {
      const configWithoutColors = { ...baseConfig, colors: undefined };
      render(<DashboardChart config={configWithoutColors} />);

      // Chart should still render
      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should use default height when not provided', () => {
      const configWithoutHeight = { ...baseConfig, height: undefined };
      render(<DashboardChart config={configWithoutHeight} />);

      // Chart should still render with default height (300)
      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });

    it('should default showGrid to true', () => {
      const configWithoutShowGrid = { ...baseConfig, showGrid: undefined };
      render(<DashboardChart config={configWithoutShowGrid} />);

      expect(screen.getByTestId('cartesian-grid')).toBeInTheDocument();
    });

    it('should default showLegend to true', () => {
      const configWithoutShowLegend = { ...baseConfig, showLegend: undefined };
      render(<DashboardChart config={configWithoutShowLegend} />);

      expect(screen.getByTestId('legend')).toBeInTheDocument();
    });

    it('should default showTooltip to true', () => {
      const configWithoutShowTooltip = { ...baseConfig, showTooltip: undefined };
      render(<DashboardChart config={configWithoutShowTooltip} />);

      expect(screen.getByTestId('tooltip')).toBeInTheDocument();
    });
  });

  describe('custom options', () => {
    it('should apply custom colors', () => {
      const customColors = ['#ff0000', '#00ff00', '#0000ff'];
      const configWithColors = { ...baseConfig, colors: customColors };
      render(<DashboardChart config={configWithColors} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should apply custom height', () => {
      const configWithHeight = { ...baseConfig, height: 500 };
      render(<DashboardChart config={configWithHeight} />);

      expect(screen.getByTestId('responsive-container')).toBeInTheDocument();
    });
  });

  describe('styling', () => {
    it('should have dark theme background', () => {
      const { container } = render(<DashboardChart config={baseConfig} />);

      expect(container.querySelector('.bg-gray-800')).toBeInTheDocument();
    });

    it('should have rounded styling', () => {
      const { container } = render(<DashboardChart config={baseConfig} />);

      expect(container.querySelector('.rounded-lg')).toBeInTheDocument();
    });

    it('should have border', () => {
      const { container } = render(<DashboardChart config={baseConfig} />);

      expect(container.querySelector('.border-gray-700')).toBeInTheDocument();
    });
  });

  describe('edge cases', () => {
    it('should handle empty data array', () => {
      const emptyDataConfig = { ...baseConfig, data: [] };
      render(<DashboardChart config={emptyDataConfig} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle empty yAxisKeys array', () => {
      const emptyKeysConfig = { ...baseConfig, yAxisKeys: [] };
      render(<DashboardChart config={emptyKeysConfig} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle missing xAxisKey', () => {
      const noXAxisConfig = { ...baseConfig, xAxisKey: undefined };
      render(<DashboardChart config={noXAxisConfig} />);

      expect(screen.getByTestId('x-axis')).toBeInTheDocument();
    });

    it('should handle large datasets', () => {
      const largeData = Array.from({ length: 1000 }, (_, i) => ({
        name: `Point ${i}`,
        value: Math.random() * 100,
      }));
      const largeDataConfig = { ...baseConfig, data: largeData };
      render(<DashboardChart config={largeDataConfig} />);

      expect(screen.getByTestId('line-chart')).toBeInTheDocument();
    });

    it('should handle many yAxisKeys', () => {
      const manyKeysConfig = {
        ...baseConfig,
        yAxisKeys: ['v1', 'v2', 'v3', 'v4', 'v5', 'v6', 'v7', 'v8'],
      };
      render(<DashboardChart config={manyKeysConfig} />);

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(8);
    });

    it('should cycle through colors when more yAxisKeys than colors', () => {
      const manyKeysConfig = {
        ...baseConfig,
        colors: ['#ff0000', '#00ff00'],
        yAxisKeys: ['v1', 'v2', 'v3', 'v4', 'v5'],
      };
      render(<DashboardChart config={manyKeysConfig} />);

      const lines = screen.getAllByTestId('line');
      expect(lines).toHaveLength(5);
    });
  });
});
