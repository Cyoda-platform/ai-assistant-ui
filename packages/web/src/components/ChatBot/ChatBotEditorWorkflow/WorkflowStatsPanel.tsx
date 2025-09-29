import React, { useMemo } from 'react';
import { Card, Statistic, Row, Col, Alert, Collapse, Tag, Tooltip } from 'antd';
import {
  NodeIndexOutlined,
  BranchesOutlined,
  CheckCircleOutlined,
  ThunderboltOutlined,
  FilterOutlined,
  WarningOutlined,
  CloseCircleOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import { WorkflowData, ValidationResult, getWorkflowStats } from './utils/workflowUtils';

const { Panel } = Collapse;

interface WorkflowStatsPanelProps {
  workflowData: WorkflowData | null;
  validationResult: ValidationResult | null;
}

const WorkflowStatsPanel: React.FC<WorkflowStatsPanelProps> = ({
  workflowData,
  validationResult,
}) => {
  const stats = useMemo(() => {
    if (!workflowData) return null;
    return getWorkflowStats(workflowData);
  }, [workflowData]);

  if (!workflowData || !stats) {
    return (
      <Card size="small" style={{ marginTop: '16px' }}>
        <Alert
          message="No Workflow Data"
          description="Load or create a workflow to see statistics"
          type="info"
          showIcon
          icon={<InfoCircleOutlined />}
        />
      </Card>
    );
  }

  const hasErrors = validationResult && validationResult.errors.length > 0;
  const hasWarnings = validationResult && validationResult.warnings.length > 0;

  return (
    <div style={{ marginTop: '16px' }}>
      {/* Validation Status */}
      {validationResult && (
        <Card size="small" style={{ marginBottom: '16px' }}>
          {hasErrors && (
            <Alert
              message={`${validationResult.errors.length} Validation Error${validationResult.errors.length !== 1 ? 's' : ''}`}
              type="error"
              showIcon
              icon={<CloseCircleOutlined />}
              style={{ marginBottom: hasWarnings ? '12px' : 0 }}
            />
          )}
          {hasWarnings && (
            <Alert
              message={`${validationResult.warnings.length} Warning${validationResult.warnings.length !== 1 ? 's' : ''}`}
              type="warning"
              showIcon
              icon={<WarningOutlined />}
            />
          )}
          {!hasErrors && !hasWarnings && (
            <Alert
              message="Workflow is Valid"
              description="All validation checks passed"
              type="success"
              showIcon
              icon={<CheckCircleOutlined />}
            />
          )}

          {/* Detailed Errors and Warnings */}
          {(hasErrors || hasWarnings) && (
            <Collapse
              ghost
              style={{ marginTop: '12px' }}
              items={[
                ...(hasErrors
                  ? [
                      {
                        key: 'errors',
                        label: (
                          <span>
                            <CloseCircleOutlined style={{ color: '#ff4d4f', marginRight: '8px' }} />
                            View Errors ({validationResult.errors.length})
                          </span>
                        ),
                        children: (
                          <div>
                            {validationResult.errors.map((error, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '8px',
                                  marginBottom: '8px',
                                  background: '#fff2f0',
                                  border: '1px solid #ffccc7',
                                  borderRadius: '4px',
                                }}
                              >
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                  {error.path}
                                </div>
                                <div style={{ fontSize: '13px' }}>{error.message}</div>
                              </div>
                            ))}
                          </div>
                        ),
                      },
                    ]
                  : []),
                ...(hasWarnings
                  ? [
                      {
                        key: 'warnings',
                        label: (
                          <span>
                            <WarningOutlined style={{ color: '#faad14', marginRight: '8px' }} />
                            View Warnings ({validationResult.warnings.length})
                          </span>
                        ),
                        children: (
                          <div>
                            {validationResult.warnings.map((warning, idx) => (
                              <div
                                key={idx}
                                style={{
                                  padding: '8px',
                                  marginBottom: '8px',
                                  background: '#fffbe6',
                                  border: '1px solid #ffe58f',
                                  borderRadius: '4px',
                                }}
                              >
                                <div style={{ fontWeight: 600, marginBottom: '4px' }}>
                                  {warning.path}
                                </div>
                                <div style={{ fontSize: '13px' }}>{warning.message}</div>
                              </div>
                            ))}
                          </div>
                        ),
                      },
                    ]
                  : []),
              ]}
            />
          )}
        </Card>
      )}

      {/* Workflow Statistics */}
      <Card title="Workflow Statistics" size="small">
        <Row gutter={[16, 16]}>
          <Col span={12}>
            <Tooltip title="Total number of states in the workflow">
              <Statistic
                title="Total States"
                value={stats.totalStates}
                prefix={<NodeIndexOutlined />}
                valueStyle={{ fontSize: '20px' }}
              />
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip title="Total number of transitions between states">
              <Statistic
                title="Transitions"
                value={stats.totalTransitions}
                prefix={<BranchesOutlined />}
                valueStyle={{ fontSize: '20px' }}
              />
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip title="States with no outgoing transitions">
              <Statistic
                title="Terminal States"
                value={stats.terminalStates}
                prefix={<CheckCircleOutlined />}
                valueStyle={{ fontSize: '20px', color: '#10B981' }}
              />
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip title="Total number of processors across all transitions">
              <Statistic
                title="Processors"
                value={stats.totalProcessors}
                prefix={<ThunderboltOutlined />}
                valueStyle={{ fontSize: '20px', color: '#F59E0B' }}
              />
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip title="Transitions with conditional criteria">
              <Statistic
                title="Conditional"
                value={stats.conditionalTransitions}
                prefix={<FilterOutlined />}
                valueStyle={{ fontSize: '20px', color: '#8B5CF6' }}
              />
            </Tooltip>
          </Col>
          <Col span={12}>
            <Tooltip title="Transitions that loop back to the same state">
              <Statistic
                title="Self-Loops"
                value={stats.selfLoops}
                valueStyle={{ fontSize: '20px', color: '#6B7280' }}
              />
            </Tooltip>
          </Col>
        </Row>

        {/* Transition Types */}
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
          <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>
            Transition Types
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <Tooltip title="Transitions that require manual triggering">
              <Tag color="orange" style={{ margin: 0, padding: '4px 12px', fontSize: '13px' }}>
                Manual: {stats.manualTransitions}
              </Tag>
            </Tooltip>
            <Tooltip title="Transitions that trigger automatically">
              <Tag color="blue" style={{ margin: 0, padding: '4px 12px', fontSize: '13px' }}>
                Automatic: {stats.automaticTransitions}
              </Tag>
            </Tooltip>
          </div>
        </div>

        {/* Workflow Metadata */}
        {workflowData.version && (
          <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid #f0f0f0' }}>
            <div style={{ marginBottom: '8px', fontWeight: 600, fontSize: '13px' }}>
              Workflow Info
            </div>
            <div style={{ fontSize: '12px', color: '#6B7280' }}>
              <div style={{ marginBottom: '4px' }}>
                <strong>Name:</strong> {workflowData.name}
              </div>
              <div style={{ marginBottom: '4px' }}>
                <strong>Version:</strong> {workflowData.version}
              </div>
              {workflowData.desc && (
                <div style={{ marginBottom: '4px' }}>
                  <strong>Description:</strong> {workflowData.desc}
                </div>
              )}
              <div>
                <strong>Initial State:</strong> {workflowData.initialState || workflowData.initial_state}
              </div>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default WorkflowStatsPanel;

