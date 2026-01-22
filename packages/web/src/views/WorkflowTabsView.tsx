import React from 'react';
import { useSearchParams, useNavigate, useLocation } from 'react-router-dom';
import ChatBotEditorWorkflowNew from '@/components/ChatBot/ChatBotEditorWorkflowNew';
import { ArrowLeft, Minimize2 } from 'lucide-react';

const WorkflowTabsView: React.FC = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const location = useLocation();

  // Get workflow parameters from URL
  const modelName = searchParams.get('model');
  const versionParam = searchParams.get('version');
  const returnUrl = searchParams.get('returnUrl');

  // Parse version as number
  const modelVersion = versionParam ? parseInt(versionParam, 10) : null;

  // Handle exit fullscreen - go back to chat with canvas open
  const handleExitFullscreen = () => {
    if (returnUrl) {
      // Navigate to the return URL (chat page)
      navigate(returnUrl);
    } else {
      // Fallback: go back in history or to home
      if (window.history.length > 1) {
        navigate(-1);
      } else {
        navigate('/?canvas=true');
      }
    }
  };

  // Show error if no model parameters
  if (!modelName || !modelVersion || isNaN(modelVersion)) {
    return (
      <div className="h-screen w-screen overflow-hidden bg-gray-900 flex items-center justify-center" style={{ position: 'fixed', top: 0, left: 0 }}>
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-300 mb-2">Invalid Workflow Parameters</h2>
          <p className="text-gray-500 mb-4">Model name and version are required.</p>
          <button
            onClick={handleExitFullscreen}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center gap-2 mx-auto"
          >
            <ArrowLeft size={16} />
            Go Back
          </button>
        </div>
      </div>
    );
  }

  const technicalId = `${modelName}_v${modelVersion}`;

  return (
    <div className="h-screen w-screen overflow-hidden bg-gray-900 flex flex-col" style={{ position: 'fixed', top: 0, left: 0 }}>
      {/* Header with exit button */}
      <div className="h-10 bg-gray-800 border-b border-gray-700 flex items-center px-4 gap-3">
        <button
          onClick={handleExitFullscreen}
          className="flex items-center gap-2 px-3 py-1.5 text-sm text-gray-300 hover:text-white hover:bg-gray-700 rounded-md transition-colors"
          title="Exit fullscreen"
        >
          <Minimize2 size={14} />
          <span>Exit Fullscreen</span>
        </button>
        <div className="h-4 w-px bg-gray-600" />
        <span className="text-sm text-gray-400">
          {modelName} v{modelVersion}
        </span>
      </div>

      {/* Workflow Editor */}
      <div className="flex-1 overflow-hidden">
        <ChatBotEditorWorkflowNew
          technicalId={technicalId}
          modelName={modelName}
          modelVersion={modelVersion}
          onBack={handleExitFullscreen}
        />
      </div>
    </div>
  );
};

export default WorkflowTabsView;

