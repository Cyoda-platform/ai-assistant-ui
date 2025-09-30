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

          <div className="relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder={placeholderText}
              onKeyDown={handleKeyDown}
              disabled={disabled}
              rows={1}
              className="w-full bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-2xl px-6 pr-24 py-4 pb-12 text-white placeholder-slate-400 focus:outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all duration-200 resize-none overflow-hidden text-base"
              style={{
                minHeight: '60px',
                maxHeight: '150px'
              }}
              onInput={(e) => {
                const target = e.target as HTMLTextAreaElement;
                target.style.height = 'auto';
                target.style.height = Math.min(target.scrollHeight, 150) + 'px';
              }}
            />

            {/* Bottom Right Controls - Lovable Style */}
            <div className="absolute right-5 bottom-8 flex items-center space-x-2">
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
                disabled={disabled || (!answer.trim() && !currentFile)}
                className="bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:opacity-50 text-white p-2 rounded-lg transition-all duration-200 shadow-lg hover:shadow-teal-500/25 disabled:cursor-not-allowed"
                title="Send Message (Enter)"
              >
                <Send size={18} />
              </button>
            </div>

            <input
              ref={fileInputRef}
              type="file"
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
