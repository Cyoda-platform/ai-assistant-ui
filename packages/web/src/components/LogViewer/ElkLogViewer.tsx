import React, { useState, useMemo, useCallback } from 'react';
import {
  EuiDataGrid,
  EuiPanel,
  EuiFlexGroup,
  EuiFlexItem,
  EuiFieldSearch,
  EuiButton,
  EuiButtonGroup,
  EuiSelect,
  EuiText,
  EuiSpacer,
  EuiHealth,
  EuiCode,
  EuiButtonEmpty,
  EuiProvider,
} from '@elastic/eui';
import type { EuiDataGridColumn, EuiDataGridCellValueElementProps } from '@elastic/eui';
import './ElkLogViewer.css';

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

interface ElkLogViewerProps {
  data: ElkLogResponse;
  onRefresh?: () => void;
  title?: string;
}

const ElkLogViewer: React.FC<ElkLogViewerProps> = ({
  data,
  onRefresh,
  title = 'Environment Logs'
}) => {
  const [searchValue, setSearchValue] = useState('');
  const [levelFilter, setLevelFilter] = useState<string>('all');
  const [pageSize, setPageSize] = useState(50);
  const [visibleColumns, setVisibleColumns] = useState(['level', '@timestamp', 'message']);
  const [pagination, setPagination] = useState({ pageIndex: 0, pageSize: 50 });

  // Level filter options
  const levelOptions = [
    { id: 'all', label: 'All Levels' },
    { id: 'ERROR', label: 'ERROR' },
    { id: 'WARN', label: 'WARN' },
    { id: 'INFO', label: 'INFO' },
    { id: 'DEBUG', label: 'DEBUG' },
    { id: 'TRACE', label: 'TRACE' },
  ];

  // Page size options
  const pageSizeOptions = [
    { value: 50, text: '50 entries' },
    { value: 100, text: '100 entries' },
    { value: 500, text: '500 entries' },
    { value: 1000, text: '1000 entries' },
  ];

  // Filter logs
  const filteredLogs = useMemo(() => {
    if (!data?.logs || !Array.isArray(data.logs)) {
      return [];
    }
    return data.logs.filter(log => {
      const matchesLevel = levelFilter === 'all' || log.level === levelFilter;
      const matchesSearch = !searchValue ||
        log.message?.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.class?.toLowerCase().includes(searchValue.toLowerCase()) ||
        log.pod?.toLowerCase().includes(searchValue.toLowerCase());
      return matchesLevel && matchesSearch;
    });
  }, [data?.logs, searchValue, levelFilter]);

  // Define columns
  const columns: EuiDataGridColumn[] = [
    {
      id: 'level',
      displayAsText: 'Level',
      initialWidth: 100,
    },
    {
      id: '@timestamp',
      displayAsText: 'Timestamp',
      initialWidth: 220,
    },
    {
      id: 'message',
      displayAsText: 'Message',
    },
    {
      id: 'pod',
      displayAsText: 'Pod',
      initialWidth: 200,
    },
    {
      id: 'class',
      displayAsText: 'Class',
      initialWidth: 250,
    },
    {
      id: 'thread',
      displayAsText: 'Thread',
      initialWidth: 200,
    },
    {
      id: 'namespace',
      displayAsText: 'Namespace',
      initialWidth: 150,
    },
    {
      id: 'deployment',
      displayAsText: 'Deployment',
      initialWidth: 150,
    },
  ];

  // Render cell content
  const renderCellValue = useCallback(
    ({ rowIndex, columnId }: EuiDataGridCellValueElementProps) => {
      const log = filteredLogs[rowIndex];
      if (!log) return null;

      const value = log[columnId as keyof ElkLog];

      if (columnId === 'level') {
        const levelColors: Record<string, string> = {
          ERROR: 'danger',
          WARN: 'warning',
          INFO: 'primary',
          DEBUG: 'subdued',
          TRACE: 'accent',
        };
        return <EuiHealth color={levelColors[log.level] || 'subdued'}>{log.level}</EuiHealth>;
      }

      if (columnId === '@timestamp') {
        const date = new Date(log['@timestamp']);
        return (
          <EuiCode>
            {date.toLocaleString('en-US', {
              year: 'numeric',
              month: '2-digit',
              day: '2-digit',
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              fractionalSecondDigits: 3,
            })}
          </EuiCode>
        );
      }

      return value?.toString() || '-';
    },
    [filteredLogs]
  );

  // Export logs
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

  // Count logs by level
  const levelCounts = useMemo(() => {
    const counts: Record<string, number> = {
      ERROR: 0,
      WARN: 0,
      INFO: 0,
      DEBUG: 0,
      TRACE: 0,
    };
    if (data?.logs && Array.isArray(data.logs)) {
      data.logs.forEach(log => {
        if (counts[log.level] !== undefined) {
          counts[log.level]++;
        }
      });
    }
    return counts;
  }, [data?.logs]);

  return (
    <EuiProvider colorMode="dark">
      <div className="elk-log-viewer">
        <EuiPanel paddingSize="none">
        {/* Header */}
        <div className="elk-header">
          <EuiFlexGroup alignItems="center" justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiText>
                <h2>{title}</h2>
                <p className="elk-subtitle">
                  {data?.total_hits?.toLocaleString() || 0} entries
                </p>
              </EuiText>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>

        <EuiSpacer size="m" />

        {/* Controls */}
        <div className="elk-controls">
          <EuiFlexGroup gutterSize="m" alignItems="center">
            <EuiFlexItem>
              <EuiFieldSearch
                placeholder="Search logs... (press Enter to search)"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                isClearable
                fullWidth
              />
            </EuiFlexItem>
          </EuiFlexGroup>

          <EuiSpacer size="s" />

          <EuiFlexGroup gutterSize="m" alignItems="center" justifyContent="spaceBetween">
            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" alignItems="center">
                <EuiFlexItem grow={false}>
                  <EuiButtonGroup
                    legend="Filter by log level"
                    options={levelOptions.map(opt => ({
                      ...opt,
                      label: opt.id === 'all'
                        ? opt.label
                        : `${opt.label} (${levelCounts[opt.id as keyof typeof levelCounts] || 0})`,
                    }))}
                    idSelected={levelFilter}
                    onChange={(id) => setLevelFilter(id)}
                    buttonSize="compressed"
                  />
                </EuiFlexItem>
              </EuiFlexGroup>
            </EuiFlexItem>

            <EuiFlexItem grow={false}>
              <EuiFlexGroup gutterSize="s" alignItems="center">
                <EuiFlexItem grow={false}>
                  <EuiSelect
                    options={pageSizeOptions}
                    value={pageSize}
                    onChange={(e) => {
                      const newSize = Number(e.target.value);
                      setPageSize(newSize);
                      setPagination({ ...pagination, pageSize: newSize });
                    }}
                    compressed
                  />
                </EuiFlexItem>
                <EuiFlexItem grow={false}>
                  <EuiButton size="s" onClick={exportLogs}>
                    Export
                  </EuiButton>
                </EuiFlexItem>
                {onRefresh && (
                  <EuiFlexItem grow={false}>
                    <EuiButtonEmpty size="s" onClick={onRefresh} iconType="refresh">
                      Refresh
                    </EuiButtonEmpty>
                  </EuiFlexItem>
                )}
              </EuiFlexGroup>
            </EuiFlexItem>
          </EuiFlexGroup>
        </div>

        <EuiSpacer size="m" />

        {/* Results info */}
        <div className="elk-results-info">
          <EuiText size="s" color="subdued">
            Showing {filteredLogs.length} of {data?.logs?.length || 0} results
          </EuiText>
        </div>

        <EuiSpacer size="s" />

        {/* Data Grid */}
        <EuiDataGrid
          aria-label="Log viewer"
          columns={columns}
          columnVisibility={{
            visibleColumns,
            setVisibleColumns
          }}
          rowCount={filteredLogs.length}
          renderCellValue={renderCellValue}
          pagination={{
            ...pagination,
            onChangeItemsPerPage: (pageSize) =>
              setPagination({ ...pagination, pageSize }),
            onChangePage: (pageIndex) =>
              setPagination({ ...pagination, pageIndex }),
          }}
          toolbarVisibility={{
            showColumnSelector: true,
            showSortSelector: true,
            showDisplaySelector: false,
            showFullScreenSelector: false,
            additionalControls: null,
          }}
          gridStyle={{
            border: 'horizontal',
            stripes: true,
            rowHover: 'highlight',
            header: 'shade',
          }}
          height="600px"
        />
      </EuiPanel>
      </div>
    </EuiProvider>
  );
};

export default ElkLogViewer;
