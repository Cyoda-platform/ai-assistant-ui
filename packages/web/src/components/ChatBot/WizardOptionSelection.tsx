import React, { useState, useMemo } from 'react';
import { Send, ChevronLeft, HelpCircle } from 'lucide-react';

// Simple Tooltip for help icons
const Tooltip: React.FC<{ text: string; children: React.ReactNode }> = ({ text, children }) => {
  const [show, setShow] = useState(false);

  return (
    <div className="relative inline-block">
      <div onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
        {children}
      </div>
      {show && (
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-slate-900 border border-teal-500/50 rounded text-xs text-slate-200 whitespace-nowrap z-50 shadow-lg pointer-events-none">
          {text}
        </div>
      )}
    </div>
  );
};

// Add animations
const animationStyles = `
  @keyframes fadeIn {
    from {
      opacity: 0;
      transform: translateY(-4px);
    }
    to {
      opacity: 1;
      transform: translateY(0);
    }
  }

  @keyframes slideDown {
    from {
      opacity: 0;
      transform: translateY(-8px);
      max-height: 0;
    }
    to {
      opacity: 1;
      transform: translateY(0);
      max-height: 500px;
    }
  }

  .animate-fadeIn {
    animation: fadeIn 0.3s ease-out;
  }

  .animate-slideDown {
    animation: slideDown 0.3s ease-out;
  }
`;

// Inject styles
if (typeof document !== 'undefined') {
  const style = document.createElement('style');
  style.textContent = animationStyles;
  document.head.appendChild(style);
}

interface Option {
  value: string;
  label: string;
  description?: string;
}

interface WizardOptionSelectionProps {
  options: Option[];
  selectedOptions: string[];
  onToggleOption: (value: string) => void;
  onSubmit: (formattedData: string) => void;
  isSubmitting: boolean;
  selectionType?: 'single' | 'multiple';
}

const WizardOptionSelection: React.FC<WizardOptionSelectionProps> = ({
  options,
  selectedOptions,
  onToggleOption,
  onSubmit,
  isSubmitting,
  selectionType = 'single'
}) => {
  const [step, setStep] = useState<'language' | 'branchType' | 'repoType'>('language');
  const [selectedLanguage, setSelectedLanguage] = useState<string | null>(null);
  const [selectedBranchType, setSelectedBranchType] = useState<string | null>(null);
  const [selectedRepoType, setSelectedRepoType] = useState<string | null>(null);
  const [branchName, setBranchName] = useState<string>('');
  const [repoUrl, setRepoUrl] = useState<string>('');
  const [installationId, setInstallationId] = useState<string>('');
  const [expandedInfo, setExpandedInfo] = useState<string | null>(null);
  const [showSetupTooltip, setShowSetupTooltip] = useState(false);
  const containerRef = React.useRef<HTMLDivElement>(null);

  // Extract unique languages, repo types, and branch types
  const languages = useMemo(() => {
    const langs = new Set<string>();
    options.forEach(opt => {
      const parts = opt.value.split('_');
      if (parts.length >= 3) langs.add(parts[0]);
    });
    return Array.from(langs).sort();
  }, [options]);

  const branchTypes = useMemo(() => {
    if (!selectedLanguage) return [];
    const types = new Set<string>();
    options.forEach(opt => {
      const parts = opt.value.split('_');
      if (parts.length >= 3 && parts[0] === selectedLanguage) {
        types.add(parts[2]); // branch type is at index 2
      }
    });
    // Sort with 'new' before 'existing'
    return Array.from(types).sort((a, b) => {
      if (a === 'new') return -1;
      if (b === 'new') return 1;
      return a.localeCompare(b);
    });
  }, [selectedLanguage, options]);

  const repoTypes = useMemo(() => {
    if (!selectedLanguage || !selectedBranchType) return [];
    const types = new Set<string>();
    options.forEach(opt => {
      const parts = opt.value.split('_');
      if (parts.length >= 3 && parts[0] === selectedLanguage && parts[2] === selectedBranchType) {
        types.add(parts[1]); // repo type is at index 1
      }
    });
    // Sort with 'public' before 'private'
    return Array.from(types).sort((a, b) => {
      if (a === 'public') return -1;
      if (b === 'public') return 1;
      return a.localeCompare(b);
    });
  }, [selectedLanguage, selectedBranchType, options]);

  // Get the option object for a given value
  const getOptionByValue = (value: string) => {
    return options.find(opt => opt.value === value);
  };

  // Get label for language
  const getLanguageLabel = (lang: string) => {
    const option = options.find(opt => opt.value.startsWith(lang + '_'));
    return lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Get label for repo type
  const getRepoTypeLabel = (type: string) => {
    return type === 'public' ? '🌐 Public Repository' : '🔒 Private Repository';
  };

  // Get label for branch type
  const getBranchTypeLabel = (type: string) => {
    return type === 'new' ? '🆕 New Branch' : '📋 Existing Branch';
  };

  // Calculate final option value and get its label
  const getFinalOption = () => {
    if (!selectedLanguage || !selectedRepoType || !selectedOptions.length) return null;
    const option = getOptionByValue(selectedOptions[0]);
    return option;
  };

  const handleLanguageSelect = (lang: string) => {
    setSelectedLanguage(lang);
    setSelectedBranchType(null);
    setSelectedRepoType(null);
    setBranchName('');
    setRepoUrl('');
    setInstallationId('');
    setStep('branchType');
  };

  const handleBranchTypeSelect = (type: string) => {
    setSelectedBranchType(type);
    setSelectedRepoType(null);
    setRepoUrl('');
    setInstallationId('');
    setStep('repoType');
  };

  const handleRepoTypeSelect = (type: string) => {
    setSelectedRepoType(type);
    const value = `${selectedLanguage}_${type}_${selectedBranchType}`;
    const option = getOptionByValue(value);
    if (option) {
      onToggleOption(value);
    }
  };

  const handleBack = () => {
    if (step === 'branchType') {
      setSelectedLanguage(null);
      setStep('language');
    } else if (step === 'repoType') {
      setSelectedBranchType(null);
      setStep('branchType');
    }
  };

  return (
    <div ref={containerRef} className="space-y-4 bg-gradient-to-br from-slate-900/50 to-slate-800/30 rounded-xl p-4 border border-slate-700/50 backdrop-blur-sm">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 flex-1">
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step === 'language' || step === 'branchType' || step === 'repoType'
                ? 'bg-teal-500/20 border border-teal-500 text-teal-300'
                : 'bg-slate-700/50 border border-slate-600 text-slate-400'
            }`}>
              1
            </div>
            <span className="text-xs text-slate-400">Language</span>
          </div>

          {/* Connector 1 */}
          <div className={`flex-1 h-0.5 transition-all ${
            step === 'branchType' || step === 'repoType'
              ? 'bg-gradient-to-r from-teal-500 to-teal-500/50'
              : 'bg-slate-700/30'
          }`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step === 'branchType' || step === 'repoType'
                ? 'bg-teal-500/20 border border-teal-500 text-teal-300'
                : 'bg-slate-700/50 border border-slate-600 text-slate-400'
            }`}>
              2
            </div>
            <span className="text-xs text-slate-400">Branch</span>
          </div>

          {/* Connector 2 */}
          <div className={`flex-1 h-0.5 transition-all ${
            step === 'repoType'
              ? 'bg-gradient-to-r from-teal-500 to-teal-500/50'
              : 'bg-slate-700/30'
          }`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step === 'repoType'
                ? 'bg-teal-500/20 border border-teal-500 text-teal-300'
                : 'bg-slate-700/50 border border-slate-600 text-slate-400'
            }`}>
              3
            </div>
            <span className="text-xs text-slate-400">Repository</span>
          </div>
        </div>
      </div>

      {/* Step 1: Language Selection */}
      {step === 'language' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Choose your language</h3>
            <Tooltip text="Select the primary programming language for your project">
              <HelpCircle size={16} className="text-slate-400 hover:text-teal-400 transition-colors" />
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {languages.map(lang => (
              <div key={lang} className="relative">
                <button
                  onClick={() => handleLanguageSelect(lang)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-600/60 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-teal-300 transition-all duration-300 text-center text-sm font-medium overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">{getLanguageLabel(lang)}</span>
                </button>
                <div
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-teal-500/20 transition-colors cursor-help group"
                  onMouseEnter={() => setExpandedInfo(`lang-${lang}`)}
                  onMouseLeave={() => setExpandedInfo(null)}
                >
                  <HelpCircle size={16} className="text-slate-400 group-hover:text-teal-400" />
                  {expandedInfo === `lang-${lang}` && (
                    <div className="absolute top-full right-0 mt-2 z-50 animate-slideDown" data-info-box>
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/50 rounded-lg p-3 shadow-lg w-56">
                        <div className="flex gap-2">
                          <div className="text-teal-400 text-lg flex-shrink-0">💡</div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {lang === 'python' ? 'Python: Great for AI, data science, and backend services' : 'Java: Enterprise-grade, scalable applications'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Step 2: Branch Type Selection */}
      {step === 'branchType' && selectedLanguage && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Choose branch strategy</h3>
            <Tooltip text="Decide whether to create a new branch or use an existing one">
              <HelpCircle size={16} className="text-slate-400 hover:text-teal-400 transition-colors" />
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {branchTypes.map(type => (
              <div key={type} className="relative">
                <button
                  onClick={() => handleBranchTypeSelect(type)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-600/60 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-teal-300 transition-all duration-300 text-center text-sm font-medium overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">{getBranchTypeLabel(type)}</span>
                </button>
                <div
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-teal-500/20 transition-colors cursor-help group"
                  onMouseEnter={() => setExpandedInfo(`branch-${type}`)}
                  onMouseLeave={() => setExpandedInfo(null)}
                >
                  <HelpCircle size={16} className="text-slate-400 group-hover:text-teal-400" />
                  {expandedInfo === `branch-${type}` && (
                    <div className="absolute top-full right-0 mt-2 z-50 animate-slideDown" data-info-box>
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/50 rounded-lg p-3 shadow-lg w-56">
                        <div className="flex gap-2">
                          <div className="text-teal-400 text-lg flex-shrink-0">💡</div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {type === 'new' ? 'New Branch: Creates a fresh branch for your project' : 'Existing Branch: Use an already created branch in your repository'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Branch Name Input - for existing branch */}
          {selectedBranchType === 'existing' && (
            <div className="mt-4 p-3 bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-lg border border-teal-500/30 animate-slideDown">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-semibold text-teal-300 uppercase tracking-wide">
                  📝 Branch Name
                </label>
                <Tooltip text="Enter the exact name of your existing branch (e.g., main, develop, feature/my-feature)">
                  <HelpCircle size={14} className="text-slate-400 hover:text-teal-400 transition-colors" />
                </Tooltip>
              </div>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g., main, develop, feature/xyz"
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none text-sm transition-all duration-200"
              />
            </div>
          )}
        </div>
      )}

      {/* Step 3: Repository Type Selection */}
      {step === 'repoType' && selectedLanguage && selectedBranchType && (
        <div className="space-y-3 animate-fadeIn">
          {/* Show branch name if existing branch was selected */}
          {selectedBranchType === 'existing' && (
            <div className="p-3 bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-lg border border-teal-500/30">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-semibold text-teal-300 uppercase tracking-wide">
                  📝 Branch Name
                </label>
                <Tooltip text="Enter the exact name of your existing branch (e.g., main, develop, feature/my-feature)">
                  <HelpCircle size={14} className="text-slate-400 hover:text-teal-400 transition-colors" />
                </Tooltip>
              </div>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g., main, develop, feature/xyz"
                className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none text-sm transition-all duration-200"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-200">Choose repository type</h3>
            <Tooltip text="Select whether your repository is public or private">
              <HelpCircle size={16} className="text-slate-400 hover:text-teal-400 transition-colors" />
            </Tooltip>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {repoTypes.map(type => (
              <div key={type} className="relative">
                <button
                  onClick={() => handleRepoTypeSelect(type)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-600/60 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-teal-300 transition-all duration-300 text-center text-sm font-medium overflow-hidden relative group"
                >
                  <div className="absolute inset-0 bg-gradient-to-r from-teal-500/0 via-teal-500/10 to-teal-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                  <span className="relative">{getRepoTypeLabel(type)}</span>
                </button>
                <div
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-teal-500/20 transition-colors cursor-help group"
                  onMouseEnter={() => setExpandedInfo(`repo-${type}`)}
                  onMouseLeave={() => setExpandedInfo(null)}
                >
                  <HelpCircle size={16} className="text-slate-400 group-hover:text-teal-400" />
                  {expandedInfo === `repo-${type}` && (
                    <div className="absolute top-full right-0 mt-2 z-50 animate-slideDown" data-info-box>
                      <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/50 rounded-lg p-3 shadow-lg w-56">
                        <div className="flex gap-2">
                          <div className="text-teal-400 text-lg flex-shrink-0">💡</div>
                          <p className="text-xs text-slate-200 leading-relaxed">
                            {type === 'public' ? 'Public: Anyone can access your repository' : 'Private: Only authorized users can access your repository'}
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>

          {/* Additional fields for private repo + existing branch */}
          {selectedRepoType === 'private' && selectedBranchType === 'existing' && (
            <div className="space-y-3 p-3 bg-gradient-to-br from-slate-800/50 to-slate-900/30 rounded-lg border border-teal-500/30 animate-slideDown">
              <div className="bg-gradient-to-br from-slate-800 to-slate-900 border border-teal-500/50 rounded-lg p-3 shadow-lg">
                <div className="flex gap-3">
                  <div className="text-teal-400 text-xl flex-shrink-0">🔐</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-teal-300 mb-1">Private Repository Credentials</p>
                    <p className="text-xs text-slate-200 leading-relaxed mb-2">
                      To connect, I just need your <strong>Repo URL</strong> and the <strong>GitHub App Installation ID</strong>.
                    </p>
                    <div className="relative inline-block">
                      <div
                        className="text-xs text-teal-400 hover:text-teal-300 flex items-center gap-1 transition-colors cursor-help"
                        onMouseEnter={() => setShowSetupTooltip(true)}
                        onMouseLeave={() => setShowSetupTooltip(false)}
                      >
                        <HelpCircle size={14} />
                        <span>Setup</span>
                      </div>
                      {showSetupTooltip && (
                        <div className="absolute bottom-full left-0 mb-2 w-48 p-2 bg-slate-900 border border-teal-500/50 rounded-lg text-xs text-slate-200 z-50 shadow-lg animate-slideDown">
                          Go to <a href="https://github.com/apps/cyoda-ai-assistant" target="_blank" rel="noopener noreferrer" className="text-teal-400 hover:text-teal-300 underline">github.com/apps/cyoda-ai-assistant</a>, click Install, and copy the ID from the URL.
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-semibold text-teal-300 uppercase tracking-wide">
                    🔗 Repository URL
                  </label>
                  <Tooltip text="Your GitHub repository URL (e.g., https://github.com/username/repo-name)">
                    <HelpCircle size={14} className="text-slate-400 hover:text-teal-400 transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none text-sm transition-all duration-200"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-semibold text-teal-300 uppercase tracking-wide">
                    🔑 Installation ID
                  </label>
                  <Tooltip text="Go to https://github.com/apps/cyoda-ai-assistant, click Install, and copy the ID from the URL (e.g., 12345678)">
                    <HelpCircle size={14} className="text-slate-400 hover:text-teal-400 transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  value={installationId}
                  onChange={(e) => setInstallationId(e.target.value)}
                  placeholder="12345678"
                  className="w-full px-3 py-2 bg-slate-900/50 border border-slate-600/50 rounded-lg text-slate-200 placeholder-slate-500 focus:border-teal-500 focus:ring-1 focus:ring-teal-500/30 focus:outline-none text-sm transition-all duration-200"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Box - Show all recorded information */}
      {(selectedLanguage || selectedBranchType || selectedRepoType || branchName || repoUrl || installationId) && (
        <div className="p-3 bg-gradient-to-r from-teal-500/10 to-cyan-500/10 border border-teal-500/40 rounded-lg animate-slideDown">
          <p className="text-xs text-teal-300 space-y-1">
            {selectedLanguage && (
              <div className="flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span><strong>Language:</strong> {getLanguageLabel(selectedLanguage)}</span>
              </div>
            )}
            {selectedBranchType && (
              <div className="flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span><strong>Branch Strategy:</strong> {getBranchTypeLabel(selectedBranchType)}</span>
              </div>
            )}
            {selectedBranchType === 'existing' && branchName && (
              <div className="flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span><strong>Branch Name:</strong> {branchName}</span>
              </div>
            )}
            {selectedRepoType && (
              <div className="flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span><strong>Repository Type:</strong> {getRepoTypeLabel(selectedRepoType)}</span>
              </div>
            )}
            {selectedRepoType === 'private' && repoUrl && (
              <div className="flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span><strong>Repository URL:</strong> {repoUrl}</span>
              </div>
            )}
            {selectedRepoType === 'private' && installationId && (
              <div className="flex items-start gap-2">
                <span className="text-sm">✓</span>
                <span><strong>Installation ID:</strong> {installationId}</span>
              </div>
            )}
          </p>
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex gap-2 pt-2">
        {step !== 'language' && (
          <button
            onClick={handleBack}
            className="px-4 py-2.5 rounded-lg border border-slate-600/60 bg-slate-800/40 hover:bg-slate-800/80 text-slate-300 hover:text-slate-200 transition-all duration-300 flex items-center justify-center gap-1.5 text-sm font-medium"
          >
            <ChevronLeft size={16} />
            <span>Back</span>
          </button>
        )}
        <button
          onClick={() => {
            const formattedLines: string[] = [];
            formattedLines.push(`Language: ${getLanguageLabel(selectedLanguage || '')}`);
            formattedLines.push(`Branch Strategy: ${getBranchTypeLabel(selectedBranchType || '')}`);
            if (selectedBranchType === 'existing' && branchName) {
              formattedLines.push(`Branch Name: ${branchName}`);
            }
            formattedLines.push(`Repository Type: ${getRepoTypeLabel(selectedRepoType || '')}`);
            if (selectedRepoType === 'private' && repoUrl) {
              formattedLines.push(`Repository URL: ${repoUrl}`);
            }
            if (selectedRepoType === 'private' && installationId) {
              formattedLines.push(`GitHub Installation ID: ${installationId}`);
            }
            const formattedData = formattedLines.join('\n');
            onSubmit(formattedData);
          }}
          disabled={isSubmitting || selectedOptions.length === 0}
          className="flex-1 px-4 py-2.5 rounded-lg bg-gradient-to-r from-teal-500 to-cyan-600 hover:from-teal-600 hover:to-cyan-700 text-white font-semibold text-sm transition-all duration-300 shadow-lg hover:shadow-xl hover:shadow-teal-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5"
        >
          <Send size={16} />
          <span>Confirm</span>
        </button>
      </div>
    </div>
  );
};

export default WizardOptionSelection;

