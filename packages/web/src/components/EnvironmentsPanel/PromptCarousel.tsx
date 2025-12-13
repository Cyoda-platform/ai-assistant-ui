import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Copy, CheckCircle2, Sparkles } from 'lucide-react';
import { message } from 'antd';

interface Prompt {
  category: string;
  title: string;
  description: string;
  prompt: string;
  icon: string;
  color: string;
}

interface PromptCarouselProps {
  environmentName: string;
  onPromptSelect?: (prompt: string) => void;
}

const PromptCarousel: React.FC<PromptCarouselProps> = ({ environmentName, onPromptSelect }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [copiedPrompt, setCopiedPrompt] = useState<string | null>(null);

  // Cyoda brand color: Teal (#0D8484)
  const cyodaColor = 'from-teal-600 to-teal-500';

  // Prompts based on TEST_PROMPTS.md with Cyoda teal color
  const prompts: Prompt[] = [
    {
      category: 'Environment Overview',
      title: 'List All Environments',
      description: 'See all your environments at a glance',
      prompt: 'List all my environments',
      icon: '📋',
      color: cyodaColor
    },
    {
      category: 'Environment Details',
      title: 'Describe Environment',
      description: 'Get details about what\'s running',
      prompt: `Describe my ${environmentName} environment`,
      icon: '🔍',
      color: cyodaColor
    },
    {
      category: 'Applications',
      title: 'List Applications',
      description: 'See all apps in this environment',
      prompt: `List my applications in ${environmentName}`,
      icon: '📦',
      color: cyodaColor
    },
    {
      category: 'Monitoring',
      title: 'Environment Metrics',
      description: 'Check CPU and memory usage',
      prompt: `Show metrics for ${environmentName} environment`,
      icon: '📊',
      color: cyodaColor
    },
    {
      category: 'Monitoring',
      title: 'Environment Pods',
      description: 'View all running pods',
      prompt: `Show pods in ${environmentName} environment`,
      icon: '🐳',
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'App Details',
      description: 'Get info about a specific app',
      prompt: 'Describe my-app in this environment',
      icon: '⚙️',
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'Scale Application',
      description: 'Adjust replica count',
      prompt: 'Scale my-app to 3 replicas',
      icon: '📈',
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'Restart Application',
      description: 'Restart a deployment',
      prompt: 'Restart my-app deployment',
      icon: '🔄',
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'Update Image',
      description: 'Update container image',
      prompt: 'Update my-app to use image my-app:v2.0',
      icon: '🖼️',
      color: cyodaColor
    },
    {
      category: 'Monitoring',
      title: 'App Metrics',
      description: 'Monitor app performance',
      prompt: 'Show metrics for my-app',
      icon: '📈',
      color: cyodaColor
    }
  ];

  const copyPrompt = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedPrompt(text);
    message.success('Prompt copied to clipboard');
    setTimeout(() => setCopiedPrompt(null), 2000);
  };

  return (
    <div className="space-y-3">
      {/* Header with Expand/Collapse Button */}
      <div className="flex items-center gap-2">
        <Sparkles size={16} className="text-amber-400" />
        <h4 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Try These Prompts</h4>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-4 py-2 rounded-lg bg-teal-500/20 hover:bg-teal-500/30 text-teal-400 hover:text-teal-300 transition-all font-medium flex items-center gap-2"
          title={isExpanded ? 'Collapse prompts' : 'Expand prompts'}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={20} />
              <span className="text-sm">Collapse</span>
            </>
          ) : (
            <>
              <ChevronDown size={20} />
              <span className="text-sm">Expand</span>
            </>
          )}
        </button>
      </div>

      {/* Prompts Grid - Expanded View */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {prompts.map((prompt, idx) => (
            <div
              key={idx}
              className="rounded-lg p-3 border border-slate-600 cursor-pointer group"
              onClick={() => copyPrompt(prompt.prompt)}
            >
              <div className="flex items-start justify-between gap-2">
                <p className="text-sm font-semibold text-white leading-relaxed flex-1">
                  {prompt.icon} {prompt.prompt}
                </p>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    copyPrompt(prompt.prompt);
                  }}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-teal-400 flex-shrink-0"
                  title="Copy prompt"
                >
                  {copiedPrompt === prompt.prompt ? (
                    <CheckCircle2 size={16} />
                  ) : (
                    <Copy size={16} />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default PromptCarousel;

