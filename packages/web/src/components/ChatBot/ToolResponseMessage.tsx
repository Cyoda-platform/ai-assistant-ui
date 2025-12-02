import React, { useEffect, useRef } from 'react';
import { Wrench } from 'lucide-react';
import MarkdownRenderer from '../MarkdownRenderer/MarkdownRenderer';

interface ToolResponseMessageProps {
  toolName: string;
  content: string;
  isComplete?: boolean;
}

/**
 * ToolResponseMessage Component
 * Displays a tool response that is being streamed in real-time
 * Shows accumulated content with live-typing animation
 */
const ToolResponseMessage: React.FC<ToolResponseMessageProps> = ({
  toolName,
  content,
  isComplete = false
}) => {
  const messageRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when content updates
  useEffect(() => {
    if (messageRef.current && !isComplete) {
      messageRef.current.scrollIntoView({ behavior: 'smooth', block: 'end' });
    }
  }, [content, isComplete]);

  // Format tool name for display
  const displayToolName = toolName
    .replace(/_/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase());

  return (
    <div
      ref={messageRef}
      className="flex justify-start mb-6 animate-fade-in-up"
    >
      <div className="flex items-start space-x-3 w-full max-w-[90%]">
        {/* Tool Icon */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg bg-gradient-to-br from-orange-500 to-red-600">
          <Wrench size={20} className="text-white" />
        </div>

        <div className="flex-1 min-w-0">
          {/* Tool Badge */}
          <div className="flex items-center space-x-2 flex-wrap mb-2">
            <div className="flex items-center space-x-1.5 bg-orange-500/20 backdrop-blur-sm px-3 py-1 rounded-full border border-orange-500/30">
              <Wrench size={12} className={isComplete ? "text-orange-400" : "text-orange-400 animate-pulse"} />
              <span className="text-xs font-medium text-orange-300">{displayToolName}</span>
            </div>
            {!isComplete && (
              <span className="text-xs text-slate-500 italic">streaming...</span>
            )}
          </div>

          {/* Tool Response Content */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-lg p-4 shadow-lg">
            <div className="text-slate-200 text-sm leading-relaxed">
              {content ? (
                <MarkdownRenderer content={content} />
              ) : (
                <span className="text-slate-500 italic">Processing...</span>
              )}
            </div>

            {/* Blinking cursor when streaming */}
            {!isComplete && (
              <span className="inline-block w-2 h-4 ml-1 bg-slate-400 animate-pulse" />
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ToolResponseMessage;

