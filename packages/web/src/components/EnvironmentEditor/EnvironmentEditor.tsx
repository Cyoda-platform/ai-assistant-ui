import React, { useState, useEffect, useMemo } from 'react';
import { Server, Globe, CheckCircle, XCircle, Edit2, Save, X, Loader2, Send, BarChart3 } from 'lucide-react';
import Editor from '@monaco-editor/react';
import apiService from '@/services/apiService';
import { mockDiagramsConfig } from '@/components/AppsCanvas/mockDiagrams';
import DashboardChart from '@/components/AppsCanvas/nodes/DashboardChart';
import type { DashboardChartConfig } from '@/components/AppsCanvas/types/diagrams';

interface Environment {
  id?: string;
  app_id?: string;
  name: string;
  url: string;
  status: string;
  created_at?: string;
  updated_at?: string;
}

interface EnvironmentEditorProps {
  appId: string;
  environmentId: string;
  onSendToChat?: (message: string) => void;
}

export const EnvironmentEditor: React.FC<EnvironmentEditorProps> = ({ appId, environmentId, onSendToChat }) => {
  const [environment, setEnvironment] = useState<Environment | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  const [editMode, setEditMode] = useState(false);
  const [editedEnv, setEditedEnv] = useState<Environment | null>(null);
  const [jsonMode, setJsonMode] = useState(false);
  const [jsonText, setJsonText] = useState('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [showDiagrams, setShowDiagrams] = useState(false);

  // Load environment data from API
  useEffect(() => {
    const loadEnvironment = async () => {
      try {
        setLoading(true);
        setError(null);
        const data = await apiService.getEnvironmentDetail(appId, environmentId);
        setEnvironment(data);
        setEditedEnv(data);
        setJsonText(JSON.stringify(data, null, 2));
      } catch (err: any) {
        console.error('Failed to load environment:', err);
        setError(err?.error?.message || 'Failed to load environment');
      } finally {
        setLoading(false);
      }
    };

    loadEnvironment();
  }, [appId, environmentId]);

  const handleSave = async () => {
    try {
      setSaving(true);
      setJsonError(null);

      let dataToSave: Environment;

      if (jsonMode) {
        try {
          dataToSave = JSON.parse(jsonText);
        } catch (err: any) {
          setJsonError(err.message);
          setSaving(false);
          return;
        }
      } else {
        if (!editedEnv) {
          setSaving(false);
          return;
        }
        dataToSave = editedEnv;
      }

      // Call API to save environment
      const updatedEnv = await apiService.saveEnvironmentDetail(appId, environmentId, dataToSave);

      // Update local state
      setEnvironment(updatedEnv);
      setEditedEnv(updatedEnv);
      setJsonText(JSON.stringify(updatedEnv, null, 2));
      setEditMode(false);
      setJsonMode(false);

      console.log('✅ Environment saved successfully:', updatedEnv);
    } catch (err: any) {
      console.error('❌ Failed to save environment:', err);
      setJsonError(err?.error?.message || 'Failed to save environment');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    setEditedEnv(environment);
    setJsonText(environment ? JSON.stringify(environment, null, 2) : '');
    setEditMode(false);
    setJsonMode(false);
    setJsonError(null);
  };

  // Get charts for current environment
  const environmentCharts = useMemo(() => {
    if (!environment) return null;

    const envNameToType: Record<string, string> = {
      'production': 'production',
      'staging': 'staging',
      'development': 'development',
      'test': 'test'
    };

    const envType = envNameToType[environment.name.toLowerCase()];
    if (!envType) return null;

    const envConfig = mockDiagramsConfig.environments.find(
      e => e.environmentId === envType
    );

    return envConfig?.charts || null;
  }, [environment]);

  // Loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Loader2 size={64} className="mx-auto mb-4 text-blue-400 animate-spin" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            Loading Environment...
          </h2>
          <p className="text-gray-500">
            Fetching environment data from API
          </p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <XCircle size={64} className="mx-auto mb-4 text-red-400" />
          <h2 className="text-xl font-semibold text-red-300 mb-2">
            Failed to Load Environment
          </h2>
          <p className="text-gray-400 mb-4">{error}</p>
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  // No data state
  if (!environment && !editedEnv) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <Server size={64} className="mx-auto mb-4 text-gray-600" />
          <h2 className="text-xl font-semibold text-gray-300 mb-2">
            No Environment Selected
          </h2>
          <p className="text-gray-500">
            Click on an environment node in the Apps canvas to view and edit it
          </p>
        </div>
      </div>
    );
  }

  const currentEnv = editedEnv || environment!;
  const isActive = currentEnv.status.toLowerCase() === 'active';

  return (
    <div className="h-full flex flex-col bg-gray-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center space-x-3">
          <Server size={24} className="text-green-400" />
          <div>
            <h2 className="text-xl font-bold text-white">{currentEnv.name}</h2>
            <p className="text-sm text-gray-400">Environment Configuration</p>
          </div>
        </div>
        <div className="flex items-center space-x-2">
          {/* Send to Chat Button */}
          {onSendToChat && (
            <button
              onClick={() => {
                const envJson = JSON.stringify(currentEnv, null, 2);
                const message = `Here is the environment configuration:\n\n\`\`\`json\n${envJson}\n\`\`\`\n\nPlease review this configuration and help me improve it.`;
                onSendToChat(message);
              }}
              className="px-4 py-2 bg-gradient-to-r from-teal-500 to-teal-600 hover:from-teal-600 hover:to-teal-700 text-white rounded-lg flex items-center space-x-2 transition-all duration-200 shadow-lg hover:shadow-teal-500/25"
              title="Send to chat"
            >
              <Send size={16} />
              <span>Send to Chat</span>
            </button>
          )}

          {/* Dashboard Toggle Button */}
          {environmentCharts && !editMode && (
            <button
              onClick={() => setShowDiagrams(!showDiagrams)}
              className={`px-4 py-2 ${
                showDiagrams
                  ? 'bg-cyan-600 hover:bg-cyan-700'
                  : 'bg-gray-700 hover:bg-gray-600'
              } text-white rounded-lg flex items-center space-x-2 transition-colors`}
            >
              <BarChart3 size={16} />
              <span>{showDiagrams ? 'Hide Dashboard' : 'Show Dashboard'}</span>
            </button>
          )}

          {!editMode ? (
            <button
              onClick={() => setEditMode(true)}
              className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg flex items-center space-x-2 transition-colors"
            >
              <Edit2 size={16} />
              <span>Edit</span>
            </button>
          ) : (
            <>
              <button
                onClick={() => setJsonMode(!jsonMode)}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
              >
                {jsonMode ? 'Form View' : 'JSON View'}
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                {saving ? (
                  <>
                    <Loader2 size={16} className="animate-spin" />
                    <span>Saving...</span>
                  </>
                ) : (
                  <>
                    <Save size={16} />
                    <span>Save</span>
                  </>
                )}
              </button>
              <button
                onClick={handleCancel}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg flex items-center space-x-2 transition-colors"
              >
                <X size={16} />
                <span>Cancel</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden">
        {showDiagrams && environmentCharts ? (
          /* Dashboard View */
          <div className="h-full overflow-auto p-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {environmentCharts.map((chart) => (
                <DashboardChart key={chart.id} config={chart} />
              ))}
            </div>
          </div>
        ) : jsonMode ? (
          <div className="h-full flex flex-col p-6">
            <div className="flex-1 rounded-lg overflow-hidden border-2 border-gray-700">
              <Editor
                height="100%"
                defaultLanguage="json"
                value={jsonText}
                onChange={(value) => setJsonText(value || '')}
                theme="vs-dark"
                options={{
                  readOnly: false,
                  minimap: { enabled: false },
                  fontSize: 14,
                  lineNumbers: 'on',
                  scrollBeyondLastLine: false,
                  automaticLayout: true,
                  tabSize: 2,
                  wordWrap: 'on',
                  formatOnPaste: true,
                  formatOnType: true,
                }}
              />
            </div>
            {jsonError && (
              <div className="mt-4 p-4 bg-red-900/50 border border-red-700 rounded-lg text-red-200">
                <strong>Error:</strong> {jsonError}
              </div>
            )}
          </div>
        ) : (
          <div className="max-w-2xl mx-auto space-y-6 p-6 overflow-auto h-full">
            {/* Status Badge */}
            <div className="flex items-center justify-center">
              <div className={`px-6 py-3 rounded-full flex items-center space-x-2 ${
                isActive ? 'bg-green-900/50 border-2 border-green-500' : 'bg-red-900/50 border-2 border-red-500'
              }`}>
                {isActive ? (
                  <CheckCircle size={20} className="text-green-400" />
                ) : (
                  <XCircle size={20} className="text-red-400" />
                )}
                <span className={`font-semibold ${isActive ? 'text-green-300' : 'text-red-300'}`}>
                  {currentEnv.status}
                </span>
              </div>
            </div>

            {/* Environment Name */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Environment Name
              </label>
              {editMode ? (
                <input
                  type="text"
                  value={currentEnv.name}
                  onChange={(e) => setEditedEnv({ ...currentEnv, name: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              ) : (
                <div className="text-lg font-semibold text-white">{currentEnv.name}</div>
              )}
            </div>

            {/* Environment URL */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2 flex items-center space-x-2">
                <Globe size={16} />
                <span>URL</span>
              </label>
              {editMode ? (
                <input
                  type="url"
                  value={currentEnv.url}
                  onChange={(e) => setEditedEnv({ ...currentEnv, url: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  placeholder="https://example.com"
                />
              ) : (
                <a
                  href={currentEnv.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-400 hover:text-blue-300 underline break-all"
                >
                  {currentEnv.url}
                </a>
              )}
            </div>

            {/* Status */}
            <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
              <label className="block text-sm font-medium text-gray-400 mb-2">
                Status
              </label>
              {editMode ? (
                <select
                  value={currentEnv.status}
                  onChange={(e) => setEditedEnv({ ...currentEnv, status: e.target.value })}
                  className="w-full px-4 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="active">Active</option>
                  <option value="inactive">Inactive</option>
                  <option value="maintenance">Maintenance</option>
                </select>
              ) : (
                <div className="text-lg font-semibold text-white">{currentEnv.status}</div>
              )}
            </div>

            {/* Info Box */}
            <div className="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
              <p className="text-sm text-blue-300">
                💡 <strong>Tip:</strong> Use JSON View to see and edit the raw configuration, or use Form View for a guided editing experience.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

