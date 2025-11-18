import React from 'react';

interface ThinkingAnimationProps {
  className?: string;
}

/**
 * ChatGPT-like thinking animation with animated dots
 */
const ThinkingAnimation: React.FC<ThinkingAnimationProps> = ({ className = '' }) => {
  return (
    <div className={`flex items-center space-x-1 ${className}`}>
      <div className="flex space-x-1">
        <div 
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: '0ms', animationDuration: '1.4s' }}
        />
        <div 
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: '200ms', animationDuration: '1.4s' }}
        />
        <div 
          className="w-2 h-2 bg-slate-400 rounded-full animate-bounce"
          style={{ animationDelay: '400ms', animationDuration: '1.4s' }}
        />
      </div>
    </div>
  );
};

export default ThinkingAnimation;
