import React, { useState, useMemo } from 'react';
import { Database, History, Clock, X, RefreshCw } from 'lucide-react';
import ResizeHandle from '@/components/ResizeHandle/ResizeHandle';
import { useResizablePanel } from '@/hooks/useResizablePanel';

interface EntityVersion {
  date: string;
  state: string;
  version?: string;
}

interface EntityData {
  id: string;
  workflow_name: string;
  next_transitions: string[];
  entity_versions: EntityVersion[];
}

interface EntityDataPanelProps {
  isOpen: boolean;
  onClose: () => void;
  chatData?: any;
  onRefresh?: () => void;
  onRollbackChat?: () => void;
  isLoadingRollback?: boolean;
  width?: number;
  onWidthChange?: (width: number) => void;
}

const EntityDataPanel: React.FC<EntityDataPanelProps> = ({
  isOpen,
  onClose,
  chatData,
  onRefresh,
  onRollbackChat,
  isLoadingRollback = false,
  width: externalWidth,
  onWidthChange
}) => {
  const [activeEntityId, setActiveEntityId] = useState<string>('');
  const [isExternalResizing, setIsExternalResizing] = useState(false);

  // Use external width if provided, otherwise use internal resize hook
  const internalResize = useResizablePanel({
    defaultWidth: 384, // 96 * 4 = 384px (w-96)
    minWidth: 320,     // Minimum width for usability
    maxWidth: 600,     // Maximum width to not overwhelm the layout
    storageKey: 'entityDataPanel-width'
  });

  const panelWidth = externalWidth ?? internalResize.width;
  const isResizing = onWidthChange ? isExternalResizing : internalResize.isResizing;

  // Custom resize handler for external width control
  const handleMouseDown = React.useCallback((e: React.MouseEvent) => {
    if (onWidthChange) {
      // Use external width control - implement custom resize logic
      e.preventDefault();
      setIsExternalResizing(true);
      const startX = e.clientX;
      const startWidth = panelWidth;

      const handleMouseMove = (moveEvent: MouseEvent) => {
        const deltaX = startX - moveEvent.clientX; // Reverse for left border
        const newWidth = Math.max(320, Math.min(600, startWidth + deltaX));
        onWidthChange(newWidth);
      };

      const handleMouseUp = () => {
        setIsExternalResizing(false);
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
        document.body.classList.remove('resizing-active');
      };

      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';
      document.body.classList.add('resizing-active');
    } else {
      // Use internal resize hook
      internalResize.handleMouseDown(e);
    }
  }, [onWidthChange, panelWidth, internalResize.handleMouseDown]);

  // Extract entities data from chat data
  const entitiesData = useMemo(() => {
    const entities = chatData?.chat_body?.entities_data || {};
    return Object.keys(entities).map(id => ({
      id,
      workflow_name: entities[id].workflow_name || id,
      next_transitions: entities[id].next_transitions || [],
      entity_versions: entities[id].entity_versions || []
    }));
  }, [chatData]);

  // Set active entity to first one if not set
  React.useEffect(() => {
    if (entitiesData.length > 0 && !activeEntityId) {
      setActiveEntityId(entitiesData[0].id);
    }
  }, [entitiesData, activeEntityId]);

  const activeEntity = entitiesData.find(entity => entity.id === activeEntityId);

  const handleRefresh = () => {
    if (onRefresh) {
      onRefresh();
    }
  };

  const handleRollback = () => {
    if (onRollbackChat) {
      onRollbackChat();
    }
  };

  if (!isOpen) return null;

  return (
    <div
      className={`bg-slate-800/95 backdrop-blur-sm border-l border-slate-600 flex flex-col relative resizable-panel ${isResizing ? 'resizing' : ''}`}
      style={{ width: `${panelWidth}px` }}
    >
      {/* Resize Handle */}
      <ResizeHandle
        onMouseDown={handleMouseDown}
        isResizing={isResizing}
        position="left"
      />
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-slate-700 bg-slate-800/50">
        <div className="flex items-center space-x-2">
          <Database size={18} className="text-blue-400" />
          <h3 className="font-semibold text-white">Entity Data</h3>
          <span className="bg-blue-500/20 text-blue-300 text-xs px-2 py-1 rounded-full font-medium">
            Live
          </span>
        </div>
        <button
          onClick={onClose}
          className="p-1.5 rounded-md text-slate-400 hover:text-white hover:bg-slate-700 transition-colors"
          title="Close Entity Data"
        >
          <X size={14} />
        </button>
      </div>

      {entitiesData.length === 0 ? (
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <Database size={48} className="text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No entity data available</p>
          </div>
        </div>
      ) : (
        <>
          {/* Entity Tabs */}
          <div className="p-4 border-b border-slate-700">
            <div className="flex flex-col space-y-2 mb-4">
              {entitiesData.map((entity) => (
                <button
                  key={entity.id}
                  onClick={() => setActiveEntityId(entity.id)}
                  className={`text-left p-3 rounded-lg text-sm font-medium transition-colors border ${
                    activeEntityId === entity.id
                      ? 'bg-slate-700/80 hover:bg-slate-600 border-slate-600 text-white'
                      : 'text-slate-400 hover:bg-slate-700/50 hover:text-white border-transparent'
                  }`}
                >
                  {entity.workflow_name}
                </button>
              ))}
            </div>

            {/* Entity Details */}
            {activeEntity && (
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                    Entity ID
                  </label>
                  <div className="text-sm font-mono bg-slate-700/50 p-3 rounded-lg mt-2 border border-slate-600 text-slate-200 break-all">
                    {activeEntity.id}
                  </div>
                </div>

                {activeEntity.next_transitions.length > 0 && (
                  <div>
                    <label className="text-xs font-medium text-slate-400 uppercase tracking-wider">
                      Next Transitions
                    </label>
                    <div className="text-sm bg-slate-700/50 p-3 rounded-lg mt-2 border border-slate-600">
                      <div className="flex flex-wrap gap-2">
                        {activeEntity.next_transitions.map((transition, index) => (
                          <span
                            key={index}
                            className="bg-teal-500/20 text-teal-300 px-2 py-1 rounded text-xs"
                          >
                            {transition}
                          </span>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Entity Versions */}
          <div className="flex-1 p-4 overflow-y-auto chat-container">
            <h4 className="text-sm font-semibold mb-4 flex items-center space-x-2 text-white">
              <History size={16} className="text-blue-400" />
              <span>Entity Versions</span>
            </h4>

            {activeEntity?.entity_versions.length === 0 ? (
              <div className="text-center py-8">
                <History size={32} className="text-slate-600 mx-auto mb-2" />
                <p className="text-slate-400 text-sm">No version history available</p>
              </div>
            ) : (
              <div className="space-y-3">
                {activeEntity?.entity_versions.map((version, index) => (
                  <div
                    key={index}
                    className="bg-slate-700/50 rounded-lg p-4 border border-slate-600 hover:border-slate-500 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <div className="font-medium text-white text-sm">{version.state}</div>
                        <div className="text-slate-400 text-xs mt-1 flex items-center space-x-2">
                          <Clock size={12} />
                          <span>{version.date}</span>
                        </div>
                      </div>
                      <div className="bg-slate-600 text-slate-300 text-xs px-2 py-1 rounded font-mono">
                        v{version.version || index + 1}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Entity Actions */}
          <div className="p-4 border-t border-slate-700 space-y-3">
            <button
              onClick={handleRefresh}
              className="w-full bg-slate-700/80 hover:bg-slate-600 text-white py-3 rounded-lg transition-all duration-200 font-medium flex items-center justify-center space-x-2"
            >
              <RefreshCw size={16} />
              <span>Refresh Data</span>
            </button>

            {onRollbackChat && (
              <button
                onClick={handleRollback}
                disabled={isLoadingRollback}
                className="w-full bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-300 hover:text-yellow-200 py-3 rounded-lg transition-all duration-200 font-medium border border-yellow-500/30 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isLoadingRollback ? 'Restarting...' : 'Restart Workflows'}
              </button>
            )}

            <button
              onClick={onClose}
              className="w-full bg-red-500/20 hover:bg-red-500/30 text-red-300 hover:text-red-200 py-3 rounded-lg transition-all duration-200 font-medium border border-red-500/30"
            >
              Close Panel
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default EntityDataPanel;
