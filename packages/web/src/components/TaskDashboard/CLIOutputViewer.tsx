/**
 * CLIOutputViewer - Displays streamed CLI output from background tasks
 * Shows real-time output from code generation and build processes
 */

import React, { useEffect, useRef } from 'react';
import { Terminal, Copy, Download } from 'lucide-react';

interface CLIOutputViewerProps {
  output?: string;
  isRunning?: boolean;
  taskId?: string;
}

const CLIOutputViewer: React.FC<CLIOutputViewerProps> = ({
  output = '',
  isRunning = false,
  taskId = ''
}) => {
  const outputRef = useRef<HTMLDivElement>(null);
  const [copied, setCopied] = React.useState(false);

  // Auto-scroll to bottom when output updates
  useEffect(() => {
    if (outputRef.current && isRunning) {
      outputRef.current.scrollTop = outputRef.current.scrollHeight;
    }
  }, [output, isRunning]);

  const handleCopy = () => {
    navigator.clipboard.writeText(output);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const element = document.createElement('a');
    const file = new Blob([output], { type: 'text/plain' });
    element.href = URL.createObjectURL(file);
    element.download = `cli-output-${taskId}-${new Date().toISOString()}.log`;
    document.body.appendChild(element);
    element.click();
    document.body.removeChild(element);
  };

  if (!output) {
    return (
      <div className="bg-slate-50 border border-slate-200 rounded p-3 text-center">
        <Terminal size={16} className="text-slate-400 mx-auto mb-2" />
        <p className="text-slate-500 text-xs">
          {isRunning ? 'Waiting for output...' : 'No output available'}
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Terminal size={14} className="text-teal-600" />
          <span className="text-slate-600 text-xs font-medium">CLI Output</span>
          {isRunning && (
            <span className="inline-flex items-center space-x-1 text-xs text-amber-600">
              <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" />
              <span>Streaming...</span>
            </span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={handleCopy}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500 hover:text-teal-600"
            title="Copy output"
          >
            <Copy size={14} />
          </button>
          <button
            onClick={handleDownload}
            className="p-1.5 hover:bg-slate-100 rounded transition-colors text-slate-500 hover:text-teal-600"
            title="Download output"
          >
            <Download size={14} />
          </button>
        </div>
      </div>

      {/* Output Container */}
      <div
        ref={outputRef}
        className="bg-slate-900/80 border border-slate-700/50 rounded p-3 font-mono text-xs text-slate-300 max-h-64 overflow-y-auto whitespace-pre-wrap break-words"
      >
        {output}
        {isRunning && (
          <span className="inline-block w-2 h-4 bg-teal-400 ml-1 animate-pulse" />
        )}
      </div>

      {/* Copy Feedback */}
      {copied && (
        <div className="text-xs text-green-600 text-center">
          ✓ Copied to clipboard
        </div>
      )}

      {/* Output Info */}
      <div className="text-xs text-slate-500">
        {output.length} bytes
        {output.split('\n').length > 1 && ` • ${output.split('\n').length} lines`}
      </div>
    </div>
  );
};

export default CLIOutputViewer;

