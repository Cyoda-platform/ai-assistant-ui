import React, { useState, useEffect } from 'react';
import { ArrowLeft, RefreshCw, Loader2, TrendingUp, Cpu, HardDrive, Network, Activity } from 'lucide-react';
import { message } from 'antd';
import privateClient from '@/clients/private';
import { getToken } from '@/helpers/HelperAuth';
import dayjs from 'dayjs';
import './MonitoringView.css';

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

const MonitoringView: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [cpuUsage, setCpuUsage] = useState<string>('--');
  const [memoryUsage, setMemoryUsage] = useState<string>('--');
  const [podCount, setPodCount] = useState<string>('--');
  const [networkIn, setNetworkIn] = useState<string>('--');
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [namespace, setNamespace] = useState<string>('default');
  const [error, setError] = useState<string | null>(null);

  // Fetch instant metrics
  const fetchMetrics = async () => {
    setLoading(true);
    setError(null);

    try {
      const token = await getToken();

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
              data: { query: q.query },
              headers: {
                'Authorization': `Bearer ${token}`,
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
    } catch (err: any) {
      console.error('Failed to fetch metrics:', err);
      const errorMsg = err?.response?.data?.error || err?.message || 'Failed to fetch metrics';
      setError(errorMsg);
      message.error(`Error: ${errorMsg}`);
    } finally {
      setLoading(false);
    }
  };

  // Fetch on mount and set up auto-refresh
  useEffect(() => {
    fetchMetrics();

    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchMetrics, 30000);
    return () => clearInterval(interval);
  }, [namespace]);

  return (
    <div className="monitoring-view">
      {/* Header */}
      <div className="monitoring-header">
        <div className="monitoring-header-left">
          <h1>Environment Metrics</h1>
          <div className="monitoring-connection-info">
            <span className="connection-status">Connected to: localhost:8000</span>
            <span className="namespace-badge">{namespace}</span>
          </div>
        </div>
        <div className="monitoring-header-actions">
          <button onClick={fetchMetrics} className="action-button" disabled={loading}>
            {loading ? 'Loading...' : '↻ Refresh'}
          </button>
        </div>
      </div>

      {error && (
        <div className="monitoring-error">
          <strong>Error:</strong> {error}
          <button onClick={fetchMetrics} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && !lastUpdate && (
        <div className="monitoring-loading">
          <div className="loading-spinner"></div>
          <div>Loading metrics...</div>
        </div>
      )}

      <div className="monitoring-content">
        {/* Last Update */}
        {lastUpdate && (
          <div className="last-update">
            Last updated: {dayjs(lastUpdate).format('HH:mm:ss')}
          </div>
        )}

        {/* Metrics Grid */}
        <div className="metrics-grid">
          {/* CPU Usage */}
          <div className="metric-card cpu">
            <div className="metric-header">
              <div className="metric-title">
                <Cpu size={18} />
                <h4>CPU Usage</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin" />}
            </div>
            <div className="metric-value">{cpuUsage}</div>
            <div className="metric-description">Average across all containers</div>
          </div>

          {/* Memory Usage */}
          <div className="metric-card memory">
            <div className="metric-header">
              <div className="metric-title">
                <HardDrive size={18} />
                <h4>Memory Usage</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin" />}
            </div>
            <div className="metric-value">{memoryUsage}</div>
            <div className="metric-description">Total memory consumption</div>
          </div>

          {/* Pod Count */}
          <div className="metric-card pods">
            <div className="metric-header">
              <div className="metric-title">
                <TrendingUp size={18} />
                <h4>Running Pods</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin" />}
            </div>
            <div className="metric-value">{podCount}</div>
            <div className="metric-description">Active pods in namespace</div>
          </div>

          {/* Network Traffic */}
          <div className="metric-card network">
            <div className="metric-header">
              <div className="metric-title">
                <Network size={18} />
                <h4>Network In</h4>
              </div>
              {loading && <Loader2 size={14} className="animate-spin" />}
            </div>
            <div className="metric-value">{networkIn}</div>
            <div className="metric-description">Incoming traffic rate</div>
          </div>
        </div>

        {/* Info Box */}
        <div className="metrics-info">
          <p className="info-title">📊 Metrics Information</p>
          <ul>
            <li>Metrics are updated every 30 seconds automatically</li>
            <li>All data is filtered to your namespace: <code>{namespace}</code></li>
            <li>Click "Refresh" to update manually</li>
            <li>CPU usage is averaged over the last 5 minutes</li>
          </ul>
        </div>

        {/* Query Status */}
        <div className="query-status">
          <div className="status-row">
            <span>API Endpoint:</span>
            <span className="status-active">✓ Connected</span>
          </div>
          <div className="status-row">
            <span>Namespace Filter:</span>
            <code>{namespace}</code>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MonitoringView;
