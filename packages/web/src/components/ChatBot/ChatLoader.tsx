import React from 'react';
import { Bot, Sparkles, Wrench } from 'lucide-react';
import LogoSmall from '@/assets/images/logo-small.svg';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';
import ThinkingAnimation from './ThinkingAnimation';

interface ChatLoaderProps {
  agentName?: string;
  toolName?: string;
  toolArgs?: Record<string, any>;
  message?: string;
}

const ChatLoader: React.FC<ChatLoaderProps> = ({
  agentName,
  toolName,
  toolArgs,
  message = 'Assistant is thinking…'
}) => {
  // Use responsive container for the message text
  const containerInfo = useTextResponsiveContainer(message);

  // Format agent name for display
  const displayAgentName = agentName
    ? agentName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : 'Assistant';

  // Format tool name for display
  const displayToolName = toolName
    ? toolName.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
    : toolName;

  return (
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 w-full max-w-[90%]">
        {/* AI Avatar */}
        <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 shadow-lg overflow-hidden">
          <img src={LogoSmall} alt="CYODA" className="w-10 h-10" />
        </div>

        <div className="flex-1">
          {/* AI Badge with Agent Name and Thinking Animation */}
          <div className="flex items-center space-x-2 flex-wrap mb-2">
            <div className="flex items-center space-x-1.5 bg-slate-100 px-3 py-1 rounded-full border border-slate-200">
              <Sparkles size={12} className="text-blue-500" />
              <span className="text-xs font-medium text-slate-700">{displayAgentName}</span>
            </div>

            {/* Tool Indicator */}
            {toolName && (
              <div className="flex items-center space-x-1.5 bg-teal-50 px-3 py-1 rounded-full border border-teal-200">
                <Wrench size={12} className="text-teal-600" />
                <span className="text-xs font-medium text-teal-700">{displayToolName}</span>
              </div>
            )}

            {/* Thinking Animation */}
            <ThinkingAnimation />
          </div>

          {/* Tool Arguments */}
          {toolArgs && Object.keys(toolArgs).length > 0 && (
            <div className="mb-2 bg-slate-50 rounded-lg px-3 py-2 border border-slate-200">
              <div className="text-xs text-slate-500 mb-1">Tool Arguments:</div>
              <div className="text-xs text-slate-700 font-mono">
                {Object.entries(toolArgs).map(([key, value]) => (
                  <div key={key} className="flex items-start space-x-2">
                    <span className="text-blue-600">{key}:</span>
                    <span className="text-slate-700 break-all">
                      {typeof value === 'object' ? JSON.stringify(value) : String(value)}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Typing Indicator - Using responsive container for compact sizing */}
          <div className={containerInfo.className}>
            <div className="flex items-center space-x-3">
              <ThinkingAnimation />
              <span className="text-sm text-slate-500">{message}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLoader;
