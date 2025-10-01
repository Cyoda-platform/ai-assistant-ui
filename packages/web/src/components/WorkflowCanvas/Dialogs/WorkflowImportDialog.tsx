// ABOUTME: Dialog component for importing WorkflowConfiguration JSON files with required
// metadata input (model name and version) for proper workflow identification.

import { useState, useCallback } from 'react';
import { Dialog } from '@headlessui/react';
import { X, Upload, FileText } from 'lucide-react';
import type { WorkflowConfiguration, WorkflowImportMetadata } from '../types/workflow';

interface WorkflowImportDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onImport: (config: WorkflowConfiguration, metadata: WorkflowImportMetadata) => void;
}

export function WorkflowImportDialog({ isOpen, onClose, onImport }: WorkflowImportDialogProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [parsedConfig, setParsedConfig] = useState<WorkflowConfiguration | null>(null);
  const [modelName, setModelName] = useState('');
  const [modelVersion, setModelVersion] = useState<number>(1);
  const [parseError, setParseError] = useState<string | null>(null);

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const content = e.target?.result as string;
        const config = JSON.parse(content) as WorkflowConfiguration;

        // Validate WorkflowConfiguration structure
        if (!config.version || !config.name || !config.initialState || !config.states) {
          throw new Error('Invalid WorkflowConfiguration: missing required fields (version, name, initialState, states)');
        }

        if (Object.keys(config.states).length === 0) {
          throw new Error('Invalid WorkflowConfiguration: states object cannot be empty');
        }

        setParsedConfig(config);

        // Auto-populate model name from workflow name if empty
        if (!modelName) {
          setModelName(config.name);
        }
      } catch (error) {
        setParseError(`Error parsing JSON: ${error instanceof Error ? error.message : 'Unknown error'}`);
        setParsedConfig(null);
      }
    };
    reader.readAsText(file);
  }, [modelName]);

  const handleImport = useCallback(() => {
    if (!parsedConfig || !modelName.trim()) return;

    const metadata: WorkflowImportMetadata = {
      modelName: modelName.trim(),
      modelVersion: modelVersion
    };

    onImport(parsedConfig, metadata);

    // Reset form
    setSelectedFile(null);
    setParsedConfig(null);
    setModelName('');
    setModelVersion(1);
    setParseError(null);
    onClose();
  }, [parsedConfig, modelName, modelVersion, onImport, onClose]);

  const handleClose = useCallback(() => {
    // Reset form on close
    setSelectedFile(null);
    setParsedConfig(null);
    setModelName('');
    setModelVersion(1);
    setParseError(null);
    onClose();
  }, [onClose]);

  const canImport = parsedConfig && modelName.trim() && modelVersion > 0;

  return (
    <Dialog open={isOpen} onClose={handleClose} className="relative z-50">
      <div className="fixed inset-0 bg-black/25" />
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <Dialog.Panel className="mx-auto max-w-md rounded bg-white dark:bg-gray-800 p-6 shadow-lg">
          <div className="flex items-center justify-between mb-4">
            <Dialog.Title className="text-lg font-medium text-gray-900 dark:text-white">
              Import Workflow Configuration
            </Dialog.Title>
            <button
              onClick={handleClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <X size={20} />
            </button>
          </div>

          <div className="space-y-4">
            {/* File Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Select WorkflowConfiguration JSON File
              </label>
              <div className="flex items-center space-x-2">
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileSelect}
                  className="block w-full text-sm text-gray-500 dark:text-gray-400
                           file:mr-4 file:py-2 file:px-4
                           file:rounded-md file:border-0
                           file:text-sm file:font-medium
                           file:bg-blue-50 file:text-blue-700
                           hover:file:bg-blue-100
                           dark:file:bg-blue-900 dark:file:text-blue-300
                           dark:hover:file:bg-blue-800"
                />
                <Upload size={20} className="text-gray-400" />
              </div>
              {selectedFile && (
                <p className="mt-1 text-sm text-gray-600 dark:text-gray-400">
                  Selected: {selectedFile.name}
                </p>
              )}
            </div>

            {/* Parse Error */}
            {parseError && (
              <div className="p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-md">
                <p className="text-sm text-red-600 dark:text-red-400">{parseError}</p>
              </div>
            )}

            {/* Workflow Info */}
            {parsedConfig && (
              <div className="p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-md">
                <div className="flex items-center space-x-2 mb-2">
                  <FileText size={16} className="text-green-600 dark:text-green-400" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-300">
                    Valid WorkflowConfiguration
                  </span>
                </div>
                <div className="text-sm text-green-700 dark:text-green-400 space-y-1">
                  <p><strong>Name:</strong> {parsedConfig.name}</p>
                  <p><strong>Version:</strong> {parsedConfig.version}</p>
                  <p><strong>Initial State:</strong> {parsedConfig.initialState}</p>
                  <p><strong>States:</strong> {Object.keys(parsedConfig.states).length}</p>
                </div>
              </div>
            )}

            {/* Metadata Input */}
            <div className="space-y-3">
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Entity Model Information
              </h3>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model Name *
                </label>
                <input
                  type="text"
                  value={modelName}
                  onChange={(e) => setModelName(e.target.value)}
                  placeholder="Enter entity model name"
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Model Version *
                </label>
                <input
                  type="number"
                  min="1"
                  value={modelVersion}
                  onChange={(e) => setModelVersion(parseInt(e.target.value) || 1)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md
                           bg-white dark:bg-gray-700 text-gray-900 dark:text-white
                           focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex justify-end space-x-3 pt-4">
              <button
                onClick={handleClose}
                className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300
                         bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600
                         rounded-md transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleImport}
                disabled={!canImport}
                className="px-4 py-2 text-sm font-medium text-white
                         bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400
                         rounded-md transition-colors disabled:cursor-not-allowed"
              >
                Import Workflow
              </button>
            </div>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
}
