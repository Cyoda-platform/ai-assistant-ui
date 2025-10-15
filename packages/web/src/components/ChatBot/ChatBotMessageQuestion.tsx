import React, { useState, useMemo } from 'react';
import dayjs from 'dayjs';
import { Bot, Clock, Sparkles, CheckCircle, Check, Plus, Loader2 } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';
import LogoSmall from '@/assets/images/logo-small.svg';
import apiService from '@/services/apiService';

interface Message {
  id?: string;
  text: string | object;
  last_modified?: string;
  raw?: any;
  approve?: boolean;
  isCanvasQA?: boolean; // Mark Canvas QA messages for pink styling
}

interface ChatBotMessageQuestionProps {
  message: Message;
  isLoading: boolean;
  onApproveQuestion: (data: any) => void;
  onAddToCanvas?: (result: { id: string; type: string; data: any }) => void;
}

const ChatBotMessageQuestion: React.FC<ChatBotMessageQuestionProps> = ({
  message,
  isLoading,
  onApproveQuestion,
  onAddToCanvas
}) => {
  const [isLoadingApprove, setIsLoadingApprove] = useState(false);
  const [isAddingToCanvas, setIsAddingToCanvas] = useState(false);
  const [addedToCanvas, setAddedToCanvas] = useState(false);

  const messageText = useMemo(() => {
    const text = message.text;
    if (typeof text === 'object' && text !== null) {
      return JSON.stringify(text, null, 2);
    }
    return text;
  }, [message.text]);

  const date = useMemo(() => {
    if (!message.last_modified) return '';
    return dayjs(message.last_modified).format('HH:mm');
  }, [message.last_modified]);

  // Detect if message contains JSON with app/entity/workflow/environment data
  const canvasData = useMemo(() => {
    try {
      let jsonData: any = null;

      // Try to extract JSON from markdown code blocks
      if (typeof message.text === 'string') {
        const jsonMatch = message.text.match(/```json\n([\s\S]*?)\n```/);
        if (jsonMatch) {
          jsonData = JSON.parse(jsonMatch[1]);
        }
      } else if (typeof message.text === 'object') {
        jsonData = message.text;
      }

      if (!jsonData) return null;

      // Detect type based on JSON structure
      if (jsonData.programming_language && (jsonData.entities || jsonData.workflows || jsonData.environments)) {
        return { type: 'app', data: jsonData };
      } else if (jsonData.model && jsonData.name && jsonData.version) {
        return { type: 'entity', data: jsonData };
      } else if (jsonData.states && jsonData.entity_id) {
        return { type: 'workflow', data: jsonData };
      } else if (jsonData.url && jsonData.status) {
        return { type: 'environment', data: jsonData };
      }

      return null;
    } catch (error) {
      return null;
    }
  }, [message.text]);

  // Get responsive container class for bot message (left-aligned)
  const containerInfo = useTextResponsiveContainer(messageText, {
    baseClass: 'text-responsive-container bot-message'
  });

  const onClickApproveQuestion = () => {
    setIsLoadingApprove(true);
    onApproveQuestion(message.raw);
    setTimeout(() => {
      setIsLoadingApprove(false);
    }, 2000);
  };

  const handleAddToCanvas = async () => {
    if (!message.id || !canvasData) return;

    try {
      setIsAddingToCanvas(true);

      // Get current app ID from localStorage if needed
      let appId: string | undefined;
      if (canvasData.type !== 'app') {
        const appData = JSON.parse(localStorage.getItem('appData') || '{}');
        appId = appData.app?.id;
      }

      // Call API to create from chat (intercepted by MSW in development)
      const result = await apiService.createFromChat(
        message.id,
        canvasData.type as 'app' | 'entity' | 'workflow' | 'environment',
        appId
      );

      console.log('✅ Added to canvas:', result);
      setAddedToCanvas(true);

      // Notify parent component
      if (onAddToCanvas) {
        onAddToCanvas(result);
      }

      // Show success for 2 seconds
      setTimeout(() => {
        setAddedToCanvas(false);
      }, 2000);
    } catch (error) {
      console.error('Failed to add to canvas:', error);
    } finally {
      setIsAddingToCanvas(false);
    }
  };

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 w-full max-w-[95%]">
        {/* AI Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-10 h-10" />
        </div>

        <div className="flex-1">
          {/* AI Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className={`flex items-center space-x-1.5 backdrop-blur-sm px-3 py-1 rounded-full border ${
              message.isCanvasQA
                ? 'bg-purple-900/30 border-purple-500/40'
                : 'bg-slate-800/50 border-slate-600'
            }`}>
              <Sparkles size={12} className={message.isCanvasQA ? 'text-purple-400' : 'text-teal-400'} />
              <span className="text-xs font-medium text-slate-300">
                {message.isCanvasQA ? 'CANVAS AI' : 'CYODA AI'}
              </span>
            </div>
            {date && (
              <div className="flex items-center space-x-1 text-xs text-slate-500">
                <Clock size={12} />
                <span>{date}</span>
              </div>
            )}
          </div>

          {/* Message Bubble - Left aligned bot message */}
          <div className={`${containerInfo.className} relative group ${message.approve || canvasData ? 'pb-12' : ''} !rounded-3xl ${
            message.isCanvasQA ? 'canvas-qa-question' : ''
          }`}>
            <MarkdownRenderer>
              {messageText}
            </MarkdownRenderer>

            {/* Add to Canvas Button - Bottom Left Corner */}
            {canvasData && (
              <button
                onClick={handleAddToCanvas}
                disabled={isAddingToCanvas || addedToCanvas}
                className={`absolute bottom-3 left-3 px-4 py-2 rounded-full transition-all duration-200 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center space-x-2 ${
                  addedToCanvas
                    ? 'bg-green-500 text-white'
                    : 'bg-gradient-to-r from-purple-500 to-indigo-600 hover:from-purple-600 hover:to-indigo-700 text-white'
                }`}
                title={addedToCanvas ? 'Added to canvas' : `Add ${canvasData.type} to canvas`}
              >
                {isAddingToCanvas ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span className="text-sm font-medium">Adding...</span>
                  </>
                ) : addedToCanvas ? (
                  <>
                    <Check size={16} />
                    <span className="text-sm font-medium">Added!</span>
                  </>
                ) : (
                  <>
                    <Plus size={16} />
                    <span className="text-sm font-medium">Add to Canvas</span>
                  </>
                )}
              </button>
            )}

            {/* Approve Button - Bottom Right Corner */}
            {message.approve && (
              <button
                onClick={onClickApproveQuestion}
                disabled={isLoading || isLoadingApprove}
                className="absolute bottom-3 right-3 w-8 h-8 rounded-full bg-green-500 hover:bg-green-600 text-white transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg hover:shadow-xl flex items-center justify-center"
                title="Approve this response"
              >
                {isLoadingApprove ? (
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                ) : (
                  <Check size={16} />
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatBotMessageQuestion;
