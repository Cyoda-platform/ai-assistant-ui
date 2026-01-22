import React, { useState, useMemo } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import {
  ChevronDown,
  ChevronRight,
  Target,
  Shield,
  Zap,
  Users,
  BookOpen,
  AlertCircle,
  CheckCircle2,
  Clock,
  Tag,
  FileText,
  Database,
  Code,
  GitBranch,
  List,
  Layers,
} from 'lucide-react';
import type { Requirement } from '@/components/AppsCanvas/types/appSchema';

interface EnhancedRequirementPreviewProps {
  markdownText: string;
  requirement?: Requirement | null;
}

interface Section {
  id: string;
  title: string;
  content: string;
  icon: React.ReactNode;
  level: number;
}

export const EnhancedRequirementPreview: React.FC<EnhancedRequirementPreviewProps> = ({
  markdownText,
  requirement,
}) => {
  const [collapsedSections, setCollapsedSections] = useState<Set<string>>(new Set());

  // Parse markdown into sections
  const sections = useMemo(() => {
    const lines = markdownText.split('\n');
    const parsedSections: Section[] = [];
    let currentSection: Section | null = null;
    let sectionIndex = 0;

    lines.forEach((line, index) => {
      const h1Match = line.match(/^#\s+(.+)$/);
      const h2Match = line.match(/^##\s+(.+)$/);
      const h3Match = line.match(/^###\s+(.+)$/);

      if (h1Match || h2Match || h3Match) {
        // Save previous section
        if (currentSection) {
          parsedSections.push(currentSection);
        }

        const title = (h1Match || h2Match || h3Match)![1];
        const level = h1Match ? 1 : h2Match ? 2 : 3;

        // Assign icons based on section title
        const icon = getSectionIcon(title);

        currentSection = {
          id: `section-${sectionIndex++}`,
          title,
          content: '',
          icon,
          level,
        };
      } else if (currentSection) {
        currentSection.content += line + '\n';
      }
    });

    // Add last section
    if (currentSection) {
      parsedSections.push(currentSection);
    }

    return parsedSections;
  }, [markdownText]);

  const toggleSection = (sectionId: string) => {
    setCollapsedSections((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(sectionId)) {
        newSet.delete(sectionId);
      } else {
        newSet.add(sectionId);
      }
      return newSet;
    });
  };

  const getStatusBadge = (status?: string) => {
    switch (status?.toLowerCase()) {
      case 'completed':
      case 'done':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
            <CheckCircle2 size={12} />
            Completed
          </span>
        );
      case 'in progress':
      case 'in_progress':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Clock size={12} />
            In Progress
          </span>
        );
      case 'draft':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-gray-500/20 text-gray-400 border border-gray-500/30">
            <FileText size={12} />
            Draft
          </span>
        );
      default:
        return null;
    }
  };

  const getPriorityBadge = (priority?: string) => {
    switch (priority?.toLowerCase()) {
      case 'critical':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-red-500/20 text-red-400 border border-red-500/30">
            <AlertCircle size={12} />
            Critical
          </span>
        );
      case 'high':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-orange-500/20 text-orange-400 border border-orange-500/30">
            <Zap size={12} />
            High
          </span>
        );
      case 'medium':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-yellow-500/20 text-yellow-400 border border-yellow-500/30">
            <Target size={12} />
            Medium
          </span>
        );
      case 'low':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-green-500/20 text-green-400 border border-green-500/30">
            Low
          </span>
        );
      default:
        return null;
    }
  };

  return (
    <div className="enhanced-requirement-preview">
      {/* Metadata Header */}
      {requirement && (
        <div className="mb-6 pb-4 border-b border-slate-700/50">
          {requirement.description && (
            <p className="text-sm text-gray-400 leading-relaxed mb-3">{requirement.description}</p>
          )}

          <div className="flex flex-wrap items-center gap-2">
            {requirement.status && getStatusBadge(requirement.status)}
            {requirement.priority && getPriorityBadge(requirement.priority)}
            {requirement.metadata?.tags && requirement.metadata.tags.length > 0 && (
              <>
                {requirement.metadata.tags.map((tag, index) => (
                  <span
                    key={index}
                    className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs bg-purple-500/20 text-purple-400 border border-purple-500/30"
                  >
                    <Tag size={12} />
                    {tag}
                  </span>
                ))}
              </>
            )}
          </div>
        </div>
      )}

      {/* Sections */}
      <div className="space-y-4">
        {sections.map((section) => {
          const isCollapsed = collapsedSections.has(section.id);
          const isSubsection = section.level > 1;

          return (
            <div
              key={section.id}
              className={`requirement-section ${
                isSubsection ? 'ml-4' : ''
              } border border-slate-700/30 rounded-lg overflow-hidden bg-gradient-to-br from-slate-800/30 to-slate-800/10`}
            >
              {/* Section Header */}
              <div
                onClick={() => toggleSection(section.id)}
                className="flex items-center gap-3 p-4 cursor-pointer hover:bg-slate-700/20 transition-colors border-b border-slate-700/20"
              >
                <div className="text-orange-400 flex-shrink-0">
                  {section.icon}
                </div>
                <h2
                  className={`flex-1 font-semibold text-white ${
                    section.level === 1 ? 'text-xl' : section.level === 2 ? 'text-lg' : 'text-base'
                  }`}
                >
                  {section.title}
                </h2>
                <div className="text-gray-400 flex-shrink-0">
                  {isCollapsed ? <ChevronRight size={18} /> : <ChevronDown size={18} />}
                </div>
              </div>

              {/* Section Content */}
              {!isCollapsed && section.content.trim() && (
                <div className="p-4 prose prose-invert prose-slate max-w-none requirement-section-content">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                    {section.content}
                  </ReactMarkdown>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Fallback for non-sectioned content */}
      {sections.length === 0 && (
        <div className="prose prose-invert prose-slate max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>
            {markdownText}
          </ReactMarkdown>
        </div>
      )}
    </div>
  );
};

// Helper function to get appropriate icon for section
function getSectionIcon(title: string): React.ReactNode {
  const lowerTitle = title.toLowerCase();

  if (lowerTitle.includes('overview') || lowerTitle.includes('summary')) {
    return <BookOpen size={18} />;
  }
  if (lowerTitle.includes('functional') || lowerTitle.includes('capability') || lowerTitle.includes('capabilities')) {
    return <Zap size={18} />;
  }
  if (lowerTitle.includes('non-functional') || lowerTitle.includes('performance')) {
    return <Target size={18} />;
  }
  if (lowerTitle.includes('security') || lowerTitle.includes('compliance')) {
    return <Shield size={18} />;
  }
  if (lowerTitle.includes('user') || lowerTitle.includes('story') || lowerTitle.includes('stories')) {
    return <Users size={18} />;
  }
  if (lowerTitle.includes('technical') || lowerTitle.includes('tech')) {
    return <Code size={18} />;
  }
  if (lowerTitle.includes('database') || lowerTitle.includes('data')) {
    return <Database size={18} />;
  }
  if (lowerTitle.includes('api') || lowerTitle.includes('endpoint')) {
    return <GitBranch size={18} />;
  }
  if (lowerTitle.includes('criteria') || lowerTitle.includes('acceptance')) {
    return <CheckCircle2 size={18} />;
  }
  if (lowerTitle.includes('constraint') || lowerTitle.includes('limitation')) {
    return <AlertCircle size={18} />;
  }
  if (lowerTitle.includes('dependency') || lowerTitle.includes('dependencies')) {
    return <Layers size={18} />;
  }
  if (lowerTitle.includes('note') || lowerTitle.includes('notes')) {
    return <FileText size={18} />;
  }
  if (lowerTitle.includes('kyc') || lowerTitle.includes('onboarding')) {
    return <Users size={18} />;
  }
  if (lowerTitle.includes('monitoring') || lowerTitle.includes('transaction')) {
    return <Target size={18} />;
  }
  if (lowerTitle.includes('watchlist') || lowerTitle.includes('sanction')) {
    return <Shield size={18} />;
  }
  if (lowerTitle.includes('reporting') || lowerTitle.includes('report')) {
    return <FileText size={18} />;
  }
  if (lowerTitle.includes('audit') || lowerTitle.includes('trail')) {
    return <List size={18} />;
  }

  // Default icon
  return <FileText size={18} />;
}
