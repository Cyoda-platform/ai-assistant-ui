import React, { useState } from 'react';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { QUERY_TEMPLATES, QueryTemplate } from './QueryTemplates';
import './QueryTemplatesPanel.css';

interface QueryTemplatesPanelProps {
  onSelectTemplate: (query: Record<string, any>) => void;
}

const QueryTemplatesPanel: React.FC<QueryTemplatesPanelProps> = ({ onSelectTemplate }) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const handleSelectTemplate = (template: QueryTemplate) => {
    onSelectTemplate(template.query);
    setIsExpanded(false);
  };

  return (
    <div className="query-templates-panel">
      <button
        className="query-templates-toggle"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        <span>Query Templates</span>
        {isExpanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
      </button>

      {isExpanded && (
        <div className="query-templates-list">
          {QUERY_TEMPLATES.map((template, index) => (
            <button
              key={index}
              className="query-template-item"
              onClick={() => handleSelectTemplate(template)}
              title={template.description}
            >
              <div className="template-name">{template.name}</div>
              <div className="template-description">{template.description}</div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export default QueryTemplatesPanel;

