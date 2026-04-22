/**
 * Dashboard configuration types for environment monitoring
 * Supports Recharts for performance metrics and data visualization
 */

export type ChartLibrary = 'recharts';

export type ChartType =
  | 'line'
  | 'area'
  | 'bar'
  | 'composed'
  | 'pie'
  | 'radar'
  | 'scatter';

export interface BaseChartConfig {
  id: string;
  name: string;
  description?: string;
  library: ChartLibrary;
  chartType: ChartType;
  width?: number | string;
  height?: number;
}

export interface RechartsConfig extends BaseChartConfig {
  library: 'recharts';
  data: any[];
  xAxisKey?: string;
  yAxisKeys?: string[];
  colors?: string[];
  showGrid?: boolean;
  showLegend?: boolean;
  showTooltip?: boolean;
  customOptions?: Record<string, any>;
}

export type DashboardChartConfig = RechartsConfig;

/**
 * Environment dashboard configuration
 * Associates performance charts with specific environments
 */
export interface EnvironmentDashboardConfig {
  environmentId: string;
  environmentName: string;
  charts: DashboardChartConfig[];
}

/**
 * Complete dashboard configuration for all environments
 */
export interface DashboardsConfiguration {
  version: string;
  environments: EnvironmentDashboardConfig[];
}

// Legacy type aliases for backward compatibility
export type DiagramConfig = DashboardChartConfig;
export type EnvironmentDiagramConfig = EnvironmentDashboardConfig;
export type DiagramsConfiguration = DashboardsConfiguration;

