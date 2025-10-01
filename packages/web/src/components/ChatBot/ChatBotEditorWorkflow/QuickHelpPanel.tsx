import React from 'react';
import { Card, Typography, Space } from 'antd';
import {
  MousePointerClick,
  Move,
  Edit3,
  Link2,
  Keyboard,
  Layout,
  HelpCircle
} from 'lucide-react';

const { Text, Title } = Typography;

interface QuickHelpPanelProps {
  visible: boolean;
}

const QuickHelpPanel: React.FC<QuickHelpPanelProps> = ({ visible }) => {
  if (!visible) return null;

  const helpItems = [
    {
      icon: <MousePointerClick size={16} />,
      text: 'Double-click canvas to add state',
      color: '#3B82F6'
    },
    {
      icon: <Edit3 size={16} />,
      text: 'Double-click state name to edit',
      color: '#8B5CF6'
    },
    {
      icon: <Link2 size={16} />,
      text: 'Drag from handles to connect states',
      color: '#10B981'
    },
    {
      icon: <Move size={16} />,
      text: 'Drag states to rearrange',
      color: '#F59E0B'
    },
    {
      icon: <Layout size={16} />,
      text: 'Use layout button to auto-arrange',
      color: '#EC4899'
    },
    {
      icon: <Keyboard size={16} />,
      text: 'Ctrl+Z/Y for undo/redo',
      color: '#6366F1'
    },
    {
      icon: <Keyboard size={16} />,
      text: 'Backspace to delete selected',
      color: '#EF4444'
    }
  ];

  return (
    <Card
      size="small"
      style={{
        position: 'absolute',
        top: '20px',
        right: '20px',
        zIndex: 10,
        width: '280px',
        background: 'rgba(15, 23, 42, 0.95)',
        backdropFilter: 'blur(12px)',
        border: '1px solid rgba(148, 163, 184, 0.2)',
        borderRadius: '12px',
        boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)'
      }}
      bodyStyle={{ padding: '12px' }}
    >
      <Space direction="vertical" size="small" style={{ width: '100%' }}>
        <div style={{ 
          display: 'flex', 
          alignItems: 'center', 
          gap: '8px',
          marginBottom: '8px'
        }}>
          <HelpCircle size={18} color="#60A5FA" />
          <Title level={5} style={{ margin: 0, color: '#F1F5F9' }}>
            Quick Help
          </Title>
        </div>
        
        {helpItems.map((item, index) => (
          <div
            key={index}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '10px',
              padding: '6px 8px',
              borderRadius: '6px',
              background: 'rgba(51, 65, 85, 0.5)',
              transition: 'all 0.2s ease'
            }}
            className="hover:bg-slate-700"
          >
            <div style={{ color: item.color, display: 'flex', alignItems: 'center' }}>
              {item.icon}
            </div>
            <Text style={{ 
              fontSize: '12px', 
              color: '#CBD5E1',
              flex: 1
            }}>
              {item.text}
            </Text>
          </div>
        ))}
      </Space>
    </Card>
  );
};

export default QuickHelpPanel;

