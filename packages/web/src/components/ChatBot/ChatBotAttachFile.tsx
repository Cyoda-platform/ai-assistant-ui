import React, { useState, useRef, forwardRef, useImperativeHandle } from 'react';
import { Modal, Button, message } from 'antd';
import { FileImageOutlined } from '@ant-design/icons';
import FileSubmitPreview from '@/components/FileSubmitPreview/FileSubmitPreview';
import HelperUpload from '@/helpers/HelperUpload';

interface ChatBotAttachFileProps {
  onFile: (file: File | null) => void;
}

export interface ChatBotAttachFileRef {
  openDialog: (file?: File | null) => void;
}

const ChatBotAttachFile = forwardRef<ChatBotAttachFileRef, ChatBotAttachFileProps>(
  ({ onFile }, ref) => {
    const [dialogVisible, setDialogVisible] = useState(false);
    const [currentFile, setCurrentFile] = useState<File | null>(null);
    const [mode, setMode] = useState<'new' | 'delete' | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    let dragCounter = 0;

    useImperativeHandle(ref, () => ({
      openDialog: (file?: File | null) => {
        setDialogVisible(true);
        setCurrentFile(file || null);
        setMode(file ? 'delete' : 'new');
      }
    }));

    const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const { isValid, message: errorMessage } = HelperUpload.validateFile(file);
      if (!isValid) {
        message.warning(errorMessage);
        return;
      }

      setCurrentFile(file);
      event.target.value = '';
    };

    const onClickAttachFile = () => {
      if (currentFile) return;
      fileInputRef.current?.click();
    };

    const onDeleteFile = () => {
      setCurrentFile(null);
    };

    const reset = () => {
      setCurrentFile(null);
    };

    const onSubmit = () => {
      setDialogVisible(false);
      onFile(currentFile);
      reset();
    };

    const handleDragEnter = (event: React.DragEvent) => {
      event.preventDefault();
      dragCounter++;
      setIsDragging(true);
    };

    const handleDragLeave = (event: React.DragEvent) => {
      event.preventDefault();
      dragCounter--;
      if (dragCounter === 0) setIsDragging(false);
    };

    const handleDrop = (event: React.DragEvent) => {
      event.preventDefault();
      dragCounter = 0;
      setIsDragging(false);

      const file = event.dataTransfer.files[0];
      if (file) {
        const { isValid, message: errorMessage } = HelperUpload.validateFile(file);
        if (!isValid) {
          message.warning(errorMessage);
          return;
        }
        setCurrentFile(file);
      }
    };

    const computedTitle = mode === 'new' ? 'Attach file or image' : 'Check uploaded file';

    return (
      <>
        <input
          ref={fileInputRef}
          type="file"
          style={{ display: 'none' }}
          onChange={handleFileSelect}
          accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
        />

        <Modal
          title={computedTitle}
          open={dialogVisible}
          onCancel={() => setDialogVisible(false)}
          width={400}
          maskClosable={false}
          footer={[
            <Button key="cancel" onClick={() => setDialogVisible(false)}>
              Cancel
            </Button>,
            <Button key="submit" type="primary" onClick={onSubmit}>
              Submit
            </Button>
          ]}
        >
          <div
            className={`chat-bot-attach-file__attachment ${isDragging ? 'chat-bot-attach-file__drag-started' : ''} ${!currentFile ? 'empty' : ''}`}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onDragOver={(e) => e.preventDefault()}
            onClick={onClickAttachFile}
            style={{
              border: '2px dashed var(--input-border)',
              borderRadius: '8px',
              padding: '20px',
              textAlign: 'center',
              cursor: currentFile ? 'default' : 'pointer',
              minHeight: '200px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              backgroundColor: isDragging ? 'var(--bg-hover)' : 'transparent',
              transition: 'background-color 0.3s ease'
            }}
          >
            {currentFile ? (
              <FileSubmitPreview
                file={currentFile}
                onDelete={onDeleteFile}
              />
            ) : (
              <div className="chat-bot-attach-file__attachment-empty">
                <div style={{ marginBottom: '16px', fontSize: '16px', color: 'var(--text-secondary)' }}>
                  Drag and drop a file here or click to upload
                </div>
                <FileImageOutlined style={{ fontSize: '48px', color: 'var(--text-secondary)' }} />
              </div>
            )}
          </div>
        </Modal>
      </>
    );
  }
);

ChatBotAttachFile.displayName = 'ChatBotAttachFile';

export default ChatBotAttachFile;
