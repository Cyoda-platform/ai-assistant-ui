import React from 'react';
import { Bot, Sparkles } from 'lucide-react';

const ChatLoader: React.FC = () => {
  return (
    <div className="flex justify-start mb-6 animate-fade-in-up">
      <div className="flex items-start space-x-3 w-full max-w-[90%]">
        {/* AI Avatar */}
        <div className="w-8 h-8 rounded-full bg-gradient-to-r from-purple-500 to-pink-500 flex items-center justify-center flex-shrink-0 shadow-lg">
          <Bot size={16} className="text-white" />
        </div>

        <div className="flex-1">
          {/* AI Badge */}
          <div className="flex items-center space-x-2 mb-2">
            <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
              <Sparkles size={12} className="text-purple-400 animate-pulse" />
              <span className="text-xs font-medium text-slate-300">CYODA AI</span>
            </div>
          </div>

          {/* Typing Indicator */}
          <div className="bg-slate-800/50 backdrop-blur-sm border border-slate-700 rounded-2xl rounded-tl-md px-6 py-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <div className="flex space-x-1">
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
                <div className="w-2 h-2 bg-slate-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
              </div>
              <span className="text-sm text-slate-400 ml-2">AI is thinking...</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatLoader;
