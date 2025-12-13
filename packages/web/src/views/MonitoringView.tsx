import React, { useState, useEffect } from 'react';
import { RefreshCw, Loader2, TrendingUp, Cpu, HardDrive, Network, Activity, BarChart3, AlertCircle } from 'lucide-react';
import { message } from 'antd';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import privateClient from '@/clients/private';
import { getToken } from '@/helpers/HelperAuth';
import dayjs from 'dayjs';
import Logo from '@/assets/images/logo.svg';
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

interface Environment {
  name: string;
  namespace: string;
  status: string;
  created_at?: string;
}

interface MetricValue {
  timestamp: number;
  value: string;
}

interface MetricHistory {
  [key: string]: MetricValue[];
}

const AVAILABLE_METRICS = [
  { id: 'cpu_usage_rate', label: 'CPU Usage Rate', unit: 'cores', icon: Cpu },
  { id: 'memory_usage', label: 'Memory Usage', unit: 'GB', icon: HardDrive },
  { id: 'pod_count', label: 'Pod Count', unit: 'pods', icon: TrendingUp },
  { id: 'pod_status_up', label: 'Pods Up', unit: 'count', icon: Activity },
  { id: 'pod_status_down', label: 'Pods Down', unit: 'count', icon: AlertCircle },
  { id: 'pod_restarts', label: 'Pod Restarts', unit: 'total', icon: RefreshCw },
  { id: 'pod_not_ready', label: 'Pods Not Ready', unit: 'count', icon: AlertCircle },
  { id: 'memory_working_set', label: 'Memory Working Set', unit: 'GB', icon: HardDrive },
  { id: 'cpu_usage_by_pod', label: 'CPU by Pod', unit: 'cores', icon: Cpu },
  { id: 'cpu_usage_by_deployment', label: 'CPU by Deployment', unit: 'cores', icon: Cpu },
  { id: 'cpu_usage_by_node', label: 'CPU by Node', unit: 'cores', icon: Cpu },
  { id: 'memory_usage_by_deployment', label: 'Memory by Deployment', unit: 'GB', icon: HardDrive },
  { id: 'http_requests_rate', label: 'HTTP Requests', unit: 'req/s', icon: Network },
  { id: 'http_errors_rate', label: 'HTTP Errors', unit: 'req/s', icon: AlertCircle },
  { id: 'http_request_latency_p95', label: 'HTTP Latency P95', unit: 'ms', icon: Network },
  { id: 'events_rate', label: 'Events Rate', unit: 'events/s', icon: Activity },
];

const MonitoringView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [loading, setLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  const [rateLimitError, setRateLimitError] = useState<string | null>(null);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<string>('cyoda');
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedMetrics, setSelectedMetrics] = useState<string[]>(['cpu_usage_rate', 'memory_usage', 'pod_count']);
  const [metricValues, setMetricValues] = useState<Record<string, string>>({});
  const [metricHistory, setMetricHistory] = useState<MetricHistory>({});
  const [showMetricSelector, setShowMetricSelector] = useState(false);
  const [expandedMetric, setExpandedMetric] = useState<string | null>(null);

  const fetchEnvironments = async () => {
    setLoadingEnvironments(true);
    try {
      const response = await privateClient({
        method: 'post',
        url: '/agent/environment/list_environments',
        data: {}
      });

      if (response.data && response.data.environments) {
        setEnvironments(response.data.environments);
        // Only auto-select first environment if no environment is already selected
        // This allows URL parameters to take precedence
        if (response.data.environments.length > 0 && !selectedEnvironment) {
          setSelectedEnvironment(response.data.environments[0].name);
        }
      } else {
        setEnvironments([]);
      }
    } catch (err) {
      console.error('Failed to fetch environments:', err);
      message.error('Failed to load environments');
      setEnvironments([]);
    } finally {
      setLoadingEnvironments(false);
    }
  };

  const fetchApplications = async (envName: string) => {
    setLoadingApplications(true);
    try {
      const response = await privateClient({
        method: 'post',
        url: '/agent/environment/list_user_apps',
        data: { env_name: envName }
      });

      if (response.data && response.data.user_applications) {
        setApplications(response.data.user_applications);
      } else {
        setApplications([]);
      }
    } catch (err) {
      console.error('Failed to fetch applications:', err);
      message.error('Failed to load applications');
      setApplications([]);
    } finally {
      setLoadingApplications(false);
    }
  };

  const formatMetricValue = (queryType: string, value: number): string => {
    const metric = AVAILABLE_METRICS.find(m => m.id === queryType);
    if (!metric) return value.toString();

    switch (queryType) {
      case 'memory_usage':
      case 'memory_working_set':
      case 'memory_usage_by_deployment':
        // Convert bytes to GB
        return (value / 1024 / 1024 / 1024).toFixed(2) + ' GB';
      case 'cpu_usage_rate':
      case 'cpu_usage_by_pod':
      case 'cpu_usage_by_deployment':
      case 'cpu_usage_by_node':
        // CPU in cores
        return value.toFixed(3) + ' cores';
      case 'http_request_latency_p95':
        // Convert to milliseconds
        return (value * 1000).toFixed(2) + ' ms';
      case 'http_requests_rate':
      case 'http_errors_rate':
      case 'events_rate':
        // Requests per second
        return value.toFixed(2) + ' ' + metric.unit;
      default:
        // Count metrics
        return Math.round(value).toString();
    }
  };

  // Fetch instant metrics using new query type system
  const fetchMetrics = async () => {
    if (!selectedEnvironment) {
      message.warning('Please select an environment');
      return;
    }

    setLoading(true);
    setError(null);
    setRateLimitError(null);

    try {
      const results = await Promise.all(
        selectedMetrics.map(async (queryType) => {
          try {
            // Get current time for range query (last 1 hour)
            const now = new Date();
            const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

            const { data } = await privateClient({
              method: 'post',
              url: '/v1/metrics/query_range',
              data: {
                query_type: queryType,
                env_name: selectedEnvironment,
                app_name: selectedApplication,
                start: oneHourAgo.toISOString(),
                end: now.toISOString(),
                step: '30s'
              }
            });
            return { queryType, data };
          } catch (error: any) {
            // Check for rate limit error (429)
            if (error?.response?.status === 429) {
              throw error;
            }
            console.error(`Failed to fetch ${queryType}:`, error);
            return { queryType, data: null };
          }
        })
      );

      // Process results and update state
      const newValues: Record<string, string> = {};
      const newHistory: MetricHistory = { ...metricHistory };

      results.forEach(({ queryType, data }) => {
        // Handle range query results (array of [timestamp, value] pairs)
        if (data?.data?.result?.[0]?.values) {
          const values = data.data.result[0].values;

          // Get the latest value for display
          if (values.length > 0) {
            const latestValue = parseFloat(values[values.length - 1][1]);
            const formattedValue = formatMetricValue(queryType, latestValue);
            newValues[queryType] = formattedValue;
          } else {
            newValues[queryType] = '--';
          }

          // Store all historical values
          newHistory[queryType] = values.map(([timestamp, value]) => ({
            timestamp: parseInt(timestamp) * 1000,
            value: value
          }));
        }
        // Handle instant query results (single [timestamp, value] pair)
        else if (data?.data?.result?.[0]?.value) {
          const value = parseFloat(data.data.result[0].value[1]);
          const formattedValue = formatMetricValue(queryType, value);
          newValues[queryType] = formattedValue;

          // Add to history (keep last 60 data points)
          if (!newHistory[queryType]) {
            newHistory[queryType] = [];
          }
          const now = Date.now();
          newHistory[queryType].push({ timestamp: now, value: data.data.result[0].value[1] });
          if (newHistory[queryType].length > 60) {
            newHistory[queryType].shift();
          }
        } else {
          newValues[queryType] = '--';
        }
      });

      setMetricValues(newValues);
      setMetricHistory(newHistory);
      setLastUpdate(new Date());
      message.success('Metrics updated');
    } catch (err: any) {
      console.error('Failed to fetch metrics:', err);

      // Handle rate limit error (429)
      if (err?.response?.status === 429) {
        const rateLimitMsg = 'We\'re receiving too many requests. Please try again in a few seconds.';
        setRateLimitError(rateLimitMsg);
        message.error(rateLimitMsg);
      } else {
        const errorMsg = err?.response?.data?.error || err?.message || 'Failed to fetch metrics';
        setError(errorMsg);
        message.error(`Error: ${errorMsg}`);
      }
    } finally {
      setLoading(false);
    }
  };

  // Initialize from URL parameters and fetch environments on mount
  useEffect(() => {
    const initializeFromUrl = async () => {
      const envName = searchParams.get('env_name');
      const appName = searchParams.get('app_name') || 'cyoda';

      // Fetch environments first
      await fetchEnvironments();

      // Then set selected environment from URL
      if (envName) {
        setSelectedEnvironment(envName);
        setSelectedApplication(appName);
      }
    };

    initializeFromUrl();
  }, []);

  // Fetch applications when environment changes
  useEffect(() => {
    if (selectedEnvironment) {
      fetchApplications(selectedEnvironment);
    }
  }, [selectedEnvironment]);

  // Fetch metrics when environment, app, or selected metrics change
  useEffect(() => {
    if (selectedEnvironment && selectedMetrics.length > 0) {
      fetchMetrics();
      // Auto-refresh every 30 seconds
      const interval = setInterval(fetchMetrics, 30000);
      return () => clearInterval(interval);
    }
  }, [selectedEnvironment, selectedApplication, selectedMetrics]);

  // Fetch only newly selected metric
  const fetchSingleMetric = async (queryType: string) => {
    if (!selectedEnvironment) return;

    try {
      // Get current time for range query (last 1 hour)
      const now = new Date();
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      const { data } = await privateClient({
        method: 'post',
        url: '/v1/metrics/query_range',
        data: {
          query_type: queryType,
          env_name: selectedEnvironment,
          app_name: selectedApplication,
          start: oneHourAgo.toISOString(),
          end: now.toISOString(),
          step: '30s'
        }
      });

      // Handle range query results (array of [timestamp, value] pairs)
      if (data?.data?.result?.[0]?.values) {
        const values = data.data.result[0].values;

        // Get the latest value for display
        if (values.length > 0) {
          const latestValue = parseFloat(values[values.length - 1][1]);
          const formattedValue = formatMetricValue(queryType, latestValue);
          setMetricValues(prev => ({ ...prev, [queryType]: formattedValue }));
        }

        // Store all historical values
        setMetricHistory(prev => {
          const newHistory = { ...prev };
          newHistory[queryType] = values.map(([timestamp, value]) => ({
            timestamp: parseInt(timestamp) * 1000,
            value: value
          }));
          return newHistory;
        });
      }
      // Handle instant query results (single [timestamp, value] pair)
      else if (data?.data?.result?.[0]?.value) {
        const value = parseFloat(data.data.result[0].value[1]);
        const formattedValue = formatMetricValue(queryType, value);
        setMetricValues(prev => ({ ...prev, [queryType]: formattedValue }));

        // Add to history
        const now = Date.now();
        setMetricHistory(prev => {
          const newHistory = { ...prev };
          if (!newHistory[queryType]) {
            newHistory[queryType] = [];
          }
          newHistory[queryType].push({ timestamp: now, value: data.data.result[0].value[1] });
          if (newHistory[queryType].length > 60) {
            newHistory[queryType].shift();
          }
          return newHistory;
        });
      }
    } catch (error: any) {
      console.error(`Failed to fetch ${queryType}:`, error);
    }
  };

  return (
    <div className="monitoring-view">
      {/* Header */}
      <div className="monitoring-header">
        <div className="monitoring-header-left">
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '8px' }}>
            <img
              src={Logo}
              alt="CYODA"
              style={{ height: '32px', width: 'auto', cursor: 'pointer' }}
              onClick={() => navigate('/')}
              title="Back to home"
            />
            <div className="monitoring-connection-info">
              <span className="connection-status">Real-time metrics monitoring</span>
            </div>
          </div>
        </div>
        <div className="monitoring-header-actions">
          <button
            onClick={() => setShowMetricSelector(!showMetricSelector)}
            className="action-button"
            style={{ marginRight: '10px' }}
          >
            <BarChart3 size={16} style={{ marginRight: '5px' }} />
            Metrics ({selectedMetrics.length})
          </button>
          <button onClick={fetchMetrics} className="action-button" disabled={loading || !selectedEnvironment}>
            {loading ? <Loader2 size={16} className="animate-spin" /> : <RefreshCw size={16} />}
            {loading ? 'Loading...' : 'Refresh'}
          </button>
        </div>
      </div>

      {/* Environment and Application Selection */}
      {loadingEnvironments ? (
        <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8' }}>
          Loading environments...
        </div>
      ) : (
        <div style={{ padding: '20px', borderBottom: '1px solid #334155' }}>
          <div style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            {/* Environment Select */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                Environment
              </label>
              <select
                value={selectedEnvironment}
                onChange={(e) => setSelectedEnvironment(e.target.value)}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  cursor: 'pointer'
                }}
              >
                <option value="">Select environment...</option>
                {environments.map((env) => (
                  <option key={env.name} value={env.name}>
                    {env.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Application Select */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#e2e8f0', fontSize: '14px', fontWeight: '500' }}>
                Application
              </label>
              <select
                value={selectedApplication}
                onChange={(e) => setSelectedApplication(e.target.value)}
                disabled={loadingApplications}
                style={{
                  width: '100%',
                  padding: '10px 12px',
                  backgroundColor: '#0f172a',
                  border: '1px solid #334155',
                  borderRadius: '6px',
                  color: '#e2e8f0',
                  fontSize: '14px',
                  cursor: 'pointer',
                  opacity: loadingApplications ? 0.6 : 1
                }}
              >
                <option value="cyoda">cyoda (default)</option>
                {loadingApplications ? (
                  <option disabled>Loading applications...</option>
                ) : applications.length === 0 ? (
                  <option disabled>No applications found</option>
                ) : (
                  applications.map((app) => (
                    <option key={app.namespace} value={app.app_name}>
                      {app.app_name}
                    </option>
                  ))
                )}
              </select>
            </div>
          </div>
        </div>
      )}

      {/* Metric Selector */}
      {showMetricSelector && (
        <div style={{ padding: '20px', borderBottom: '1px solid #334155', backgroundColor: '#1e293b' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
            <h3 style={{ color: '#e2e8f0', margin: 0 }}>Select Metrics to Display</h3>
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={() => setSelectedMetrics(AVAILABLE_METRICS.map(m => m.id))}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#0d8484',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Select All
              </button>
              <button
                onClick={() => setSelectedMetrics([])}
                style={{
                  padding: '6px 12px',
                  backgroundColor: '#475569',
                  color: '#fff',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer',
                  fontSize: '12px',
                  fontWeight: '500'
                }}
              >
                Unselect All
              </button>
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '10px' }}>
            {AVAILABLE_METRICS.map((metric) => (
              <label key={metric.id} style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer', color: '#e2e8f0' }}>
                <input
                  type="checkbox"
                  checked={selectedMetrics.includes(metric.id)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setSelectedMetrics([...selectedMetrics, metric.id]);
                      // Fetch this metric immediately
                      fetchSingleMetric(metric.id);
                    } else {
                      setSelectedMetrics(selectedMetrics.filter(m => m !== metric.id));
                    }
                  }}
                  style={{ cursor: 'pointer' }}
                />
                <span>{metric.label}</span>
              </label>
            ))}
          </div>
        </div>
      )}

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

      {/* Scrollable Content Container */}
      <div className="monitoring-scroll-container">
        {/* Rate Limit Error Message */}
        {rateLimitError && (
          <div style={{
            marginBottom: '20px',
            padding: '16px',
            backgroundColor: '#fef2f2',
            border: '1px solid #fecaca',
            borderRadius: '6px',
            color: '#991b1b',
            display: 'flex',
            alignItems: 'center',
            gap: '12px'
          }}>
            <AlertCircle size={20} style={{ flexShrink: 0 }} />
            <div>
              <p style={{ margin: '0 0 4px 0', fontWeight: '500' }}>Rate Limited</p>
              <p style={{ margin: 0, fontSize: '14px' }}>{rateLimitError}</p>
            </div>
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
          {selectedMetrics.map((metricId) => {
            const metric = AVAILABLE_METRICS.find(m => m.id === metricId);
            if (!metric) return null;
            const Icon = metric.icon;
            const value = metricValues[metricId] || '--';
            const history = metricHistory[metricId] || [];

            // Prepare chart data with timestamps
            const chartData = history.map((h) => {
              const date = new Date(h.timestamp);
              const timeStr = date.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
                hour12: false
              });
              return {
                time: timeStr,
                timestamp: h.timestamp,
                value: parseFloat(h.value)
              };
            });

            return (
              <div
                key={metricId}
                className="metric-card expandable"
                style={{ borderLeft: '4px solid #0d8484', display: 'flex', flexDirection: 'column' }}
                onClick={() => setExpandedMetric(metricId)}
              >
                <div className="metric-header">
                  <div className="metric-title">
                    <Icon size={18} style={{ color: '#0d8484' }} />
                    <h4>{metric.label}</h4>
                  </div>
                  {loading && <Loader2 size={14} className="animate-spin" />}
                </div>
                <div className="metric-value" style={{ fontSize: '24px', fontWeight: 'bold', color: '#0d8484', marginBottom: '10px' }}>
                  {value}
                </div>

                {/* Chart */}
                {history.length > 1 && (
                  <div style={{ flex: 1, minHeight: '150px', marginBottom: '10px' }} key={`chart-${metricId}-${history.length}`}>
                    <ResponsiveContainer width="100%" height="100%">
                      <LineChart data={chartData} key={`linechart-${metricId}-${history.length}`}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                        <XAxis dataKey="time" stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <YAxis stroke="#94a3b8" style={{ fontSize: '12px' }} />
                        <Tooltip
                          contentStyle={{ backgroundColor: '#1e293b', border: '1px solid #334155', borderRadius: '4px' }}
                          labelStyle={{ color: '#e2e8f0' }}
                        />
                        <Line
                          type="monotone"
                          dataKey="value"
                          stroke="#0d8484"
                          dot={false}
                          strokeWidth={2}
                          isAnimationActive={false}
                        />
                      </LineChart>
                    </ResponsiveContainer>
                  </div>
                )}

                <div className="metric-description">
                  {history.length > 0 ? `${history.length} data points` : 'No data yet'}
                </div>
                {history.length > 1 && (
                  <div style={{ marginTop: '10px', fontSize: '12px', color: '#94a3b8' }}>
                    <div>Min: {Math.min(...history.map(h => parseFloat(h.value))).toFixed(2)}</div>
                    <div>Max: {Math.max(...history.map(h => parseFloat(h.value))).toFixed(2)}</div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {selectedMetrics.length === 0 && (
          <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8' }}>
            <AlertCircle size={48} style={{ marginBottom: '10px', opacity: 0.5 }} />
            <p>No metrics selected. Click "Metrics" button to select metrics to display.</p>
          </div>
        )}

        {/* Info Box */}
        <div className="metrics-info">
          <p className="info-title">📊 Metrics Information</p>
          <ul>
            <li>Metrics are updated every 30 seconds automatically</li>
            <li>All data is filtered to your selected environment and application</li>
            <li>Click "Refresh" to update manually</li>
            <li>Click "Metrics" to add or remove metrics from the display</li>
            <li>Each metric shows min/max values from the last 60 data points</li>
          </ul>
        </div>

        {/* Query Status */}
        <div className="query-status">
          <div className="status-row">
            <span>API Endpoint:</span>
            <span className="status-active">✓ Connected</span>
          </div>
          <div className="status-row">
            <span>Environment:</span>
            <code>{selectedEnvironment || 'Not selected'}</code>
          </div>
          <div className="status-row">
            <span>Application:</span>
            <code>{selectedApplication}</code>
          </div>
          <div className="status-row">
            <span>Metrics Selected:</span>
            <code>{selectedMetrics.length} / {AVAILABLE_METRICS.length}</code>
          </div>
        </div>
      </div>
        </div>

      {/* Expanded Graph Modal */}
      {expandedMetric && (
        <div className="graph-modal-overlay" onClick={() => setExpandedMetric(null)}>
          <div className="graph-modal-content" onClick={(e) => e.stopPropagation()}>
            {(() => {
              const metric = AVAILABLE_METRICS.find(m => m.id === expandedMetric);
              if (!metric) return null;
              const Icon = metric.icon;
              const value = metricValues[expandedMetric] || '--';
              const history = metricHistory[expandedMetric] || [];

              // Get timezone once
              const tzStr = new Date().toLocaleTimeString('en-US', {
                timeZoneName: 'short'
              }).split(' ').pop() || 'UTC';

              const chartData = history.map((h) => {
                const date = new Date(h.timestamp);
                const timeStr = date.toLocaleTimeString('en-US', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                  hour12: false
                });
                return {
                  time: timeStr,
                  timestamp: h.timestamp,
                  value: parseFloat(h.value)
                };
              });

              return (
                <>
                  <div className="graph-modal-header">
                    <div className="graph-modal-title">
                      <Icon size={24} style={{ color: '#0d8484' }} />
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span>{metric.label}</span>
                        <span style={{ fontSize: '12px', color: '#a8a8a8', fontWeight: 'normal' }}>Timezone: {tzStr}</span>
                      </div>
                    </div>
                    <button
                      className="graph-modal-close"
                      onClick={() => setExpandedMetric(null)}
                    >
                      ✕
                    </button>
                  </div>
                  <div className="graph-modal-body">
                    <div style={{ width: '100%', height: '400px' }} key={`modal-chart-${expandedMetric}-${history.length}`}>
                      <ResponsiveContainer width="100%" height="100%">
                        <LineChart data={chartData} key={`modal-linechart-${expandedMetric}-${history.length}`}>
                          <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
                          <XAxis dataKey="time" stroke="#a8a8a8" />
                          <YAxis stroke="#a8a8a8" />
                          <Tooltip
                            contentStyle={{ backgroundColor: '#1f1f1f', border: '1px solid #434343', borderRadius: '6px' }}
                            labelStyle={{ color: '#e8e8e8' }}
                          />
                          <Line
                            type="monotone"
                            dataKey="value"
                            stroke="#0d8484"
                            dot={false}
                            isAnimationActive={false}
                          />
                        </LineChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                  <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #434343', textAlign: 'center', color: '#a8a8a8', fontSize: '14px' }}>
                    <p style={{ margin: 0 }}>Current Value: <strong style={{ color: '#0d8484' }}>{value}</strong></p>
                  </div>
                </>
              );
            })()}
          </div>
        </div>
      )}
    </div>
  );
};

export default MonitoringView;
