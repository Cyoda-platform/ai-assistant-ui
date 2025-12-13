import React, { useState, useMemo, useEffect } from 'react';
import { Server, X, Plus, Maximize2, Minimize2, Loader2, RefreshCw } from 'lucide-react';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import EnvironmentDetails from './EnvironmentDetails';
import { useAuthStore } from '@/stores/auth';
import privateClient from '@/clients/private';
import { message } from 'antd';

interface Environment {
  name: string;
  namespace: string;
  status: string;
  created_at?: string;
}

interface EnvironmentsPanelProps {
  onResizeMouseDown: (e: React.MouseEvent) => void;
  isResizing: boolean;
  onClose?: () => void;
  isFullscreen?: boolean;
  onToggleFullscreen?: () => void;
}

const EnvironmentsPanel: React.FC<EnvironmentsPanelProps> = ({
  onResizeMouseDown,
  isResizing,
  onClose,
  isFullscreen = false,
  onToggleFullscreen
}) => {
  const { token } = useAuthStore();

  // Extract org ID from token
  const orgId = useMemo(() => {
    if (!token) return null;
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.caas_org_id || null;
    } catch (error) {
      console.error('Failed to parse token:', error);
      return null;
    }
  }, [token]);

  // Build development environment URL from .env config and org ID
  const devEnvUrl = useMemo(() => {
    if (!orgId) return 'http://localhost:8080';

    const envPrefix = import.meta.env.VITE_APP_CYODA_CLIENT_ENV_PREFIX || '';
    const host = import.meta.env.VITE_APP_CYODA_CLIENT_HOST || '';

    if (!host) return 'http://localhost:8080';

    const cleanPrefix = envPrefix.endsWith('-') ? envPrefix.slice(0, -1) : envPrefix;
    return `https://${cleanPrefix}-${orgId}.${host}`;
  }, [orgId]);

  const [environments, setEnvironments] = useState<Environment[]>([]);
  const [selectedEnvironment, setSelectedEnvironment] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Fetch environments from the backend
  const fetchEnvironments = async () => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      const response = await privateClient({
        method: 'post',
        url: '/agent/environment/list_environments',
        data: {}
      });

      if (response.data && response.data.environments) {
        setEnvironments(response.data.environments);
      } else {
        setEnvironments([]);
      }
    } catch (error: any) {
      console.error('Failed to fetch environments:', error);
      message.error('Failed to load environments');
      setEnvironments([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch environments on mount and when token changes
  useEffect(() => {
    fetchEnvironments();
  }, [token]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active':
        return 'bg-green-500/20 text-green-400 border-green-500/30';
      case 'inactive':
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
      case 'maintenance':
        return 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30';
      default:
        return 'bg-gray-500/20 text-gray-400 border-gray-500/30';
    }
  };

  // If an environment is selected, show details view
  if (selectedEnvironment) {
    return (
      <div className="h-full bg-slate-800/95 backdrop-blur-sm flex flex-col relative resizable-panel">
        <EnvironmentDetails
          environmentName={selectedEnvironment}
          onBack={() => setSelectedEnvironment(null)}
          onClose={onClose}
        />
        <ResizeHandle
          onMouseDown={onResizeMouseDown}
          isResizing={isResizing}
          position="right"
        />
      </div>
    );
  }

  return (
    <div className={`h-full bg-slate-800/95 backdrop-blur-sm flex flex-col relative ${isFullscreen ? '' : 'resizable-panel'}`}>
      {/* Header with Action Buttons */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <Server size={18} className="text-teal-400" />
          <h3 className="font-semibold text-white translate-y-[20%]">Cloud</h3>
          {isFullscreen && (
            <span className="text-xs bg-purple-500/20 text-purple-300 px-2 py-1 rounded-full">Fullscreen</span>
          )}
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={(e) => {
              e.preventDefault();
              e.stopPropagation();
              fetchEnvironments();
            }}
            disabled={isLoading}
            className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            title="Refresh environments"
          >
            <RefreshCw size={16} className={isLoading ? 'animate-spin' : ''} />
          </button>
          {!isFullscreen && onToggleFullscreen && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onToggleFullscreen();
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title="Open Fullscreen"
            >
              <Maximize2 size={16} />
            </button>
          )}
          {onClose && (
            <button
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onClose();
              }}
              onDoubleClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
              }}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
              title={isFullscreen ? 'Exit Fullscreen' : 'Close Panel'}
            >
              {isFullscreen ? <Minimize2 size={16} /> : <X size={16} />}
            </button>
          )}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col p-4 space-y-3 overflow-y-auto">
        {/* Loading State */}
        {isLoading ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Loader2 size={48} className="mx-auto mb-3 animate-spin text-teal-400" />
              <p className="text-sm">Loading environments...</p>
            </div>
          </div>
        ) : environments.length === 0 ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center text-slate-400">
              <Server size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-sm">No environments found</p>
              <p className="text-xs mt-1">Please, ask in the chat to deploy Cyoda environment</p>
            </div>
          </div>
        ) : (
          <div className="space-y-3 pb-4">
            {environments.map((env) => (
              <div
                key={env.name}
                onClick={() => setSelectedEnvironment(env.name)}
                className="group relative p-4 rounded-lg bg-gradient-to-br from-slate-700/50 to-slate-800/50 border border-teal-500/50 hover:border-teal-500 cursor-pointer transition-all"
                title="Click to view details"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center space-x-2 mb-2">
                      <Server size={16} className="text-teal-400" />
                      <h4 className="font-semibold truncate text-white">
                        {env.name}
                      </h4>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${getStatusColor(env.status)}`}>
                        {env.status}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 truncate mb-1">{env.namespace}</p>
                    {env.created_at && (
                      <p className="text-xs text-slate-500">Created: {new Date(env.created_at).toLocaleDateString()}</p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Resize Handle - Only show when not in fullscreen */}
      {!isFullscreen && (
        <ResizeHandle
          onMouseDown={onResizeMouseDown}
          isResizing={isResizing}
          position="right"
        />
      )}
    </div>
  );
};

export default EnvironmentsPanel;

