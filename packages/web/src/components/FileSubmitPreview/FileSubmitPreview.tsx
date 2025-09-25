import React from 'react';
import { Card, Button } from 'antd';
import { CloseOutlined } from '@ant-design/icons';

interface FileSubmitPreviewProps {
  file: File;
  className?: string;
  onDelete: () => void;
}

const FileSubmitPreview: React.FC<FileSubmitPreviewProps> = ({ 
  file, 
  className = '',
  onDelete 
}) => {
  return (
    <Card 
      size="small" 
      className={`file-submit-preview ${className}`}
      extra={
        <Button 
          type="text" 
          size="small" 
          icon={<CloseOutlined />} 
          onClick={onDelete}
        />
      }
    >
      <div>
        <strong>{file.name}</strong>
      </div>
      <div>
        {(file.size / 1024).toFixed(2)} KB
      </div>
    </Card>
  );
};

export default FileSubmitPreview;
