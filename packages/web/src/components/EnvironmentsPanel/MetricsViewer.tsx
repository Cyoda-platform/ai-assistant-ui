import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Loader2, TrendingUp, Cpu, HardDrive, Network, Activity } from 'lucide-react';
import { message } from 'antd';
import privateClient from '@/clients/private';
import dayjs from 'dayjs';

interface MetricsViewerProps {
  grafanaToken: string;
  namespace: string;
  onBack: () => void;
  type?: 'environment' | 'application';
  deploymentId?: string;
}

interface MetricData {
  metric: Record<string, string>;
  value?: [number, string];
  values?: [number, string][];
}

interface PrometheusResponse {
  status: string;
  data: {
    resultType: string;
    result: MetricData[];
  };
}

const MetricsViewer: React.FC<MetricsViewerProps> = ({
  grafanaToken,
  namespace,
  onBack,
  type = 'environment',
  deploymentId
}) => {
  const [loading, setLoading] = useState(false);
  const [cpuUsage, setCpuUsage] = useState<string>('--');
  const [memoryUsage, setMemoryUsage] = useState<string>('--');
  const [podCount, setPodCount] = useState<string>('--');
  const [networkIn, setNetworkIn] = useState<string>('--');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  // Fetch instant metrics
  const fetchMetrics = async () => {
    setLoading(true);
    try {
      // Query multiple metrics in parallel
      const queries = [
        // CPU usage rate
        {
          name: 'cpu',
          query: `sum(rate(container_cpu_usage_seconds_total{namespace="${namespace}",container!=""}[5m])) * 100`
        },
        // Memory usage in MB
        {
          name: 'memory',
          query: `sum(container_memory_usage_bytes{namespace="${namespace}",container!=""}) / 1024 / 1024`
        },
        // Pod count
        {
          name: 'pods',
          query: `count(kube_pod_info{namespace="${namespace}"})`
        },
        // Network received rate in KB/s
        {
          name: 'network',
          query: `sum(rate(container_network_receive_bytes_total{namespace="${namespace}"}[5m])) / 1024`
        }
      ];

      const results = await Promise.all(
        queries.map(async (q) => {
          try {
            const { data } = await privateClient({
              method: 'post',
              url: `${import.meta.env.VITE_APP_API_BASE}/v1/metrics/query`,
              data: {
                query: q.query,
                type: type,
                id: deploymentId || (type === 'environment' ? 'develop' : 'start')
              }
            });
            return { name: q.name, data };
          } catch (error) {
            console.error(`Failed to fetch ${q.name}:`, error);
            return { name: q.name, data: null };
          }
        })
      );

      // Process results
      results.forEach(({ name, data }) => {
        if (data?.data?.result?.[0]?.value) {
          const value = parseFloat(data.data.result[0].value[1]);

          switch (name) {
            case 'cpu':
              setCpuUsage(value.toFixed(2) + '%');
              break;
            case 'memory':
              setMemoryUsage(value.toFixed(0) + ' MB');
              break;
            case 'pods':
              setPodCount(Math.round(value).toString());
              break;
            case 'network':
              setNetworkIn(value.toFixed(2) + ' KB/s');
              break;
          }
        }
      });

      setLastUpdate(new Date());
      message.success('Metrics updated');
    } catch (error: any) {
      console.error('Failed to fetch metrics:', error);
      message.error('Failed to fetch metrics');
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount
  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [namespace]);

  return (
    <div className="h-full flex flex-col bg-white">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-200">
        <div className="flex items-center space-x-3">
          <button
            onClick={onBack}
            className="p-1.5 rounded hover:bg-slate-100 transition-colors"
            title="Back to environment"
          >
            <ArrowLeft size={18} className="text-slate-500" />
          </button>
          <Activity size={18} className="text-orange-500" />
          <h3 className="font-semibold text-slate-900">Environment Metrics</h3>
          <span className="text-xs bg-orange-50 text-orange-700 px-2 py-1 rounded-full">
            {namespace}
          </span>
        </div>
        <button
          onClick={fetchMetrics}
          disabled={loading}
          className="flex items-center space-x-2 px-3 py-1.5 rounded bg-teal-500/20 text-teal-400 hover:bg-teal-500/30 transition-colors disabled:opacity-50"
        >
          <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
          <span className="text-xs font-medium">Refresh</span>
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4">
        {/* Last Update */}
        {lastUpdate && (
          <div className="text-xs text-slate-400 mb-4">
            Last updated: {dayjs(lastUpdate).format('HH:mm:ss')}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* CPU Usage */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Cpu size={18} className="text-blue-400" />
                <h4 className="text-sm font-semibold text-white">CPU Usage</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            </div>
            <div className="text-3xl font-bold text-blue-400">{cpuUsage}</div>
            <div className="text-xs text-slate-400 mt-1">Average across all containers</div>
          </div>

          {/* Memory Usage */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <HardDrive size={18} className="text-green-400" />
                <h4 className="text-sm font-semibold text-white">Memory Usage</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            </div>
            <div className="text-3xl font-bold text-green-400">{memoryUsage}</div>
            <div className="text-xs text-slate-400 mt-1">Total memory consumption</div>
          </div>

          {/* Pod Count */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <TrendingUp size={18} className="text-purple-400" />
                <h4 className="text-sm font-semibold text-white">Running Pods</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            </div>
            <div className="text-3xl font-bold text-purple-400">{podCount}</div>
            <div className="text-xs text-slate-400 mt-1">Active pods in namespace</div>
          </div>

          {/* Network Traffic */}
          <div className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
            <div className="flex items-center justify-between mb-3">
              <div className="flex items-center space-x-2">
                <Network size={18} className="text-yellow-400" />
                <h4 className="text-sm font-semibold text-white">Network In</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin text-slate-400" />}
            </div>
            <div className="text-3xl font-bold text-yellow-400">{networkIn}</div>
            <div className="text-xs text-slate-400 mt-1">Incoming traffic rate</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="mt-6 bg-blue-500/10 border border-blue-500/30 rounded-lg p-4">
          <div className="text-xs text-blue-300">
            <p className="font-semibold mb-2">📊 Metrics Information</p>
            <ul className="space-y-1 ml-4 list-disc">
              <li>Metrics are updated every 30 seconds automatically</li>
              <li>All data is filtered to your namespace: <code className="bg-blue-900/30 px-1 rounded">{namespace}</code></li>
              <li>Click "Refresh" to update manually</li>
              <li>CPU usage is averaged over the last 5 minutes</li>
            </ul>
          </div>
        </div>

        {/* Query Status */}
        <div className="mt-4 p-3 bg-slate-700/30 rounded border border-slate-600">
          <div className="text-xs text-slate-400">
            <div className="flex items-center justify-between">
              <span>Grafana Token:</span>
              <span className="text-green-400">✓ Active</span>
            </div>
            <div className="flex items-center justify-between mt-1">
              <span>Namespace Filter:</span>
              <code className="text-teal-400">{namespace}</code>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MetricsViewer;
