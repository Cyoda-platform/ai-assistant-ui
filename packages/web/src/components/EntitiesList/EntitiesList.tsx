import React, { useEffect } from 'react';
import { Plus, Database, ExternalLink } from 'lucide-react';
import { message } from 'antd';
import type { Entity, AppRoot } from '@/components/AppsCanvas/types/appSchema';

interface EntitiesListProps {
  appId: string;
  appData: AppRoot; // AppRoot is the single source of truth
  onEntityClick: (entityId: string) => void;
  onEntityCreated?: (entityId: string) => void;
  onAppDataUpdate?: (updatedAppData: AppRoot) => void; // Callback to update AppRoot
}

export const EntitiesList: React.FC<EntitiesListProps> = ({
  appId,
  appData,
  onEntityClick,
  onEntityCreated,
  onAppDataUpdate,
}) => {


  // Get entities directly from AppRoot (single source of truth)
  const entities = appData.app.entities || [];

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl/Cmd + N to create new entity
      if ((e.ctrlKey || e.metaKey) && e.key === 'n') {
        e.preventDefault();
        handleCreateEntity();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleCreateEntity = () => {
    try {
      // Create new entity object with default values
      const newEntity: Entity = {
        name: 'New Entity',
        version: '1',
        description: 'Define a new data structure for your app',
        cyoda_url: '',
        github_url: '',
        model: {
          // Default model structure
          fields: {
            id: { type: 'string', required: true, description: 'Unique identifier' },
            name: { type: 'string', required: true, description: 'Entity name' },
            created_at: { type: 'datetime', required: true, description: 'Creation timestamp' },
            updated_at: { type: 'datetime', required: true, description: 'Last update timestamp' }
          }
        },
        workflows: []
      };

      // Update AppRoot with new entity
      const updatedAppData: AppRoot = {
        ...appData,
        app: {
          ...appData.app,
          entities: [...appData.app.entities, newEntity]
        }
      };

      // Notify parent to update AppRoot
      onAppDataUpdate?.(updatedAppData);

      console.log('✅ Entity created:', newEntity);

      message.success('New entity created! Edit it and send to chat when ready.');

      // Generate entity ID for navigation
      const entityId = `entity-${newEntity.name.toLowerCase()}-${newEntity.version}`;

      // Notify parent to navigate to editor
      if (onEntityCreated) {
        onEntityCreated(entityId);
      }
    } catch (error: any) {
      console.error('Failed to create entity:', error);
      const errorMessage = error?.message || 'Failed to create entity. Please try again.';
      message.error({
        content: errorMessage,
        duration: 5,
      });
    }
  };

  return (
    <div className="flex flex-col h-full bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-700/50 bg-slate-900/50 backdrop-blur-sm">
        <div className="flex items-center space-x-3">
          <div className="p-2 bg-teal-500/10 rounded-lg">
            <Database size={20} className="text-teal-400" />
          </div>
          <div>
            <h3 className="font-semibold text-white text-lg">Data Entities</h3>
            <p className="text-xs text-gray-400">
              {entities.length === 0 ? 'No entities yet' : `${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}`}
            </p>
          </div>
        </div>
        <button
          onClick={handleCreateEntity}
          className="flex items-center space-x-2 px-4 py-2 bg-gradient-to-r from-teal-600 to-teal-500 hover:from-teal-500 hover:to-teal-400 text-white rounded-lg transition-all duration-200 text-sm font-medium shadow-lg shadow-teal-500/20 hover:shadow-teal-500/40 hover:scale-105 group"
          title="Create new entity and open editor"
        >
          <Plus size={16} />
          <span>Add Entity</span>
        </button>
      </div>

      {/* Entities Grid */}
      <div className="flex-1 overflow-y-auto px-6 py-4">
        {entities.length === 0 ? (
          <div className="w-full max-w-2xl mx-auto text-center pt-8">
              <div className="relative mb-6">
                <div className="absolute inset-0 blur-3xl bg-teal-400/10 animate-pulse"></div>
                <Database size={80} className="mx-auto text-teal-400/80 relative" />
              </div>
              <h2 className="text-2xl font-bold text-white mb-3">
                Start Building Your Data Model
              </h2>
              <p className="text-gray-400 mb-2 leading-relaxed">
                Entities are the core data structures of your application.
              </p>
              <p className="text-gray-500 text-sm mb-8">
                Define entities like <span className="text-teal-400 font-medium">Customer</span>, <span className="text-teal-400 font-medium">Order</span>, or <span className="text-teal-400 font-medium">Product</span> to get started.
              </p>
              <p className="text-gray-600 text-xs mt-4">
                💡 Tip: Use the "Add Entity" button above to create your first entity
              </p>
            </div>
        ) : (
          <div className="w-full">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entities.map((entity, index) => {
              // Generate entity ID from name and version
              const entityId = `entity-${entity.name.toLowerCase()}-${entity.version}`;

              return (
                <div
                  key={`${entity.name}-${entity.version}`}
                  onClick={() => onEntityClick(entityId)}
                  className="bg-gradient-to-br from-slate-800 to-slate-800/50 border border-slate-700/50 rounded-xl p-5 hover:border-teal-500/50 hover:shadow-xl hover:shadow-teal-500/10 transition-all duration-300 cursor-pointer group hover:scale-105 hover:-translate-y-1"
                  style={{
                    animationDelay: `${index * 50}ms`,
                    animation: 'fadeInUp 0.5s ease-out forwards',
                  }}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center space-x-3">
                      <div className="p-2 bg-teal-500/10 rounded-lg group-hover:bg-teal-500/20 transition-colors">
                        <Database size={18} className="text-teal-400 group-hover:text-teal-300 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-white group-hover:text-teal-300 transition-colors text-lg">
                        {entity.name}
                      </h4>
                    </div>
                    <span className="text-xs bg-slate-700/50 text-slate-300 px-2.5 py-1 rounded-full font-medium">
                      v{entity.version}
                    </span>
                  </div>

                  <p className="text-sm text-gray-400 mb-4 line-clamp-2 leading-relaxed">
                    {entity.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-between text-xs text-gray-500 pt-3 border-t border-slate-700/50">
                    <div className="flex items-center space-x-1.5">
                      <Database size={12} className="text-gray-500" />
                      <span>{entity.workflows?.length || 0} workflow{entity.workflows?.length !== 1 ? 's' : ''}</span>
                    </div>
                    {(entity.cyoda_url || entity.github_url) && (
                      <div className="flex items-center space-x-2">
                        {entity.cyoda_url && (
                          <div className="p-1 bg-teal-500/10 rounded" title="Cyoda URL">
                            <ExternalLink size={12} className="text-teal-400" />
                          </div>
                        )}
                        {entity.github_url && (
                          <div className="p-1 bg-purple-500/10 rounded" title="GitHub URL">
                            <ExternalLink size={12} className="text-purple-400" />
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
            </div>
          </div>
        )}
      </div>


    </div>
  );
};

