import React, { useState } from 'react';
import { Cloud, AlertCircle, Send } from 'lucide-react';

interface DeploymentOption {
  value: string;
  label: string;
  description: string;
}

interface DeploymentOptionsUIProps {
  hook: any;
  onSelectOption: (option: string) => void;
  isSubmitting?: boolean;
}

const DeploymentOptionsUI: React.FC<DeploymentOptionsUIProps> = ({
  hook,
  onSelectOption,
  isSubmitting = false
}) => {
  const [selectedOption, setSelectedOption] = useState<string>('');

  const options: DeploymentOption[] = hook?.data?.options || [];
  const warning = hook?.data?.warning;
  const question = hook?.data?.question || 'What would you like to do?';

  const handleSelectOption = (value: string) => {
    setSelectedOption(value);
  };

  const handleSubmit = () => {
    if (selectedOption) {
      console.log('[DeploymentOptionsUI] Submitting option:', selectedOption);
      onSelectOption(selectedOption);
      setSelectedOption('');
    }
  };

  const handleOpenEnvironment = () => {
    // Dispatch event to open environments panel
    // This will be caught by the main app component
    const event = new CustomEvent('openEnvironmentsPanel', {
      detail: { tab: 'cloud', action: 'open' }
    });
    window.dispatchEvent(event);

    // Also try to trigger via localStorage for cross-tab communication
    try {
      localStorage.setItem('openEnvironmentsPanel', JSON.stringify({
        timestamp: Date.now(),
        tab: 'cloud'
      }));
    } catch (e) {
      console.warn('Could not set localStorage:', e);
    }
  };

  return (
    <div className="space-y-3">
      {/* Question */}
      <div className="text-xs font-medium text-slate-300">
        {question}
      </div>

      {/* Warning Message */}
      {warning && (
        <div className="flex items-start space-x-2 p-3 bg-amber-900/20 border border-amber-700/30 rounded-2xl">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">{warning}</p>
        </div>
      )}

      {/* Deployment Options */}
      <div className="grid gap-2">
        {options.map((option) => (
          <label
            key={option.value}
            className={`flex items-start space-x-3 p-3 rounded-2xl border cursor-pointer transition-all duration-200 ${
              selectedOption === option.value
                ? 'border-teal-500/70 bg-teal-500/15 shadow-lg shadow-teal-500/10'
                : 'border-slate-700/40 bg-slate-800/20 hover:border-teal-500/40 hover:bg-slate-800/40'
            }`}
          >
            <input
              type="radio"
              name="deployment-option"
              value={option.value}
              checked={selectedOption === option.value}
              onChange={() => handleSelectOption(option.value)}
              className="mt-1 w-4 h-4 text-teal-500 cursor-pointer"
              disabled={isSubmitting}
            />
            <div className="flex-1 min-w-0">
              <div className="text-sm font-medium text-slate-200">
                {option.label}
              </div>
              <div className="text-xs text-slate-400 mt-0.5">
                {option.description}
              </div>
            </div>
          </label>
        ))}
      </div>

      {/* Action Buttons */}
      <div className="flex items-center space-x-2 pt-1">
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full backdrop-blur-md bg-slate-700/40 border border-slate-600/50 hover:bg-slate-600/50 hover:border-slate-500/60 disabled:bg-slate-800/40 disabled:border-slate-700/30 disabled:opacity-50 text-slate-200 hover:text-white disabled:text-slate-500 text-sm font-medium transition-all duration-200 shadow-lg hover:shadow-slate-500/20 disabled:shadow-none disabled:cursor-not-allowed"
        >
          <Send size={16} />
          <span>Select</span>
        </button>

        <button
          onClick={handleOpenEnvironment}
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-4 py-2.5 rounded-full backdrop-blur-md bg-slate-700/30 border border-slate-600/40 hover:bg-slate-700/40 hover:border-slate-600/50 disabled:bg-slate-800/20 disabled:border-slate-700/20 disabled:cursor-not-allowed text-slate-300 hover:text-slate-200 disabled:text-slate-600 text-sm font-medium transition-all duration-200"
        >
          <Cloud size={16} />
          <span>Open Env Window</span>
        </button>
      </div>
    </div>
  );
};

export default DeploymentOptionsUI;

