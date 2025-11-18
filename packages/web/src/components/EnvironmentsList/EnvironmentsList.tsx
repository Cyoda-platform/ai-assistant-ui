import React, { useState, useEffect } from 'react';
import { Plus, Server, ExternalLink, Globe } from 'lucide-react';
import { Modal, Input, Select, message } from 'antd';
import type { AppRoot } from '@/components/AppsCanvas/types/appSchema';

interface Environment {
  name: string;
  url: string;
  status: string;
}

interface EnvironmentsListProps {
  appId: string;
  appData: AppRoot; // AppRoot is the single source of truth
  onEnvironmentClick: (environmentId: string) => void;
  onEnvironmentCreated?: (environmentId: string) => void;
  onAppDataUpdate?: (updatedAppData: AppRoot) => void; // Callback to update AppRoot
}

export const EnvironmentsList: React.FC<EnvironmentsListProps> = ({
  appId,
  appData,
  onEnvironmentClick,
  onEnvironmentCreated,
  onAppDataUpdate,
}) => {
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newEnvironmentName, setNewEnvironmentName] = useState('');
  const [newEnvironmentUrl, setNewEnvironmentUrl] = useState('');
  const [newEnvironmentStatus, setNewEnvironmentStatus] = useState<string>('active');
  const [isCreating, setIsCreating] = useState(false);

  // Get environments directly from AppRoot (single source of truth)
  const environments = (appData.app as any).environments || [];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + Shift + E to create new environment
      if ((e.ctrlKey || e.metaKey) && e.shiftKey && e.key === 'E' && !isCreateModalOpen) {
        e.preventDefault();
        setIsCreateModalOpen(true);
      }
      // Escape to close modal
      if (e.key === 'Escape' && isCreateModalOpen) {
        setIsCreateModalOpen(false);
        setNewEnvironmentName('');
        setNewEnvironmentUrl('');
        setNewEnvironmentStatus('active');
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isCreateModalOpen]);

  const handleCreateEnvironment = () => {
    console.log('🚀 handleCreateEnvironment called:', {
      environmentName: newEnvironmentName,
      environmentUrl: newEnvironmentUrl,
      environmentStatus: newEnvironmentStatus,
      appData
    });

    if (!newEnvironmentName.trim()) {
      message.error('Please enter an environment name');
      return;
    }

    if (!newEnvironmentUrl.trim()) {
      message.error('Please enter an environment URL');
      return;
    }

    setIsCreating(true);
    try {
      // Create new environment
      const newEnvironment: Environment = {
        name: newEnvironmentName.trim(),
        url: newEnvironmentUrl.trim(),
        status: newEnvironmentStatus
      };

      // Update app data with new environment
      const updatedAppData = {
        ...appData,
        app: {
          ...appData.app,
          environments: [...environments, newEnvironment]
        }
      };

      // Notify parent to update AppRoot
      console.log('📤 Calling onAppDataUpdate with updated AppRoot:', {
        environments: (updatedAppData.app as any).environments.length,
        updatedAppData
      });
      onAppDataUpdate?.(updatedAppData);

      console.log('✅ Environment created:', newEnvironment);

      // Close modal and reset form
      setIsCreateModalOpen(false);
      setNewEnvironmentName('');
      setNewEnvironmentUrl('');
      setNewEnvironmentStatus('active');

      message.success({
        content: `Environment "${newEnvironmentName}" created successfully! 🎉`,
        duration: 3,
        style: {
          marginTop: '20vh',
        },
      });

      // Generate environment ID for navigation
      const environmentId = `environment-${newEnvironment.name.toLowerCase().replace(/\s+/g, '-')}`;

      // Notify parent
      if (onEnvironmentCreated) {
        onEnvironmentCreated(environmentId);
      }
    } catch (error: any) {
      console.error('Failed to create environment:', error);
      const errorMessage = error?.message || 'Failed to create environment. Please try again.';
      message.error({
        content: errorMessage,
        duration: 5,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between p-5 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-green-500/10 rounded-lg">
            <Server size={20} className="text-green-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Environments</h3>
            <p className="text-xs text-gray-400">
              {environments.length === 0 ? 'No environments yet' : `${environments.length} ${environments.length === 1 ? 'environment' : 'environments'}`}
            </p>
          </div>
        </div>
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg shadow-green-500/20 hover:shadow-green-500/40 hover:scale-105 group"
          title="Keyboard shortcut: Ctrl+Shift+E (Cmd+Shift+E on Mac)"
        >
          <Plus size={16} />
          <span>Add Environment</span>
          <kbd className="hidden group-hover:inline-block ml-2 px-1.5 py-0.5 text-xs bg-white/20 rounded border border-white/30">
            ⌘⇧E
          </kbd>
        </button>
      </div>

      {/* Environments Grid */}
      <div className="flex-1 overflow-y-auto p-6 flex items-center justify-center">
        {environments.length === 0 ? (
          <div className="w-full max-w-2xl mx-auto text-center">
            <div className="relative mb-6">
              <div className="absolute inset-0 blur-3xl bg-green-400/10 animate-pulse"></div>
              <Server size={80} className="mx-auto text-green-400/80 relative" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-3">
              Configure Your Deployment Environments
            </h2>
            <p className="text-gray-400 mb-2 leading-relaxed">
              Environments define where your application runs and how it's accessed.
            </p>
            <p className="text-gray-500 text-sm mb-8">
              Create environments like <span className="text-green-400 font-medium">Production</span>, <span className="text-green-400 font-medium">Staging</span>, or <span className="text-green-400 font-medium">Development</span>.
            </p>
            <p className="text-gray-600 text-xs mt-4">
              💡 Tip: Use the "Add Environment" button above to create your first environment
            </p>
          </div>
        ) : (
          <div className="w-full grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {environments.map((environment: Environment, index: number) => {
              // Generate environment ID from name
              const environmentId = `environment-${environment.name.toLowerCase().replace(/\s+/g, '-')}`;

              return (
                <div
                  key={environmentId}
                  onClick={() => onEnvironmentClick(environmentId)}
                  className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-green-500/50 hover:shadow-xl hover:shadow-green-500/10 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-green-500/10 rounded-lg group-hover:bg-green-500/20 transition-colors">
                        <Server size={18} className="text-green-400 group-hover:text-green-300 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-white group-hover:text-green-300 transition-colors text-lg">
                        {environment.name}
                      </h4>
                    </div>
                    <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                      environment.status === 'active' 
                        ? 'bg-green-500/20 text-green-300' 
                        : environment.status === 'inactive'
                        ? 'bg-gray-500/20 text-gray-300'
                        : 'bg-yellow-500/20 text-yellow-300'
                    }`}>
                      {environment.status}
                    </span>
                  </div>

                  <div className="flex items-center space-x-2 mb-4">
                    <Globe size={14} className="text-gray-500" />
                    <p className="text-sm text-gray-400 truncate">
                      {environment.url}
                    </p>
                  </div>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center space-x-1">
                      <div className="w-2 h-2 bg-green-400 rounded-full"></div>
                      <span>Ready</span>
                    </div>
                    <div className="p-1 bg-green-500/10 rounded" title="Environment URL">
                      <ExternalLink size={12} className="text-green-400" />
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Environment Modal */}
      <Modal
        title={
          <div className="flex items-center space-x-3">
            <div className="p-2 bg-green-500/10 rounded-lg">
              <Server size={20} className="text-green-400" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-white">Create New Environment</h3>
              <p className="text-xs text-gray-400 font-normal">Configure deployment environment</p>
            </div>
          </div>
        }
        open={isCreateModalOpen}
        onOk={handleCreateEnvironment}
        onCancel={() => {
          setIsCreateModalOpen(false);
          setNewEnvironmentName('');
          setNewEnvironmentUrl('');
          setNewEnvironmentStatus('active');
        }}
        okText={isCreating ? 'Creating...' : 'Create Environment'}
        confirmLoading={isCreating}
        okButtonProps={{
          className: 'bg-gradient-to-r from-green-600 to-green-500 hover:from-green-500 hover:to-green-400 border-0 shadow-lg shadow-green-500/20',
          disabled: !newEnvironmentName.trim() || !newEnvironmentUrl.trim()
        }}
        cancelButtonProps={{
          className: 'border-slate-600 text-gray-300 hover:border-slate-500 hover:text-white'
        }}
        width={700}
        centered
      >
        <div className="space-y-5 py-6">
          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Environment Name <span className="text-red-400">*</span>
            </label>
            <Input
              value={newEnvironmentName}
              onChange={(e) => setNewEnvironmentName(e.target.value)}
              placeholder="e.g., Production, Staging, Development"
              size="large"
              disabled={isCreating}
              className="rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              💡 Use a descriptive name for the environment
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Environment URL <span className="text-red-400">*</span>
            </label>
            <Input
              value={newEnvironmentUrl}
              onChange={(e) => setNewEnvironmentUrl(e.target.value)}
              placeholder="e.g., https://api.example.com"
              size="large"
              disabled={isCreating}
              className="rounded-lg"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              The base URL where this environment is accessible
            </p>
          </div>

          <div>
            <label className="block text-sm font-semibold text-gray-200 mb-2">
              Status <span className="text-red-400">*</span>
            </label>
            <Select
              value={newEnvironmentStatus}
              onChange={setNewEnvironmentStatus}
              size="large"
              disabled={isCreating}
              className="w-full"
            >
              <Select.Option value="active">Active</Select.Option>
              <Select.Option value="inactive">Inactive</Select.Option>
              <Select.Option value="maintenance">Maintenance</Select.Option>
            </Select>
            <p className="text-xs text-gray-500 mt-1.5">
              Current operational status of the environment
            </p>
          </div>
        </div>
      </Modal>
    </div>
  );
};

