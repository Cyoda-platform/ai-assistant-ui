import React from 'react';
import { AlertTriangle, CheckCircle2, X } from 'lucide-react';

export interface ValidationResult {
  passed: boolean;
  expectedEntities: number;
  actualEntities: number;
  expectedWorkflows: number;
  actualWorkflows: number;
  missingEntities: string[];
  missingWorkflows: string[];
  generatedEntities: string[];
  generatedWorkflows: string[];
}

interface ValidationWarningBannerProps {
  validation: ValidationResult | null;
  onDismiss: () => void;
  onRegenerateMissing?: () => void;
}

export const ValidationWarningBanner: React.FC<ValidationWarningBannerProps> = ({
  validation,
  onDismiss,
  onRegenerateMissing,
}) => {
  if (!validation) return null;

  const hasMissing = validation.missingEntities.length > 0 || validation.missingWorkflows.length > 0;

  if (validation.passed && !hasMissing) {
    // All items generated successfully
    return (
      <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4 shadow-sm">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <CheckCircle2 className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <h4 className="text-sm font-semibold text-green-900 mb-1">
                ✅ Generation Validation: PASSED
              </h4>
              <p className="text-sm text-green-700">
                All expected items were successfully generated ({validation.actualEntities} entities, {validation.actualWorkflows} workflows)
              </p>
            </div>
          </div>
          <button
            onClick={onDismiss}
            className="text-green-600 hover:text-green-800 p-1 rounded-md hover:bg-green-100"
            aria-label="Dismiss"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    );
  }

  // Some items missing
  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-4 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex items-start gap-3 flex-1">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div className="flex-1">
            <h4 className="text-sm font-semibold text-amber-900 mb-2">
              ⚠️ Generation Validation: REVIEW NEEDED
            </h4>

            <div className="space-y-2">
              {/* Summary */}
              <div className="text-sm text-amber-800">
                <p className="mb-1">
                  <strong>Expected:</strong> {validation.expectedEntities} entities, {validation.expectedWorkflows} workflows
                </p>
                <p>
                  <strong>Generated:</strong> {validation.actualEntities} entities, {validation.actualWorkflows} workflows
                </p>
              </div>

              {/* Missing Items */}
              {validation.missingEntities.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-amber-900 mb-1">
                    ⚠️ Possibly Missing Entities ({validation.missingEntities.length}):
                  </p>
                  <ul className="list-disc list-inside text-amber-800 ml-2">
                    {validation.missingEntities.slice(0, 5).map((entity, idx) => (
                      <li key={idx}>{entity}</li>
                    ))}
                    {validation.missingEntities.length > 5 && (
                      <li className="text-amber-700 italic">
                        ...and {validation.missingEntities.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {validation.missingWorkflows.length > 0 && (
                <div className="text-sm">
                  <p className="font-medium text-amber-900 mb-1">
                    ⚠️ Possibly Missing Workflows ({validation.missingWorkflows.length}):
                  </p>
                  <ul className="list-disc list-inside text-amber-800 ml-2">
                    {validation.missingWorkflows.slice(0, 5).map((workflow, idx) => (
                      <li key={idx}>{workflow}</li>
                    ))}
                    {validation.missingWorkflows.length > 5 && (
                      <li className="text-amber-700 italic">
                        ...and {validation.missingWorkflows.length - 5} more
                      </li>
                    )}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              <div className="text-sm text-amber-800 bg-amber-100 rounded p-2 mt-2">
                <p className="font-medium mb-1">💡 What you can do:</p>
                <ul className="list-disc list-inside space-y-0.5 text-xs">
                  <li>Review the generated code in Canvas to verify what was created</li>
                  <li>Some items may exist with slightly different names</li>
                  <li>Ask the AI to generate missing items individually</li>
                  <li>Consider breaking large requirements into smaller sections</li>
                </ul>
              </div>

              {/* Actions */}
              {onRegenerateMissing && hasMissing && (
                <div className="mt-3 pt-3 border-t border-amber-200">
                  <button
                    onClick={onRegenerateMissing}
                    className="text-xs bg-amber-600 hover:bg-amber-700 text-white px-3 py-1.5 rounded-md font-medium transition-colors"
                  >
                    Ask AI to Generate Missing Items
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
        <button
          onClick={onDismiss}
          className="text-amber-600 hover:text-amber-800 p-1 rounded-md hover:bg-amber-100 flex-shrink-0"
          aria-label="Dismiss"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
};
