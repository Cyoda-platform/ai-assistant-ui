import React from 'react';
import './LogsAccessCard.css';

const LogsAccessCard: React.FC = () => {
  const openLogsPage = () => {
    window.open('/logs', '_blank');
  };

  return (
    <div className="logs-access-card" onClick={openLogsPage}>
      <div className="logs-card-glow"></div>
      <div className="logs-card-content">
        <div className="logs-card-icon">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M3 3h18v18H3V3z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M7 7h10M7 11h10M7 15h6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>

        <h3 className="logs-card-title">Environment Logs</h3>
        <p className="logs-card-description">
          View and analyze your system logs in real-time with advanced search, filtering, and Elasticsearch query support.
        </p>

        <div className="logs-card-features">
          <div className="logs-feature-badge">
            <span className="badge-icon">🔍</span>
            <span>Advanced Search</span>
          </div>
          <div className="logs-feature-badge">
            <span className="badge-icon">📊</span>
            <span>Query DSL</span>
          </div>
          <div className="logs-feature-badge">
            <span className="badge-icon">💾</span>
            <span>Export JSON</span>
          </div>
        </div>

        <div className="logs-card-action">
          <span className="action-text">Open Logs Viewer</span>
          <svg className="action-arrow" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path d="M5 12h14M12 5l7 7-7 7" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </div>
      </div>
    </div>
  );
};

export default LogsAccessCard;
