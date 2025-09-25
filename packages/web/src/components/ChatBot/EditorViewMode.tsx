import React from 'react';
import { Radio, Button, Modal } from 'antd';
import { DeleteOutlined } from '@ant-design/icons';
import { useBreakpoint } from 'antd';

interface EditorViewModeProps {
  value: string;
  onChange: (value: string) => void;
  onClear: () => void;
}

const EditorViewMode: React.FC<EditorViewModeProps> = ({ value, onChange, onClear }) => {
  const screens = useBreakpoint();
  
  // Show editor preview only on medium screens and larger
  const isShowEditorPreview = screens.md;

  // Auto-switch to editor mode on smaller screens
  React.useEffect(() => {
    if (!isShowEditorPreview && value !== 'editor') {
      onChange('editor');
    }
  }, [isShowEditorPreview, value, onChange]);

  const handleClear = () => {
    Modal.confirm({
      title: 'Confirm!',
      content: 'Are you sure you want to clear the data?',
      onOk: () => {
        onClear();
      },
    });
  };

  const options = [
    { label: 'Editor', value: 'editor' },
    ...(isShowEditorPreview ? [
      { label: 'Preview', value: 'preview' },
      { label: 'Editor + Preview', value: 'editorPreview' }
    ] : [])
  ];

  return (
    <div className="editor-view-mode" style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center',
      padding: '8px 0',
      borderBottom: '1px solid var(--input-border)',
      marginBottom: '8px'
    }}>
      <Radio.Group
        value={value}
        onChange={(e) => onChange(e.target.value)}
        options={options}
        optionType="button"
        buttonStyle="solid"
        size="small"
      />
      
      <Button
        type="text"
        size="small"
        icon={<DeleteOutlined />}
        onClick={handleClear}
        style={{ color: 'var(--text-secondary)' }}
        title="Clear data"
      />
    </div>
  );
};

export default EditorViewMode;
