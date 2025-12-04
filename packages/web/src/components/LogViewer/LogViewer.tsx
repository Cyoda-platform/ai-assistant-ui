import React, { useMemo, useState, useCallback } from 'react';
import { useVirtualizer } from '@tanstack/react-virtual';
import './LogViewer.css';

export interface ElkLog {
  '@timestamp': string;
  '@version': string;
  class?: string;
  deployment?: string;
  exception?: string;
  exportable?: string;
  level: 'INFO' | 'WARN' | 'ERROR' | 'DEBUG' | 'TRACE';
  message: string;
  namespace?: string;
  nodeIp?: string;
  parent?: string;
  pid?: string;
  pod?: string;
  spanId?: string;
  thread?: string;
  traceId?: string;
  type?: string;
  [key: string]: any;
}

export interface ElkLogResponse {
  exported_at: string;
  total_hits: number;
  logs: ElkLog[];
}

interface LogViewerProps {
  data: ElkLogResponse;
  onRefresh?: () => void;
  onAdvancedQuery?: (query: string) => void;
  height?: number;
  title?: string;
}

const LogViewer: React.FC<LogViewerProps> = ({ data, onRefresh, onAdvancedQuery, height = 600, title = 'Environment Logs' }) => {
  const [expandedRows, setExpandedRows] = useState<Set<number>>(new Set());
  const [searchTerm, setSearchTerm] = useState('');
  const [searchInput, setSearchInput] = useState('');
  const [levelFilter, setLevelFilter] = useState<string[]>(['INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE']);
  const [entriesLimit, setEntriesLimit] = useState(50);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [selectedLog, setSelectedLog] = useState<ElkLog | null>(null);

  const parentRef = React.useRef<HTMLDivElement>(null);

  // Filter logs based on search and level
  const filteredLogs = useMemo(() => {
    if (!data?.logs || !Array.isArray(data.logs)) {
      return [];
    }

    let filtered = data.logs.filter(log => {
      const matchesLevel = levelFilter.includes(log.level);
      const matchesSearch = !searchTerm ||
        log.message?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.class?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.pod?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.thread?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.deployment?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.namespace?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        log.exception?.toLowerCase().includes(searchTerm.toLowerCase());
      return matchesLevel && matchesSearch;
    });

    console.log('Filtered logs:', {
      total: data.logs.length,
      filtered: filtered.length,
      searchTerm,
      levelFilter,
      entriesLimit
    });

    // Apply entries limit
    return filtered.slice(0, entriesLimit);
  }, [data?.logs, searchTerm, levelFilter, entriesLimit]);

  // Virtual scrolling
  const rowVirtualizer = useVirtualizer({
    count: filteredLogs.length,
    getScrollElement: () => parentRef.current,
    estimateSize: () => 60,
    overscan: 10,
  });

  const handleRowClick = (log: ElkLog) => {
    setSelectedLog(log);
  };

  const handleSearch = () => {
    console.log('Search button clicked, searchInput:', searchInput);
    setSearchTerm(searchInput);
  };

  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const toggleAllLevels = () => {
    if (levelFilter.length === 5) {
      setLevelFilter([]);
    } else {
      setLevelFilter(['INFO', 'WARN', 'ERROR', 'DEBUG', 'TRACE']);
    }
  };

  const exportLogs = () => {
    const jsonStr = JSON.stringify(filteredLogs, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `logs-${new Date().toISOString()}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleApplyAdvancedQuery = () => {
    console.log('Apply Advanced Query clicked', { advancedQuery, hasCallback: !!onAdvancedQuery });
    if (onAdvancedQuery && advancedQuery.trim()) {
      try {
        // Validate JSON
        const parsed = JSON.parse(advancedQuery);
        console.log('Query parsed successfully:', parsed);
        onAdvancedQuery(advancedQuery);
        setShowAdvanced(false);
      } catch (err) {
        console.error('Query parse error:', err);
        alert('Invalid JSON query. Please check your syntax.');
      }
    } else if (!onAdvancedQuery) {
      console.error('No onAdvancedQuery callback provided');
    }
  };

  const formatTimestamp = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      fractionalSecondDigits: 3,
    });
  };

  const getLevelClassName = (level: string) => {
    return `log-level log-level-${level.toLowerCase()}`;
  };

  return (
    <div className="log-viewer">
      {/* Title Bar */}
      <div className="log-viewer-title">
        <h2>{title}</h2>
        <span className="log-count">{data?.total_hits?.toLocaleString() || 0} entries</span>
      </div>

      {/* Search and Controls */}
      <div className="log-viewer-controls">
        <div className="search-container">
          <input
            type="text"
            placeholder="Search across message, class, pod, thread, deployment, namespace, type, exception..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="search-input"
          />
          <button onClick={handleSearch} className="search-button">
            Search
          </button>
        </div>

        <div className="controls-row">
          <div className="level-filter-container">
            <button
              onClick={toggleAllLevels}
              className={`level-toggle-all ${levelFilter.length === 5 ? 'active' : ''}`}
            >
              All Levels
            </button>
            <div className="level-filter-buttons">
              {['ERROR', 'WARN', 'INFO', 'DEBUG', 'TRACE'].map(level => {
                const count = data?.logs?.filter(log => log.level === level).length || 0;
                return (
                  <button
                    key={level}
                    className={`level-filter-btn ${getLevelClassName(level)} ${levelFilter.includes(level) ? 'active' : ''}`}
                    onClick={() => {
                      if (levelFilter.includes(level)) {
                        setLevelFilter(prev => prev.filter(l => l !== level));
                      } else {
                        setLevelFilter(prev => [...prev, level]);
                      }
                    }}
                  >
                    <span className="level-name">{level}</span>
                    <span className="level-count">{count}</span>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="controls-right">
            <div className="entries-control">
              <select
                value={entriesLimit}
                onChange={(e) => setEntriesLimit(Number(e.target.value))}
                className="entries-select"
              >
                <option value={50}>50 entries</option>
                <option value={100}>100 entries</option>
                <option value={500}>500 entries</option>
                <option value={1000}>1000 entries</option>
                <option value={data?.total_hits || 1000}>All entries</option>
              </select>
            </div>

            <button
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="advanced-button"
            >
              Advanced Query
            </button>

            <button onClick={exportLogs} className="export-button">
              Export
            </button>
          </div>
        </div>

        {showAdvanced && (
          <div className="advanced-query-panel">
            <textarea
              placeholder='Enter Elasticsearch query DSL (JSON)&#10;Example: {"query": {"match": {"message": "error"}}, "size": 100}'
              className="advanced-query-input"
              rows={5}
              value={advancedQuery}
              onChange={(e) => setAdvancedQuery(e.target.value)}
            />
            <div className="advanced-query-actions">
              <button
                className="query-apply-button"
                onClick={handleApplyAdvancedQuery}
                disabled={!advancedQuery.trim()}
              >
                Apply Query
              </button>
              <button
                className="query-close-button"
                onClick={() => setShowAdvanced(false)}
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Results Info */}
      <div className="log-viewer-results">
        <span>Showing {filteredLogs.length} of {data?.logs?.length || 0} results</span>
      </div>

      {/* Log list with virtual scrolling */}
      <div
        ref={parentRef}
        className="log-viewer-list"
        style={{ height: `${height}px`, overflow: 'auto' }}
      >
        <div
          style={{
            height: `${rowVirtualizer.getTotalSize()}px`,
            width: '100%',
            position: 'relative',
          }}
        >
          {rowVirtualizer.getVirtualItems().map((virtualRow) => {
            const log = filteredLogs[virtualRow.index];

            return (
              <div
                key={virtualRow.index}
                className={`log-row log-row-${log.level.toLowerCase()}`}
                style={{
                  position: 'absolute',
                  top: 0,
                  left: 0,
                  width: '100%',
                  height: `${virtualRow.size}px`,
                  transform: `translateY(${virtualRow.start}px)`,
                }}
                onClick={() => handleRowClick(log)}
              >
                <div className="log-row-content">
                  <div className="log-main">
                    <span className={getLevelClassName(log.level)}>{log.level}</span>
                    <span className="log-timestamp">{formatTimestamp(log['@timestamp'])}</span>
                    <span className="log-message">{log.message}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <div className="log-modal-overlay" onClick={() => setSelectedLog(null)}>
          <div className="log-modal" onClick={(e) => e.stopPropagation()}>
            <div className="log-modal-header">
              <div className="log-modal-title">
                <span className={getLevelClassName(selectedLog.level)}>{selectedLog.level}</span>
                <span className="log-modal-timestamp">{formatTimestamp(selectedLog['@timestamp'])}</span>
              </div>
              <button className="log-modal-close" onClick={() => setSelectedLog(null)}>
                ✕
              </button>
            </div>

            <div className="log-modal-body">
              <div className="log-modal-section">
                <h3>Message</h3>
                <div className="log-modal-message">{selectedLog.message}</div>
              </div>

              <div className="log-modal-section">
                <h3>Details</h3>
                <div className="log-modal-grid">
                  {selectedLog['@version'] && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Version:</span>
                      <span className="log-modal-value">{selectedLog['@version']}</span>
                    </div>
                  )}
                  {selectedLog.pod && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Pod:</span>
                      <span className="log-modal-value">{selectedLog.pod}</span>
                    </div>
                  )}
                  {selectedLog.namespace && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Namespace:</span>
                      <span className="log-modal-value">{selectedLog.namespace}</span>
                    </div>
                  )}
                  {selectedLog.deployment && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Deployment:</span>
                      <span className="log-modal-value">{selectedLog.deployment}</span>
                    </div>
                  )}
                  {selectedLog.nodeIp && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Node IP:</span>
                      <span className="log-modal-value">{selectedLog.nodeIp}</span>
                    </div>
                  )}
                  {selectedLog.class && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Class:</span>
                      <span className="log-modal-value">{selectedLog.class}</span>
                    </div>
                  )}
                  {selectedLog.thread && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Thread:</span>
                      <span className="log-modal-value">{selectedLog.thread}</span>
                    </div>
                  )}
                  {selectedLog.pid && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">PID:</span>
                      <span className="log-modal-value">{selectedLog.pid}</span>
                    </div>
                  )}
                  {selectedLog.type && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Type:</span>
                      <span className="log-modal-value">{selectedLog.type}</span>
                    </div>
                  )}
                  {selectedLog.traceId && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Trace ID:</span>
                      <span className="log-modal-value">{selectedLog.traceId}</span>
                    </div>
                  )}
                  {selectedLog.spanId && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Span ID:</span>
                      <span className="log-modal-value">{selectedLog.spanId}</span>
                    </div>
                  )}
                  {selectedLog.parent && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Parent:</span>
                      <span className="log-modal-value">{selectedLog.parent}</span>
                    </div>
                  )}
                  {selectedLog.exportable && (
                    <div className="log-modal-item">
                      <span className="log-modal-label">Exportable:</span>
                      <span className="log-modal-value">{selectedLog.exportable}</span>
                    </div>
                  )}
                </div>
              </div>

              {selectedLog.exception && (
                <div className="log-modal-section">
                  <h3>Exception</h3>
                  <pre className="log-modal-exception">{selectedLog.exception}</pre>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default LogViewer;
