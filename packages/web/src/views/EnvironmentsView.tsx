import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Send,
  EyeOff,
  Edit2,
  Database,
  Code,
  GitBranch,
  FileText,
  Layers
} from 'lucide-react';

interface ChartDataPoint {
  date: string;
  value: number;
  threshold?: number;
}

interface BarDataPoint {
  date: string;
  value: number;
}

const EnvironmentsView: React.FC = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('environments');
  const [dashboardVisible, setDashboardVisible] = useState(true);

  // Mock data for charts
  const cpuData: ChartDataPoint[] = [
    { date: 'Oct 11', value: 45, threshold: 80 },
    { date: 'Oct 12', value: 52, threshold: 80 },
    { date: 'Oct 13', value: 58, threshold: 80 },
    { date: 'Oct 14', value: 65, threshold: 80 },
    { date: 'Oct 15', value: 70, threshold: 80 },
    { date: 'Oct 16', value: 72, threshold: 80 },
    { date: 'Oct 17', value: 68, threshold: 80 },
  ];

  const memoryData: ChartDataPoint[] = [
    { date: 'Oct 11', value: 5.8 },
    { date: 'Oct 12', value: 6.2 },
    { date: 'Oct 13', value: 6.5 },
    { date: 'Oct 14', value: 4.8 },
    { date: 'Oct 15', value: 5.2 },
    { date: 'Oct 16', value: 6.8 },
    { date: 'Oct 17', value: 7.0 },
  ];

  const apiResponseData: BarDataPoint[] = [
    { date: 'Oct 11', value: 320 },
    { date: 'Oct 12', value: 580 },
    { date: 'Oct 13', value: 450 },
    { date: 'Oct 14', value: 520 },
    { date: 'Oct 15', value: 620 },
    { date: 'Oct 16', value: 480 },
    { date: 'Oct 17', value: 550 },
  ];

  const requestVolumeData: ChartDataPoint[] = [
    { date: 'Oct 11', value: 15000 },
    { date: 'Oct 12', value: 18500 },
    { date: 'Oct 13', value: 17800 },
    { date: 'Oct 14', value: 19200 },
    { date: 'Oct 15', value: 16500 },
    { date: 'Oct 16', value: 18000 },
    { date: 'Oct 17', value: 19800 },
  ];

  const tabs = [
    { id: 'apps', label: 'Apps', icon: <Layers size={16} /> },
    { id: 'data', label: 'Data', icon: <Database size={16} /> },
    { id: 'workflow', label: 'Workflow', icon: <GitBranch size={16} /> },
    { id: 'requirement', label: 'Requirement', icon: <FileText size={16} /> },
    { id: 'code', label: 'Code', icon: <Code size={16} /> },
    { id: 'environments', label: 'Environments', icon: null },
  ];

  const handleSendToChat = () => {
    // Navigate to chat or trigger chat functionality
    console.log('Send to Chat clicked');
  };

  const handleHideDashboard = () => {
    setDashboardVisible(!dashboardVisible);
  };

  const handleEdit = () => {
    console.log('Edit clicked');
  };

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header with Tabs */}
      <div className="border-b border-slate-200 bg-white sticky top-0 z-10">
        <div className="max-w-[1400px] mx-auto px-6">
          <div className="flex items-center space-x-1 py-3">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2 ${
                  activeTab === tab.id
                    ? 'bg-teal-600 text-white'
                    : 'text-slate-600 hover:bg-slate-100 hover:text-slate-900'
                }`}
              >
                {tab.icon && <span>{tab.icon}</span>}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Main Content */}
      {dashboardVisible && (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          {/* Production Environment Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 rounded-lg bg-teal-50 flex items-center justify-center">
                  <Database className="text-teal-600" size={20} />
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-slate-900">Production</h1>
                  <p className="text-sm text-slate-500">Environment Configuration</p>
                </div>
              </div>

              <div className="flex items-center space-x-3">
                <button
                  onClick={handleSendToChat}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
                >
                  <Send size={16} />
                  <span>Send to Chat</span>
                </button>
                <button
                  onClick={handleHideDashboard}
                  className="px-4 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-lg text-sm font-medium transition-colors flex items-center space-x-2"
                >
                  <EyeOff size={16} />
                  <span>Hide Dashboard</span>
                </button>
                <button
                  onClick={handleEdit}
                  className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-all flex items-center space-x-2"
                >
                  <Edit2 size={16} />
                  <span>Edit</span>
                </button>
              </div>
            </div>
          </div>

          {/* Charts Grid */}
          <div className="grid grid-cols-2 gap-6">
            {/* CPU Usage Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">CPU Usage</h3>
              <p className="text-sm text-slate-500 mb-6">Production CPU utilization over time</p>
              <div className="h-64 relative">
                <AreaChart data={cpuData} color="#ef4444" thresholdColor="#f59e0b" showThreshold />
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gradient-to-b from-red-400 to-red-600"></div>
                  <span className="text-slate-500">cpu</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-0.5 bg-orange-400"></div>
                  <span className="text-slate-500">threshold</span>
                </div>
              </div>
            </div>

            {/* Memory Usage Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Memory Usage (GB)</h3>
              <p className="text-sm text-slate-500 mb-6">Production memory consumption</p>
              <div className="h-64 relative">
                <LineChart data={memoryData} color="#10b981" />
              </div>
              <div className="flex items-center justify-center space-x-6 mt-4 text-xs">
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-gray-500"></div>
                  <span className="text-slate-500">total</span>
                </div>
                <div className="flex items-center space-x-2">
                  <div className="w-3 h-3 rounded-full bg-emerald-400"></div>
                  <span className="text-slate-500">used</span>
                </div>
              </div>
            </div>

            {/* API Response Time Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">API Response Time (ms)</h3>
              <p className="text-sm text-slate-500 mb-6">Response time percentiles</p>
              <div className="h-64 relative">
                <BarChart data={apiResponseData} color="#ef4444" />
              </div>
            </div>

            {/* Request Volume Chart */}
            <div className="bg-white border border-slate-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-slate-900 mb-2">Request Volume</h3>
              <p className="text-sm text-slate-500 mb-6">Total requests and errors per day</p>
              <div className="h-64 relative">
                <AreaChart data={requestVolumeData} color="#3b82f6" />
              </div>
            </div>
          </div>
        </div>
      )}

      {!dashboardVisible && (
        <div className="max-w-[1400px] mx-auto px-6 py-8">
          <div className="text-center text-slate-500">
            <p className="mb-4">Dashboard is hidden</p>
            <button
              onClick={handleHideDashboard}
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-medium"
            >
              Show Dashboard
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// Simple Area Chart Component
const AreaChart: React.FC<{
  data: ChartDataPoint[];
  color: string;
  thresholdColor?: string;
  showThreshold?: boolean;
}> = ({ data, color, thresholdColor, showThreshold }) => {
  const width = 600;
  const height = 200;
  const padding = 40;

  const maxValue = Math.max(...data.map(d => Math.max(d.value, d.threshold || 0)));
  const minValue = 0;

  const xScale = (index: number) =>
    padding + (index / (data.length - 1)) * (width - 2 * padding);

  const yScale = (value: number) =>
    height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding);

  const pathData = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`
  ).join(' ');

  const areaPath = `${pathData} L ${xScale(data.length - 1)} ${height - padding} L ${padding} ${height - padding} Z`;

  const thresholdPath = showThreshold && data[0].threshold
    ? `M ${padding} ${yScale(data[0].threshold)} L ${width - padding} ${yScale(data[0].threshold)}`
    : '';

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      <defs>
        <linearGradient id={`gradient-${color}`} x1="0%" y1="0%" x2="0%" y2="100%">
          <stop offset="0%" stopColor={color} stopOpacity="0.6" />
          <stop offset="100%" stopColor={color} stopOpacity="0.1" />
        </linearGradient>
      </defs>

      {/* Grid lines */}
      {[0, 25, 50, 75, 100].map((percent) => {
        const y = height - padding - (percent / 100) * (height - 2 * padding);
        return (
          <line
            key={percent}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Area */}
      <path d={areaPath} fill={`url(#gradient-${color})`} />

      {/* Line */}
      <path d={pathData} fill="none" stroke={color} strokeWidth="2" />

      {/* Threshold line */}
      {showThreshold && thresholdPath && (
        <path
          d={thresholdPath}
          fill="none"
          stroke={thresholdColor}
          strokeWidth="2"
          strokeDasharray="6 4"
        />
      )}

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(d.value)}
          r="4"
          fill={color}
          className="hover:r-6 transition-all cursor-pointer"
        />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - 10}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
        >
          {d.date}
        </text>
      ))}

      {/* Y-axis labels */}
      {[0, 20, 40, 60, 80].map((value) => (
        <text
          key={value}
          x={padding - 10}
          y={yScale(value)}
          textAnchor="end"
          fill="#94a3b8"
          fontSize="11"
          dominantBaseline="middle"
        >
          {value}
        </text>
      ))}
    </svg>
  );
};

// Simple Line Chart Component
const LineChart: React.FC<{
  data: ChartDataPoint[];
  color: string;
}> = ({ data, color }) => {
  const width = 600;
  const height = 200;
  const padding = 40;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = 0;

  const xScale = (index: number) =>
    padding + (index / (data.length - 1)) * (width - 2 * padding);

  const yScale = (value: number) =>
    height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding);

  const pathData = data.map((d, i) =>
    `${i === 0 ? 'M' : 'L'} ${xScale(i)} ${yScale(d.value)}`
  ).join(' ');

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Grid lines */}
      {[0, 2, 4, 6, 8].map((value) => {
        const y = yScale(value);
        return (
          <line
            key={value}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Line */}
      <path d={pathData} fill="none" stroke={color} strokeWidth="2" />

      {/* Data points */}
      {data.map((d, i) => (
        <circle
          key={i}
          cx={xScale(i)}
          cy={yScale(d.value)}
          r="4"
          fill={color}
          className="hover:r-6 transition-all cursor-pointer"
        />
      ))}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - 10}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
        >
          {d.date}
        </text>
      ))}

      {/* Y-axis labels */}
      {[0, 2, 4, 6, 8].map((value) => (
        <text
          key={value}
          x={padding - 10}
          y={yScale(value)}
          textAnchor="end"
          fill="#94a3b8"
          fontSize="11"
          dominantBaseline="middle"
        >
          {value}
        </text>
      ))}
    </svg>
  );
};

// Simple Bar Chart Component
const BarChart: React.FC<{
  data: BarDataPoint[];
  color: string;
}> = ({ data, color }) => {
  const width = 600;
  const height = 200;
  const padding = 40;

  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = 0;

  const barWidth = (width - 2 * padding) / data.length * 0.6;
  const barSpacing = (width - 2 * padding) / data.length;

  const xScale = (index: number) =>
    padding + index * barSpacing + barSpacing / 2;

  const yScale = (value: number) =>
    height - padding - ((value - minValue) / (maxValue - minValue)) * (height - 2 * padding);

  return (
    <svg width="100%" height="100%" viewBox={`0 0 ${width} ${height}`} className="overflow-visible">
      {/* Grid lines */}
      {[0, 200, 400, 600].map((value) => {
        const y = yScale(value);
        return (
          <line
            key={value}
            x1={padding}
            y1={y}
            x2={width - padding}
            y2={y}
            stroke="#334155"
            strokeWidth="1"
            strokeDasharray="4 4"
          />
        );
      })}

      {/* Bars */}
      {data.map((d, i) => {
        const barHeight = (height - padding) - yScale(d.value);
        return (
          <rect
            key={i}
            x={xScale(i) - barWidth / 2}
            y={yScale(d.value)}
            width={barWidth}
            height={barHeight}
            fill={color}
            className="hover:opacity-80 transition-all cursor-pointer"
            rx="4"
          />
        );
      })}

      {/* X-axis labels */}
      {data.map((d, i) => (
        <text
          key={i}
          x={xScale(i)}
          y={height - 10}
          textAnchor="middle"
          fill="#94a3b8"
          fontSize="11"
        >
          {d.date}
        </text>
      ))}

      {/* Y-axis labels */}
      {[0, 200, 400, 600].map((value) => (
        <text
          key={value}
          x={padding - 10}
          y={yScale(value)}
          textAnchor="end"
          fill="#94a3b8"
          fontSize="11"
          dominantBaseline="middle"
        >
          {value}
        </text>
      ))}
    </svg>
  );
};

export default EnvironmentsView;
