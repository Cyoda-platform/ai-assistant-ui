import React from 'react';
import { Card } from 'antd';

interface FilePreviewProps {
  file: File;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  return (
    <Card size="small" className="file-preview">
      <div>
        <strong>File:</strong> {file.name}
      </div>
      <div>
        <strong>Size:</strong> {(file.size / 1024).toFixed(2)} KB
      </div>
      <div>
        <strong>Type:</strong> {file.type}
      </div>
    </Card>
  );
};

export default FilePreview;
