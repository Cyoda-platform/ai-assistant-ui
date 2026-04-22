import React, { useState } from 'react';
import { ChevronUp, ChevronDown, Copy, CheckCircle2, MessageSquare, List, Search, Package, BarChart3, Container, Settings, TrendingUp, RefreshCw, Image, LucideIcon } from 'lucide-react';
import { message } from 'antd';

interface Prompt {
  category: string;
  title: string;
  description: string;
  prompt: string;
  icon: LucideIcon;
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
      icon: List,
      color: cyodaColor
    },
    {
      category: 'Environment Details',
      title: 'Describe Environment',
      description: 'Get details about what\'s running',
      prompt: `Describe my ${environmentName} environment`,
      icon: Search,
      color: cyodaColor
    },
    {
      category: 'Applications',
      title: 'List Applications',
      description: 'See all apps in this environment',
      prompt: `List my applications in ${environmentName}`,
      icon: Package,
      color: cyodaColor
    },
    {
      category: 'Monitoring',
      title: 'Environment Metrics',
      description: 'Check CPU and memory usage',
      prompt: `Show metrics for ${environmentName} environment`,
      icon: BarChart3,
      color: cyodaColor
    },
    {
      category: 'Monitoring',
      title: 'Environment Pods',
      description: 'View all running pods',
      prompt: `Show pods in ${environmentName} environment`,
      icon: Container,
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'App Details',
      description: 'Get info about a specific app',
      prompt: 'Describe my-app in this environment',
      icon: Settings,
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'Scale Application',
      description: 'Adjust replica count',
      prompt: 'Scale my-app to 3 replicas',
      icon: TrendingUp,
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'Restart Application',
      description: 'Restart a deployment',
      prompt: 'Restart my-app deployment',
      icon: RefreshCw,
      color: cyodaColor
    },
    {
      category: 'Application Management',
      title: 'Update Image',
      description: 'Update container image',
      prompt: 'Update my-app to use image my-app:v2.0',
      icon: Image,
      color: cyodaColor
    },
    {
      category: 'Monitoring',
      title: 'App Metrics',
      description: 'Monitor app performance',
      prompt: 'Show metrics for my-app',
      icon: TrendingUp,
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
    <section className="space-y-3">
      {/* Header with Expand/Collapse Button */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <MessageSquare size={16} className="text-teal-400" />
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">Try These Prompts</h3>
        </div>
        <button
          onClick={() => setIsExpanded(!isExpanded)}
          className="px-2.5 py-1.5 rounded-lg bg-gradient-to-r from-teal-500/15 to-cyan-500/15 hover:from-teal-500/25 hover:to-cyan-500/25 text-teal-400 border border-teal-500/25 hover:border-teal-400/40 transition-all duration-200 font-medium flex items-center gap-1.5 hover:shadow-md hover:shadow-teal-500/10 text-xs"
          title={isExpanded ? 'Collapse prompts' : 'Expand prompts'}
        >
          {isExpanded ? (
            <>
              <ChevronUp size={12} />
              <span>Collapse</span>
            </>
          ) : (
            <>
              <ChevronDown size={12} />
              <span>Expand</span>
            </>
          )}
        </button>
      </div>

      {/* Prompts Grid - Expanded View */}
      {isExpanded && (
        <div className="grid grid-cols-1 gap-2 max-h-96 overflow-y-auto">
          {prompts.map((prompt, idx) => {
            const IconComponent = prompt.icon;
            return (
              <div
                key={idx}
                className="rounded-lg p-3 border border-slate-600 cursor-pointer group hover:border-teal-500/40 transition-all"
                onClick={() => copyPrompt(prompt.prompt)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-2.5 flex-1 min-w-0">
                    <IconComponent size={16} className="text-teal-400 mt-0.5 flex-shrink-0" />
                    <p className="text-sm font-medium text-white leading-relaxed">
                      {prompt.prompt}
                    </p>
                  </div>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      copyPrompt(prompt.prompt);
                    }}
                    className="p-1.5 rounded-lg hover:bg-teal-500/10 border border-transparent hover:border-teal-500/30 transition-all duration-200 group flex-shrink-0"
                    title="Copy prompt"
                  >
                    {copiedPrompt === prompt.prompt ? (
                      <CheckCircle2 size={16} className="text-green-400" />
                    ) : (
                      <Copy size={16} className="text-slate-400 group-hover:text-teal-400 transition-colors" />
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
};

export default PromptCarousel;

