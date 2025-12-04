import React, { useState, useEffect } from 'react';
import LogViewer, { ElkLogResponse } from '../components/LogViewer/LogViewer';
import { getToken } from '../helpers/HelperAuth';
import './LogsView.css';

const LogsView: React.FC = () => {
  const [logData, setLogData] = useState<ElkLogResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState<string | null>(null);
  const [generatingKey, setGeneratingKey] = useState(false);
  const [logType, setLogType] = useState<'environment' | 'application'>('environment');
  const [deploymentId, setDeploymentId] = useState<string>('');

  const generateApiKey = async () => {
    setGeneratingKey(true);
    setError(null);

    try {
      const token = await getToken();

      const response = await fetch('http://localhost:8000/api/v1/logs/api-key', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to generate API key: ${response.status} - ${errorText}`);
      }

      const data = await response.json();
      const newKey = data.api_key || data.apiKey || data.key;
      setApiKey(newKey);
      localStorage.setItem('logs-api-key', newKey);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to generate API key');
      console.error('Error generating API key:', err);
    } finally {
      setGeneratingKey(false);
    }
  };

  const fetchLogs = async (customQuery?: string) => {
    console.log('fetchLogs called with customQuery:', customQuery);
    setLoading(true);
    setError(null);

    try {
      // Get auth token
      const token = await getToken();

      // Get API key from localStorage
      const key = apiKey || localStorage.getItem('logs-api-key');

      if (!key) {
        throw new Error('API key required. Please generate an API key first.');
      }

      // Use custom query or default query
      let queryBody;
      if (customQuery) {
        queryBody = JSON.parse(customQuery);
        console.log('Using custom query:', queryBody);
      } else {
        queryBody = {
          type: logType,
          id: deploymentId || (logType === 'environment' ? 'develop' : 'start'),
          query: {
            match_all: {}
          },
          size: 1000,
          from: 0,
          sort: [
            { '@timestamp': { order: 'desc' } }
          ]
        };
        console.log('Using default query:', queryBody);
      }

      // Use the backend API endpoint with Elasticsearch query format
      const response = await fetch('http://localhost:8000/api/v1/logs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'X-API-Key': key,
        },
        body: JSON.stringify(queryBody),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP error! status: ${response.status} - ${errorText}`);
      }

      const rawData = await response.json();
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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
      console.error('Error fetching logs:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load API key from localStorage on mount
  useEffect(() => {
    const savedKey = localStorage.getItem('logs-api-key');
    if (savedKey) {
      setApiKey(savedKey);
    }
  }, []);

  // Auto-fetch logs when API key, logType, or deploymentId changes
  useEffect(() => {
    if (apiKey) {
      fetchLogs();
    }
  }, [apiKey, logType, deploymentId]);

  return (
    <div className="logs-view">
      <div className="logs-header">
        <div className="logs-header-left">
          <h1>System Logs</h1>
          <div className="logs-connection-info">
            <span className="connection-status">Connected to: localhost:8000</span>
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
              <button onClick={fetchLogs} className="action-button" disabled={loading}>
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

      {/* Log Type Toggle */}
      {apiKey && (
        <div className="logs-filters" style={{
          padding: '12px 20px',
          backgroundColor: '#1e293b',
          borderBottom: '1px solid #334155',
          display: 'flex',
          alignItems: 'center',
          gap: '16px'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              Log Source:
            </label>
            <div style={{
              display: 'flex',
              backgroundColor: '#0f172a',
              borderRadius: '6px',
              padding: '2px',
              border: '1px solid #334155'
            }}>
              <button
                onClick={() => setLogType('environment')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: logType === 'environment' ? '#3b82f6' : 'transparent',
                  color: logType === 'environment' ? 'white' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🌐 Environment
              </button>
              <button
                onClick={() => setLogType('application')}
                style={{
                  padding: '6px 16px',
                  borderRadius: '4px',
                  border: 'none',
                  backgroundColor: logType === 'application' ? '#3b82f6' : 'transparent',
                  color: logType === 'application' ? 'white' : '#94a3b8',
                  fontSize: '13px',
                  fontWeight: '500',
                  cursor: 'pointer',
                  transition: 'all 0.2s'
                }}
              >
                🚀 Application
              </button>
            </div>
          </div>

          {/* Deployment ID Input */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <label style={{ color: '#94a3b8', fontSize: '14px', fontWeight: '500' }}>
              {logType === 'environment' ? 'Environment ID:' : 'Application ID:'}
            </label>
            <input
              type="text"
              value={deploymentId}
              onChange={(e) => setDeploymentId(e.target.value)}
              placeholder={logType === 'environment' ? 'develop' : 'start'}
              style={{
                padding: '6px 12px',
                borderRadius: '4px',
                border: '1px solid #334155',
                backgroundColor: '#0f172a',
                color: 'white',
                fontSize: '13px',
                width: '180px',
                outline: 'none'
              }}
            />
            <span style={{ color: '#64748b', fontSize: '12px' }}>
              (default: {logType === 'environment' ? 'develop' : 'start'})
            </span>
          </div>
        </div>
      )}

      {error && (
        <div className="logs-error">
          <strong>Error:</strong> {error}
          <button onClick={fetchLogs} className="retry-button">
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
          <button onClick={fetchLogs} className="action-button">
            Load Logs
          </button>
        </div>
      )}
    </div>
  );
};

export default LogsView;
