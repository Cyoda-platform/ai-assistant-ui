import React from 'react';
import {
  LineChart,
  Line,
  AreaChart,
  Area,
  BarChart,
  Bar,
  ComposedChart,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';
import type { RechartsConfig } from '../types/diagrams';

interface DashboardChartProps {
  config: RechartsConfig;
}

export const DashboardChart: React.FC<DashboardChartProps> = ({ config }) => {
  const {
    chartType,
    data,
    xAxisKey,
    yAxisKeys = [],
    colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'],
    showGrid = true,
    showLegend = true,
    showTooltip = true,
    height = 300,
  } = config;

  const renderChart = () => {
    const commonProps = {
      data,
      margin: { top: 10, right: 30, left: 0, bottom: 0 },
    };

    switch (chartType) {
      case 'line':
        return (
          <LineChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6',
                }}
              />
            )}
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Line
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                strokeWidth={2}
                dot={{ fill: colors[index % colors.length], r: 4 }}
                activeDot={{ r: 6 }}
              />
            ))}
          </LineChart>
        );

      case 'area':
        return (
          <AreaChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6',
                }}
              />
            )}
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Area
                key={key}
                type="monotone"
                dataKey={key}
                stroke={colors[index % colors.length]}
                fill={colors[index % colors.length]}
                fillOpacity={0.6}
                strokeWidth={2}
              />
            ))}
          </AreaChart>
        );

      case 'bar':
        return (
          <BarChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6',
                }}
              />
            )}
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => (
              <Bar
                key={key}
                dataKey={key}
                fill={colors[index % colors.length]}
                radius={[4, 4, 0, 0]}
              />
            ))}
          </BarChart>
        );

      case 'composed':
        return (
          <ComposedChart {...commonProps}>
            {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#374151" />}
            <XAxis dataKey={xAxisKey} stroke="#9ca3af" />
            <YAxis stroke="#9ca3af" />
            {showTooltip && (
              <Tooltip
                contentStyle={{
                  backgroundColor: '#1f2937',
                  border: '1px solid #374151',
                  borderRadius: '0.5rem',
                  color: '#f3f4f6',
                }}
              />
            )}
            {showLegend && <Legend />}
            {yAxisKeys.map((key, index) => {
              // First key as area, rest as lines
              if (index === 0) {
                return (
                  <Area
                    key={key}
                    type="monotone"
                    dataKey={key}
                    stroke={colors[index % colors.length]}
                    fill={colors[index % colors.length]}
                    fillOpacity={0.6}
                    strokeWidth={2}
                  />
                );
              }
              return (
                <Line
                  key={key}
                  type="monotone"
                  dataKey={key}
                  stroke={colors[index % colors.length]}
                  strokeWidth={2}
                  dot={{ fill: colors[index % colors.length], r: 4 }}
                />
              );
            })}
          </ComposedChart>
        );

      case 'pie':
        // For pie charts, we expect data in format: [{name: string, value: number}]
        return (
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              labelLine={false}
              label={({ name, percent }) => `${name}: ${(percent * 100).toFixed(0)}%`}
              outerRadius={80}
              fill="#8884d8"
              dataKey="value"
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={colors[index % colors.length]} />
              ))}
            </Pie>
            {showTooltip && <Tooltip />}
            {showLegend && <Legend />}
          </PieChart>
        );

      default:
        return <div className="text-gray-400">Unsupported chart type: {chartType}</div>;
    }
  };

  return (
    <div className="w-full bg-gray-800 rounded-lg p-4 border border-gray-700">
      <div className="mb-4">
        <h3 className="text-lg font-semibold text-white">{config.name}</h3>
        {config.description && (
          <p className="text-sm text-gray-400 mt-1">{config.description}</p>
        )}
      </div>
      <ResponsiveContainer width="100%" height={height}>
        {renderChart()}
      </ResponsiveContainer>
    </div>
  );
};

export default DashboardChart;

