import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import LogViewer, { ElkLogResponse } from '../components/LogViewer/LogViewer';
import privateClient from '@/clients/private';
import { message } from 'antd';
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
  const [selectedApplication, setSelectedApplication] = useState<string>('cyoda');
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
        url: '/v1/logs/api-key',
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
    setLoading(true);
    setError(null);

    try {
      if (!selectedEnvironment) {
        throw new Error('Please select an environment');
      }

      // Get API key from localStorage (may be empty on first load)
      let key = apiKey || localStorage.getItem('logs-api-key') || '';

      // Use custom query or default query
      let queryBody;
      if (customQuery) {
        const parsedQuery = JSON.parse(customQuery);
        // Merge custom query with required env_name and app_name
        queryBody = {
          env_name: selectedEnvironment,
          app_name: selectedApplication || 'cyoda',
          ...parsedQuery
        };
        console.log('Using custom query:', queryBody);
      } else {
        queryBody = {
          env_name: selectedEnvironment,
          app_name: selectedApplication || 'cyoda',
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
        url: '/v1/logs/search',
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

      // Check if we got a 500 error with "API key invalid or expired" message
      const is500Error = err?.response?.status === 500;
      const isApiKeyExpired = err?.response?.data?.error?.includes('API key invalid or expired');

      if ((is400Error && isApiKeyMissing || is500Error && isApiKeyExpired) && retryCount === 0) {
        const isExpired = is500Error && isApiKeyExpired;
        console.log(isExpired ? 'API key expired detected, regenerating...' : 'API key missing, generating...');
        message.info(isExpired ? 'Regenerating API key...' : 'Generating API key...');

        try {
          // Generate or regenerate the ELK API key
          const response = await privateClient({
            method: 'post',
            url: '/v1/logs/api-key',
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
    if (apiKey && selectedEnvironment) {
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
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
        }}>
          <h3 style={{ color: '#e2e8f0', marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
            Available Environments
          </h3>
          {loadingEnvironments ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
              Loading environments...
            </div>
          ) : environments.length === 0 ? (
            <div style={{ color: '#94a3b8', textAlign: 'center', padding: '20px' }}>
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
                    backgroundColor: selectedEnvironment === env.name ? '#0d8484' : '#0f172a',
                    border: selectedEnvironment === env.name ? '2px solid #0d8484' : '1px solid #334155',
                    borderRadius: '6px',
                    cursor: 'pointer',
                    transition: 'all 0.2s',
                    color: selectedEnvironment === env.name ? 'white' : '#e2e8f0',
                  }}
                >
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>{env.name}</div>
                  <div style={{ fontSize: '12px', color: selectedEnvironment === env.name ? '#e0e7ff' : '#94a3b8' }}>
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
        <div className="logs-filters" style={{
          padding: '16px 20px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '24px',
          flexWrap: 'wrap'
        }}>
          {/* Environment Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              🌐 Environment:
            </label>
            <select
              value={selectedEnvironment}
              onChange={(e) => setSelectedEnvironment(e.target.value)}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: 'white',
                fontSize: '13px',
                minWidth: '200px',
                outline: 'none',
                cursor: 'pointer'
              }}
            >
              <option value="">Select an environment...</option>
              {loadingEnvironments ? (
                <option disabled>Loading environments...</option>
              ) : environments.length === 0 ? (
                <option disabled>No environments found</option>
              ) : (
                environments.map((env) => (
                  <option key={env.namespace} value={env.name}>
                    {env.name}
                  </option>
                ))
              )}
            </select>
          </div>

          {/* Application Select */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              🚀 Application:
            </label>
            <select
              value={selectedApplication}
              onChange={(e) => setSelectedApplication(e.target.value)}
              disabled={!selectedEnvironment}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #334155',
                backgroundColor: selectedEnvironment ? '#0f172a' : '#334155',
                color: selectedEnvironment ? 'white' : '#94a3b8',
                fontSize: '13px',
                minWidth: '200px',
                outline: 'none',
                cursor: selectedEnvironment ? 'pointer' : 'not-allowed',
                opacity: selectedEnvironment ? 1 : 0.6
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
