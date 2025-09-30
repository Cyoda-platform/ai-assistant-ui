import React, { useState, useRef } from 'react';
import { Form, Input, message } from 'antd';
import { Send, Paperclip } from 'lucide-react';
import FileSubmitPreview from '@/components/FileSubmitPreview/FileSubmitPreview';
import HelperUpload from '@/helpers/HelperUpload';

const { TextArea } = Input;

interface ChatBotSubmitFormProps {
  layout?: 'default' | 'canvas';
  disabled: boolean;
  onAnswer: (data: { answer: string; files?: File[] }) => void;
}

const ChatBotSubmitForm: React.FC<ChatBotSubmitFormProps> = ({
  layout = 'default',
  disabled,
  onAnswer
}) => {
  const [form] = Form.useForm();
  const [answer, setAnswer] = useState('');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(60);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  let dragCounter = 0;

  const onClickTextAnswer = async () => {
    if (!answer.trim() && currentFiles.length === 0) return;

    onAnswer({
      answer: answer,
      files: currentFiles.length > 0 ? currentFiles : undefined
    });

    setAnswer('');
    setCurrentFiles([]);
    form.resetFields();
  };

  const onClickAttachFile = () => {
    fileInputRef.current?.click();
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const validFiles: File[] = [];
    const invalidFiles: string[] = [];

    Array.from(files).forEach(file => {
      const { isValid, message: errorMessage } = HelperUpload.validateFile(file);
      if (isValid) {
        validFiles.push(file);
      } else {
        invalidFiles.push(`${file.name}: ${errorMessage}`);
      }
    });

    if (invalidFiles.length > 0) {
      message.warning(`Some files were not added:\n${invalidFiles.join('\n')}`);
    }

    if (validFiles.length > 0) {
      setCurrentFiles(prev => [...prev, ...validFiles]);
    }

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

    const files = event.dataTransfer.files;
    if (files && files.length > 0) {
      const validFiles: File[] = [];
      const invalidFiles: string[] = [];

      Array.from(files).forEach(file => {
        const { isValid, message: errorMessage } = HelperUpload.validateFile(file);
        if (isValid) {
          validFiles.push(file);
        } else {
          invalidFiles.push(`${file.name}: ${errorMessage}`);
        }
      });

      if (invalidFiles.length > 0) {
        message.warning(`Some files were not added:\n${invalidFiles.join('\n')}`);
      }

      if (validFiles.length > 0) {
        setCurrentFiles(prev => [...prev, ...validFiles]);
      }
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
          {currentFiles.length > 0 && (
            <div className="flex flex-wrap gap-2 p-3 bg-slate-800/50 rounded-lg border border-slate-600">
              {currentFiles.map((file, index) => (
                <FileSubmitPreview
                  key={`${file.name}-${index}`}
                  file={file}
                  onDelete={() => setCurrentFiles(prev => prev.filter((_, i) => i !== index))}
                />
              ))}
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={(e) => {
                setAnswer(e.target.value);
                // Auto-resize on change without causing jump
                const target = e.target as HTMLTextAreaElement;
                // Temporarily set height to auto to get the correct scrollHeight
                const currentHeight = target.style.height;
                target.style.height = 'auto';
                const newHeight = Math.min(Math.max(target.scrollHeight, 60), 150);
                target.style.height = currentHeight; // Restore immediately
                setTextareaHeight(newHeight);
              }}
              placeholder={placeholderText}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={1}
              className="w-full bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-2xl px-6 pr-24 py-4 pb-12 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-colors duration-200 resize-none text-lg"
              style={{
                height: `${textareaHeight}px`,
                minHeight: '60px',
                maxHeight: '150px',
                overflowY: textareaHeight >= 150 ? 'auto' : 'hidden'
              }}
            />

            {/* Bottom Right Controls - Lovable Style */}
            <div className="absolute right-5 bottom-6 flex items-center gap-2">
              {/* Attach File Button */}
              <button
                type="button"
                onClick={onClickAttachFile}
                disabled={disabled}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>

              {/* Send Button */}
              <button
                type="submit"
                disabled={disabled || (!answer.trim() && currentFiles.length === 0)}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white p-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-teal-500/25 disabled:cursor-not-allowed"
                title="Send Message (Enter)"
              >
                <Send size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
              multiple
              disabled={disabled}
              style={{ display: 'none' }}
              onChange={handleFileSelect}
              accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
            />
          </div>

        </div>
      </Form>
    </div>
  );
};

export default ChatBotSubmitForm;
