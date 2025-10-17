/**
 * Mock dashboard data for environment monitoring
 * Performance metrics and charts configured via JSON using Recharts
 */

import type { DashboardsConfiguration, RechartsConfig } from './types/diagrams';

// Generate sample time-series data
const generateTimeSeriesData = (days: number = 7) => {
  const data = [];
  const now = new Date();
  for (let i = days - 1; i >= 0; i--) {
    const date = new Date(now);
    date.setDate(date.getDate() - i);
    data.push({
      date: date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      timestamp: date.getTime(),
    });
  }
  return data;
};

export const mockDiagramsConfig: DashboardsConfiguration = {
  version: '1.0.0',
  environments: [
    {
      environmentId: 'production',
      environmentName: 'Production',
      charts: [
        {
          id: 'prod-cpu-usage',
          name: 'CPU Usage',
          description: 'Production CPU utilization over time',
          library: 'recharts',
          chartType: 'area',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            cpu: 45 + Math.random() * 30,
            threshold: 75,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['cpu', 'threshold'],
          colors: ['#3b82f6', '#ef4444'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'prod-memory-usage',
          name: 'Memory Usage (GB)',
          description: 'Production memory consumption',
          library: 'recharts',
          chartType: 'line',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            used: 4.2 + Math.random() * 2,
            total: 8,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['used', 'total'],
          colors: ['#10b981', '#6b7280'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'prod-response-time',
          name: 'API Response Time (ms)',
          description: 'Response time percentiles',
          library: 'recharts',
          chartType: 'bar',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            p50: 120 + Math.random() * 50,
            p95: 250 + Math.random() * 100,
            p99: 450 + Math.random() * 150,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['p50', 'p95', 'p99'],
          colors: ['#22c55e', '#f59e0b', '#ef4444'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'prod-requests',
          name: 'Request Volume',
          description: 'Total requests and errors per day',
          library: 'recharts',
          chartType: 'composed',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            requests: 15000 + Math.random() * 5000,
            errors: 50 + Math.random() * 100,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['requests', 'errors'],
          colors: ['#3b82f6', '#ef4444'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
      ],
    },
    {
      environmentId: 'staging',
      environmentName: 'Staging',
      charts: [
        {
          id: 'staging-test-results',
          name: 'Test Results',
          description: 'Daily test pass/fail rates',
          library: 'recharts',
          chartType: 'bar',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            passed: 450 + Math.random() * 50,
            failed: 10 + Math.random() * 20,
            skipped: 5 + Math.random() * 10,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['passed', 'failed', 'skipped'],
          colors: ['#22c55e', '#ef4444', '#f59e0b'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'staging-deployment-frequency',
          name: 'Deployment Frequency',
          description: 'Number of deployments per day',
          library: 'recharts',
          chartType: 'line',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            deployments: Math.floor(3 + Math.random() * 5),
            rollbacks: Math.floor(Math.random() * 2),
          })),
          xAxisKey: 'date',
          yAxisKeys: ['deployments', 'rollbacks'],
          colors: ['#3b82f6', '#ef4444'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'staging-coverage',
          name: 'Code Coverage',
          description: 'Test coverage percentage',
          library: 'recharts',
          chartType: 'area',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            coverage: 75 + Math.random() * 10,
            target: 80,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['coverage', 'target'],
          colors: ['#10b981', '#6b7280'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
      ],
    },
    {
      environmentId: 'development',
      environmentName: 'Development',
      charts: [
        {
          id: 'dev-build-time',
          name: 'Build Time (seconds)',
          description: 'Average build duration',
          library: 'recharts',
          chartType: 'line',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            frontend: 45 + Math.random() * 15,
            backend: 120 + Math.random() * 30,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['frontend', 'backend'],
          colors: ['#3b82f6', '#8b5cf6'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'dev-commits',
          name: 'Daily Commits',
          description: 'Number of commits per day',
          library: 'recharts',
          chartType: 'bar',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            commits: Math.floor(15 + Math.random() * 25),
          })),
          xAxisKey: 'date',
          yAxisKeys: ['commits'],
          colors: ['#10b981'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'dev-pr-stats',
          name: 'Pull Request Stats',
          description: 'PR open/merged/closed counts',
          library: 'recharts',
          chartType: 'composed',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            opened: Math.floor(5 + Math.random() * 10),
            merged: Math.floor(3 + Math.random() * 7),
            closed: Math.floor(1 + Math.random() * 3),
          })),
          xAxisKey: 'date',
          yAxisKeys: ['opened', 'merged', 'closed'],
          colors: ['#3b82f6', '#22c55e', '#ef4444'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
      ],
    },
    {
      environmentId: 'test',
      environmentName: 'Test',
      charts: [
        {
          id: 'test-execution-time',
          name: 'Test Execution Time (min)',
          description: 'Time taken to run test suites',
          library: 'recharts',
          chartType: 'bar',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            unit: 2 + Math.random() * 1,
            integration: 8 + Math.random() * 3,
            e2e: 15 + Math.random() * 5,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['unit', 'integration', 'e2e'],
          colors: ['#22c55e', '#f59e0b', '#ef4444'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
        {
          id: 'test-flakiness',
          name: 'Test Flakiness Rate',
          description: 'Percentage of flaky tests',
          library: 'recharts',
          chartType: 'line',
          height: 300,
          data: generateTimeSeriesData(7).map((d) => ({
            ...d,
            flaky: 2 + Math.random() * 3,
            threshold: 5,
          })),
          xAxisKey: 'date',
          yAxisKeys: ['flaky', 'threshold'],
          colors: ['#f59e0b', '#ef4444'],
          showGrid: true,
          showLegend: true,
          showTooltip: true,
        } as RechartsConfig,
      ],
    },
  ],
};

export default mockDiagramsConfig;

