import React from 'react';
import { Bot, User } from 'lucide-react';
import { useTextResponsiveContainer } from '@/hooks/useTextResponsiveContainer';

interface DemoMessage {
  id: number;
  type: 'user' | 'bot';
  text: string;
  timestamp: string;
}

const ChatDemo: React.FC = () => {
  const demoMessages: DemoMessage[] = [
    {
      id: 1,
      type: 'bot',
      text: 'Hello! I\'m CYODA AI Assistant. How can I help you today?',
      timestamp: '10:30'
    },
    {
      id: 2,
      type: 'user',
      text: 'Hi there!',
      timestamp: '10:31'
    },
    {
      id: 3,
      type: 'bot',
      text: 'I can help you with various tasks including data analysis, code generation, workflow automation, and much more. What would you like to work on?',
      timestamp: '10:31'
    },
    {
      id: 4,
      type: 'user',
      text: 'Can you help me understand how the text-responsive container system works? I want to make sure the chat messages look good regardless of their length.',
      timestamp: '10:32'
    },
    {
      id: 5,
      type: 'bot',
      text: 'Absolutely! The text-responsive container system automatically adjusts padding and width based on content length:\n\n- **Short messages** get compact styling\n- **Medium messages** get standard styling  \n- **Long messages** get comfortable styling with more padding\n\nThis ensures optimal readability and prevents issues like scroll bar blocking or poor text wrapping.',
      timestamp: '10:33'
    }
  ];

  const UserMessage: React.FC<{ message: DemoMessage }> = ({ message }) => {
    const containerInfo = useTextResponsiveContainer(message.text, {
      baseClass: 'text-responsive-container user-message'
    });

    return (
      <div className="flex justify-end mb-6 animate-fade-in-up">
        <div className="flex items-start space-x-3 max-w-[85%]">
          <div className="flex flex-col items-end space-y-2">
            <div className="flex items-center space-x-2">
              <span className="text-xs text-slate-500">{message.timestamp}</span>
              <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
                <span className="text-xs font-medium text-slate-300">You</span>
                <User size={12} className="text-teal-400" />
              </div>
            </div>
            <div className={containerInfo.className}>
              {message.text}
            </div>
          </div>
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-semibold text-sm shadow-lg border-2 border-teal-400/30">
            U
          </div>
        </div>
      </div>
    );
  };

  const BotMessage: React.FC<{ message: DemoMessage }> = ({ message }) => {
    const containerInfo = useTextResponsiveContainer(message.text, {
      baseClass: 'text-responsive-container bot-message'
    });

    return (
      <div className="flex justify-start mb-6 animate-fade-in-up">
        <div className="flex items-start space-x-3 max-w-[95%]">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-indigo-600 flex items-center justify-center flex-shrink-0 shadow-lg border-2 border-purple-400/30">
            <Bot size={18} className="text-white" />
          </div>
          <div className="flex-1">
            <div className="flex items-center space-x-2 mb-2">
              <div className="flex items-center space-x-1.5 bg-slate-800/50 backdrop-blur-sm px-3 py-1 rounded-full border border-slate-600">
                <span className="text-xs font-medium text-slate-300">CYODA AI</span>
              </div>
              <span className="text-xs text-slate-500">{message.timestamp}</span>
            </div>
            <div className={containerInfo.className}>
              {message.text}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="max-w-4xl mx-auto p-6 bg-slate-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white mb-2">Chat Layout Demo</h1>
        <p className="text-slate-400">
          Demonstrating proper chat UI conventions with text-responsive containers
        </p>
      </div>
      
      <div className="bg-slate-800/30 rounded-xl p-6 backdrop-blur-sm border border-slate-700">
        <div className="space-y-4">
          {demoMessages.map((message) => (
            message.type === 'user' ? (
              <UserMessage key={message.id} message={message} />
            ) : (
              <BotMessage key={message.id} message={message} />
            )
          ))}
        </div>
      </div>

      <div className="mt-8 p-4 bg-slate-800/50 rounded-lg border border-slate-600">
        <h3 className="text-lg font-semibold text-white mb-2">Key Features Demonstrated:</h3>
        <ul className="text-slate-300 space-y-1 text-sm">
          <li>✅ User messages right-aligned with teal styling</li>
          <li>✅ Bot messages left-aligned with purple/indigo styling</li>
          <li>✅ Text-responsive containers adapt to content length</li>
          <li>✅ Proper avatar positioning (user right, bot left)</li>
          <li>✅ No scroll bar blocking with optimized padding</li>
          <li>✅ Smooth animations and hover effects</li>
        </ul>
      </div>
    </div>
  );
};

export default ChatDemo;
