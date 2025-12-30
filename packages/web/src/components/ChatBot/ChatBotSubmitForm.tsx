import React, { useState, useRef, useEffect, useCallback } from 'react';
import { Form, Input, message } from 'antd';
import { SendHorizontal, Paperclip, X, Github } from 'lucide-react';
import FileSubmitPreview from '@/components/FileSubmitPreview/FileSubmitPreview';
import HelperUpload from '@/helpers/HelperUpload';

const { TextArea } = Input;

interface ChatBotSubmitFormProps {
  layout?: 'default' | 'canvas';
  disabled: boolean;
  onAnswer: (data: { answer: string; files?: File[]; mode?: 'workflow' | 'qa' }) => void;
  showCanvasButton?: boolean; // Show Canvas button when canvas is open
  activeCanvasTab?: 'apps' | 'data' | 'workflow' | 'requirement' | 'code'; // Active tab in canvas
  isAIThinking?: boolean; // Whether AI is currently thinking/processing
  onStopRequest?: () => void; // Callback to stop current request
  onSetTextareaContent?: (callback: (content: string) => void) => void; // Expose method to set textarea content
  hasRepository?: boolean; // Whether repository is configured
  onShowRepositoryConfigModal?: () => void; // Callback to show repository configuration modal
}

const ChatBotSubmitForm: React.FC<ChatBotSubmitFormProps> = ({
  layout = 'default',
  disabled,
  onAnswer,
  showCanvasButton = false,
  activeCanvasTab,
  isAIThinking = false,
  onStopRequest,
  onSetTextareaContent,
  hasRepository = false,
  onShowRepositoryConfigModal
}) => {
  const [form] = Form.useForm();
  const [answer, setAnswer] = useState('');
  const [currentFiles, setCurrentFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [textareaHeight, setTextareaHeight] = useState(60);
  const [isCollapsed, setIsCollapsed] = useState(false); // Track if canvas content is collapsed
  const [canvasContent, setCanvasContent] = useState(''); // Store the canvas content separately
  const [userPrefix, setUserPrefix] = useState(''); // Text before canvas content
  const [userSuffix, setUserSuffix] = useState(''); // Text after canvas content
  const fileInputRef = useRef<HTMLInputElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  let dragCounter = 0;

  // Helper to detect content type and format it
  const formatContent = (content: string): { formatted: string; type: 'json' | 'markdown' | 'text' } => {
    // Try to parse as JSON
    try {
      const parsed = JSON.parse(content);
      return {
        formatted: `\`\`\`json\n${JSON.stringify(parsed, null, 2)}\n\`\`\``,
        type: 'json'
      };
    } catch {
      // Check if it looks like markdown (has markdown headers, lists, etc.)
      if (content.match(/^#{1,6}\s/m) || content.match(/^[-*+]\s/m) || content.match(/^\d+\.\s/m)) {
        return {
          formatted: `\`\`\`markdown\n${content}\n\`\`\``,
          type: 'markdown'
        };
      }
      // Plain text
      return {
        formatted: content,
        type: 'text'
      };
    }
  };

  // Expose method to set textarea content from parent
  // Use useEffect with empty dependency array to register callback only once
  // The callback accepts content and optional options: { collapse?: boolean }
  // - collapse: true (default for canvas) - show [...] placeholder, store full content
  // - collapse: false (for options) - show full content directly
  useEffect(() => {
    if (onSetTextareaContent) {
      onSetTextareaContent((content: string, options?: { collapse?: boolean }) => {
        const shouldCollapse = options?.collapse ?? true; // Default to collapse for canvas

        if (shouldCollapse) {
          // Canvas mode: collapse content with [...] placeholder
          setCanvasContent(content);
          setAnswer('[...]');
          setIsCollapsed(true);
          setUserPrefix('');
          setUserSuffix('');
          setTextareaHeight(60); // Keep default height for collapsed view
        } else {
          // Options mode: show full content directly
          setAnswer(content);
          setCanvasContent('');
          setIsCollapsed(false);
          setUserPrefix('');
          setUserSuffix('');
        }

        // Focus and adjust
        setTimeout(() => {
          if (!shouldCollapse) {
            adjustTextareaHeight();
          }
          if (textareaRef.current) {
            textareaRef.current.focus();
            textareaRef.current.setSelectionRange(textareaRef.current.value.length, textareaRef.current.value.length);
          }
        }, 0);
      });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty dependency array - only register once on mount

  const onClickTextAnswer = async (mode: 'workflow' | 'qa' = 'workflow') => {
    // Validation: require message text
    if (!answer.trim()) {
      if (currentFiles.length > 0) {
        // Files attached but no message
        message.error('Please add a message along with your file(s)');
      }
      return;
    }

    // Build final answer with formatted canvas content
    let finalAnswer = answer;
    if (canvasContent) {
      const { formatted } = formatContent(canvasContent);

      if (isCollapsed) {
        // If collapsed, replace [...] with formatted content
        finalAnswer = answer.replace('[...]', formatted);
      } else {
        // If expanded, the answer already contains the full content
        // Just use it as-is (user may have edited it)
        finalAnswer = answer;
      }
    }

    onAnswer({
      answer: finalAnswer,
      files: currentFiles.length > 0 ? currentFiles : undefined,
      mode: mode
    });

    setAnswer('');
    setCanvasContent('');
    setUserPrefix('');
    setUserSuffix('');
    setCurrentFiles([]);
    setTextareaHeight(60); // Reset to default height
    setIsCollapsed(false); // Reset collapsed state
    form.resetFields();
  };

  const handleFileAttach = () => {
    // Check if repository is configured
    if (!hasRepository) {
      onShowRepositoryConfigModal?.();
      return;
    }
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

  // Enhanced auto-resize textarea based on content
  const adjustTextareaHeight = useCallback(() => {
    if (textareaRef.current) {
      const textarea = textareaRef.current;

      // Store current scroll position to maintain it
      const scrollTop = textarea.scrollTop;

      // Temporarily set height to auto to get accurate scrollHeight
      textarea.style.height = 'auto';

      // Calculate optimal height based on content
      const scrollHeight = textarea.scrollHeight;
      const lineHeight = 24; // Approximate line height in pixels
      const padding = 32; // Top and bottom padding combined
      const minLines = 2; // Minimum 2 lines
      const maxLines = 12; // Maximum 12 lines for better UX

      const minHeight = (minLines * lineHeight) + padding;
      const maxHeight = (maxLines * lineHeight) + padding;

      // Calculate new height with smooth increments
      let newHeight = Math.max(minHeight, Math.min(maxHeight, scrollHeight));

      // Round to nearest line height for smoother appearance
      const extraHeight = newHeight - padding;
      const roundedLines = Math.round(extraHeight / lineHeight);
      newHeight = (roundedLines * lineHeight) + padding;

      // Apply the new height with smooth transition
      setTextareaHeight(newHeight);
      textarea.style.height = `${newHeight}px`;

      // Restore scroll position
      textarea.scrollTop = scrollTop;
    }
  }, []);

  // Debounced resize function for better performance
  const debouncedResize = useCallback(() => {
    const timeoutId = setTimeout(() => {
      adjustTextareaHeight();
    }, 10); // Small delay for better performance

    return () => clearTimeout(timeoutId);
  }, [adjustTextareaHeight]);

  // Auto-resize when content changes
  useEffect(() => {
    adjustTextareaHeight();
  }, [answer, adjustTextareaHeight]);

  // Enhanced paste handler with better timing
  const handlePaste = (event: React.ClipboardEvent) => {
    // Allow the paste to happen first, then adjust height
    requestAnimationFrame(() => {
      adjustTextareaHeight();
    });
  };

  // Enhanced keyboard handling with better UX
  const handleKeyDown = (event: React.KeyboardEvent) => {
    if (event.key === 'Enter') {
      if (event.shiftKey) {
        // Shift+Enter: Add new line and resize
        // Let the default behavior happen, then resize
        setTimeout(() => {
          adjustTextareaHeight();
        }, 0);
      } else {
        // Enter: Submit message (only if not disabled)
        event.preventDefault();
        if (!disabled && (answer.trim() || currentFiles.length > 0)) {
          onClickTextAnswer('workflow');
        }
      }
    } else if (event.key === 'Escape') {
      // Escape: Clear input or collapse canvas content
      if (canvasContent && !isCollapsed) {
        // Collapsing - extract user text around canvas content and replace with [...]
        const canvasIndex = answer.indexOf(canvasContent);
        if (canvasIndex !== -1) {
          const prefix = answer.substring(0, canvasIndex);
          const suffix = answer.substring(canvasIndex + canvasContent.length);
          setUserPrefix(prefix);
          setUserSuffix(suffix);
          setAnswer(prefix + '[...]' + suffix);
        } else {
          // Fallback if canvas content not found
          setAnswer('[...]');
          setUserPrefix('');
          setUserSuffix('');
        }
        setIsCollapsed(true);
        setTextareaHeight(60);
      } else if (answer.trim()) {
        setAnswer('');
        setTextareaHeight(60);
      }
    }
  };

  // Enhanced input change handler
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    setAnswer(value);

    // If input is completely cleared, also clear canvas content
    if (!value.trim()) {
      setCanvasContent('');
      setIsCollapsed(false);
      setUserPrefix('');
      setUserSuffix('');
    }

    // Trigger resize with slight delay for better performance
    debouncedResize();
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

          {/* Expand/Collapse button - positioned above textarea */}
          {canvasContent && (
            <div className="mb-2">
              <button
                type="button"
                onClick={() => {
                  if (isCollapsed) {
                    // Expanding - extract user text around [...] and replace with canvas content
                    const collapsedMarker = '[...]';
                    const markerIndex = answer.indexOf(collapsedMarker);
                    if (markerIndex !== -1) {
                      const prefix = answer.substring(0, markerIndex);
                      const suffix = answer.substring(markerIndex + collapsedMarker.length);
                      setUserPrefix(prefix);
                      setUserSuffix(suffix);
                      setAnswer(prefix + canvasContent + suffix);
                    } else {
                      // Fallback if marker not found
                      setAnswer(canvasContent);
                    }
                    setIsCollapsed(false);
                    // Auto-adjust height after expanding
                    requestAnimationFrame(() => {
                      adjustTextareaHeight();
                    });
                  } else {
                    // Collapsing - extract user text around canvas content and replace with [...]
                    const canvasIndex = answer.indexOf(canvasContent);
                    if (canvasIndex !== -1) {
                      const prefix = answer.substring(0, canvasIndex);
                      const suffix = answer.substring(canvasIndex + canvasContent.length);
                      setUserPrefix(prefix);
                      setUserSuffix(suffix);
                      setAnswer(prefix + '[...]' + suffix);
                    } else {
                      // Fallback if canvas content not found (user may have edited it)
                      // In this case, just collapse without preserving user text
                      setAnswer('[...]');
                      setUserPrefix('');
                      setUserSuffix('');
                    }
                    setIsCollapsed(true);
                    setTextareaHeight(48); // Use new minimum height
                  }
                }}
                className="px-3 py-1.5 bg-slate-700/50 hover:bg-slate-600/50 border border-slate-600 text-slate-300 hover:text-white rounded-lg text-xs font-medium transition-all duration-200 flex items-center space-x-2"
                title={isCollapsed ? "Click to expand canvas content" : "Click to collapse canvas content"}
              >
                <svg
                  className="w-3 h-3 text-slate-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  {isCollapsed ? (
                    <path fillRule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clipRule="evenodd" />
                  ) : (
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  )}
                </svg>
                <span>Canvas Content</span>
                <span className="text-slate-500">•</span>
                <span className="text-slate-400">{isCollapsed ? 'Collapsed' : 'Expanded'}</span>
              </button>
            </div>
          )}

          <div className="relative">
            <textarea
              ref={textareaRef}
              value={answer}
              onChange={handleInputChange}
              onPaste={handlePaste}
              placeholder={placeholderText}
              onKeyDown={handleKeyDown}
              rows={1}
              className="w-full bg-slate-800/80 backdrop-blur-sm border-2 border-slate-600 rounded-2xl px-6 pr-24 py-4 pb-12 text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 transition-all duration-300 resize-none text-lg"
              style={{
                height: `${textareaHeight}px`,
                minHeight: '48px',
                maxHeight: '320px',
                overflowY: textareaHeight >= 320 ? 'auto' : 'hidden',
                lineHeight: '1.5',
                scrollbarWidth: 'thin',
                scrollbarColor: 'rgb(148 163 184) transparent'
              }}
            />

            {/* Bottom Right Controls - Lovable Style */}
            <div className="absolute right-5 bottom-6 flex items-center" style={{ gap: '0.2rem' }}>
              {/* Attach File Button */}
              <button
                type="button"
                onClick={handleFileAttach}
                disabled={disabled}
                className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700/50 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ transform: 'translateY(25%)' }}
                title="Attach file"
              >
                <Paperclip size={18} />
              </button>

              {/* Conditional Button - Send or Stop based on AI thinking state */}
              {isAIThinking && onStopRequest ? (
                /* Stop Button when AI is thinking - Square with circular preloader */
                <button
                  type="button"
                  onClick={onStopRequest}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-slate-600 to-slate-700 hover:from-slate-700 hover:to-slate-800 shadow-lg hover:shadow-xl hover:shadow-slate-500/25 transition-all duration-300 flex items-center justify-center group active:scale-95 border border-slate-500/30"
                  style={{
                    transform: 'translateY(20%)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: '0 8px 32px rgba(100, 116, 139, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                  title="Stop AI request"
                >
                  {/* Circular preloader */}
                  <div className="w-6 h-6 border-2 border-emerald-400/30 border-t-emerald-400 rounded-full animate-spin"></div>
                </button>
              ) : (
                /* Send Button when not thinking - Beautiful square design */
                <button
                  type="button"
                  onClick={() => onClickTextAnswer('workflow')}
                  disabled={disabled || (!answer.trim() && currentFiles.length === 0)}
                  className="w-12 h-12 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 disabled:from-slate-600 disabled:to-slate-700 disabled:opacity-50 shadow-lg hover:shadow-xl hover:shadow-teal-500/25 disabled:shadow-none transition-all duration-300 flex items-center justify-center group active:scale-95 disabled:cursor-not-allowed border border-teal-400/30 disabled:border-slate-500/30"
                  style={{
                    transform: 'translateY(5%)',
                    backdropFilter: 'blur(10px)',
                    boxShadow: disabled
                      ? '0 4px 16px rgba(0, 0, 0, 0.1)'
                      : '0 8px 32px rgba(20, 184, 166, 0.3), inset 0 1px 0 rgba(255, 255, 255, 0.1)'
                  }}
                  title="Send message (Enter)"
                >
                  <SendHorizontal
                    size={20}
                    className="text-white group-hover:scale-110 group-disabled:scale-100 transition-transform duration-200"
                    strokeWidth={2.5}
                  />
                </button>
              )}
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
