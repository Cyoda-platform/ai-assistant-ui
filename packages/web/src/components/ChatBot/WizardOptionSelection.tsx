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
        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-white border border-slate-200 rounded text-xs text-slate-700 whitespace-nowrap z-50 shadow-md pointer-events-none">
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
  const containerRef = React.useRef<HTMLDivElement>(null);
  const [isNarrow, setIsNarrow] = useState<boolean>(false);

  // Check container width to determine if we should use narrow layout
  React.useEffect(() => {
    const checkWidth = () => {
      if (containerRef.current) {
        const width = containerRef.current.offsetWidth;
        // Use narrow layout if width is less than 500px
        setIsNarrow(width < 500);
      }
    };

    checkWidth();
    window.addEventListener('resize', checkWidth);

    // Use ResizeObserver for better detection of container size changes
    const resizeObserver = new ResizeObserver(checkWidth);
    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => {
      window.removeEventListener('resize', checkWidth);
      resizeObserver.disconnect();
    };
  }, []);

  // Extract unique languages, repo types, and branch types
  // Parse option value to extract language, repo type, and branch type
  const parseOptionValue = (value: string) => {
    // Handle markdown-generated values like "python_—_public_repo_—_new_branch"
    // or labels like "Python — Public repo — New Branch"
    if (value.includes('—')) {
      // Split by em dash (with or without underscores around it)
      const parts = value.split(/[_\s]*—[_\s]*/).map(p => p.trim().replace(/_/g, ' '));
      if (parts.length >= 3) {
        const language = parts[0].toLowerCase();
        const repoType = parts[1].toLowerCase().includes('public') ? 'public' : 'private';
        const branchType = parts[2].toLowerCase().includes('new') ? 'new' : 'existing';
        return { language, repoType, branchType };
      }
    }
    // Old format: "python_public_new"
    const parts = value.split('_');
    if (parts.length >= 3) {
      return { language: parts[0], repoType: parts[1], branchType: parts[2] };
    }
    return null;
  };

  const languages = useMemo(() => {
    const langs = new Set<string>();
    options.forEach(opt => {
      const parsed = parseOptionValue(opt.value);
      if (parsed) langs.add(parsed.language);
    });
    return Array.from(langs).sort();
  }, [options]);

  const branchTypes = useMemo(() => {
    if (!selectedLanguage) return [];
    const types = new Set<string>();
    options.forEach(opt => {
      const parsed = parseOptionValue(opt.value);
      if (parsed && parsed.language === selectedLanguage) {
        types.add(parsed.branchType);
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
      const parsed = parseOptionValue(opt.value);
      if (parsed && parsed.language === selectedLanguage && parsed.branchType === selectedBranchType) {
        types.add(parsed.repoType);
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

  // Map shorthand values to full descriptive text
  const mapValueToDescriptive = (value: string): string => {
    const mapping: { [key: string]: string } = {
      'python_public_new': 'Python — Public repo — New Branch',
      'python_public_existing': 'Python — Public repo — My Existing Branch',
      'python_private_new': 'Python — Private repo — New Branch',
      'python_private_existing': 'Python — Private repo — My Existing Branch',
      'java_public_new': 'Java — Public repo — New Branch',
      'java_public_existing': 'Java — Public repo — My Existing Branch',
      'java_private_new': 'Java — Private repo — New Branch',
      'java_private_existing': 'Java — Private repo — My Existing Branch',
    };
    return mapping[value] || value;
  };

  // Get label for language
  const getLanguageLabel = (lang: string) => {
    const labels: { [key: string]: string } = {
      python: "I'm building a Python project",
      java: 'I want to build with Java'
    };
    return labels[lang] || lang.charAt(0).toUpperCase() + lang.slice(1);
  };

  // Get description for language
  const getLanguageDescription = (lang: string) => {
    const descriptions: { [key: string]: string } = {
      python: 'Perfect for AI, data science, and backend services',
      java: 'Enterprise-grade, scalable applications'
    };
    return descriptions[lang] || '';
  };

  // Get label for repo type
  const getRepoTypeLabel = (type: string) => {
    return type === 'public' ? 'I am ok with a public repository' : 'I will use my private repository';
  };

  // Get description for repo type
  const getRepoTypeDescription = (type: string) => {
    return type === 'public' ? 'Anyone can access your repository' : 'Only authorized users can access your repository';
  };

  // Get label for branch type
  const getBranchTypeLabel = (type: string) => {
    return type === 'new' ? 'Set up a fresh branch' : 'Continue with an existing branch';
  };

  // Get description for branch type
  const getBranchTypeDescription = (type: string) => {
    return type === 'new' ? 'Creates a fresh branch for your project' : 'Use an already created branch in your repository';
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

    // Build the value to match the option format (old or new)
    let value: string | null = null;

    // Try to find matching option by checking all options
    const matchingOption = options.find(opt => {
      const parsed = parseOptionValue(opt.value);
      return parsed &&
        parsed.language === selectedLanguage &&
        parsed.repoType === type &&
        parsed.branchType === selectedBranchType;
    });

    if (matchingOption) {
      value = matchingOption.value;
      onToggleOption(value);
    }
  };

  const handleBack = () => {
    if (step === 'branchType') {
      setSelectedLanguage(null);
      setSelectedBranchType(null);
      setSelectedRepoType(null);
      setBranchName('');
      setRepoUrl('');
      setInstallationId('');
      setStep('language');
    } else if (step === 'repoType') {
      setSelectedBranchType(null);
      setSelectedRepoType(null);
      setBranchName('');
      setRepoUrl('');
      setInstallationId('');
      setStep('branchType');
    }
  };

  return (
    <div ref={containerRef} className="space-y-4 bg-slate-50 rounded-xl p-4 border border-slate-200">
      {/* Progress Steps */}
      <div className="flex items-center justify-between">
        <div className={`flex items-center flex-1 ${isNarrow ? 'gap-1' : 'gap-3'}`}>
          {/* Step 1 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`${isNarrow ? 'w-7 h-7' : 'w-8 h-8'} rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step === 'language' || step === 'branchType' || step === 'repoType'
                ? 'bg-teal-50 border border-teal-500 text-teal-700'
                : 'bg-slate-100 border border-slate-300 text-slate-400'
            }`}>
              1
            </div>
            <span className={`${isNarrow ? 'text-[10px]' : 'text-xs'} text-slate-500 whitespace-nowrap`}>Language</span>
          </div>

          {/* Connector 1 */}
          <div className={`flex-1 h-0.5 transition-all ${
            step === 'branchType' || step === 'repoType'
              ? 'bg-gradient-to-r from-teal-500 to-teal-500/50'
              : 'bg-slate-200'
          }`}></div>

          {/* Step 2 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`${isNarrow ? 'w-7 h-7' : 'w-8 h-8'} rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step === 'branchType' || step === 'repoType'
                ? 'bg-teal-50 border border-teal-500 text-teal-700'
                : 'bg-slate-100 border border-slate-300 text-slate-400'
            }`}>
              2
            </div>
            <span className={`${isNarrow ? 'text-[10px]' : 'text-xs'} text-slate-500 whitespace-nowrap`}>Branch</span>
          </div>

          {/* Connector 2 */}
          <div className={`flex-1 h-0.5 transition-all ${
            step === 'repoType'
              ? 'bg-gradient-to-r from-teal-500 to-teal-500/50'
              : 'bg-slate-200'
          }`}></div>

          {/* Step 3 */}
          <div className="flex flex-col items-center gap-1">
            <div className={`${isNarrow ? 'w-7 h-7' : 'w-8 h-8'} rounded-full flex items-center justify-center text-xs font-semibold transition-all ${
              step === 'repoType'
                ? 'bg-teal-50 border border-teal-500 text-teal-700'
                : 'bg-slate-100 border border-slate-300 text-slate-400'
            }`}>
              3
            </div>
            <span className={`${isNarrow ? 'text-[10px]' : 'text-xs'} text-slate-500 whitespace-nowrap`}>Repository</span>
          </div>
        </div>
      </div>

      {/* Step 1: Language Selection */}
      {step === 'language' && (
        <div className="space-y-3 animate-fadeIn">
          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Choose your language</h3>
            <Tooltip text="Select the primary programming language for your project">
              <HelpCircle size={16} className="text-slate-400 hover:text-teal-600 transition-colors" />
            </Tooltip>
          </div>
          <div className={`grid gap-3 ${isNarrow ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {languages.map(lang => (
              <div key={lang} className="relative">
                <button
                  onClick={() => handleLanguageSelect(lang)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-colors text-center relative group"
                >
                  <div></div>
                  <div className="relative">
                    <p className="text-sm font-medium">{getLanguageLabel(lang)}</p>
                    <p className="text-xs text-slate-500 mt-1">{getLanguageDescription(lang)}</p>
                  </div>
                </button>
                <div
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-50 transition-colors cursor-help group"
                  onMouseEnter={() => setExpandedInfo(`lang-${lang}`)}
                  onMouseLeave={() => setExpandedInfo(null)}
                >
                  <HelpCircle size={16} className="text-slate-400 group-hover:text-teal-600" />
                  {expandedInfo === `lang-${lang}` && (
                    <div className="absolute top-full right-0 mt-2 z-50 animate-slideDown" data-info-box>
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md w-56">
                        <div className="flex gap-2">
                          <div className="text-teal-600 text-lg flex-shrink-0">💡</div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {getLanguageDescription(lang)}
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
            <h3 className="text-sm font-semibold text-slate-800">Choose branch strategy</h3>
            <Tooltip text="Decide whether to create a new branch or use an existing one">
              <HelpCircle size={16} className="text-slate-400 hover:text-teal-600 transition-colors" />
            </Tooltip>
          </div>
          <div className={`grid gap-3 ${isNarrow ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {branchTypes.map(type => (
              <div key={type} className="relative">
                <button
                  onClick={() => handleBranchTypeSelect(type)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-colors text-center relative group"
                >
                  <div></div>
                  <div className="relative">
                    <p className="text-sm font-medium">{getBranchTypeLabel(type)}</p>
                    <p className="text-xs text-slate-500 mt-1">{getBranchTypeDescription(type)}</p>
                  </div>
                </button>
                <div
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-50 transition-colors cursor-help group"
                  onMouseEnter={() => setExpandedInfo(`branch-${type}`)}
                  onMouseLeave={() => setExpandedInfo(null)}
                >
                  <HelpCircle size={16} className="text-slate-400 group-hover:text-teal-600" />
                  {expandedInfo === `branch-${type}` && (
                    <div className="absolute top-full right-0 mt-2 z-50 animate-slideDown" data-info-box>
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md w-56">
                        <div className="flex gap-2">
                          <div className="text-teal-600 text-lg flex-shrink-0">💡</div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {getBranchTypeDescription(type)}
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
            <div className="mt-4 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-slideDown">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Branch Name
                </label>
                <Tooltip text="Enter the exact name of your existing branch (e.g., main, develop, feature/my-feature)">
                  <HelpCircle size={14} className="text-slate-400 hover:text-teal-600 transition-colors" />
                </Tooltip>
              </div>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g., main, develop, feature/xyz"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-sm transition-colors"
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
            <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center gap-2 mb-2">
                <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                  Branch Name
                </label>
                <Tooltip text="Enter the exact name of your existing branch (e.g., main, develop, feature/my-feature)">
                  <HelpCircle size={14} className="text-slate-400 hover:text-teal-600 transition-colors" />
                </Tooltip>
              </div>
              <input
                type="text"
                value={branchName}
                onChange={(e) => setBranchName(e.target.value)}
                placeholder="e.g., main, develop, feature/xyz"
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-sm transition-colors"
              />
            </div>
          )}

          <div className="flex items-center gap-2">
            <h3 className="text-sm font-semibold text-slate-800">Choose repository type</h3>
            <Tooltip text="Select whether your repository is public or private">
              <HelpCircle size={16} className="text-slate-400 hover:text-teal-600 transition-colors" />
            </Tooltip>
          </div>
          <div className={`grid gap-3 ${isNarrow ? 'grid-cols-1' : 'grid-cols-2'}`}>
            {repoTypes.map(type => (
              <div key={type} className="relative">
                <button
                  onClick={() => handleRepoTypeSelect(type)}
                  className="w-full px-4 py-3 rounded-lg border border-slate-200 bg-white hover:bg-blue-50 hover:border-blue-300 text-slate-700 hover:text-blue-700 transition-colors text-center relative group"
                >
                  <div></div>
                  <div className="relative">
                    <p className="text-sm font-medium">{getRepoTypeLabel(type)}</p>
                    <p className="text-xs text-slate-500 mt-1">{getRepoTypeDescription(type)}</p>
                  </div>
                </button>
                <div
                  className="absolute top-2 right-2 p-1 rounded-full hover:bg-blue-50 transition-colors cursor-help group"
                  onMouseEnter={() => setExpandedInfo(`repo-${type}`)}
                  onMouseLeave={() => setExpandedInfo(null)}
                >
                  <HelpCircle size={16} className="text-slate-400 group-hover:text-teal-600" />
                  {expandedInfo === `repo-${type}` && (
                    <div className="absolute top-full right-0 mt-2 z-50 animate-slideDown" data-info-box>
                      <div className="bg-white border border-slate-200 rounded-lg p-3 shadow-md w-56">
                        <div className="flex gap-2">
                          <div className="text-teal-600 text-lg flex-shrink-0">💡</div>
                          <p className="text-xs text-slate-700 leading-relaxed">
                            {getRepoTypeDescription(type)}
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
            <div className="space-y-3 p-3 bg-blue-50 rounded-lg border border-blue-200 animate-slideDown">
              <div className="bg-white border border-blue-200 rounded-lg p-3">
                <div className="flex gap-3">
                  <div className="text-blue-600 text-xl flex-shrink-0">🔐</div>
                  <div className="flex-1">
                    <p className="text-xs font-semibold text-blue-700 mb-2">Private Repository Credentials</p>
                    <p className="text-xs text-slate-700 leading-relaxed mb-3">
                      To connect, I need your <strong>Repo URL</strong> and <strong>GitHub App Installation ID</strong>.
                    </p>
                    <p className="text-xs text-slate-600 leading-relaxed">
                      Don't have the Installation ID? Go to <a href="https://github.com/apps/cyoda-ai-assistant" target="_blank" rel="noopener noreferrer" className="text-teal-600 hover:text-teal-700 underline">github.com/apps/cyoda-ai-assistant</a>, click Install, and copy the ID from the URL.
                    </p>
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Repository URL
                  </label>
                  <Tooltip text="Your GitHub repository URL (e.g., https://github.com/username/repo-name)">
                    <HelpCircle size={14} className="text-slate-400 hover:text-teal-600 transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  value={repoUrl}
                  onChange={(e) => setRepoUrl(e.target.value)}
                  placeholder="https://github.com/user/repo"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-sm transition-colors"
                />
              </div>

              <div>
                <div className="flex items-center gap-2 mb-2">
                  <label className="text-xs font-semibold text-blue-700 uppercase tracking-wide">
                    Installation ID
                  </label>
                  <Tooltip text="Go to https://github.com/apps/cyoda-ai-assistant, click Install, and copy the ID from the URL (e.g., 12345678)">
                    <HelpCircle size={14} className="text-slate-400 hover:text-teal-600 transition-colors" />
                  </Tooltip>
                </div>
                <input
                  type="text"
                  value={installationId}
                  onChange={(e) => setInstallationId(e.target.value)}
                  placeholder="12345678"
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 placeholder-slate-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500/30 focus:outline-none text-sm transition-colors"
                />
              </div>
            </div>
          )}
        </div>
      )}

      {/* Summary Box - Show all recorded information */}
      {(selectedLanguage || selectedBranchType || selectedRepoType || branchName || repoUrl || installationId) && (
        <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg animate-slideDown">
          <div className="text-xs text-slate-700 space-y-1">
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
          </div>
        </div>
      )}

      {/* Action Buttons */}
      <div className={`flex gap-2 pt-2 ${isNarrow ? 'flex-col' : 'flex-row'}`}>
        {step !== 'language' && (
          <button
            onClick={handleBack}
            className={`${isNarrow ? 'w-full' : 'w-auto'} px-4 py-2.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-slate-600 hover:text-slate-900 transition-colors flex items-center justify-center gap-1.5 text-sm font-medium`}
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
          className={`${isNarrow ? 'w-full' : 'flex-1'} px-4 py-2.5 rounded-lg bg-teal-50 border border-teal-500 text-teal-700 hover:bg-teal-100 font-medium text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-1.5`}
        >
          <Send size={16} />
          <span>Send</span>
        </button>
      </div>
    </div>
  );
};

export default WizardOptionSelection;

