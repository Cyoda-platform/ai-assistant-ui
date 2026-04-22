/**
 * Banner showing FR consolidation validation results
 *
 * Displays after functional requirements are consolidated to show:
 * - Which source documents were analyzed
 * - How many requirements matched
 * - What requirements might be missing
 * - Recommendations for next steps
 */

import React from 'react';
import { Alert, Button, Collapse, List, Typography, Progress } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
  FileTextOutlined,
} from '@ant-design/icons';
import type { FRValidationResult } from '@/helpers/frValidationParser';

const { Panel } = Collapse;
const { Text, Paragraph } = Typography;

export interface FRValidationBannerProps {
  validation: FRValidationResult;
  onDismiss: () => void;
  onRequestRegeneration?: (message: string) => void;
}

export const FRValidationBanner: React.FC<FRValidationBannerProps> = ({
  validation,
  onDismiss,
  onRequestRegeneration,
}) => {
  const {
    passed,
    sourceDocumentCount,
    keyRequirementsIdentified,
    requirementsMatched,
    requirementsMissing,
    matchPercentage,
    matchedRequirements,
    missingRequirements,
    sourceDocuments,
    recommendations,
  } = validation;

  const statusType = passed ? 'success' : 'warning';
  const statusIcon = passed ? <CheckCircleOutlined /> : <WarningOutlined />;
  const statusTitle = passed
    ? 'FR Consolidation Validation: PASSED'
    : 'FR Consolidation Validation: REVIEW NEEDED';

  const handleRegenerateMissing = () => {
    if (!onRequestRegeneration || missingRequirements.length === 0) {
      return;
    }

    const message = `The following requirements appear to be missing from the consolidated FR document. Please review and add them:\n\n${missingRequirements.map((req) => `- ${req}`).join('\n')}`;

    onRequestRegeneration(message);
  };

  return (
    <Alert
      message={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {statusIcon}
          <strong>{statusTitle}</strong>
        </div>
      }
      description={
        <div>
          {/* Summary Stats */}
          <div style={{ marginBottom: 16 }}>
            <Text>
              Analyzed <strong>{sourceDocumentCount}</strong> source documents
              with <strong>{keyRequirementsIdentified}</strong> key requirements
            </Text>
          </div>

          {/* Match Progress */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Text strong>Coverage:</Text>
              <Text>
                {requirementsMatched} / {keyRequirementsIdentified} matched
              </Text>
            </div>
            <Progress
              percent={matchPercentage}
              status={passed ? 'success' : 'exception'}
              strokeColor={passed ? '#52c41a' : '#faad14'}
            />
          </div>

          {/* Collapsible Details */}
          <Collapse ghost>
            {/* Source Documents */}
            {sourceDocuments.length > 0 && (
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <FileTextOutlined />
                    <Text strong>Source Documents ({sourceDocuments.length})</Text>
                  </div>
                }
                key="sources"
              >
                <List
                  size="small"
                  dataSource={sourceDocuments}
                  renderItem={(doc) => (
                    <List.Item>
                      <Text>
                        <Text code>{doc.name}</Text> - {doc.requirementCount}{' '}
                        requirements
                      </Text>
                    </List.Item>
                  )}
                />
              </Panel>
            )}

            {/* Matched Requirements */}
            {matchedRequirements.length > 0 && (
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <CheckCircleOutlined style={{ color: '#52c41a' }} />
                    <Text strong>
                      Matched Requirements ({matchedRequirements.length})
                    </Text>
                  </div>
                }
                key="matched"
              >
                <List
                  size="small"
                  dataSource={matchedRequirements.slice(0, 10)}
                  renderItem={(req) => (
                    <List.Item>
                      <Text>
                        <CheckCircleOutlined
                          style={{ color: '#52c41a', marginRight: 8 }}
                        />
                        {req}
                      </Text>
                    </List.Item>
                  )}
                />
                {matchedRequirements.length > 10 && (
                  <Text type="secondary">
                    ...and {matchedRequirements.length - 10} more
                  </Text>
                )}
              </Panel>
            )}

            {/* Missing Requirements */}
            {missingRequirements.length > 0 && (
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <WarningOutlined style={{ color: '#faad14' }} />
                    <Text strong type="warning">
                      Potentially Missing ({missingRequirements.length})
                    </Text>
                  </div>
                }
                key="missing"
              >
                <List
                  size="small"
                  dataSource={missingRequirements}
                  renderItem={(req) => (
                    <List.Item>
                      <Text type="warning">
                        <WarningOutlined
                          style={{ color: '#faad14', marginRight: 8 }}
                        />
                        {req}
                      </Text>
                    </List.Item>
                  )}
                />
              </Panel>
            )}

            {/* Recommendations */}
            {recommendations.length > 0 && (
              <Panel
                header={
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <InfoCircleOutlined style={{ color: '#1890ff' }} />
                    <Text strong>Recommendations</Text>
                  </div>
                }
                key="recommendations"
              >
                <List
                  size="small"
                  dataSource={recommendations}
                  renderItem={(rec) => (
                    <List.Item>
                      <Paragraph style={{ marginBottom: 0 }}>{rec}</Paragraph>
                    </List.Item>
                  )}
                />
              </Panel>
            )}
          </Collapse>

          {/* Actions */}
          <div
            style={{
              display: 'flex',
              gap: 8,
              marginTop: 16,
              justifyContent: 'flex-end',
            }}
          >
            {missingRequirements.length > 0 && onRequestRegeneration && (
              <Button type="primary" size="small" onClick={handleRegenerateMissing}>
                Request Missing Requirements
              </Button>
            )}
            <Button size="small" onClick={onDismiss}>
              Dismiss
            </Button>
          </div>
        </div>
      }
      type={statusType}
      showIcon={false}
      closable={false}
      style={{ marginBottom: 16 }}
    />
  );
};
