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
    <div className="space-y-4 p-4 bg-slate-800/30 rounded-2xl border border-slate-700/50">
      {/* Question */}
      <div className="text-sm font-medium text-slate-200">
        {question}
      </div>

      {/* Warning Message */}
      {warning && (
        <div className="flex items-start space-x-2 p-3 bg-amber-900/20 border border-amber-700/30 rounded-lg">
          <AlertCircle size={16} className="text-amber-400 flex-shrink-0 mt-0.5" />
          <p className="text-xs text-amber-200">{warning}</p>
        </div>
      )}

      {/* Deployment Options */}
      <div className="space-y-2">
        {options.map((option) => (
          <label
            key={option.value}
            className="flex items-start space-x-3 p-3 rounded-lg border border-slate-600/50 hover:border-slate-500 cursor-pointer transition-colors"
            style={{
              backgroundColor: selectedOption === option.value ? 'rgba(20, 184, 166, 0.1)' : 'rgba(15, 23, 42, 0.5)'
            }}
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
      <div className="flex items-center space-x-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!selectedOption || isSubmitting}
          className="flex items-center space-x-2 px-4 py-2 bg-teal-600 hover:bg-teal-700 disabled:bg-slate-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
        >
          <Send size={16} />
          <span>Select</span>
        </button>

        <button
          onClick={handleOpenEnvironment}
          disabled={isSubmitting}
          className="flex items-center space-x-2 px-4 py-2 bg-slate-700 hover:bg-slate-600 disabled:bg-slate-700 disabled:cursor-not-allowed text-slate-200 text-sm font-medium rounded-lg transition-colors"
        >
          <Cloud size={16} />
          <span>Open Env Window</span>
        </button>
      </div>
    </div>
  );
};

export default DeploymentOptionsUI;

