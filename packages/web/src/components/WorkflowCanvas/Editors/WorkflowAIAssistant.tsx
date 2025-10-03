import React, { useState, useEffect, useRef, useCallback } from 'react';
import { Sparkles, X, Send, Loader2, Copy, Check, Wand2, Paperclip, FileText } from 'lucide-react';
import { useAssistantStore } from '@/stores/assistant';
import HelperUpload from '@/helpers/HelperUpload';
import { message as antdMessage } from 'antd';

interface WorkflowAIAssistantProps {
  isOpen: boolean;
  onClose: () => void;
  currentWorkflow: string;
  selectedText?: string;
  onApplySuggestion: (suggestion: string) => void;
  technicalId?: string;
}

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

export const WorkflowAIAssistant: React.FC<WorkflowAIAssistantProps> = ({
  isOpen,
  onClose,
  currentWorkflow,
  selectedText,
  onApplySuggestion,
  technicalId
}) => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [attachedFiles, setAttachedFiles] = useState<File[]>([]);
  const [expectWorkflowResponse, setExpectWorkflowResponse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const assistantStore = useAssistantStore();

  // Auto-scroll to bottom when messages change
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus();
      // Add initial context message if there's selected text
      if (selectedText && messages.length === 0) {
        setMessages([{
          role: 'assistant',
          content: `I can help you with the selected workflow JSON. What would you like to do?`,
          timestamp: new Date()
        }]);
      }
    }
  }, [isOpen, selectedText]);

  // Handle Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  const sendMessage = useCallback(async () => {
    if (!input.trim() || isLoading) return;

    const userMessage: Message = {
      role: 'user',
      content: input.trim(),
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Store files to send and clear the state
    const filesToSend = [...attachedFiles];
    setAttachedFiles([]);

    try {
      // Use the question directly without adding context
      const question = input.trim();
      let response;

      // Choose endpoint based on expectWorkflowResponse flag
      if (expectWorkflowResponse) {
        // Use workflow-questions endpoint for workflow generation/modification
        const formData = new FormData();
        formData.append('question', question);
        formData.append('workflow', currentWorkflow || '');

        // Append all files
        filesToSend.forEach(file => {
          formData.append('files', file);
        });

        response = await assistantStore.postWorkflowQuestions(formData);
      } else {
        // Use text/questions endpoints for chat-style responses
        if (filesToSend.length > 0) {
          // Use questions endpoint with files
          const formData = new FormData();
          formData.append('question', question);

          filesToSend.forEach(file => {
            formData.append('files', file);
          });

          const chatId = technicalId || 'workflow-assistant';
          response = await assistantStore.postQuestions(chatId, formData);
        } else {
          // Use text-questions endpoint without files
          const chatId = technicalId || 'workflow-assistant';
          response = await assistantStore.postTextQuestions(chatId, {
            question: question
          });
        }
      }

      const assistantMessage: Message = {
        role: 'assistant',
        content: response.data.message || 'I apologize, but I could not generate a response.',
        timestamp: new Date()
      };

      setMessages(prev => [...prev, assistantMessage]);

      // If in workflow mode, automatically apply the response to the editor
      if (expectWorkflowResponse && response.data.message) {
        try {
          // Extract JSON from the response
          const jsonContent = extractJsonFromMessage(response.data.message);
          if (jsonContent) {
            onApplySuggestion(jsonContent);
            antdMessage.success('Workflow updated in editor');
          }
        } catch (err) {
          console.error('Failed to auto-apply workflow:', err);
        }
      }
    } catch (error: any) {
      console.error('Error sending message to AI:', error);

      // Extract error details
      let errorContent = 'Sorry, I encountered an error. Please try again.';

      if (error?.response) {
        const status = error.response.status;
        const errorData = error.response.data;

        if (status === 403) {
          errorContent = '🔒 **Access Denied (403)**\n\n';
          if (errorData?.message) {
            errorContent += errorData.message;
          } else if (errorData?.error) {
            errorContent += errorData.error;
          } else {
            errorContent += 'You don\'t have permission to access the AI assistant. Please check your authentication or contact your administrator.';
          }
        } else if (status === 401) {
          errorContent = '🔐 **Authentication Required (401)**\n\nYour session may have expired. Please log in again.';
        } else if (status === 429) {
          errorContent = '⏱️ **Rate Limit Exceeded (429)**\n\nToo many requests. Please wait a moment and try again.';
        } else if (status === 500) {
          errorContent = '⚠️ **Server Error (500)**\n\nThe server encountered an error. Please try again later.';
        } else if (status >= 400) {
          errorContent = `❌ **Error ${status}**\n\n${errorData?.message || errorData?.error || 'An unexpected error occurred.'}`;
        }
      } else if (error?.message === 'Network Error') {
        errorContent = '🌐 **Network Error**\n\nUnable to connect to the server. Please check your internet connection.';
      } else if (error?.message) {
        errorContent = `❌ **Error**\n\n${error.message}`;
      }

      const errorMessage: Message = {
        role: 'assistant',
        content: errorContent,
        timestamp: new Date()
      };
      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  }, [input, isLoading, currentWorkflow, technicalId, assistantStore, attachedFiles, expectWorkflowResponse]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);

    for (const file of files) {
      const { isValid, message: errorMessage } = HelperUpload.validateFile(file);
      if (!isValid) {
        antdMessage.warning(errorMessage);
        continue;
      }

      // Check if file already attached
      if (attachedFiles.some(f => f.name === file.name && f.size === file.size)) {
        antdMessage.warning(`File "${file.name}" is already attached`);
        continue;
      }

      setAttachedFiles(prev => [...prev, file]);
    }

    // Reset input
    event.target.value = '';
  };

  const handleRemoveFile = (index: number) => {
    setAttachedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const copyToClipboard = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedIndex(index);
      setTimeout(() => setCopiedIndex(null), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  const extractJsonFromMessage = (content: string): string | null => {
    // Try to extract JSON from markdown code blocks
    const jsonMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/);
    if (jsonMatch) {
      return jsonMatch[1].trim();
    }
    // Try to find JSON object directly
    const directJsonMatch = content.match(/\{[\s\S]*\}/);
    if (directJsonMatch) {
      return directJsonMatch[0];
    }
    return null;
  };

  const quickPrompts = [
    { icon: '🔄', text: 'Add a new state', prompt: 'Add a new state called "PENDING_REVIEW" with transitions to "APPROVED" and "REJECTED"', needsWorkflow: true },
    { icon: '🔗', text: 'Add transition', prompt: 'Add a transition from the current state to another state', needsWorkflow: true },
    { icon: '✨', text: 'Optimize workflow', prompt: 'Review this workflow and suggest optimizations', needsWorkflow: false },
    { icon: '🐛', text: 'Find issues', prompt: 'Check for any issues or missing required fields in this workflow', needsWorkflow: false },
    { icon: '📝', text: 'Create workflow', prompt: 'Create a simple approval workflow with states: DRAFT, PENDING, APPROVED, REJECTED', needsWorkflow: true },
    { icon: '💡', text: 'Explain workflow', prompt: 'Explain what this workflow does and how it works', needsWorkflow: false },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-[9999] animate-in fade-in duration-200">
      <div className="bg-gray-900 rounded-2xl shadow-2xl w-full max-w-3xl mx-4 flex flex-col max-h-[85vh] border-2 border-purple-800 animate-in slide-in-from-bottom-4 duration-300">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-gray-700 bg-gradient-to-r from-purple-950/30 to-pink-950/30 rounded-t-2xl">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-br from-purple-500 to-pink-500 rounded-xl shadow-lg">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-white translate-y-[20%]">
                AI Workflow Assistant
              </h2>
              <p className="text-sm text-gray-400">
                Ask me anything about your workflow
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-300 transition-colors rounded-lg hover:bg-gray-800"
          >
            <X size={24} />
          </button>
        </div>

        {/* Quick Prompts */}
        {messages.length === 0 && (
          <div className="p-6 border-b border-gray-700">
            <p className="text-sm font-medium text-gray-300 mb-3">
              Quick actions:
            </p>
            <div className="grid grid-cols-2 gap-2">
              {quickPrompts.map((prompt, index) => (
                <button
                  key={index}
                  onClick={() => {
                    setInput(prompt.prompt);
                    setExpectWorkflowResponse(prompt.needsWorkflow);
                  }}
                  className="flex items-center gap-2 p-3 text-left text-sm bg-gray-800 hover:bg-gray-700 rounded-lg transition-colors border border-gray-700"
                >
                  <span className="text-lg">{prompt.icon}</span>
                  <span className="text-gray-300">{prompt.text}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {messages.map((message, index) => {
            const jsonContent = message.role === 'assistant' ? extractJsonFromMessage(message.content) : null;
            const isError = message.role === 'assistant' && (
              message.content.includes('Error') ||
              message.content.includes('403') ||
              message.content.includes('401') ||
              message.content.includes('429') ||
              message.content.includes('500') ||
              message.content.includes('Access Denied') ||
              message.content.includes('Network Error')
            );

            return (
              <div
                key={index}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-[80%] rounded-2xl p-4 ${
                    message.role === 'user'
                      ? 'bg-gradient-to-br from-purple-500 to-pink-500 text-white'
                      : isError
                      ? 'bg-red-950/30 border-2 border-red-800 text-red-100'
                      : 'bg-gray-800 text-white'
                  }`}
                >
                  <div className="prose prose-sm dark:prose-invert max-w-none">
                    <pre className="whitespace-pre-wrap font-sans">{message.content}</pre>
                  </div>

                  {/* Action buttons for assistant messages */}
                  {message.role === 'assistant' && (
                    <div className="flex gap-2 mt-3 pt-3 border-t border-gray-700">
                      <button
                        onClick={() => copyToClipboard(message.content, index)}
                        className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors border border-gray-600"
                      >
                        {copiedIndex === index ? (
                          <>
                            <Check size={14} className="text-green-500" />
                            <span>Copied!</span>
                          </>
                        ) : (
                          <>
                            <Copy size={14} />
                            <span>Copy</span>
                          </>
                        )}
                      </button>

                      {jsonContent && (
                        <button
                          onClick={() => onApplySuggestion(jsonContent)}
                          className="flex items-center gap-1 px-3 py-1.5 text-xs bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:from-purple-600 hover:to-pink-600 rounded-lg transition-colors shadow-sm"
                        >
                          <Wand2 size={14} />
                          <span>Apply JSON</span>
                        </button>
                      )}
                    </div>
                  )}
                </div>
              </div>
            );
          })}

          {isLoading && (
            <div className="flex justify-start">
              <div className="bg-gray-800 rounded-2xl p-4">
                <Loader2 className="w-5 h-5 animate-spin text-purple-500" />
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        <div className="p-6 border-t border-gray-700 bg-gray-800/50 rounded-b-2xl">
          {/* File attachments preview */}
          {attachedFiles.length > 0 && (
            <div className="mb-3 flex flex-wrap gap-2">
              {attachedFiles.map((file, index) => (
                <div
                  key={index}
                  className="flex items-center gap-2 px-3 py-2 bg-gray-700 rounded-lg border border-gray-600"
                >
                  <FileText className="w-4 h-4 text-purple-400" />
                  <span className="text-sm text-gray-300 max-w-[200px] truncate">
                    {file.name}
                  </span>
                  <button
                    onClick={() => handleRemoveFile(index)}
                    className="text-gray-400 hover:text-red-400 transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Response Mode Toggle - Prominent */}
          <div className={`mb-4 p-4 rounded-xl border-2 transition-all ${
            expectWorkflowResponse
              ? 'bg-purple-950/30 border-purple-500'
              : 'bg-gray-800/50 border-gray-700'
          }`}>
            <label className="flex items-start gap-4 cursor-pointer group">
              <input
                type="checkbox"
                checked={expectWorkflowResponse}
                onChange={(e) => setExpectWorkflowResponse(e.target.checked)}
                disabled={isLoading}
                className="mt-1 w-6 h-6 rounded border-2 border-gray-600 bg-gray-700 text-purple-500 focus:ring-2 focus:ring-purple-500 focus:ring-offset-0 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
              />
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <Wand2 className={`w-5 h-5 ${expectWorkflowResponse ? 'text-purple-400' : 'text-gray-400'}`} />
                  <span className={`font-semibold ${expectWorkflowResponse ? 'text-purple-300' : 'text-gray-300'} group-hover:text-white transition-colors`}>
                    Replace workflow with AI response
                  </span>
                </div>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {expectWorkflowResponse ? (
                    <>
                      <span className="text-purple-400 font-medium">✓ Enabled:</span> The AI will generate a complete workflow JSON that will automatically replace your current workflow in the editor.
                    </>
                  ) : (
                    <>
                      Get a conversational response without modifying your workflow. Perfect for questions, explanations, and suggestions.
                    </>
                  )}
                </p>
              </div>
            </label>
          </div>

          <input
            ref={fileInputRef}
            type="file"
            multiple
            style={{ display: 'none' }}
            onChange={handleFileSelect}
            accept=".pdf,.docx,.xlsx,.pptx,.xml,.json,text/*,image/*"
          />

          {/* Message Input with Send Button Inside */}
          <div className="relative">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="Ask about your workflow... (Shift+Enter for new line)"
              className="w-full px-4 py-3 pr-14 bg-gray-900 border-2 border-gray-700 rounded-xl focus:outline-none focus:border-purple-500 resize-none text-white placeholder-gray-500"
              rows={3}
              disabled={isLoading}
            />
            <button
              onClick={sendMessage}
              disabled={!input.trim() || isLoading}
              className="absolute right-2 bottom-2 p-2.5 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-lg hover:from-purple-600 hover:to-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg hover:shadow-xl disabled:shadow-none"
              title="Send message"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </div>

          {/* Bottom Actions */}
          <div className="flex items-center justify-between mt-3">
            <button
              onClick={handleAttachClick}
              disabled={isLoading}
              className="flex items-center gap-2 px-3 py-2 text-sm bg-gray-700 hover:bg-gray-600 text-gray-300 rounded-lg transition-colors border border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Paperclip className="w-4 h-4" />
              <span>Attach files</span>
            </button>

            <p className="text-xs text-gray-400">
              Press <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Enter</kbd> to send, <kbd className="px-2 py-1 bg-gray-700 rounded text-xs">Shift+Enter</kbd> for new line
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

