import React, { useMemo } from 'react';
import { ChevronRight } from 'lucide-react';

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface HierarchicalOptionSelectionProps {
  options: Option[];
  selectedOptions: string[];
  onToggleOption: (value: string) => void;
  selectionType?: 'single' | 'multiple';
}

const HierarchicalOptionSelection: React.FC<HierarchicalOptionSelectionProps> = ({
  options,
  selectedOptions,
  onToggleOption,
  selectionType = 'single'
}) => {
  // Parse options into hierarchical structure
  const hierarchicalOptions = useMemo(() => {
    const structure: Record<string, Record<string, Option[]>> = {};

    options.forEach(option => {
      const parts = option.value.split('_');
      if (parts.length >= 3) {
        const language = parts[0]; // python, java
        const repoType = parts[1]; // public, private
        const branchType = parts[2]; // new, existing

        if (!structure[language]) structure[language] = {};
        if (!structure[language][repoType]) structure[language][repoType] = [];
        structure[language][repoType].push(option);
      }
    });

    return structure;
  }, [options]);

  const languages = Object.keys(hierarchicalOptions).sort();

  return (
    <div className="space-y-6">
      {languages.map(language => (
        <div key={language} className="space-y-3">
          {/* Language Header */}
          <div className="px-2 py-2 bg-slate-700/40 rounded-lg border border-slate-600/50">
            <h3 className="text-sm font-semibold text-teal-300 uppercase tracking-wider">
              {language.charAt(0).toUpperCase() + language.slice(1)}
            </h3>
          </div>

          {/* Repository Types */}
          <div className="space-y-3 ml-4">
            {Object.keys(hierarchicalOptions[language]).sort().map(repoType => (
              <div key={repoType} className="space-y-2">
                {/* Repo Type Label */}
                <div className="flex items-center space-x-2 text-xs font-medium text-slate-400 uppercase tracking-wider">
                  <ChevronRight size={14} />
                  <span>{repoType === 'public' ? '🌐 Public' : '🔒 Private'} Repository</span>
                </div>

                {/* Branch Options */}
                <div className="space-y-2 ml-4">
                  {hierarchicalOptions[language][repoType].map(option => (
                    <button
                      key={option.value}
                      onClick={() => onToggleOption(option.value)}
                      className={`w-full px-4 py-3 rounded-lg border-2 transition-all duration-200 text-left ${
                        selectedOptions.includes(option.value)
                          ? 'border-teal-500 bg-teal-500/20 text-teal-300'
                          : 'border-slate-600 bg-slate-800/50 text-slate-400 hover:border-slate-500 hover:bg-slate-800/70'
                      }`}
                    >
                      <div className="flex items-start space-x-3">
                        {/* Radio/Checkbox */}
                        <div className={`mt-0.5 w-5 h-5 rounded-${selectionType === 'single' ? 'full' : 'md'} border-2 flex items-center justify-center flex-shrink-0 ${
                          selectedOptions.includes(option.value)
                            ? 'border-teal-500 bg-teal-500'
                            : 'border-slate-500'
                        }`}>
                          {selectedOptions.includes(option.value) && (
                            <div className="w-2 h-2 bg-white rounded-full"></div>
                          )}
                        </div>

                        <div className="flex-1 min-w-0">
                          <div className="text-sm font-medium">{option.label}</div>
                          {option.description && (
                            <div className="text-xs opacity-75 mt-1">{option.description}</div>
                          )}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default HierarchicalOptionSelection;

