import React, { useState, useRef } from 'react';
import { Form, Input, message } from 'antd';
import { Send, Paperclip } from 'lucide-react';
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
      className={`relative ${isDragging ? 'bg-teal-500 bg-opacity-10 border-2 border-dashed border-teal-500' : ''}`}
    >
      {isDragging && (
        <div className="absolute inset-0 flex items-center justify-center bg-slate-800 bg-opacity-90 backdrop-blur-sm rounded-xl z-10">
          <div className="text-center">
            <Paperclip size={32} className="text-teal-400 mx-auto mb-2" />
            <span className="text-teal-400 font-medium">Drop file here</span>
          </div>
        </div>
      )}

      <Form form={form} onFinish={onClickTextAnswer}>
        <div className="space-y-3">
          {currentFile && (
            <FileSubmitPreview
              file={currentFile}
              onDelete={() => setCurrentFile(null)}
            />
          )}

          <div className="flex items-end space-x-4">
            <div className="flex-1 relative">
              <textarea
                value={answer}
                onChange={(e) => setAnswer(e.target.value)}
                placeholder={`${placeholderText} (Ctrl+K to focus)`}
                onKeyDown={handleKeyDown}
                disabled={disabled}
                rows={1}
                className="w-full bg-slate-800/80 backdrop-blur-sm border border-slate-600 rounded-xl px-4 py-4 pr-16 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 resize-none min-h-[56px] max-h-40 overflow-y-auto scrollbar-thin"
                style={{
                  height: 'auto',
                  minHeight: '56px'
                }}
                onInput={(e) => {
                  const target = e.target as HTMLTextAreaElement;
                  target.style.height = 'auto';
                  target.style.height = Math.min(target.scrollHeight, 160) + 'px';
                }}
              />

              {/* Keyboard Shortcut Hint */}
              <div className="absolute right-16 top-1/2 transform -translate-y-1/2 text-xs text-slate-500 font-mono pointer-events-none">
                ⌘K
              </div>

              {/* Attach Button */}
              <button
                type="button"
                onClick={onClickAttachFile}
                disabled={disabled}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>

              <input
                ref={fileInputRef}
                type="file"
                disabled={disabled}
                style={{ display: 'none' }}
                onChange={handleFileSelect}
                accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
              />
            </div>

            <button
              type="submit"
              disabled={disabled || (!answer.trim() && !currentFile)}
              className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 text-white p-4 rounded-xl transition-all duration-200 shadow-lg hover:shadow-xl transform hover:scale-105 disabled:transform-none disabled:cursor-not-allowed"
              title="Send message"
            >
              <Send size={20} />
            </button>
          </div>

        </div>
      </Form>
    </div>
  );
};

export default ChatBotSubmitForm;
