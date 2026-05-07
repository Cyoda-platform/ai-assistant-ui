import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LogViewer, { ElkLogResponse } from '../components/LogViewer/LogViewer';
import privateClient from '@/clients/private';
import { message, Select } from 'antd';
import Logo from '@/assets/images/logo.svg';
import './LogsView.css';

interface Environment {
  name: string;
  namespace: string;
  status: string;
  created_at?: string;
}

const LogsView: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [logData, setLogData] = useState<ElkLogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string>('');
  const [selectedApplication, setSelectedApplication] = useState<string>('');
  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [loadingEnvironments, setLoadingEnvironments] = useState(true);
  const [applications, setApplications] = useState<any[]>([]);
  const [loadingApplications, setLoadingApplications] = useState(false);

  // Initialize from query parameters
  useEffect(() => {
    const envName = searchParams.get('env_name');
    const appName = searchParams.get('app_name');

    if (envName) {
      setSelectedEnvironment(envName);
    }
    if (appName) {
      setSelectedApplication(appName);
    }
  }, [searchParams]);

  const generateApiKey = async () => {
    setGeneratingKey(true);
    setError(null);

    try {
      const response = await privateClient({
        method: 'post',
        url: 'v1/logs/api-key',
      });

      const newKey = response.data?.api_key || response.data?.apiKey || response.data?.key;
      setApiKey(newKey);
      localStorage.setItem('logs-api-key', newKey);
      message.success('API key generated successfully');
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to generate API key';
      setError(errorMsg);
      console.error('Error generating API key:', err);
      message.error(errorMsg);
    } finally {
      setGeneratingKey(false);
    }
  };

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

  const fetchLogs = async (customQuery?: string, retryCount = 0) => {
    console.log('fetchLogs called with customQuery:', customQuery, 'retryCount:', retryCount);

    // Don't fetch if environment or application is not selected
    if (!selectedEnvironment || !selectedApplication) {
      console.log('Skipping fetch - environment or application not selected');
      return;
    }

    setLoading(true);
    setError(null);

    try {

      // Get API key from localStorage (may be empty on first load)
      let key = apiKey || localStorage.getItem('logs-api-key') || '';

      // Use custom query or default query
      let queryBody;
      if (customQuery) {
        const parsedQuery = JSON.parse(customQuery);
        // Merge custom query with required env_name and app_name
        queryBody = {
          env_name: selectedEnvironment,
          app_name: selectedApplication,
          ...parsedQuery
        };
        console.log('Using custom query:', queryBody);
      } else {
        queryBody = {
          env_name: selectedEnvironment,
          app_name: selectedApplication,
          query: {
            bool: {
              must: [{ match_all: {} }]
            }
          },
          size: 1000,
          sort: [
            { '@timestamp': { order: 'desc' } }
          ]
        };
        console.log('Using default query:', queryBody);
      }

      // Use the backend API endpoint with Elasticsearch query format
      const response = await privateClient({
        method: 'post',
        url: 'v1/logs/search',
        headers: {
          'X-API-Key': key,
        },
        data: queryBody,
      });

      const rawData = response.data;
      console.log('Raw Elasticsearch response:', rawData);

      // Transform Elasticsearch response to our format
      const data: ElkLogResponse = {
        exported_at: new Date().toISOString(),
        total_hits: rawData.hits?.total?.value || 0,
        logs: rawData.hits?.hits?.map((hit: any) => hit._source) || []
      };

      console.log('Transformed data:', {
        total_hits: data.total_hits,
        logs_count: data.logs.length
      });

      setLogData(data);
    } catch (err: any) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to fetch logs';

      // Check if we got a 400 error with "X-API-Key header required" message
      const is400Error = err?.response?.status === 400;
      const isApiKeyMissing = err?.response?.data?.error?.includes('X-API-Key header required');

      // Check if we got a 500 error with "ELK_API_KEY_EXPIRED" error code
      const is500Error = err?.response?.status === 500;
      const errorCode = err?.response?.data?.details?.error_code;
      const isApiKeyExpired = errorCode === 'ELK_API_KEY_EXPIRED' ||
                             err?.response?.data?.error?.includes('API key invalid or expired');

      if ((is400Error && isApiKeyMissing || is500Error && isApiKeyExpired) && retryCount === 0) {
        const isExpired = is500Error && isApiKeyExpired;
        console.log(isExpired ? 'API key expired detected, regenerating...' : 'API key missing, generating...');
        message.info(isExpired ? 'Regenerating API key...' : 'Generating API key...');

        try {
          // Generate or regenerate the ELK API key
          const response = await privateClient({
            method: 'post',
            url: 'v1/logs/api-key',
          });

          const newKey = response.data?.api_key || response.data?.apiKey || response.data?.key;
          setApiKey(newKey);
          localStorage.setItem('logs-api-key', newKey);
          console.log('ELK API key generated/regenerated');
          message.success('API key generated, retrying...');

          // Retry the fetch with the new API key
          await fetchLogs(customQuery, 1);
          return;
        } catch (regenerateErr) {
          console.error('Failed to generate API key:', regenerateErr);
          message.error('Failed to generate API key');
        }
      }

      // Don't display ELK_API_KEY_EXPIRED error to user - it's handled automatically above
      if (errorCode === 'ELK_API_KEY_EXPIRED') {
        console.log('ELK_API_KEY_EXPIRED error suppressed - handled automatically');
        return;
      }

      setError(errorMsg);
      console.error('Error fetching logs:', err);
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  // Load API key from localStorage and fetch environments on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('logs-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
    fetchEnvironments();
  }, []);

  // Fetch applications when selected environment changes
  useEffect(() => {
    if (selectedEnvironment && apiKey) {
      fetchApplications(selectedEnvironment);
    }
  }, [selectedEnvironment, apiKey]);

  // Auto-fetch logs when API key, selectedEnvironment, or selectedApplication changes
  useEffect(() => {
    if (apiKey && selectedEnvironment && selectedApplication) {
      fetchLogs();
    }
  }, [apiKey, selectedEnvironment, selectedApplication]);

  return (
    <div className="logs-view">
      <div className="logs-header">
        <div className="logs-header-left">
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img
              src={Logo}
              alt="CYODA"
              style={{ height: '32px', width: 'auto', cursor: 'pointer' }}
              onClick={() => navigate('/')}
              title="Back to home"
            />
            <div>
              <h1>Environment Logs</h1>
              <div className="logs-connection-info">
                <span className="connection-status">Real-time log monitoring and analysis</span>
              </div>
            </div>
          </div>
        </div>
        <div className="logs-header-actions">
          {!apiKey ? (
            <button
              onClick={generateApiKey}
              className="action-button primary"
              disabled={generatingKey}
            >
              {generatingKey ? 'Generating...' : '🔑 Generate API Key'}
            </button>
          ) : (
            <>
              <button onClick={() => fetchLogs()} className="action-button" disabled={loading}>
                {loading ? 'Loading...' : '↻ Refresh'}
              </button>
              <button
                onClick={() => {
                  setApiKey(null);
                  localStorage.removeItem('logs-api-key');
                  setLogData(null);
                }}
                className="action-button secondary"
              >
                🔑 Regenerate API Key
              </button>
            </>
          )}
        </div>
      </div>

      {/* Environments List */}
      {!apiKey && (
        <div className="logs-environments" style={{
          padding: '20px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
        }}>
          <h3 style={{ color: '#0f172a', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            Available Environments
          </h3>
          {loadingEnvironments ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
              Loading environments...
            </div>
          ) : environments.length === 0 ? (
            <div style={{ color: '#64748b', textAlign: 'center', padding: '20px' }}>
              No environments found. Please create an environment first.
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '12px' }}>
              {environments.map((env) => (
                <div
                  key={env.namespace}
                  onClick={() => setSelectedEnvironment(env.name)}
                  style={{
                    padding: '12px',
                    backgroundColor: selectedEnvironment === env.name ? '#f0fdfa' : '#ffffff',
                    border: selectedEnvironment === env.name ? '2px solid #0d9488' : '1px solid #e2e8f0',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.15s',
                    color: selectedEnvironment === env.name ? '#0d9488' : '#1e293b',
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{env.name}</div>
                  <div style={{ fontSize: '12px', color: selectedEnvironment === env.name ? '#0d9488' : '#64748b' }}>
                    {env.status}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Environment and Application Selection */}
      {apiKey && (
        <div style={{ padding: '20px', borderBottom: '1px solid #e2e8f0' }}>
          <div className="logs-selects-container" style={{ display: 'flex', gap: '20px', alignItems: 'flex-end' }}>
            {/* Environment Select */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>
                Environment
              </label>
              <Select
                value={selectedEnvironment || undefined}
                onChange={(value) => setSelectedEnvironment(value)}
                placeholder="Select environment..."
                loading={loadingEnvironments}
                className="logs-select-antd"
                popupClassName="logs-select-dropdown"
                style={{ width: '100%', height: '42px' }}
              >
                {environments.map((env) => (
                  <Select.Option key={env.namespace} value={env.name}>
                    {env.name}
                  </Select.Option>
                ))}
              </Select>
            </div>

            {/* Application Select */}
            <div style={{ flex: 1 }}>
              <label style={{ display: 'block', marginBottom: '8px', color: '#1e293b', fontSize: '14px', fontWeight: '500' }}>
                Application
              </label>
              <Select
                value={selectedApplication || undefined}
                onChange={(value) => setSelectedApplication(value)}
                placeholder="Select application..."
                disabled={!selectedEnvironment}
                loading={loadingApplications}
                className="logs-select-antd"
                popupClassName="logs-select-dropdown"
                style={{ width: '100%', height: '42px' }}
                notFoundContent={applications.length === 0 ? 'No applications found' : null}
              >
                {applications.map((app) => (
                  <Select.Option key={app.namespace} value={app.name}>
                    {app.name}
                  </Select.Option>
                ))}
              </Select>
            </div>
          </div>
        </div>
      )}

      {/* Information Banner */}
      {apiKey && !selectedEnvironment && (
        <div style={{
          padding: '32px 24px',
          background: '#ffffff',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          flexDirection: 'column',
          gap: '20px',
        }}>
          <div style={{ textAlign: 'center' }}>
            <h2 style={{
              fontSize: '24px',
              fontWeight: '700',
              marginBottom: '12px',
              color: '#0f172a'
            }}>
              Environment Logs Viewer
            </h2>
            <p style={{ fontSize: '16px', color: '#475569', marginBottom: '0' }}>
              View and analyze logs from your deployed environments and applications
            </p>
          </div>

          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '16px',
            marginTop: '8px'
          }}>
            <div style={{
              padding: '20px',
              backgroundColor: '#f0fdfa',
              border: '1px solid #99f6e4',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#0d9488'
              }}>
                Your Applications
              </h3>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', margin: 0 }}>
                Select an environment above to view logs from all your deployed applications.
              </p>
            </div>

            <div style={{
              padding: '20px',
              backgroundColor: '#eff6ff',
              border: '1px solid #bfdbfe',
              borderRadius: '12px'
            }}>
              <h3 style={{
                fontSize: '16px',
                fontWeight: '600',
                marginBottom: '8px',
                color: '#1d4ed8'
              }}>
                Need a CYODA Environment?
              </h3>
              <p style={{ fontSize: '14px', color: '#334155', lineHeight: '1.6', marginBottom: '12px' }}>
                Get access to CYODA environments and platform logs by joining our community.
              </p>
              <a
                href="https://discord.com/invite/95rdAyBZr2"
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  display: 'inline-block',
                  padding: '8px 16px',
                  backgroundColor: '#2563eb',
                  color: 'white',
                  borderRadius: '6px',
                  textDecoration: 'none',
                  fontWeight: '600',
                  fontSize: '14px',
                  transition: 'background-color 0.15s'
                }}
                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#1d4ed8'}
                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = '#2563eb'}
              >
                Join Discord Community
              </a>
            </div>
          </div>
        </div>
      )}

      {/* Banner when environment is selected but no application */}
      {apiKey && selectedEnvironment && !selectedApplication && (
        <div style={{
          padding: '20px 24px',
          backgroundColor: '#f8fafc',
          borderBottom: '1px solid #e2e8f0',
          display: 'flex',
          alignItems: 'center',
          gap: '16px',
        }}>
          <div style={{ flex: 1 }}>
            <h3 style={{
              fontSize: '16px',
              fontWeight: '600',
              marginBottom: '8px',
              color: '#0f172a'
            }}>
              {applications.length === 0 && !loadingApplications
                ? 'No Applications Found'
                : 'Select an Application'}
            </h3>
            <p style={{
              fontSize: '14px',
              color: '#475569',
              lineHeight: '1.6',
              margin: 0
            }}>
              {applications.length === 0 && !loadingApplications ? (
                <>
                  No applications found in this environment. Need help deploying applications or want access to CYODA platform logs?{' '}
                  <a
                    href="https://discord.com/invite/95rdAyBZr2"
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#0d9488', textDecoration: 'underline', fontWeight: '600' }}
                  >
                    Reach out on Discord
                  </a>
                  {' '}for assistance.
                </>
              ) : (
                'Choose an application from the dropdown above to view its logs.'
              )}
            </p>
          </div>
        </div>
      )}

      {error && (
        <div className="logs-error">
          <strong>Error:</strong> {error}
          <button onClick={() => fetchLogs()} className="retry-button">
            Retry
          </button>
        </div>
      )}

      {loading && !logData && (
        <div className="logs-loading">
          <div className="loading-spinner"></div>
          <div>Loading logs...</div>
        </div>
      )}

      {logData && (
        <div className="logs-content">
          <LogViewer
            data={logData}
            onRefresh={fetchLogs}
            onAdvancedQuery={(query) => fetchLogs(query)}
            height={window.innerHeight - 200}
          />
        </div>
      )}

      {!loading && !logData && !error && (
        <div className="logs-empty">
          <div className="empty-icon">📋</div>
          <h3>No logs available</h3>
          <p>Click "Refresh" to load logs from the backend</p>
          <button onClick={() => fetchLogs()} className="action-button">
            Load Logs
          </button>
        </div>
      )}
    </div>
  );
};

export default LogsView;
