import React from 'react';
import { Paperclip } from 'lucide-react';

interface FilePreviewProps {
  file: File;
}

const FilePreview: React.FC<FilePreviewProps> = ({ file }) => {
  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-slate-700/50 border border-slate-600 rounded-lg text-slate-300 text-xs">
      <Paperclip size={12} className="text-teal-400 flex-shrink-0" />
      <span className="truncate max-w-[150px]" title={file.name}>{file.name}</span>
      <span className="text-slate-500">({formatFileSize(file.size)})</span>
    </div>
  );
};

export default FilePreview;
