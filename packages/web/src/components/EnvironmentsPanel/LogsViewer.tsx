import React, { useState, useEffect, useCallback } from 'react';
import { Search, RefreshCw, Download, AlertCircle, CheckCircle2, Loader2, Eye, X, Filter } from 'lucide-react';
import { message, Modal, Input, Select, DatePicker } from 'antd';
import privateClient from '@/clients/private';
import dayjs, { Dayjs } from 'dayjs';
import FileSaver from 'file-saver';

const { RangePicker } = DatePicker;
const { TextArea } = Input;

interface LogEntry {
  _index: string;
  _id: string;
  _score: number;
  _source: {
    '@timestamp': string;
    message?: string;
    level?: string;
    logger?: string;
    org_id?: string;
    [key: string]: any;
  };
}

interface LogsViewerProps {
  apiKey: string | null;
  onClose: () => void;
}

const LogsViewer: React.FC<LogsViewerProps> = ({ apiKey, onClose }) => {
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [quickFilter, setQuickFilter] = useState<string>('all');
  const [timeRange, setTimeRange] = useState<[Dayjs, Dayjs] | null>(null);
  const [pageSize, setPageSize] = useState(50);
  const [totalHits, setTotalHits] = useState(0);
  const [selectedLog, setSelectedLog] = useState<LogEntry | null>(null);
  const [advancedQuery, setAdvancedQuery] = useState('');
  const [showAdvanced, setShowAdvanced] = useState(false);

  // Initial load
  useEffect(() => {
    if (apiKey) {
      fetchLogs();
    }
  }, [apiKey]);

  // Build Elasticsearch query
  const buildQuery = useCallback(() => {
    const baseQuery: any = {
      query: {
        bool: {
          must: [] as any[],
          filter: [] as any[]
        }
      },
      size: pageSize,
      sort: [{ '@timestamp': { order: 'desc' } }]
    };

    // If using advanced query, parse it
    if (showAdvanced && advancedQuery.trim()) {
      try {
        const parsedQuery = JSON.parse(advancedQuery);
        return parsedQuery;
      } catch (e) {
        message.error('Invalid JSON in advanced query');
        return baseQuery;
      }
    }

    // Text search
    if (searchQuery.trim()) {
      baseQuery.query.bool.must.push({
        query_string: {
          query: searchQuery,
          default_field: 'message'
        }
      });
    } else {
      baseQuery.query.bool.must.push({ match_all: {} });
    }

    // Level filter
    if (quickFilter !== 'all') {
      baseQuery.query.bool.filter.push({
        term: { level: quickFilter.toUpperCase() }
      });
    }

    // Time range filter
    if (timeRange && timeRange[0] && timeRange[1]) {
      baseQuery.query.bool.filter.push({
        range: {
          '@timestamp': {
            gte: timeRange[0].toISOString(),
            lte: timeRange[1].toISOString()
          }
        }
      });
    }

    return baseQuery;
  }, [searchQuery, quickFilter, timeRange, pageSize, showAdvanced, advancedQuery]);

  // Fetch logs from backend
  const fetchLogs = async (retryCount = 0) => {
    setLoading(true);
    try {
      const query = buildQuery();

      const { data } = await privateClient({
        method: 'post',
        url: `${import.meta.env.VITE_APP_API_BASE}/v1/logs/search`,
        headers: {
          'X-API-Key': apiKey || ''
        },
        data: query
      });

      const hits = data?.hits?.hits || [];
      const total = data?.hits?.total?.value || 0;

      setLogs(hits);
      setTotalHits(total);
      message.success(`Found ${total} log entries`);
    } catch (error: any) {
      console.error('Failed to fetch logs:', error);

      // Check if we got a 400 error with "X-API-Key header required" message
      const is400Error = error?.response?.status === 400;
      const isApiKeyMissing = error?.response?.data?.error?.includes('X-API-Key header required');

      // Check if we got a 500 error with "API key invalid or expired" message
      const is500Error = error?.response?.status === 500;
      const isApiKeyExpired = error?.response?.data?.error?.includes('API key invalid or expired');

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
          await fetchLogs(1);
          return;
        } catch (regenerateErr) {
          console.error('Failed to generate API key:', regenerateErr);
          message.error('Failed to generate API key');
        }
      }

      const errorMsg = error?.response?.data?.error || error?.message || 'Failed to fetch logs';
      message.error(`Error: ${errorMsg}`);
      setLogs([]);
      setTotalHits(0);
    } finally {
      setLoading(false);
    }
  };

  // Export logs to JSON
  const exportLogs = () => {
    if (logs.length === 0) {
      message.warning('No logs to export');
      return;
    }

    const exportData = {
      exported_at: new Date().toISOString(),
      total_hits: totalHits,
      logs: logs.map(log => log._source)
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const file = new File([blob], `logs-export-${dayjs().format('YYYY-MM-DD-HH-mm-ss')}.json`, {
      type: 'application/json'
    });
    FileSaver.saveAs(file);
    message.success('Logs exported successfully');
  };

  // Get log level color
  const getLevelColor = (level?: string) => {
    switch (level?.toUpperCase()) {
      case 'ERROR':
        return 'text-red-400 bg-red-500/10';
      case 'WARN':
      case 'WARNING':
        return 'text-yellow-400 bg-yellow-500/10';
      case 'INFO':
        return 'text-blue-400 bg-blue-500/10';
      case 'DEBUG':
        return 'text-purple-400 bg-purple-500/10';
      default:
        return 'text-slate-400 bg-slate-500/10';
    }
  };

  return (
    <div className="h-full flex flex-col bg-slate-800/95">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700">
        <div className="flex items-center space-x-2">
          <h3 className="font-semibold text-white">Environment Logs</h3>
          <span className="text-xs bg-teal-500/20 text-teal-300 px-2 py-1 rounded-full">
            {totalHits} entries
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded hover:bg-slate-700 transition-colors"
          title="Close logs viewer"
        >
          <X size={18} className="text-slate-400" />
        </button>
      </div>

      {/* Search and Filters */}
      <div className="p-4 border-b border-slate-700 space-y-3">
        {/* Search Bar */}
        <div className="flex items-center space-x-2">
          <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && fetchLogs()}
              placeholder="Search logs... (press Enter to search)"
              className="w-full pl-10 pr-3 py-2 bg-slate-900/50 border border-slate-600 rounded text-white text-sm placeholder-slate-500 focus:outline-none focus:border-teal-500"
            />
          </div>
          <button
            onClick={fetchLogs}
            disabled={loading}
            className="px-4 py-2 bg-teal-500/20 text-teal-400 rounded hover:bg-teal-500/30 transition-colors disabled:opacity-50 flex items-center space-x-2"
          >
            {loading ? (
              <Loader2 size={16} className="animate-spin" />
            ) : (
              <Search size={16} />
            )}
            <span className="text-sm font-medium">Search</span>
          </button>
        </div>

        {/* Filters Row */}
        <div className="flex items-center space-x-2 flex-wrap gap-2">
          <div className="flex items-center space-x-2">
            <Filter size={14} className="text-slate-400" />
            <select
              value={quickFilter}
              onChange={(e) => setQuickFilter(e.target.value)}
              className="px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-teal-500"
            >
              <option value="all">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
          </div>

          <select
            value={pageSize}
            onChange={(e) => setPageSize(Number(e.target.value))}
            className="px-3 py-1.5 bg-slate-900/50 border border-slate-600 rounded text-white text-sm focus:outline-none focus:border-teal-500"
          >
            <option value={20}>20 entries</option>
            <option value={50}>50 entries</option>
            <option value={100}>100 entries</option>
            <option value={200}>200 entries</option>
          </select>

          <button
            onClick={() => setShowAdvanced(!showAdvanced)}
            className={`px-3 py-1.5 rounded text-sm font-medium transition-colors ${
              showAdvanced
                ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30'
                : 'bg-slate-700 text-slate-300 hover:bg-slate-600'
            }`}
          >
            Advanced Query
          </button>

          <button
            onClick={exportLogs}
            disabled={logs.length === 0}
            className="ml-auto px-3 py-1.5 bg-blue-500/20 text-blue-400 rounded hover:bg-blue-500/30 transition-colors disabled:opacity-50 flex items-center space-x-1.5"
          >
            <Download size={14} />
            <span className="text-sm">Export</span>
          </button>
        </div>

        {/* Advanced Query Editor */}
        {showAdvanced && (
          <div className="space-y-2">
            <label className="text-xs text-slate-400">Elasticsearch Query DSL (JSON)</label>
            <TextArea
              value={advancedQuery}
              onChange={(e) => setAdvancedQuery(e.target.value)}
              placeholder='{"query": {"match_all": {}}, "size": 50}'
              rows={6}
              className="font-mono text-xs"
            />
          </div>
        )}
      </div>

      {/* Logs List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {loading && (
          <div className="flex items-center justify-center py-12">
            <Loader2 size={32} className="animate-spin text-teal-400" />
          </div>
        )}

        {!loading && logs.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-slate-400">
            <AlertCircle size={48} className="mb-3 opacity-30" />
            <p className="text-sm">No logs found</p>
            <p className="text-xs mt-1">Try adjusting your search criteria</p>
          </div>
        )}

        {!loading && logs.map((log) => (
          <div
            key={log._id}
            onClick={() => setSelectedLog(log)}
            className="p-3 bg-slate-700/50 hover:bg-slate-700/70 rounded-lg cursor-pointer transition-colors border border-slate-600 hover:border-teal-500/50"
          >
            <div className="flex items-start justify-between gap-3">
              <div className="flex-1 min-w-0">
                <div className="flex items-center space-x-2 mb-1">
                  <span className="text-xs text-slate-500">
                    {dayjs(log._source['@timestamp']).format('YYYY-MM-DD HH:mm:ss.SSS')}
                  </span>
                  {log._source.level && (
                    <span className={`text-xs px-2 py-0.5 rounded font-medium ${getLevelColor(log._source.level)}`}>
                      {log._source.level.toUpperCase()}
                    </span>
                  )}
                  {log._source.logger && (
                    <span className="text-xs text-slate-400 truncate">
                      {log._source.logger}
                    </span>
                  )}
                </div>
                <p className="text-sm text-white line-clamp-2">
                  {log._source.message || JSON.stringify(log._source)}
                </p>
              </div>
              <Eye size={16} className="text-slate-400 flex-shrink-0 mt-1" />
            </div>
          </div>
        ))}
      </div>

      {/* Log Detail Modal */}
      {selectedLog && (
        <Modal
          title="Log Entry Details"
          open={!!selectedLog}
          onCancel={() => setSelectedLog(null)}
          footer={null}
          width={800}
          centered
        >
          <div className="space-y-3">
            <div>
              <label className="text-xs text-slate-500 font-medium">Timestamp</label>
              <p className="text-sm text-slate-300 mt-1">
                {dayjs(selectedLog._source['@timestamp']).format('YYYY-MM-DD HH:mm:ss.SSS Z')}
              </p>
            </div>

            {selectedLog._source.level && (
              <div>
                <label className="text-xs text-slate-500 font-medium">Level</label>
                <p className={`text-sm mt-1 inline-block px-2 py-1 rounded ${getLevelColor(selectedLog._source.level)}`}>
                  {selectedLog._source.level.toUpperCase()}
                </p>
              </div>
            )}

            {selectedLog._source.logger && (
              <div>
                <label className="text-xs text-slate-500 font-medium">Logger</label>
                <p className="text-sm text-slate-300 mt-1 font-mono">
                  {selectedLog._source.logger}
                </p>
              </div>
            )}

            {selectedLog._source.message && (
              <div>
                <label className="text-xs text-slate-500 font-medium">Message</label>
                <pre className="text-sm text-slate-300 mt-1 bg-slate-900 p-3 rounded overflow-auto max-h-64 whitespace-pre-wrap">
                  {selectedLog._source.message}
                </pre>
              </div>
            )}

            <div>
              <label className="text-xs text-slate-500 font-medium">Full Log Entry (JSON)</label>
              <pre className="text-xs text-slate-300 mt-1 bg-slate-900 p-3 rounded overflow-auto max-h-96 font-mono">
                {JSON.stringify(selectedLog._source, null, 2)}
              </pre>
            </div>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default LogsViewer;
