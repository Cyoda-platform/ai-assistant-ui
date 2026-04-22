/**
 * Dialog showing repository pull status and integrity check results
 *
 * Displays after a git pull operation to show:
 * - What entities and workflows were found
 * - Any validation results against requirements
 * - Recommendations for next steps
 */

import React from 'react';
import { Modal, Button, Alert, Typography, Divider, List } from 'antd';
import {
  CheckCircleOutlined,
  WarningOutlined,
  InfoCircleOutlined,
} from '@ant-design/icons';
import type { RepositoryIntegrityResult } from '@/helpers/repositoryIntegrityParser';

const { Title, Text, Paragraph } = Typography;

export interface PullStatusDialogProps {
  visible: boolean;
  integrityResult: RepositoryIntegrityResult | null;
  onClose: () => void;
  onViewInCanvas?: () => void;
}

export const PullStatusDialog: React.FC<PullStatusDialogProps> = ({
  visible,
  integrityResult,
  onClose,
  onViewInCanvas,
}) => {
  if (!integrityResult) {
    return null;
  }

  const {
    appType,
    entitiesFound,
    workflowsFound,
    requirementsFound,
    entityNames,
    workflowNames,
    hasValidation,
    validationPassed,
    validationMessage,
    recommendations,
  } = integrityResult;

  // Determine overall status
  const hasItems = entitiesFound > 0 || workflowsFound > 0;
  const hasWarnings = !hasItems || (hasValidation && !validationPassed);

  return (
    <Modal
      title={
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          {hasWarnings ? (
            <WarningOutlined style={{ color: '#faad14', fontSize: 20 }} />
          ) : (
            <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 20 }} />
          )}
          <span>Repository Pull Status</span>
        </div>
      }
      open={visible}
      onCancel={onClose}
      width={700}
      footer={[
        <Button key="close" onClick={onClose}>
          Close
        </Button>,
        onViewInCanvas && (
          <Button key="canvas" type="primary" onClick={onViewInCanvas}>
            View in Canvas
          </Button>
        ),
      ]}
    >
      {/* Summary Alert */}
      <Alert
        message={
          hasWarnings
            ? 'Review Required'
            : 'Pull Successful'
        }
        description={
          hasWarnings
            ? 'Repository was pulled, but some issues were detected. Please review below.'
            : 'Repository was successfully pulled and verified.'
        }
        type={hasWarnings ? 'warning' : 'success'}
        showIcon
        style={{ marginBottom: 16 }}
      />

      {/* Summary Stats */}
      <div
        style={{
          background: '#f5f5f5',
          padding: 16,
          borderRadius: 4,
          marginBottom: 16,
        }}
      >
        <Title level={5} style={{ marginTop: 0, marginBottom: 12 }}>
          Repository Summary
        </Title>
        <div style={{ display: 'flex', gap: 24 }}>
          <div>
            <Text strong>App Type:</Text>{' '}
            <Text code>{appType}</Text>
          </div>
          <div>
            <Text strong>Entities:</Text>{' '}
            <Text type={entitiesFound === 0 ? 'warning' : undefined}>
              {entitiesFound}
            </Text>
          </div>
          <div>
            <Text strong>Workflows:</Text>{' '}
            <Text type={workflowsFound === 0 ? 'warning' : undefined}>
              {workflowsFound}
            </Text>
          </div>
          <div>
            <Text strong>Requirements:</Text> <Text>{requirementsFound}</Text>
          </div>
        </div>
      </div>

      {/* Entities List */}
      {entityNames.length > 0 && (
        <>
          <Title level={5}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            Entities Found ({entityNames.length})
          </Title>
          <List
            size="small"
            bordered
            dataSource={entityNames}
            renderItem={(item) => (
              <List.Item>
                <Text code>{item}</Text>
              </List.Item>
            )}
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {/* Workflows List */}
      {workflowNames.length > 0 && (
        <>
          <Title level={5}>
            <CheckCircleOutlined style={{ color: '#52c41a', marginRight: 8 }} />
            Workflows Found ({workflowNames.length})
          </Title>
          <List
            size="small"
            bordered
            dataSource={workflowNames}
            renderItem={(item) => (
              <List.Item>
                <Text code>{item}</Text>
              </List.Item>
            )}
            style={{ marginBottom: 16, maxHeight: 200, overflowY: 'auto' }}
          />
        </>
      )}

      {/* Validation Results */}
      {hasValidation && validationMessage && (
        <>
          <Divider />
          <Title level={5}>
            {validationPassed ? (
              <CheckCircleOutlined
                style={{ color: '#52c41a', marginRight: 8 }}
              />
            ) : (
              <WarningOutlined style={{ color: '#faad14', marginRight: 8 }} />
            )}
            Validation Against Requirements
          </Title>
          <Alert
            message={validationPassed ? 'All items generated' : 'Items missing'}
            description={
              <div
                style={{
                  whiteSpace: 'pre-wrap',
                  fontFamily: 'monospace',
                  fontSize: 12,
                }}
              >
                {validationMessage}
              </div>
            }
            type={validationPassed ? 'success' : 'warning'}
            showIcon
            style={{ marginBottom: 16 }}
          />
        </>
      )}

      {/* Recommendations */}
      {recommendations.length > 0 && (
        <>
          <Divider />
          <Title level={5}>
            <InfoCircleOutlined style={{ color: '#1890ff', marginRight: 8 }} />
            Recommendations
          </Title>
          <List
            size="small"
            dataSource={recommendations}
            renderItem={(item) => (
              <List.Item>
                <Paragraph style={{ marginBottom: 0 }}>{item}</Paragraph>
              </List.Item>
            )}
          />
        </>
      )}

      {/* Empty State */}
      {!hasItems && (
        <Alert
          message="No Items Found"
          description="The repository appears to be empty or parsing failed. Check backend logs for errors."
          type="error"
          showIcon
          style={{ marginTop: 16 }}
        />
      )}
    </Modal>
  );
};
