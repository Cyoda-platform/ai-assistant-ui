import React, { useState, useEffect } from 'react';
import LogViewer, { ElkLogResponse } from './LogViewer';

/**
 * Example component demonstrating how to use the LogViewer
 * with data from your API endpoint: http://localhost:8000/api/v1/logs/search
 */
const LogViewerExample: React.FC = () => {
  const [logData, setLogData] = useState<ElkLogResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchLogs = async () => {
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('http://localhost:8000/api/v1/logs/search', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          // Add your search parameters here
          // Example:
          // query: '*',
          // size: 100,
          // from: 0,
        }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data: ElkLogResponse = await response.json();
      setLogData(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch logs');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLogs();
  }, []);

  if (loading && !logData) {
    return (
      <div style={{ padding: '20px', textAlign: 'center' }}>
        <div>Loading logs...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div style={{ padding: '20px', color: '#cf1322' }}>
        <strong>Error:</strong> {error}
        <button
          onClick={fetchLogs}
          style={{
            marginLeft: '12px',
            padding: '6px 12px',
            cursor: 'pointer',
          }}
        >
          Retry
        </button>
      </div>
    );
  }

  if (!logData) {
    return null;
  }

  return (
    <div style={{ padding: '20px' }}>
      <h2 style={{ marginBottom: '16px' }}>System Logs</h2>
      <LogViewer data={logData} onRefresh={fetchLogs} height={700} />
    </div>
  );
};

export default LogViewerExample;
