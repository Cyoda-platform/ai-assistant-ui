import React from 'react';
import { Button, Card } from 'antd';
import { FileTextOutlined, EditOutlined, ClearOutlined } from '@ant-design/icons';

interface EmptyStateProps {
  onLoadSample: () => void;
  onClear: () => void;
}

const EmptyState: React.FC<EmptyStateProps> = ({ onLoadSample, onClear }) => {
  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      height: '100%',
      padding: '40px',
      background: 'var(--bg-dialog-color)'
    }}>
      <Card
        style={{
          maxWidth: '600px',
          textAlign: 'center',
          boxShadow: '0 4px 12px rgba(0, 0, 0, 0.1)'
        }}
      >
        <div style={{ marginBottom: '24px' }}>
          <EditOutlined style={{ fontSize: '48px', color: '#3B82F6', marginBottom: '16px' }} />
          <h2 style={{ marginBottom: '8px', fontSize: '20px', fontWeight: 600 }}>
            Welcome to Workflow Editor
          </h2>
          <p style={{ color: '#6B7280', fontSize: '14px', marginBottom: '24px' }}>
            Create and visualize state machine workflows with real-time validation
          </p>
        </div>

        <div style={{
          textAlign: 'left',
          background: '#F9FAFB',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '12px' }}>
            Quick Start:
          </h3>
          <ol style={{ paddingLeft: '20px', margin: 0, fontSize: '13px', lineHeight: '1.8' }}>
            <li>Click <strong>"Sample"</strong> to load an example workflow</li>
            <li>Or click <strong>"Clear"</strong> to start with an empty template</li>
            <li>Or paste your own workflow JSON in the editor</li>
            <li>Watch the canvas update in real-time</li>
            <li>Use validation panel to check for errors</li>
          </ol>
        </div>

        <div style={{
          textAlign: 'left',
          background: '#EFF6FF',
          padding: '16px',
          borderRadius: '8px',
          marginBottom: '24px',
          border: '1px solid #DBEAFE'
        }}>
          <h3 style={{ fontSize: '14px', fontWeight: 600, marginBottom: '8px', color: '#1E40AF' }}>
            💡 Minimum Required Structure:
          </h3>
          <pre style={{
            background: '#1F2937',
            color: '#F3F4F6',
            padding: '12px',
            borderRadius: '4px',
            fontSize: '12px',
            overflow: 'auto',
            margin: 0
          }}>
{`{
  "version": "1.0",
  "name": "My Workflow",
  "initialState": "initial_state",
  "states": {
    "initial_state": {
      "transitions": []
    }
  }
}`}
          </pre>
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <Button
            type="primary"
            size="large"
            icon={<FileTextOutlined />}
            onClick={onLoadSample}
          >
            Load Sample Workflow
          </Button>
          <Button
            size="large"
            icon={<ClearOutlined />}
            onClick={onClear}
          >
            Start Fresh
          </Button>
        </div>

        <div style={{
          marginTop: '24px',
          padding: '12px',
          background: '#FEF3C7',
          borderRadius: '6px',
          fontSize: '12px',
          color: '#92400E'
        }}>
          <strong>📖 Tip:</strong> Check the Statistics Panel below the editor for validation status and workflow metrics
        </div>
      </Card>
    </div>
  );
};

export default EmptyState;

