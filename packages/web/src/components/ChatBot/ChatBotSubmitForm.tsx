import React, { useState, useRef } from 'react';
import { Form, Input, Button, message } from 'antd';
import SendIcon from '@/assets/images/icons/send.svg';
import AttachIcon from '@/assets/images/icons/attach.svg';
import FileSubmitPreview from '@/components/FileSubmitPreview/FileSubmitPreview';
import HelperUpload from '@/helpers/HelperUpload';

const { TextArea } = Input;

interface ChatBotSubmitFormProps {
  layout?: 'default' | 'canvas';
  disabled: boolean;
  onAnswer: (data: { answer: string; file?: File }) => void;
}

const ChatBotSubmitForm: React.FC<ChatBotSubmitFormProps> = ({
  layout = 'default',
  disabled,
  onAnswer
}) => {
  const [form] = Form.useForm();
  const [answer, setAnswer] = useState('');
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  let dragCounter = 0;

  const onClickTextAnswer = async () => {
    if (!answer.trim() && !currentFile) return;
    
    onAnswer({
      answer: answer,
      file: currentFile || undefined
    });
    
    setAnswer('');
    setCurrentFile(null);
    form.resetFields();
  };

  const onClickAttachFile = () => {
    fileInputRef.current?.click();
  };

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

  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter' && !event.shiftKey) {
      event.preventDefault();
      onClickTextAnswer();
    }
  };

  const placeholderText = layout === 'canvas' ? 'Type here' : 'Ask Cyoda AI Assistant...';

  return (
    <div
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className={`chat-bot-submit-form ${isDragging ? 'chat-bot-submit-form__drag-started' : ''} ${
        layout === 'canvas' ? 'chat-bot-submit-form__layout_canvas' : ''
      }`}
    >
      <div className="chat-bot-submit-form__drag-and-drop">
        <span>Drag & Drop</span>
      </div>
      
      <Form form={form} layout="vertical">
        <div className="chat-bot-submit-form__wrapper">
          <div className="chat-bot-submit-form__input-box">
            <div className={`chat-bot-submit-form__input ${disabled ? 'disabled' : ''}`}>
              {currentFile && (
                <FileSubmitPreview 
                  className="chat-bot-submit-form__file-submit-preview"
                  file={currentFile}
                  onDelete={() => setCurrentFile(null)}
                />
              )}
              
              <div className="chat-bot-submit-form__input-inner">
                <TextArea
                  value={answer}
                  onChange={(e) => setAnswer(e.target.value)}
                  placeholder={placeholderText}
                  autoSize={{ minRows: 1, maxRows: 10 }}
                  onKeyDown={handleKeyDown}
                  disabled={disabled}
                  style={{ resize: 'none' }}
                />
                
                <div className="chat-bot-submit-form__actions">
                  <Button
                    onClick={onClickAttachFile}
                    className="btn-default btn-icon transparent"
                    disabled={disabled}
                    icon={<AttachIcon className="chat-bot-submit-form__attach-icon" />}
                  />
                  
                  <input
                    ref={fileInputRef}
                    type="file"
                    disabled={disabled}
                    style={{ display: 'none' }}
                    onChange={handleFileSelect}
                    accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
                  />
                  
                  <button
                    className="btn btn-primary btn-icon"
                    disabled={disabled || (!answer.trim() && !currentFile)}
                    onClick={onClickTextAnswer}
                    type="button"
                  >
                    <SendIcon />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Form>
    </div>
  );
};

export default ChatBotSubmitForm;
