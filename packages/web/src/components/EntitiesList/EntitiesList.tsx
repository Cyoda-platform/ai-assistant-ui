import React, { useEffect } from 'react';
import { Plus, Database, ExternalLink, Github, Trash2 } from 'lucide-react';
import { message } from 'antd';
import type { Entity, AppRoot } from '@/components/AppsCanvas/types/appSchema';
import CanvasEmptyState from '@/components/ChatBot/CanvasEmptyState';

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
      // Check if there's already a draft entity
      // Draft entity = entity without github_url
      const existingDraftEntity = appData.app.entities?.find(e =>
        !e.github_url || e.github_url === ''
      );

      if (existingDraftEntity) {
        message.warning('You already have a draft entity. Please Send to chat to push it to Git before creating a new one.');
        return;
      }

      // Create new entity object with default values
      const newEntity: Entity = {
        name: 'New Entity',
        version: '1',
        description: 'Define a new data structure for your app',
        cyoda_url: '',
        github_url: '',
        model: {
          // Default model structure - JSON example format
          id: 'example-id-123',
          name: 'Example Name',
          created_at: '2024-01-01T00:00:00Z',
          updated_at: '2024-01-01T00:00:00Z'
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

  const getGitHubUrl = (entity: Entity) => {
    if (!entity.github_url) return null;

    const owner = appData.app.metadata?.owner || 'Cyoda-platform';
    const repo = appData.app.metadata?.repository || 'mcp-cyoda-quart-app';
    const branch = appData.app.metadata?.branch || 'main';
    const filePath = entity.github_url.replace(/^\.\//, '');

    return `https://github.com/${owner}/${repo}/blob/${branch}/${filePath}`;
  };

  const handleDeleteEntity = (entityName: string, entityVersion: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const updatedAppData: AppRoot = {
      ...appData,
      app: {
        ...appData.app,
        entities: entities.filter(ent => !(ent.name === entityName && ent.version === entityVersion))
      }
    };
    if (onAppDataUpdate) {
      onAppDataUpdate(updatedAppData);
    }
    message.success('Entity deleted');
  };

  return (
    <div className="flex flex-col h-full bg-white">
      {/* Header */}
      <div className="flex items-center justify-between px-6 py-3 border-b border-slate-200 bg-white">
        <div className="flex items-center space-x-6">
          <div className="p-2 bg-teal-50 rounded-lg">
            <Database size={20} className="text-teal-600" />
          </div>
          <div>
            <h3 className="font-semibold text-slate-900 text-lg">Data Entities</h3>
            <p className="text-xs text-slate-500">
              {entities.length === 0 ? 'No entities yet' : `${entities.length} ${entities.length === 1 ? 'entity' : 'entities'}`}
            </p>
          </div>
          <button
            onClick={handleCreateEntity}
            className="flex items-center justify-center w-8 h-8 rounded-full bg-teal-500 hover:bg-teal-600 text-white transition-all duration-200 shadow-lg hover:shadow-teal-500/25"
            title="Create new entity and open editor"
          >
            <Plus size={18} />
          </button>
        </div>
      </div>

      {/* Entities Grid */}
      <div className="flex-1 overflow-auto px-6 py-4 pt-4 w-full">
        {entities.length === 0 ? (
          <div className="flex items-center justify-center h-full">
            <CanvasEmptyState type="entities" />
          </div>
        ) : (
          <div className="flex flex-wrap gap-4">
            {entities.map((entity, index) => {
              // Generate entity ID from name and version
              const entityId = `entity-${entity.name.toLowerCase()}-${entity.version}`;

              return (
                <div
                  key={`${entity.name}-${entity.version}`}
                  onClick={() => onEntityClick(entityId)}
                  className="bg-white border border-slate-200 rounded-xl p-3 hover:border-teal-400 hover:shadow-sm cursor-pointer group h-48 flex flex-col flex-shrink-0"
                  style={{ width: '220px' }}
                >
                  <div className="flex items-start justify-between gap-2 mb-2 min-w-0">
                    <div className="flex items-start space-x-2 min-w-0 flex-1">
                      <div className="p-1 bg-teal-50 rounded group-hover:bg-teal-100 transition-colors flex-shrink-0 mt-0.5">
                        <Database size={14} className="text-teal-600 group-hover:text-teal-700 transition-colors" />
                      </div>
                      <h4 className="font-semibold text-slate-900 group-hover:text-teal-700 transition-colors text-sm break-words leading-tight min-w-0 overflow-hidden">
                        {entity.name}
                      </h4>
                    </div>
                    <div className="w-2 h-2 rounded-full flex-shrink-0 mt-0.5 bg-teal-400" />
                  </div>

                  <p className="text-xs text-slate-500 leading-tight flex-1 overflow-hidden break-words">
                    {entity.description || 'No description provided'}
                  </p>

                  <div className="flex items-center justify-end text-xs text-slate-400 gap-1 mt-2">
                    {!getGitHubUrl(entity) && (
                      <button
                        onClick={(e) => handleDeleteEntity(entity.name, entity.version, e)}
                        className="p-1 rounded transition-colors"
                        title="Delete entity"
                      >
                        <Trash2 size={14} className="text-slate-400 hover:text-red-500" />
                      </button>
                    )}
                    {getGitHubUrl(entity) && (
                      <a
                        href={getGitHubUrl(entity)!}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="p-1 bg-green-50 hover:bg-green-100 rounded transition-colors"
                        title="View on GitHub"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <Github size={14} className="text-green-600" />
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>


    </div>
  );
};

